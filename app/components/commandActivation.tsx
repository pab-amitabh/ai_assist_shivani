'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactMediaRecorder } from "react-media-recorder-2";
import { start } from 'repl';
import { signIn, useSession } from "next-auth/react";
import ChatHistory from './ChatHistory';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { decode } from 'punycode';
import { stringify } from 'querystring';
import SourceLink from './SourceLink';
export default function CommandActivation() {
    const [isListening, setIsListening] = useState(false);
    const [message, setMessage] = useState("");
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<null | any>(null);
    const [LLMResponse, setLLMResponse] = useState("");


    // START OF 2022 Code *********************************************************************************************
    interface Chat {
        id: string,
        messages: string[],
        userId: string,
    }

    const { data : session, status } = useSession();
    const [input, setInput] = useState("");
    const [currentChat, setCurrentChat] = useState<string[]>(["Hello, I am an AI Assitant designed to help you with all things related to Policy Advisor and Insurance"]);
    const [loading, setLoading] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [currChatId, setCurrChatId] = useState<string>("");
    const [llmDone, setLlmDone] = useState<boolean>(false);
    let loadingVar = false;
    const currentChatRef = useRef<HTMLDivElement | null>(null);

    const currentChatArrayRef = useRef(currentChat);

    // Update currentChatRef to latest currentChat
    useEffect(() => {
    currentChatArrayRef.current = currentChat;
    }, [currentChat]);

    // Scroll to bottom of chat when new message is added
    useEffect(() => {
        if (currentChatRef.current) {
            currentChatRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [currentChat])


    // updates chatHistory when a new LLmResponse is received
    useEffect(() => {
        if (llmDone) {
            setMessage("");

            const updateChat = async (newMessage: string) => {
                await fetch("/api/updateChat", {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ chatId: currChatId, message: newMessage })
                })
            }

            const updateBothChats = async () => {
                // console.log("currentChat[currentChat.length - 2]: ", currentChat[currentChat.length - 2])
                await updateChat(currentChat[currentChat.length - 2]);
                // console.log("LLMResponse: ", LLMResponse)
                await updateChat(LLMResponse);
            }
            updateBothChats();

            const checkForUnresolved = async () => {
                if (LLMResponse.toLowerCase().includes("i don't know")) {
                    await fetch("/api/storeResponse", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        }, 
                        body: JSON.stringify({ question: currentChat[currentChat.length - 2], answer: LLMResponse })

                    })
                }
            }
            checkForUnresolved();

            setLlmDone(false);
            
        }
    }, [llmDone])

    async function callLLM(question: string) {
        if (loading || loadingVar) {
			return;
		}
		if (!question) {
			alert("Please input a question");
			return;
		}
        setInput("");
		console.log("current chat in getResponse: ", currentChat)
		await setCurrentChat((state) => {
			const newState = [...state];
			newState.push(question);
			return newState;
		})
		console.log("currentChat after pushing question", currentChat)
		setLoading(true);
        loadingVar = true;
		// const question = input.trim()

		try {
			
			// https://us-central1-fir-test-962b5.cloudfunctions.net/app/chat
			const response = await fetch('/api/getLLMResponse', {
                method: 'POST',
                body: JSON.stringify({query: question, chatHistory: currentChatArrayRef.current}),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            // @ts-ignore
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let accumulated = '';
            let sources = ""
            let first = true;
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    accumulated += "  \n  \nSources:  \n" + sources
                    setCurrentChat((state) => {
                        const newState = [...state];
                        newState[newState.length - 1] += "  \n  \nSources:  \n" + sources;
                        return newState;
                    })
                    setLLMResponse(accumulated);
                    setLlmDone(true);
                    setLoading(false);
                    loadingVar = false;
                    break;
                }

                if (first) {
                    setCurrentChat((state) => {
                        const newState = [...state];
                        newState.push("");
                        return newState;
                    })
                    first = false;
                }

                const chunkText = decoder.decode(value, { stream: true }).toString();
                console.log("chunkText: ", chunkText);
                if (chunkText.includes("Source by LLM:")) {
                    // console.log("in chunkText.includes");
                    // console.log("chunkText.replaceAll: ", chunkText.replaceAll("Source by LLM:", ""));
                    sources += chunkText.replaceAll("Source by LLM:", "");
                } else if (chunkText.includes("End of Source by LLM")) {
                    let endIndex = chunkText.indexOf("End of Source by LLM");
                    sources += chunkText.slice(0, endIndex + 20);
                    accumulated += chunkText.slice(endIndex + 20);
                    console.log("accumulated added with end of sources: ", chunkText.slice(endIndex + 20));
                    setCurrentChat((state) => {
                        const newState = [...state];
                        newState[newState.length - 1] += chunkText.slice(endIndex + 20);
                        return newState;
                    })
                } 
                else {
                    accumulated += chunkText;
                    // console.log("chunkText: ", chunkText);
                    setCurrentChat((state) => {
                        const newState = [...state];
                        newState[newState.length - 1] += chunkText;
                        return newState;
                    })
                }
            }
            
			
			
		} catch (error) {
			console.log("Error", error);
			setLoading(false);
		}


    }

    async function getResponse(event:any) {
		// console.log(input);
		event.preventDefault();
        callLLM(input);
	}

    // END OF 2022 CODE ********************************************************************************************    

    useEffect(() => {
        console.log("isListening Changed", isListening)
    }, [isListening]) 
    
    const startListening = async () => {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Web Speech API is not supported on this browser. Try Chrome!");
            return;
        }

        const recognition = new (window as any).webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognitionRef.current = recognition;

        recognition.onstart = () => {
            setIsListening(true);
            console.log("Recognition started inside .onStart func")
        };

        recognition.onresult = async (event: any) => {


            
            let finalTranscript = '';
    
            for (let i = 0; i < event.results.length; i++) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalTranscript += transcript;
                }
            }
            finalTranscript = finalTranscript.split(",").join("").trim();
            finalTranscript = finalTranscript.toLowerCase();

            const replacementPhrases = ["high advisor", "hey advisor", "hi advisor", "high adviser", "hey adviser", "hi adviser", "he advisor", "he adviser", "head visor", "heyadvisor", "heyadviser", "hair advisor", "pay advisor", "pay adviser", "head riser",
                                        "high policy advisor", "hey policy advisor", "hi policy advisor", "high policy adviser", "hey policy adviser", "hi policy adviser"];

            for (let i = 0; i < replacementPhrases.length; i++) {
                finalTranscript = finalTranscript.replaceAll(replacementPhrases[i], "hi advisor");
            }
            // console.log(finalTranscript.toLowerCase());
            // console.log("New event")
            // console.log(event)
            // const transcript = event.results[0][0].transcript.trim();
            // console.log(finalTranscript.toLowerCase())

            if (finalTranscript.includes("hi advisor") && finalTranscript.includes("thank you")) {
                // console.log("Doing")

                const lowercaseTranscript = finalTranscript.toLowerCase();
                const startIndex = lowercaseTranscript.lastIndexOf("hi advisor");
                const endIndex = lowercaseTranscript.lastIndexOf("thank you");
                
                
                if (startIndex < endIndex) {
                    const extractedText = finalTranscript.slice(startIndex + 10, endIndex);
                    console.log(extractedText)
                    if (extractedText === "") {
                        console.log("Empty string")
                        recognition.stop()
                    }
                    callLLM(extractedText);
                } 
                
                recognition.stop();
                
            } else if (finalTranscript.includes("hi advisor")) {
                const lowercaseTranscript = finalTranscript.toLowerCase();
                const startIndex = lowercaseTranscript.lastIndexOf("hi advisor");
                const extractedText = finalTranscript.slice(startIndex + 10);
                setInput(extractedText);
                setMessage("Listening...");
            }
            else {
                // setMessage("Phrase not recognized");
                console.log(finalTranscript.toLowerCase(), ": is not the phrase")
            }
            // setIsListening(false);
        };

        recognition.onerror = (event: any) => {
            console.error(event.error);
            setIsListening(false);
            recognition.stop();
        };

        recognition.onend = () => {
            setIsListening(false);
            startListening();
        }
        
        recognition.start();
        
        console.log("Recognition started")
    }
    
    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setMessage("");
            setIsListening(false);
            recognitionRef.current = null;
        }
    } 

    function extractSources(message: string) {
        // console.log("message in extractSources: ", message)
        const sourcesStartIndex = message.indexOf("\n  \nSources:");
        
        if (sourcesStartIndex === -1) {
          return []; // No sources found
        }
      
        const sourcesPart = message.slice(sourcesStartIndex + "\n  \nSources:".length);
        // console.log("sourcesPart: ", sourcesPart)
        const sources = sourcesPart.split("End of Source by LLM")
                        .map(line => line.trim())
                        .filter(line => line.startsWith("* ["))
                        .map(line => {
                            // @ts-ignore
                            const matches = line.match(/\* \[(.*?)\]\((.*?)\)/s);
                            return matches ? { text: matches[1], url: matches[2] } : {};
                        })
                        
          
        //   .filter(line => line.startsWith("* ["))
        //   .map(line => {
            // const matches = line.match(/\* \[(.*?)\]\((.*?)\)/);
        //     return matches ? { text: matches[1], url: matches[2] } : null;
        //   })
        //   .filter(source => source !== null);
        
        // console.log("sources: ", sources)
        return sources;
      }

    return (
        <div className="flex">
            
            


            <div className='flex bg-[rgb(222,233,235)]'>
                <ChatHistory currentChat={currentChat} setCurrentChat={setCurrentChat} currChatId={currChatId} setCurrChatId={setCurrChatId} chatHistory={chatHistory} setChatHistory={setChatHistory}/>

                {status === "authenticated" &&
                <div className='flex flex-col ml-10' id='main'>
                    
                        
                        {/* <ChatLogs/> */}
                    <div className="chat-history overflow-auto overflow-y-auto flex-col justify-center">
                        {/* Loads all chat messages in chatHistory */}
                        {currentChat.map((message, index) => {
                            // console.log("currentRawMessage in map: ", JSON.stringify(message))
                            const sources = extractSources(message);
                            const messageWithoutSources = message.split("\n  \nSources:")[0];
                            return (
                            <div key={index} ref={index === currentChat.length - 1 ? currentChatRef: null} className={`flex flex-row p-8 my-6 ${index % 2 === 0 ? 'bg-[rgb(214,224,227)]' : 'bg-[rgb(239,246,248)]'}`}>
                                <img src={index % 2 === 0 ? "/PA ICON.png" : "/user-icon.webp"} alt="User/Bot Icon" className='mr-5 icon' width="40" height="48" />
                                <div key={index} className='p-2 rounded message prose prose-sm max-w-none [&_table]:border-collapse [&_table]:w-full [&_td]:border [&_td]:border-gray-600 [&_td]:p-2 [&_th]:border [&_th]:border-gray-600 [&_th]:p-2 [&_th]:font-bold'>
                                    <ReactMarkdown remarkPlugins={[remarkGfm]} className="markdown">{messageWithoutSources}</ReactMarkdown>
                                    {sources.length > 0 &&
                                     (<div className="mt-4">
                                        <h4>Sources:</h4>
                                        <div className="source-links flex">
                                            {sources.map((currSource, index) => (
                                                <SourceLink url={currSource.url || ""} text={currSource.text || ""} index={index} key={index}></SourceLink>
                                            ))}
                                        </div>
                                     </div>)}
                                </div>
                            </div>)
                        }
                        )
                        }
                        {/* Puts a loading icon if API request is being made */}
                        <LoadingSpinner loading={loading}/>
                        
                    <div ref={currentChatRef}></div>
                    </div>
                    <div className='flex flex-start'>
                        <form onSubmit={getResponse} className='w-full flex flex-row justify-center items-center mr-0'>
                            <input type='text' value={input} onChange={e => setInput(e.target.value)} id="textInput" className='w-4/5 px-4 py-2 rounded-md mt-2 mr-2 focus:outline-none bg-white'></input>
                            
                            <button type='submit' className='mt-2 text-white bg-[rgb(0,182,228)] font-medium rounded-lg text-sm px-5 py-2.5 mr-2'>Send</button>
                            <button type='button' className='mt-2 text-white bg-[rgb(0,182,228)] font-medium rounded-lg text-sm px-2 py-2.5 mr-2' onClick={startListening} disabled={isListening}> {isListening ? "Listening..." : "Start Listening"} </button>
                        </form>
                        <div>{message}</div>
                        
                    </div>
                </div>
                }
			
		</div>

        </div>
    )


}
