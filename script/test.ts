import "cheerio";
import { CheerioWebBaseLoader } from "@langchain/community/document_loaders/web/cheerio";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { OpenAIEmbeddings, ChatOpenAI } from "@langchain/openai";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { GoogleVertexAIEmbeddings } from "@langchain/community/embeddings/googlevertexai";
import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import * as dotenv from "dotenv";
import { ChatVertexAI } from "@langchain/google-vertexai";
import {
  RunnablePassthrough,
  RunnableSequence,
  RunnableMap,
} from "@langchain/core/runnables";
import { formatDocumentsAsString } from "langchain/util/document";
import { NextResponse } from "next/server";
import { PromptTemplate } from "@langchain/core/prompts";
import { StreamingTextResponse } from "ai";

dotenv.config();



const test = async () => {
    try {

        const query = "What types of life insurance are there"
        const chatHistory = ["I am looking for information on life insurance. Can you help"]
        // console.log("Chat History in getLLMResponse: ", chatHistory)
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!)

        const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex, namespace: "namespace-test-two"});
        const retriever = vectorStore.asRetriever({ k: 10, searchType: "similarity" });

        // const retrievedDocs = await retriever.invoke("What is the difference between a group health plan and an individual health plan?")
        // console.log(retrievedDocs);
        // const customPromptTemplate = `Use the following pieces of context to answer the question at the end. 
        // If you don't know the answer, just say that you don't know, don't try to make up an answer, however please provide a short explanation on where they may be able to find the answer. 
        // If you are instructed to create a table, create a table in markdown with proper newlines in markdown.
        // Do not refer to your context as "the context", refer to it as "training data" or a variation of that.
        // If necessary utilize the below chat history as additional context, carefully consider it before answering the question but only use it if necessary: ${chatHistory}
        // {context}Question: {question}Helpful Answer:`;

//         const customPromptTemplate = `Use the following pieces of context to answer the question at the end. 
// If the answer is not explicitly stated in the context, use the information provided to infer a reasonable answer.
// If you are instructed to create a table, create a table in markdown with proper newlines in markdown.
// Do not refer to your context as "the context", refer to it as "training data" or a variation of that.

// {context}

// Question: {question}

// Helpful Answer:`;


const customPromptTemplate = `Use the following pieces of context to answer the question at the end. 
If you don't know the answer, just say that you don't know, don't try to make up an answer, however please provide a short explanation on where they may be able to find the answer. 
If you are instructed to create a table, create a table in markdown with proper newlines in markdown.
Do not refer to your context as "the context", refer to it as "training data" or a variation of that.
{context}Question: {question}Helpful Answer:`;

        const customPrompt = new PromptTemplate({
            template: customPromptTemplate,
            inputVariables: ["context", "question"],
          });


        const llm = new ChatOpenAI({
            model: "gpt-4o-mini",
            temperature: 0
            });
        


        // console.log(example_messsages);
        
        const ragChainWithSources = RunnableMap.from({
            context: retriever,
            question: new RunnablePassthrough(),
        }).assign({
            answer: RunnableSequence.from([
                (input: any) => {
                    return {
                        context: formatDocumentsAsString(input.context),
                        question: input.question
                    };
                },
                customPrompt,
                llm,
                new StringOutputParser()
            ])
        })
        
        const ragChain = RunnableSequence.from([
            {
                context: retriever.pipe(formatDocumentsAsString),
                question: new RunnablePassthrough(),
            },
            customPrompt,
            llm,
            new StringOutputParser()
        ])
        

        // No Streaming Code:
        // let res = await ragChainWithSources.invoke(query);
        // console.log("resAnswer Context: ", res)
        // const resAnswer = res["answer"]
        // return NextResponse.json({res: resAnswer});

        // Streaming Code:
        const stream = await ragChainWithSources.stream(query);
        // for await (const chunk of await ragChainWithSources.stream(
        //     query
        //   )) {
        //     console.log(chunk);
        //   }
        return new StreamingTextResponse(stream)

    }
    catch (e) {
        console.log(e)
        return NextResponse.json({error: e})
    }
}

test()
