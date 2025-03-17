import * as cheerio from "cheerio";
import axios from 'axios';
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
import { StreamingTextResponse, LangChainAdapter, createStreamDataTransformer, AWSBedrockAnthropicMessagesStream } from "ai";
import { HttpResponseOutputParser } from "langchain/output_parsers";
import {
    MessagesPlaceholder,
  } from "@langchain/core/prompts";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import OpenAI from "openai"; 

// FOR VERCEL DEPLOYMENT, increases API TIMEOUT LIMIT TO 60 SECONDS
export const maxDuration = 60;
export const dynamic = 'force-dynamic';


export async function POST(req: Request) {

    try {

        let customPromptTemplate;
        const info = await req.json();
        const { query, chatHistory, detailMode } = info;
        // console.log("Chat History in getLLMResponse: ", chatHistory)
        const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
        const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!)

        console.time('Pinecone data')
        const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex, namespace: "namespace-test-two"});
        console.timeEnd('Pinecone data')
        // const retriever = vectorStore.asRetriever({ k: 3, searchType: "similarity"});
        const scoreRetriever = ScoreThresholdRetriever.fromVectorStore(vectorStore, { minSimilarityScore: 0.8, maxK: 5 });
        
        // const retrievedDocs = await retriever.invoke("What is the difference between a group health plan and an individual health plan?")
        // console.log(retrievedDocs);

        
        if (query.endsWith("? Please elaborate in detail.") === true || (detailMode === true && !query.endsWith("? Please answer in brief."))){
            customPromptTemplate = ` 
            Use the following pieces of context to answer the question at the end in detail specifically mentioning about insurance and PolicyAdvisor. Also don't repeat yourself & don't give summary. Always try to bring the most latest & most accurate information out of the documents, and give the response in form of categories & subcategories which looks well-organized and easy to understand.
            If the answer isn't in the context, only return "garbagevalue", don't try to make up an answer. I repeat just return "garbagevalue" if answer isn't avaiable in the context. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable.

            Also, please pay attention that If you are creating a table, do not use any newline characters, please do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information.
            Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.
            
            You are used to help insurance advisors in Canada sell insurance products to their customers. Provide answers which help them structure the call and explain concepts in layman term to their clients.
            Where possible use tables and good formatting to help understand the content better.

            Do not refer to your context as "the context", refer to it as "training data" or a variation of that.
            {context} 
            Question: {question}
            Helpful Answer:`
        } else {
            customPromptTemplate = ` 
            Use the following pieces of context to answer the question at the end in brief within 50 words specifically mentioning about insurance and PolicyAdvisor.Also, don't give me long responses, give me summarized responses I repeat give me summarized responses. Also don't repeat yourself & don't give summary. Always try to bring the most latest & most accurate information out of the documents, and give the response in brief in 50-100 words only in form of multiple paragraphs which looks well-organized and easy to understand.
            If the answer isn't in the context, only return "garbagevalue", don't try to make up an answer. I repeat just return "garbagevalue" if answer isn't avaiable in the context. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable.

            Also, please pay attention that If you are creating a table, do not use any newline characters, please do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information.
            Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.
            
            You are used to help insurance advisors in Canada sell insurance products to their customers. Provide answers which help them structure the call and explain concepts in layman term to their clients.
            Where possible use tables and good formatting to help understand the content better.

            Do not refer to your context as "the context", refer to it as "training data" or a variation of that.
            {context} 
            Question: {question}
            Helpful Answer:`;
        }

//         const customPromptTemplate = `Use the following pieces of context to answer the question at the end. 
// If the answer is not explicitly stated in the context, use the information provided to infer a reasonable answer.
// If you are instructed to create a table, create a table in markdown with proper newlines in markdown.
// Do not refer to your context as "the context", refer to it as "training data" or a variation of that.

// {context}

// Question: {question}

