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
import fs from "fs/promises";

export const maxDuration = 60;
export const dynamic = 'force-dynamic';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

async function extractUserInfoFromAI(userQuery: string, chatHistory: any[]) {
    const systemPrompt = `
        You are a smart travel insurance assistant helping an advisor evaluate different clients.

        Your task is to extract the latest and correct medical profile for the **current client** only. This includes:
        - Age (if mentioned)
        - All medical or non-medical conditions that may affect travel insurance eligibility
        - The **timing** of each condition if provided (e.g., "currently", "18 months ago")

        The client may be described anywhere in the conversation. Users may mention multiple clients using:
        - "another client", "different client", "new case", "ignore previous" → In these cases, **reset any prior context**.
        If the user just adds more details using "also has", "as well", "additionally" → **combine** those conditions.
        If they say "actually", "no longer", or correct prior statements → **replace** previous conditions with the corrected ones.
        ⏳ If any **timing** is mentioned (e.g., "last year", "in 2020", "18 months ago"), associate that timing with the specific condition.
        Only use **user messages**, not assistant messages.

        🚫 Do not assume or guess. Only extract what's explicitly or clearly implied.
        🚫 Do not include commentary or explanation.

        📦 Return the following strict JSON structure:

        {
        "age": number or null,
        "conditions": [
            {
            "name": "condition or limitation",
            "timing": "if specified, e.g., 'currently', '18 months ago', otherwise null"
            }
        ]
        }
        ---
        Conversation History (user messages only):
        ${chatHistory
            .filter((msg, i) => i % 2 === 0)
            .map((msg, index) => `User ${index + 1}: ${msg.message}`)
            .join("\n")}

        🆕 Latest Input:
        User: ${userQuery}
        ---
    `;

    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Extract the structured latest client profile as JSON." }
        ],
        temperature: 0,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    let cleanJsonString = aiResponse || '';
    cleanJsonString = cleanJsonString.replace(/```json/g, '').replace(/```/g, '').trim();

    try {
        const extractedInfo = JSON.parse(cleanJsonString);
        return extractedInfo;
    } catch (error) {
        console.error("AI Slot Extraction Failed:", aiResponse);
        return {
            age: null,
            disease: null
        };
    }
}

async function evaluateEligibility(plan: any, userInfo: any) {
    const systemPrompt = `
You are an expert travel insurance eligibility advisor.

Your job is to evaluate if the client is eligible for the given product based only on the specific condition(s) provided by the user.
When identifying [${userInfo.disease} condition], include all medically relevant diagnoses that a trained underwriter or physician would associate with the same level of risk, even if the terminology differs. This includes alternative names, subtypes, prior terms, and functionally similar conditions that impact the same organ system or carry similar prognosis.
Do not make assumptions or list unrelated conditions. Do not list all general eligibility rules.
Make sure with the time based conditions and compare the time frame very well against the rules.
Never include eligibility questions that are not connected to the provided input.

If you are certain based on the client’s condition and the product’s rules, respond clearly with:
- "Eligible" if there is no rule violation

If the rules mention or imply the condition but are not completely definitive, respond with:
- "Check follow-Up Questions", and provide only follow-up questions that are directly related to the client's stated condition(s)

Avoid vague answers and never list general eligibility questions. Focus only on what's relevant to the condition provided.

🧾 Format your response strictly as JSON:
{
"eligible": true | false,
"status": "Eligible" | "Not Eligible" | "Follow-Up Required",
"plan": "<Company Name> – <Product Name>",
"follow_up_questions": ["Question 1", "Question 2"],
"reason": "<the exact eligibility rule(s) violated from the list above>"
}

Now evaluate:

Company Name: ${plan.company_name}
Plan Name: ${plan.product_name}
Eligibility Rules:
- ${plan.eligibility_rules.join("\n- ")}

User Information:
- Age: ${userInfo.age}
- Condition(s): ${userInfo.disease}
`;



    const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: "Evaluate eligibility and return only JSON as described." }
        ],
        temperature: 0,
    });

    const aiResponse = completion.choices[0]?.message?.content?.trim();
    if (!aiResponse) return null;

    try {
        let cleanJsonString = aiResponse || '';
        cleanJsonString = cleanJsonString.replace(/```json/g, '').replace(/```/g, '').trim();
        return JSON.parse(cleanJsonString);
    } catch (err) {
        console.error("Invalid JSON from GPT:", aiResponse);
        return null;
    }
}

