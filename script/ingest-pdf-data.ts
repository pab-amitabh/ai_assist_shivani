
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DirectoryLoader } from "langchain/document_loaders/fs/directory";
import * as dotenv from "dotenv";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import fs from 'fs/promises';
import path from 'path';

dotenv.config();


export const run = async (filePath: string) => {
    if (filePath === "/home/sujal/PolicyAdvisor/gemini-podcast/pdfs/AI tool content/Product brochures- Life & Living Benefits CI - Part 1/217 CAN CL DI for Professionals.pdf"
        || filePath === "/home/sujal/PolicyAdvisor/gemini-podcast/pdfs/AI tool content/Product brochures- Life & Living Benefits DI/217 CAN CL DI for Professionals.pdf"
    ) {
        return;
    }
    console.log(`Processing file: ${filePath}`);
    const loader = new PDFLoader(filePath, {
        splitPages: true
    }
    );

    const documents = await loader.load();
    console.log("loader created");

    const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
    });

    const allSplits = await textSplitter.splitDocuments(documents);
    console.log("split docs")

    console.log("Creating vector store");
    const pinecone = await new Pinecone({ apiKey: process.env.PINECONE_API_KEY!})
    const pineconeIndex = await pinecone.Index(process.env.PINECONE_INDEX!)

    const vectorStore = await PineconeStore.fromDocuments(allSplits, new OpenAIEmbeddings(), {
        pineconeIndex,
        namespace: "namespace-test-two"
    })
    console.log(`Processed file: ${filePath}`);


    // Use to ignore metadata in pdf's
    
    // const vectorStore = await PineconeStore.fromDocuments(allSplits.map(
    //     doc => ({
    //         pageContent: doc.pageContent,
    //         metadata: {}
    //     })
    // ), new OpenAIEmbeddings(), {
    //     pineconeIndex,
    //     namespace: "namespace-test-two"
    // })

}

async function findPDFs(dir: string): Promise<string[]> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const res = path.resolve(dir, entry.name);
        if (entry.isDirectory()) {
            return findPDFs(res);
        } else if (path.extname(res).toLowerCase() === '.pdf') {
            return res;
        }
        return [];
    }));
    return files.flat();
}

(async () => {
    try {
        const baseDir = path.resolve(__dirname, '../pdfs', 'AI tool content');
        const pdfFiles = await findPDFs(baseDir);


        for (const pdfFile of pdfFiles) {
            await run(pdfFile);
        }

    } catch (e) {
        console.log(e);
    }
})();