// Helpful Answer:`;
        const customPrompt = new PromptTemplate({
            template: customPromptTemplate,
            inputVariables: ["context", "question"],
          });


        const llm = new ChatOpenAI({
            model: "chatgpt-4o-latest",
            temperature: 0
            });

        const parser = new StringOutputParser();
    
        const ragChainWithSources = RunnableMap.from({
            context: scoreRetriever,
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
                parser
            ])
        })

        console.time('AI response generation')
        let res = await ragChainWithSources.invoke(query);
        console.timeEnd('AI response generation')
        const resAnswer = res["answer"]
        console.log('resAnswer::',resAnswer)
        if (resAnswer.includes("garbagevalue")) { 
            const openai=new OpenAI({apiKey:process.env.OPENAI_API_KEY})
            
            const systemPrompt = `You are an AI assistant. Answer the user's question in a detailed manner & answers should be focused more on PolicyAdvisor.
            If the question is related to insurance, explain it in layman terms specifically mentioning about insurance in Canada. Also don't repeat yourself & don't give summary. Provide structured responses and give the response in form of categories & subcategories which looks well-organized and easy to understand  when necessary. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable. If you are creating a table, do not use any newline characters, do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information. Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.`;

            const messages= [
                    {role: "system", content:systemPrompt},
                    ...chatHistory.map((msg:any,index:number)=> (
                        { 
                            role: index % 2 === 0? "user" : "assistant",
                            content: msg.message
                        }
                    )),
                    {role:"user",content:query}
            ]
            const completion = await openai.chat.completions.create({
                model:'chatgpt-4o-latest',
                messages,
                stream: true
            })

            const encoder = new TextEncoder();
            const decoder = new TextDecoder();

            const openaiStream = new ReadableStream({
                async start(controller) {
                    for await (const chunk of completion) {
                        const text = chunk.choices[0]?.delta?.content || "";
                        controller.enqueue(encoder.encode(text));
                    }
                    controller.enqueue(encoder.encode("\n\n**Note:** Response is generated by OpenAI 🤖"));
                    controller.close();
                }
            });
        
            // return new NextResponse(openaiStream, {
            //     headers: {
            //         'Content-Type': 'text/plain',
            //         'Transfer-Encoding': 'chunked',
            //     }
            // });
            return new StreamingTextResponse(openaiStream);
        } else {
            const contextualizeQSystemPrompt = `Your job is to generate a concise stand alone question. Given a chat history and the latest user question
            which might reference context in the chat history, formulate a concise standalone question which can be understood without the chat history. Do NOT answer the question. I repeat, do NOT answer the question. Create a concise standalone question. Do NOT ignore the latest question asked, ensure the question asked in the latest question would properly be answered from your reformated question. If the latest question is already a standalone question, return it as is, do not change anything if it is a standalone question.
            Try to answer the question in straight forward approach rather than giving it in essay pattern.
            Prioritize the latest messages in the chat history when inferring context.
            Prioritize the human messages when formulating the standalone question, only use the AI messages as context if needed. just reformulate it if needed and otherwise return it as is. If the latest question asks to reformat information, use the chat history to infer what information and create a standalone question based on that. Do not answer the question and reformat the information. Just create a standalone question. Do not give 'garbagevalue'.
            If you are creating a table, do not use any newline characters, do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information.
            Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.`

            const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
                ["system", contextualizeQSystemPrompt],
                new MessagesPlaceholder("chat_history"),
                ["human", "{question}"],
              ]);

            const llm = new ChatOpenAI({
                model: "chatgpt-4o-latest",
                temperature: 0,
              });

            const contextualizeQChain = contextualizeQPrompt
                .pipe(llm)
                .pipe(new StringOutputParser());

            const properChatHistory = []

            for (let i = 0; i < chatHistory.length; i++) {
                if (i % 2 == 0 && i != 0) {
                    const currentThread = chatHistory[i].message.split("Sources:")
                    // console.log("Chat History String: ", currentThread[0])
                    properChatHistory.push(new AIMessage(currentThread[0]))
                    continue
                } else {
                    properChatHistory.push(new HumanMessage(chatHistory[i].message))
                }
            }

            const contextualizedQuery = await contextualizeQChain.invoke({
                chat_history: properChatHistory,
                question: query,
            });
            
            const stream = await ragChainWithSources.stream(contextualizedQuery);
            let sourcesArray: string[] = [];
            let headingArray: string[] = [];
            let responseString = "";
            let isInitialResponse = false;
            
            const transformStream = new TransformStream({
                async transform(chunk, controller) {
                    if (chunk.answer) {
                        responseString += chunk.answer;
                        if (chunk.answer.includes("garbagevalue")) {
                            console.log('result not found!!! fetch from previous answer', chunk.answer);
                            isInitialResponse = true;
                            return; 
                        }
                        controller.enqueue(chunk.answer);
                    } else if (chunk.context) {
                        let contextString = "";
                        let fetchPromises = []; // Store async fetches here
            
                        for (const document of chunk.context) {
                            let h1text = "No H1 Found"; // Default value
            
                            if (!(document.metadata.source.toString().includes('/home/sujal/PolicyAdvisor/gemini-podcast/pdfs/'))) {
                                // Start async fetch but don't block execution
                                const fetchPromise = axios.get(document.metadata.source.toString(), {
                                    headers: { 'User-Agent': 'Mozilla/5.0' }
                                })
                                .then(({ data }) => {
                                    const $ = cheerio.load(data);
                                    return $('h1').first().text().trim() || "No H1 Found";
                                })
                                .catch(() => "No H1 Found"); // Handle fetch errors gracefully
            
                                fetchPromises.push(fetchPromise);
                            } else {
                                fetchPromises.push(Promise.resolve("Internal Documents"));
                            }
                        }
            
                        // Wait for all fetches to complete **after** processing current chunk
                        Promise.all(fetchPromises).then(h1Results => {
                            chunk.context.forEach((document:any, index:any) => {
                                let pushMessage =
                                    "Source by LLM: " +
                                    "* " +
                                    "[" +
                                    document.metadata.source.toString() +
                                    "  \n" +
                                    h1Results[index] + // Use the resolved H1 text
                                    "  \n" +
                                    document.pageContent.toString() +
                                    "]" +
                                    `(${document.metadata.source.toString()})` +
                                    " End of Source by LLM  \n";
                                
                                controller.enqueue(pushMessage); // Enqueue **without delay**
                            });
                        });
                    }
                },
                flush(controller) {
                    if (responseString.includes("garbagevalue")) {
                        console.log("Flush executed - Streaming resAnswer instead...");
                        const encoder = new TextEncoder();
                        controller.enqueue(encoder.encode(resAnswer)); // Stream resAnswer
                    }
                },
            });
            
            
            const readableStream = stream.pipeThrough(transformStream);
            
            if (isInitialResponse) {
                console.log("Returning resAnswer as a readable stream...");
                const encoder = new TextEncoder();
                const readableResStream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(resAnswer));
                        controller.close();
                    }
                });
                return new StreamingTextResponse(readableResStream);
            } else {
                console.log("Returning normal streaming response...");
                return new StreamingTextResponse(readableStream);
            }
        }

        // console.log('check answer here::',resAnswer)
        // return NextResponse.json({res: resAnswer});

        // No Streaming Code:
        // let res = await ragChainWithSources.invoke(query);
        // console.log("resAnswer Context: ", res)
        // const resAnswer = res["answer"]
        // return NextResponse.json({res: resAnswer});

        // Streaming Code:
          
        // const contextualizeQSystemPrompt = `Your job is to generate a concise stand alone question. Given a chat history and the latest user question
        // which might reference context in the chat history, formulate a concise standalone question
        // which can be understood without the chat history. Do NOT answer the question. I repeat, do NOT answer the question. Create a concise standalone question. Do NOT ignore the latest question asked, ensure the question asked in the latest question would properly be answered from your reformated question. If the latest question is already a standalone question, return it as is, do not change anything if it is a standalone question.
        // Prioritize the latest messages in the chat history when inferring context.
        // Prioritize the human messages when formulating the standalone question, only use the AI messages as context if needed.
        // just reformulate it if needed and otherwise return it as is. If the latest question asks to reformat information, use the chat history to infer what information and create a standalone question based on that. Do not answer the question and reformat the information. Just create a standalone question. Do not give 'garbagevalue'.`;
        
        // const contextualizeQSystemPromptOriginal = `DO NOT ANSWER THE QUESTION! DO NOT ANSWER THE QUESTION! Given a chat history and the latest user question
        //     which might reference context in the chat history, formulate a standalone question, if the latest user question is not already a standalone question,
        //     which can be understood without the chat history. Do NOT answer the question,
        //     just reformulate it if needed and otherwise return it as is. I repeat, you are to reformulate the question IF NEEDED, do NOT answer the question. Do not add any information not already in the chat history or the latest question. Simply create a standalone question. Ensure all information in the latest question is asked in your standalone question. Do not give 'garbagevalue'.`;


        // // LANGCHAIN CONTEXTUALIZE QUERY METHOD #################################################################

        // const contextualizeQPrompt = ChatPromptTemplate.fromMessages([
        // ["system", contextualizeQSystemPromptOriginal],
        // new MessagesPlaceholder("chat_history"),
        // ["human", "{question}"],
        // ]);
        // const contextualizeQChain = contextualizeQPrompt
        // .pipe(secondLLM)
        // .pipe(new StringOutputParser());

        // const properChatHistory = []

        // for (let i = 0; i < chatHistory.length; i++) {
        //     if (i % 2 == 0 && i != 0) {
        //         const currentThread = chatHistory[i].message.split("Sources:")
        //         // console.log("Chat History String: ", currentThread[0])
        //         properChatHistory.push(new AIMessage(currentThread[0]))
        //         continue
        //     } else {
        //         properChatHistory.push(new HumanMessage(chatHistory[i].message))
        //     }
        // }

        // const contexualizedQuery = await contextualizeQChain.invoke({ chat_history: properChatHistory, question: query });

        // // #############################################################################################################



        // // OPENAI CONTEXTUALIZE QUERY METHOD ###########################################
        // // const openai = new OpenAI();
        // // let openaiMessages = ""
        // // openaiMessages += contextualizeQSystemPrompt

        // // for (let i = 0; i < chatHistory.length; i++) {
        // //     if (i % 2 == 0 && i != 0) {
        // //         const currentThread = chatHistory[i].split("Sources:")
        // //         openaiMessages += "role: assistant" + `content: ${currentThread[0]}`
        // //         continue
        // //     } else {
        // //         openaiMessages += "role: user" + `content: ${chatHistory[i]}`
        // //     }
        // // }

        // // const completion = await openai.chat.completions.create({
        // //     model: "gpt-4o-mini",
        // //     messages: [{role: "user", content: openaiMessages}]
        // // })

        // // const contexualizedQuery = completion.choices[0].message.content

        // // #############################################################################

        // console.log("Contexualized Query: ", contexualizedQuery)
        // const stream  = await ragChainWithSources.stream(contexualizedQuery);

        // let sourcesArray: string[] = []

        // const transformStream = new TransformStream({
        //     async transform(chunk, controller) {
        //         if (chunk.answer) {
        //             controller.enqueue(chunk.answer);
        //             console.log('shivani',chunk.answer)
        //         } else if (chunk.context) {
        //             let contextString = ""
        //             for (const document of chunk.context) {
        //                 let pushMessage = "Source by LLM: "+ "* " + "[" + document.metadata.source.toString() + "  \n" + document.pageContent.toString() + "]"  + `(${document.metadata.source.toString()})`+ " End of Source by LLM  \n"
        //                 contextString += pushMessage
        //                 // console.log("Chunk Pushed: ", "Source by LLM: "+ "* " + "[" + document.metadata.source.toString() + document.pageContent.toString() + "]"  + `(${document.metadata.source.toString()})`+ " End of Source by LLM  \n")
        //                 // console.log("document: ", document)
        //             }
        //             // console.log("enqueued contextString: ", contextString)
        //             controller.enqueue(contextString)
                    
        //         }
        //     }
        // });

        // // Pipe the original stream through our transform stream
        // const readableStream = stream.pipeThrough(transformStream);
        // // return new NextResponse(readableStream, {
        // //     headers: {
        // //         'Content-Type': 'text/plain',
        // //         'Transfer-Encoding': 'chunked',
        // //     }
        // // });
        // return new StreamingTextResponse(readableStream);
        
    }
    catch (e) {
        console.log(e)
        return NextResponse.json({error: e})
    }
    
}