export async function POST(req: Request) {
    try {
        let customPromptTemplate;
        const info = await req.json();
        const { query, chatHistory, detailMode, modelType } = info;
        console.log(modelType)
        if (modelType == "chatbot") {
            const pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! })
            const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX!)

            console.time('Pinecone data')
            const vectorStore = await PineconeStore.fromExistingIndex(new OpenAIEmbeddings(), { pineconeIndex, namespace: "namespace-test-two" });
            console.timeEnd('Pinecone data')
            // const retriever = vectorStore.asRetriever({ k: 3, searchType: "similarity"});
            const scoreRetriever = ScoreThresholdRetriever.fromVectorStore(vectorStore, { minSimilarityScore: 0.8, maxK: 5 });

            // const retrievedDocs = await retriever.invoke("What is the difference between a group health plan and an individual health plan?")
            // console.log(retrievedDocs);


            if (query.endsWith("? Please elaborate in detail.") === true || (detailMode === true && !query.endsWith("? Please answer in brief."))) {
                customPromptTemplate = ` 
                Use the following pieces of context to answer the question at the end in detail specifically mentioning about insurance and PolicyAdvisor. Also don't repeat yourself & don't give summary. Always try to bring the most latest & most accurate information out of the documents, and give the response in form of categories & subcategories which looks well-organized and easy to understand.
                If the answer isn't in the context, only return "Here you go !!!", don't try to make up an answer. I repeat just return "Here you go !!!" if answer isn't avaiable in the context. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable. Surround the answer with the table borders wherever data is coming in tabular form.

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
                If the answer isn't in the context, only return "Here you go !!!", don't try to make up an answer. I repeat just return "Here you go !!!" if answer isn't avaiable in the context. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable. Surround the answer with the table borders wherever data is coming in tabular form.

                Also, please pay attention that If you are creating a table, do not use any newline characters, please do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information.
                Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.
                
                You are used to help insurance advisors in Canada sell insurance products to their customers. Provide answers which help them structure the call and explain concepts in layman term to their clients.
                Where possible use tables and good formatting to help understand the content better.

                Do not refer to your context as "the context", refer to it as "training data" or a variation of that.
                {context} 
                Question: {question}
                Helpful Answer:`;
            }

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
            console.log('resAnswer::', resAnswer)
            if (resAnswer.includes("Here you go !!!")) {
                const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

                const systemPrompt = `You are an AI assistant. Answer the user's question in a detailed manner & answers should be focused more on PolicyAdvisor.
                If the question is related to insurance, explain it in layman terms specifically mentioning about insurance in Canada. Also don't repeat yourself & don't give summary. Provide structured responses and give the response in form of categories & subcategories which looks well-organized and easy to understand  when necessary. Don't add too many emojis inside the response, just add some to make it look more attractive and presentable. If you are creating a table, do not use any newline characters, do not add <br> tags under any circumstance. Be as detailed as possible, don't leave out any important information. Do not add HTML formatting, such as <br> tags, to your answer or any other formatting. Especially do NOT add <br> tags in tables, use new line characters.`;

                const messages = [
                    { role: "system", content: systemPrompt },
                    ...chatHistory.map((msg: any, index: number) => (
                        {
                            role: index % 2 === 0 ? "user" : "assistant",
                            content: msg.message
                        }
                    )),
                    { role: "user", content: query }
                ]
                const completion = await openai.chat.completions.create({
                    model: 'chatgpt-4o-latest',
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
                return new StreamingTextResponse(openaiStream);
            } else {
                const contextualizeQSystemPrompt = `Your job is to generate a concise stand alone question. Given a chat history and the latest user question
                which might reference context in the chat history, formulate a concise standalone question which can be understood without the chat history. Do NOT answer the question. I repeat, do NOT answer the question. Create a concise standalone question. Do NOT ignore the latest question asked, ensure the question asked in the latest question would properly be answered from your reformated question. If the latest question is already a standalone question, return it as is, do not change anything if it is a standalone question.
                Try to answer the question in straight forward approach rather than giving it in essay pattern.
                Prioritize the latest messages in the chat history when inferring context.
                Prioritize the human messages when formulating the standalone question, only use the AI messages as context if needed. just reformulate it if needed and otherwise return it as is. If the latest question asks to reformat information, use the chat history to infer what information and create a standalone question based on that. Do not answer the question and reformat the information. Just create a standalone question. Do not give 'Here you go!!!'.
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
                            if (chunk.answer.includes("Here you go !!!")) {
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
                                chunk.context.forEach((document: any, index: any) => {
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
                        if (responseString.includes("Here you go !!!")) {
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


        } else {
            const travelRulesRaw = await fs.readFile("app/data/travel_rules.json", "utf-8");
            const travelPlans = JSON.parse(travelRulesRaw);

            const extractedInfo = await extractUserInfoFromAI(query, chatHistory);
            console.log(extractedInfo)
            const requiredFields = ["age"];
            const missingFields = requiredFields.filter(
                (field) => !extractedInfo[field] || extractedInfo[field] === "null"
            );

            if (missingFields.length > 0) {
                const followUpQuestion = `To assist you better, could you please provide your ${missingFields.join(", ")}?`;
                const encoder = new TextEncoder();
                const readableStream = new ReadableStream({
                    start(controller) {
                        controller.enqueue(encoder.encode(followUpQuestion));
                        controller.close();
                    },
                });
                return new StreamingTextResponse(readableStream);
            }

            let eligible: string[] = [];
            let followUps: { plan: string; questions: string[] }[] = [];
            let notEligible: { plan: string; reason: string }[] = [];

            for (const plan of travelPlans) {
                const userInfo = {
                    age: extractedInfo.age,
                    disease: extractedInfo.conditions
                        .map((c: { name: string; timing: string | null }) => `${c.name}${c.timing ? ` (${c.timing})` : ''}`)
                        .join(', ')
                };

                const result = await evaluateEligibility(plan, userInfo);
                console.log(result)
                if (!result) continue;

                if (result.status === "Eligible") {
                    eligible.push(result.plan);
                } else if (result.status === "Follow-Up Required" && result.follow_up_questions?.length > 0) {
                    followUps.push({ plan: result.plan, questions: result.follow_up_questions });
                } else if (result.status === "Not Eligible") {
                    notEligible.push({ plan: result.plan, reason: result.reason });
                }
            }

            const conditionSummary = extractedInfo.conditions
                .map((c: { name: string; timing: string | null }) =>
                    `${c.name}${c.timing ? ` (${c.timing})` : ''}`
                )
                .join(', ');

            let finalResponse = `Based on your provided details (Age: ${extractedInfo.age}${conditionSummary ? `, Condition(s): ${conditionSummary}` : ""}), here's what we found:\n\n`;

            if (eligible.length > 0) {
                finalResponse += `---\nEligible Plans:\n`;
                eligible.forEach((plan) => {
                    finalResponse += `- **${plan}**\n`;
                });
            }

            if (followUps.length > 0) {
                finalResponse += `---\nPlans Requiring Follow-Up:\n`;
                followUps.forEach(({ plan, questions }) => {
                    finalResponse += `- **${plan}**\n`;
                    questions.forEach((q) => {
                        finalResponse += `    - ${q}\n`;
                    });
                });
            }

            if (notEligible.length > 0) {
                finalResponse += `---\nNot Eligible Plans:\n`;
                notEligible.forEach(({ plan, reason }) => {
                    finalResponse += `- **${plan}**: ${reason}\n`;
                    
                });
            }

            if (eligible.length === 0 && followUps.length === 0 && notEligible.length === 0) {
                finalResponse += `Unfortunately, based on the information provided, we could not find any matching travel insurance plans at this time.`;
            }

            const encoder = new TextEncoder();
            const readableStream = new ReadableStream({
                start(controller) {
                    controller.enqueue(encoder.encode(finalResponse));
                    controller.close();
                },
            });
            return new StreamingTextResponse(readableStream);
        }
    }
    catch (e) {
        console.log(e)
        return NextResponse.json({ error: e })
    }
}
