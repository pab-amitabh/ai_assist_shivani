'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { useReactMediaRecorder } from "react-media-recorder-2";
import { start } from 'repl';
import { signIn, useSession,signOut } from "next-auth/react";
import ChatHistory from './ChatHistory';
import LoadingSpinner from './LoadingSpinner';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm'
import { decode } from 'punycode';
import { stringify } from 'querystring';
import SourceLink from './SourceLink';
import { title } from 'process';
import { Lato } from 'next/font/google';
export default function CommandActivation() {
    const [isListening, setIsListening] = useState(false);
    const [message, setMessage] = useState(false);
    const [audioBlob, setAudioBlob] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef<null | any>(null);
    const [LLMResponse, setLLMResponse] = useState("");
    const [sendDisabled,setSendDisabled] = useState(false);
    const [rating,setRating] = useState(null);
    const [AIResponse,setAIResponse] = useState(false)
    const [pendingElaboration,setPendingElaboration]=useState<{message_id: string, event: any} | null>(null)
    const [contentCopy,setContentCopy]=useState<boolean>(false);


    // START OF 2022 Code *********************************************************************************************
    interface Chat {
        id: string,
        messages: Message[],
        userId: string,
    }

    interface Message {
        content: string;
        sender: string;
        messageType: string;
        id: string;
        rating: number;
        reviewComments: string;
        commentAddedAt?: Date | null;
        createdAt?: Date | null;
    } 
    
    const { data : session, status } = useSession();
    const [input, setInput] = useState("");
    // const [currentChat, setCurrentChat] = useState<string[]>(["Hello, I am PolicyAdvisor AI Assitant. What can I help you with?"]);
    const [currentChat, setCurrentChat] = useState<{ 
        message: string;
        sender: string;
        messageType: string;
        messageId: string;
        rating: number;
        reviewComments: string;
        commentAddedAt?: Date | null;
        createdAt?: Date | null;
    }[]>([{ message: "Hello, I am PolicyAdvisor AI Assistant. What can I help you with?", sender: "AI", messageType: "ANSWER", messageId: "", rating: -1, reviewComments: "", commentAddedAt: null, createdAt: null}]);
    const [sectionQuestion,setSectionQuestion]=useState<{[key:string]:string[]}>({
        'Life Insurance':[
            "What are the key differences between term life and whole life insurance?",
            "How does a life insurance policy’s cash value work?",
            "What factors determine the premium rates for life insurance?",
            "Can a life insurance policy be transferred to another person?",
            "What happens if I outlive my term life insurance policy?",
            "Are life insurance benefits taxable for the beneficiaries?"
        ],
        'Critical Insurance':[
            "What types of illnesses are typically covered under critical illness insurance?",
            "How does critical illness insurance differ from traditional health insurance?",
            "Can I purchase critical illness insurance if I already have a pre-existing condition?",
            "What is the process for filing a claim for critical illness benefits?",
            "Is there a waiting period before I can claim benefits under critical illness insurance?",
            "Can I use the payout from my CI insurance for non-medical expenses?"
        ],
        'Disability Insurance':[
            "What is the difference between short-term and long-term disability insurance?",
            "How is the benefit amount determined for disability insurance?",
            "Can I receive disability insurance benefits while working part-time?",
            "Does disability insurance cover mental health conditions?",
            "How long does it take to start receiving benefits after filing a disability claim?",
            "Is disability insurance taxable if paid by an employer?"
        ],
        'Group Health':[
            "What are the advantages of enrolling in a group health insurance plan?",
            "Can I keep my group health insurance coverage if I leave my employer?",
            "How does group health insurance impact my individual insurance options?",
            "Are family members eligible for coverage under a group health insurance plan?",
            "What happens if my employer changes the group health insurance provider?",
            "How does group health insurance handle pre-existing conditions?"
        ],
        'Mortgage Insurance':[
            "How does my credit score affect mortgage insurance rates?",
            "How long do I have to pay for mortgage insurance?",
            "Can I cancel my mortgage insurance once I reach a certain loan-to-value ratio?",
            "What happens to mortgage insurance if I refinance my home?",
            "Does mortgage insurance cover disability or job loss?",
            "Can I cancel mortgage insurance early?"
        ]
    });

    
    
    const [finalSectionQuestions,setFinalSectionQuestions]=useState<string[]>([
            "What are the key differences between term life and whole life insurance?",
            "How does a life insurance policy’s cash value work?",
            "What factors determine the premium rates for life insurance?",
            "Can a life insurance policy be transferred to another person?",
            "What happens if I outlive my term life insurance policy?",
            "Are life insurance benefits taxable for the beneficiaries?"]);
    
    
    const [homepageButton,setHomepageButton]=useState<[string,string,string,string,string]>(['Life Insurance','Critical Insurance','Disability Insurance','Group Health','Mortgage Insurance']);
    const [loading, setLoading] = useState<boolean>(false);
    const [chatHistory, setChatHistory] = useState<Chat[]>([]);
    const [currChatId, setCurrChatId] = useState<string>("");
    const [llmDone, setLlmDone] = useState<boolean>(false);
    const [commentMessage,setCommentMessage] = useState<{[key:string]:string}>({})
    let loadingVar = false;
    const currentChatRef = useRef<HTMLDivElement | null>(null);
    const [activeButton,setActiveButton]=useState('Life Insurance')

    const currentChatArrayRef = useRef(currentChat);
    const [sourcesData,setSourcesData]= useState<Array<{ text?: string; url?: string; heading?: string; }>>([])
    const [fastQuestion,setFastQuestion]=useState(false);
    const [detailMode,setDetailMode]=useState<boolean>(false);
    const [isOpen, setIsOpen] = useState(false);

    // Update currentChatRef to latest currentChat
    useEffect(() => {
    currentChatArrayRef.current = currentChat;
    }, [currentChat]);
    
    // Scroll to bottom of chat when new message is added
    useEffect(() => {
        if (currentChatRef.current) {
            currentChatRef.current.scrollIntoView({ behavior: "smooth" });
            setSourcesData([])
        }
       
    }, [currentChat])


    // updates chatHistory when a new LLmResponse is received
    useEffect(() => {
        if (llmDone) {
            setMessage(false);
            setLoading(false);

            // const normalizedLLMResponse = LLMResponse.toLowerCase()
            //         .replace(/\s+/g, " ") // Normalize spaces and newlines
            //         .replace(/\*/g, "") // Remove markdown bold formatting
            //         .replace(/<b>/g, "").replace(/<\/b>/g, ""); // Remove <b> HTML tags
            
            // console.log("Normalized Response:", normalizedLLMResponse);
            // const generatedByAI=normalizedLLMResponse.includes("response is generated by openai");

            const updateChat = async (newMessage: string, messageType: string, sender: string, questionId: string | null,isResolved: boolean ) => {
                const response= await fetch("/api/updateChat", {
                    method: 'POST',
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ chatId: currChatId, message: newMessage,messageType: messageType,sender: sender, questionId:questionId, isResolved: isResolved})
                })
                const data=await response.json();
                return data.question_id;
            }

            const updateBothChats = async () => {
                if (currentChat.length < 2) return; // Prevent accessing an out-of-bounds index
            
                const lastUserMessage = currentChat[currentChat.length - 2]; // Get the last user message
                const question_id = await updateChat(lastUserMessage.message, 'QUESTION', 'USER', null, false);
            
                if (AIResponse) {
                    const answer_id = await updateChat(LLMResponse, 'ANSWER', 'AI', question_id, true);
                    
                    // Update AI message with answer_id in currentChat
                    setCurrentChat((state) =>
                        state.map((msg, idx) =>
                            idx === state.length - 1 ? { ...msg, messageId: answer_id } : msg
                        )
                    );
                } else {
                    const answer_id = await updateChat(LLMResponse, 'ANSWER', 'AI', question_id, false);
                    
                    // Update AI message with answer_id in currentChat
                    setCurrentChat((state) =>
                        state.map((msg, idx) =>
                            idx === state.length - 1 ? { ...msg, messageId: answer_id } : msg
                        )
                    );
                }
            };
            
            updateBothChats();
            setLlmDone(false);
            setAIResponse(false);
            
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
		// await setCurrentChat((state) => {
		// 	const newState = [...state];
		// 	newState.push(question);
		// 	return newState;
		// })
        await setCurrentChat((state) => [
            ...state,
            {
                message: question,
                sender: "USER",
                messageType: "QUESTION",
                messageId: "",
                rating: -1,
                reviewComments: "",
                commentAddedAt: null
            }
        ]);

        
        console.log('question::',question)
		console.log("currentChat after pushing question", currentChat)
		setLoading(true);
        scrollToBottom();
        setSendDisabled(true);
        loadingVar = true;
		// const question = input.trim()

		try {
			// https://us-central1-fir-test-962b5.cloudfunctions.net/app/chat
			const response = await fetch('/api/getLLMResponse', {
                method: 'POST',
                body: JSON.stringify({query: question, chatHistory: currentChatArrayRef.current, detailMode:detailMode}),
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
            setLoading(false);
            while (true) {
                const { done, value } = await reader.read();
                if (done) {
                    const normalizedLLMResponse = accumulated.toLowerCase()
                    .replace(/\s+/g, " ") // Normalize spaces and newlines
                    .replace(/\*/g, "") // Remove markdown bold formatting
                    .replace(/<b>/g, "").replace(/<\/b>/g, ""); // Remove <b> HTML tags
            
                    if (!normalizedLLMResponse.includes("response is generated by openai")){
                        accumulated += "  \n  \nSources:  \n" + sources 
                        setCurrentChat((state) => 
                            state.map((msg, idx) =>
                                idx === state.length - 1 
                                    ? { ...msg, message: msg.message + (sources !== '' ? "\n\nSources:\n": '' ) + sources }
                                    : msg
                            )
                        );
                    } else {
                        setAIResponse(true);
                    }

                    
                    setLLMResponse(accumulated);
                    setLlmDone(true);
                    loadingVar = false;
                    setSendDisabled(false);
                    break;
                }

                // if (first) {
                //     setCurrentChat((state) => {
                //         const newState = [...state];
                //         newState.push("");
                //         return newState;
                //     })
                //     first = false;
                // }
                
                if (first) {
                    setCurrentChat((state) => [
                        ...state,
                        { message: "", sender: "AI", messageType: "ANSWER", messageId: '', rating:-1, reviewComments: "", commentAddedAt: null } // Temporary ID
                    ]);
                    first = false;
                }
                


                const chunkText = decoder.decode(value, { stream: true }).toString();
                // console.log("chunkText: ", chunkText);
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
                        return state.map((msg, idx) =>
                            idx === state.length - 1 ? { ...msg, message: msg.message + chunkText } : msg
                        );
                    });
                } 
                else {
                    accumulated += chunkText;
                    // console.log("chunkText: ", chunkText);
                    setCurrentChat((state) => {
                        return state.map((msg, idx) =>
                            idx === state.length - 1 ? { ...msg, message: msg.message + chunkText } : msg
                        );
                    });
                }
            }
            
			
			
		} catch (error) {
			console.log("Error", error);
			setLoading(false);
		}
    }

    async function getResponse(event:any) {
        if (!input.endsWith('? Please elaborate in detail.') && !input.endsWith('? Please answer in brief.') && fastQuestion === false) {
            event.preventDefault();
        }
        callLLM(input);
	}

    // END OF 2022 CODE ********************************************************************************************    

    // useEffect(() => {
    //     console.log("isListening Changed", isListening)
    // }, [isListening]) 
    
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
            setMessage(true);
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
                    setMessage(false)
                    callLLM(extractedText);
                } 
                
                recognition.stop();
                
            } else if (finalTranscript.includes("hi advisor")) {
                const lowercaseTranscript = finalTranscript.toLowerCase();
                const startIndex = lowercaseTranscript.lastIndexOf("hi advisor");
                const extractedText = finalTranscript.slice(startIndex + 10);
                setInput(extractedText);
                
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
            setMessage(false);
            setIsListening(false);
            recognitionRef.current = null;
        }
    } 

    function extractSources(message: string) {
        // console.log("message in extractSources: ", message)
        const sourcesStartIndex = message.indexOf("\nSources:");
        
        if (sourcesStartIndex === -1) {
          return []; // No sources found
        }
      
        const sourcesPart = message.slice(sourcesStartIndex + "\nSources:".length);
        // console.log("sourcesPart: ", sourcesPart)
        const sources = sourcesPart.split("End of Source by LLM")
                        .map(line => line.trim())
                        .filter(line => line.startsWith("* ["))
                        .map(line => {
                            // @ts-ignore
                            const matches = line.match(/\* \[(.*?)\]\((.*?)\)/s);
                            // console.log('matches:::',matches);
                            const heading = matches ? matches[1].split("  \n")[1] : {}
                            const plaintext = matches ? matches[1].split("  \n")[2] : {}
                            return matches ? { text: plaintext, url: matches[2], heading: heading } : {};
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

    const updateRating = async (message_id:any, rating:any) => {
        const response= await fetch("/api/updateRating", {
            method: 'POST',
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({message_id,rating})
        })
        const result=await response.json()
        setCurrentChat((state)=>
            state.map((msg)=>
                msg.messageId === message_id ? {...msg,rating: result.rating} : msg
            )
        )
    }

    const LoadingDots = () => {
        return (
        <div className="flex w-full max-w-md ml-4  p-4 items-center bg-white rounded-lg animate-pulse">
            <img src="/PA ICON.png" className="icon rounded mt-4" />
            <p className="text-gray-500 ml-4 mr-2 ">Analyzing</p>
            <div className="w-full h-2 bg-gray-300 rounded-lg overflow-hidden">
                <div className="h-2 bg-gray-500 animate-[loading_1.5s_linear_infinite]"></div>
            </div>
        </div>
        );
    };

    const handleKeydown = (event: any) => {
        setFastQuestion((prev)=>false);
        if (event.key === "Enter"){
            if (event.shiftKey) {
                event.preventDefault();
                setInput((prev)=>prev+'\n')
            } else {
                event.preventDefault();
                if (input.trim() !== "") {
                    getResponse(event); 
                }
            }
        }
    }

    const handleComment = (message_id:string,e:any) => {
        setCommentMessage((prev)=>({
            ...prev,
            [message_id]: e.target.value
        }))
    }

    const openCommentBox = async(message_id:string) => {
        const message_value=commentMessage[message_id]
        if (message_value !== ""){
            const response=await fetch('/api/saveComment',{
                method: "POST",
                headers: {
                    "Content-type":"application/json"
                },
                body: JSON.stringify({message_value, message_id})
            }) 
            const res=await response.json()
            if (res){
                setCommentMessage((prev)=>({
                    ...prev,
                    [message_id]:res.commentMessage
                }))
            }

        }
    }

    const isComment24hours=(commentAddedAt:Date|string|null)=>{
        if(!commentAddedAt){
            return false;
        }
        const commentDate=new Date(commentAddedAt)
        const now=new Date()
        const diff_time=now.getTime() - commentDate.getTime();
        const diffInHours=diff_time/(1000*60*60);
        return diffInHours > 24;
    }

    useEffect(()=>{
        if(pendingElaboration?.message_id && input || fastQuestion && input){
            getResponse(input);
            setPendingElaboration(null);
        }
    },[input])

    const elaborateMessage = async(message_id: string,event:any, detailMode:Boolean) => {
        const response = await fetch('/api/getMessageDetails',{
            method: "POST",
            headers: {
                "Content-type": "application/json"
            },
            body: JSON.stringify({message_id: message_id})
        })
        const result=await response.json();
        let question_content= result.response.question.content;
        if (!detailMode){
            if (question_content.endsWith("?")){
                question_content = question_content.replace("?","? Please elaborate in detail.")
            } else {
                question_content = question_content + '? Please elaborate in detail.'
            }
        } else {
            if (question_content.endsWith("?")){
                question_content = question_content.replace("?","? Please answer in brief.")
            } else {
                question_content = question_content + '? Please answer in brief.'
            }
        }
        setInput(question_content);
        setPendingElaboration({message_id,event})
    }

    const finalSectionQuestionFunc = (e:any,buttonValue:string) => { 
        setFinalSectionQuestions(sectionQuestion[buttonValue]);
        setActiveButton(buttonValue);
    }

    const formatMessageTime = (isoString:string) => {
        const date = new Date(isoString);
        return date.toLocaleString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
            day: "2-digit",
            month: "short"
        }).replace(",", ""); 
    };

    const showSources = (sources: any, event: any) => {
        setSourcesData(sources);
    }

    const fastQuestionFunc = (event:any, eachQuestion: string) => {
        setFastQuestion(true)
        setInput(eachQuestion)
    }

    const changeMode = (isChecked:boolean) => {
        setDetailMode((prev)=>isChecked);
    }

    const copyContent = async(event:any,message:string) => {
        try {
            await navigator.clipboard.writeText(message);
            setContentCopy(true)
            setTimeout(() => setContentCopy(false), 2000);
        } catch (err) {
            console.error("Failed to copy: ", err);
        }
    }

    const scrollToBottom = () => {
        if (currentChatRef.current) {
            currentChatRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        if (loading) {
            scrollToBottom(); 
        }
    }, [loading]);

    // bg-[rgb(222,233,235)]
    return (
            <div className='flex h-screen text-sm' style={{ fontFamily: 'Lato, sans-serif' }}>
                <ChatHistory currentChat={currentChat} setCurrentChat={setCurrentChat} currChatId={currChatId} setCurrChatId={setCurrChatId} chatHistory={chatHistory} setChatHistory={setChatHistory} />
                {status === "authenticated" &&
                    <>
                        <div className={`flex-1 p-1 ${currentChat.length !== 1 ? "max-w-5xl" : "max-w-8xl"} flex flex-col items-center`}>
                            <div className="w-full  flex justify-between items-center bg-white p-4 rounded-lg">
                                <div className='mr-auto'>
                                    <img src='/policyadvisor-logo.svg' height='200px' width='200px' alt='PolicyAdvisor'/>
                                </div>
                                <div className='flex flex-row items-center space-x-2 mr-3'>
                                    <label className="inline-flex items-center cursor-pointer">
                                        <input type="checkbox" checked={detailMode} className="sr-only peer" onChange={(event) => changeMode(event.target.checked)} / >
                                        <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-[rgb(22,184,216)] dark:peer-checked:bg-[rgb(22,184,216)]"></div>
                                        <span className="ms-1 text-sm font-medium text-gray-900 dark:text-gray-300">Detail Mode</span>
                                    </label>
                                </div>
                                <div className="relative">
                                    <button 
                                        className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <img 
                                            src={session?.user?.image ? session.user?.image :"/user-icon.webp"} 
                                            alt="User Avatar" 
                                            className="w-8 h-8 rounded-full border border-gray-300"
                                        />
                                        <span className="text-gray-700 font-medium">{session?.user?.name}</span>
                                    </button>

                                    {/* Dropdown Menu */}
                                    {isOpen && (
                                        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                            <ul className="py-2 text-sm text-gray-700">
                                                <li>
                                                    <button 
                                                        className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                                                        onClick={() => signOut()} 
                                                    >
                                                        Logout
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <hr className="w-full border-t border-gray-300 my-2" />

                            {currentChat.length === 1 ? 
                                <>
                                    <div className="mt-24 w-full bg-white rounded-lg flex flex-col md:flex-row text-center">
                                        <div className="md:ml-6 flex-1">
                                            <h2 className="text-3xl font-extrabold text-gray-900">Welcome to AdvisorGPT</h2>
                                            <p className="text-gray-300 mt-1">Version 1.0.0</p>
                                        </div>
                                    </div>
                                    <div className="w-full  flex justify-between items-center bg-white p-4 rounded-lg ">
                                        <div className='flex m-auto'>
                                        {/* bg-gradient-to-r from-teal-400 to-teal-500 text-white */}
                                            {homepageButton.map((eachButton,index)=>(
                                                <button type="button" key={`sections_button_${index}`} className={`rounded-full m-2 px-5 py-2 ${eachButton === activeButton? ' text-white' : 'border-2 border-gray-200'}`} style={eachButton === activeButton ? { background: "linear-gradient(to right, #5DE0E6, #004AAD)" }: {}} onClick={(e)=>finalSectionQuestionFunc(e,eachButton)}>{eachButton}</button>
                                            ))}
                                        </div>
                                    </div>
                                
                                    <div className={`mt-6 mb-10 ${currentChat.length !== 1 ? "w-3/5" : "w-4/5"}  grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3`}>
                                    {finalSectionQuestions?.map((eachQuestion,index)=>(
                                        <button key={`each_question_${index}`} className="w-full bg-white border border-gray-300 rounded-lg shadow-md p-4 text-gray-600 font-bold" onClick={(event)=>fastQuestionFunc(event,eachQuestion)}>
                                            {eachQuestion}
                                        </button>
                                    
                                    ))}
                                    </div>
                                </>
                            : 
                                <div className="overflow-y-auto flex-1 w-full flex flex-col rounded-3xl text-center">
                                    {currentChat.map((message, index) => {
                                        const isAIMessage = message.sender === "AI"; // AI messages
                                        const sources = extractSources(message.message); // Extract sources
                                        const messageWithoutSources = message.message.split("\nSources:")[0];
                                        const comment_date = message.commentAddedAt || null;
                                        const comment_hrs = isComment24hours(comment_date);
                                        const message_time = message.createdAt || null;
                                        // style={!isAIMessage ? {background: "linear-gradient(to right, #5DE0E6, #004AAD)"} : {}}
                                        return (
                                            <>
                                            {!isAIMessage && <div className='flex justify-end w-full pr-8 text-gray-400'>{message_time ? formatMessageTime(message_time.toLocaleString()) : ""}</div>}
                                            <div key={message.messageId || `chat-${index}`} ref={index === currentChat.length - 1 ? currentChatRef : null} className={`flex w-full my-1 ${isAIMessage ? "justify-start" : "justify-end"}`}>
                                                
                                                <div className={`ml-8 mr-8 mt-1 mb-1 rounded-lg ${isAIMessage ? " text-gray-900" : "text-black bg-gray-100"}`}>
                                                    <div className='flex'>
                                                        {isAIMessage && (
                                                        <img src="/PA ICON.png" className="icon rounded mt-4" />
                                                        )}
                                                        
                                                        <ReactMarkdown remarkPlugins={[remarkGfm]} className={`markdown text-gray-700 max-w-4xl text-justify ${isAIMessage ? "px-3" : "px-6"}`}>
                                                            {messageWithoutSources}
                                                        </ReactMarkdown>
                                                    </div>

                                                    {isAIMessage && index !== 0 && (
                                                        <div className={`relative ml-11 ${sources.length > 0 ? "mt-2":""} `}>
                                                            <div className="flex">
                                                                {sources.length > 0 && 
                                                                    <>
                                                                        <button
                                                                            className="px-2 py-4 bg-[rgb(250,226,237)] text-[rgb(216,22,113)] mr-2 hover:scale-105 rounded-lg h-6 text-sm flex items-center gap-1 "
                                                                            data-id={`thumbs_down_${message.messageId}`}
                                                                            onClick={(event) => elaborateMessage(message.messageId, event, detailMode)}
                                                                        >
                                                                            {detailMode === false ? 
                                                                                <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`size-4`}>
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
                                                                                </svg>
                                                                                Elaborate</> : 
                                                                                <><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className={`size-4`}>
                                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
                                                                                </svg>
                                                                                Summarize</>
                                                                            }

                                                                        </button>
                                                                        <button
                                                                            className="px-2 py-4 bg-[rgb(226,245,250)] text-[rgb(22,184,216)] mr-auto hover:scale-105 rounded-lg h-6 text-sm flex items-center gap-1 "
                                                                            data-id={`sources_${message.messageId}`}
                                                                            onClick={(event) => showSources(sources, event)}
                                                                        >
                                                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-4">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
                                                                            </svg>
                                                                            Sources
                                                                        </button>
                                                                    </>
                                                                }
                                                                <button className={`px-2 mr-2 hover:text-green-600 hover:scale-105 bg-gray-100 hover:shadow  ${message.rating === 5 ? "text-white" : "border-gray-300"} rounded-md h-6 text-sm flex items-center gap-1`} data-id={`thumbs_up_${message.messageId}`} onClick={() => updateRating(message.messageId, 5)} disabled={message.rating === 5 ? true : false}>
                                                                    {/* <img src="/thumbsUp.svg" className="w-4" /> */}
                                                                    {message.rating === 5 ? <img src="/thumbsDownColored.svg" className="w-4 scale-y-[-1] scale-x-[-1]" /> : <img src="/thumbsDownNonColored.svg" className="w-4 scale-y-[-1] scale-x-[-1]" />}
                                                                </button>

                                                                <button className={`px-2 mr-2 hover:scale-105 hover:shadow bg-gray-100 cursor-pointer ${message.rating === 0 ? "bg-[rgb(216,22,113)] text-[rgb(216,22,113)]" : "border-gray-300 text-black"} rounded-md h-6 text-sm flex items-center gap-1`} data-id={`thumbs_down_${message.messageId}`} onClick={() => updateRating(message.messageId, 0)} disabled={message.rating === 0 ? true : false}
                                                                >
                                                                    {message.rating === 0 ? <img src="/thumbsDownColored.svg" className="w-4 " /> : <img src="/thumbsDownNonColored.svg" className="w-4" />}
                                                                </button>

                                                                <button className={`px-2 mr-2 hover:scale-105 hover:shadow bg-gray-100 cursor-pointer rounded-md h-6 text-sm flex items-center gap-1`} data-id={`copy_${message.messageId}`} onClick={(e)=>copyContent(e,messageWithoutSources)} >
                                                                    {!contentCopy ?
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" 
                                                                    strokeWidth="1.5" stroke="currentColor" className="w-4 text-gray-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 7.5V6.108c0-1.135.845-2.098 1.976-2.192.373-.03.748-.057 1.123-.08M15.75 18H18a2.25 2.25 0 0 0 2.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 0 0-1.123-.08M15.75 18.75v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 7.5H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25h-1.5a2.251 2.251 0 0 0-2.15 1.586m5.8 0c.065.21.1.433.1.664v.75h-6V4.5c0-.231.035-.454.1-.664M6.75 7.5H4.875c-.621 0-1.125.504-1.125 1.125v12c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V16.5a9 9 0 0 0-9-9Z" />
                                                                    </svg> : 
                                                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 text-gray-400">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                                                    </svg>
                                                                    }
                                                                </button>
                                                            </div>
                                                            <div className='mt-2'>
                                                            {message.rating === 0 && <>
                                                                    <div className='gap-sm p-md pt-sm relative flex w-full flex-col rounded-md border border-borderMain/50 ring-borderMain/50 divide-borderMain/50 dark:divide-borderMainDark/50  dark:ring-borderMainDark/50 dark:border-borderMainDark/50 bg-transparent h-50'>
                                                                    <div className="absolute -top-4 mr-8 right-1 -translate-x-1/2">
                                                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="0.3" stroke="gray" className="size-6">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 15.75 7.5-7.5 7.5 7.5" />
                                                                        </svg>
                                                                    </div>
                                                                    <span className='text-gray-500 text-left pl-2 pt-2'>What didn't you like about this response (optional)?</span>
                                                                    <div className='flex'>
                                                                    <input type="text" value={commentMessage[message.messageId] || message.reviewComments} onChange={(e) => handleComment(message.messageId,e)} id={`textInput_${index}`} className={`w-full h-8 resize-none  focus:outline-none bg-white mt-2 mb-2 ml-2 pl-2 pr-2 border border-[rgb(0,182,228)]-200 ${!comment_hrs? '' : '' }`} autoComplete='off' placeholder='Type you message here...'  disabled={comment_hrs ? true: false}/>
                                                                    {!comment_hrs && 
                                                                        <button className="text-white px-2 mb-2 mt-2 mr-2  bg-[rgb(226,245,250)]" data-id={`comment_${message.messageId}`} onClick={()=>openCommentBox(message.messageId)}>
                                                                        <svg width="18" height="25" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M1.56322 4.8854C1.02122 5.1129 0.684804 5.5179 0.679721 6.09123C0.676221 6.49206 0.94672 7.03041 1.48872 7.25041C1.71197 7.34125 4.84655 7.76291 4.84655 7.76291C4.84655 7.76291 5.67622 10.3854 5.97522 11.3071C6.0618 11.5737 6.11114 11.7046 6.30114 11.8787C6.62347 12.1737 7.16839 12.0813 7.40405 11.8446C8.02755 11.2196 9.01305 10.2554 9.01305 10.2554L9.4278 10.5929C9.4278 10.5929 11.2696 12.0621 12.2763 12.7537C12.8691 13.1612 13.2805 13.5862 13.9476 13.5887C14.2875 13.5904 14.8326 13.4212 15.1929 13.0087C15.431 12.7362 15.5837 12.3004 15.6428 11.9096C15.7771 11.0221 17.3531 1.42541 17.3464 1.08957C17.3357 0.553738 16.885 0.252065 16.5103 0.255398C16.275 0.257898 16.0811 0.326241 15.6496 0.457908C12.3117 1.47708 1.7843 4.7929 1.56322 4.8854ZM14.0131 2.7554C14.0131 2.7554 9.61472 6.58374 7.85714 8.34541C7.29405 8.90958 7.2543 9.8779 7.2543 9.8779L6.34581 6.97123L14.0131 2.7554Z" fill="rgb(22,184,216)"/>
                                                                        </svg>
                                                                        </button>
                                                                    }
                                                                    </div>
                                                                    </div>
                                                                    </>
                                                                }
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            {isAIMessage && index !== 0 && <hr className="border-gray-200 my-2 mx-8"/>}
                                            </>
                                        );
                                    })}
                                    {loading &&  <LoadingDots />}
                                    <div ref={currentChatRef}></div>
                                    {message && <LoadingDots />}
                                </div>
                            }

                            {/* Chat Input Box */}
                            <form onSubmit={getResponse} className={`sticky bottom-0 ${currentChat.length === 1 ? "mt-20": "mt-2 mb-2" } w-full max-w-4xl flex items-center bg-white border border-gray-300 rounded-lg shadow-md p-3`} >
                                <input type="text" value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeydown} placeholder={loading ? 'Analyzing...':"Type your message here..."} className="w-full p-2 outline-none text-gray-700" readOnly={loading ? true : false} />
                                <button className="ml-4 px-4 py-2 rounded-lg bg-[rgb(226,245,250)]" disabled={sendDisabled}>
                                    {!loading ? 
                                        <svg width="18" height="25" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1.56322 4.8854C1.02122 5.1129 0.684804 5.5179 0.679721 6.09123C0.676221 6.49206 0.94672 7.03041 1.48872 7.25041C1.71197 7.34125 4.84655 7.76291 4.84655 7.76291C4.84655 7.76291 5.67622 10.3854 5.97522 11.3071C6.0618 11.5737 6.11114 11.7046 6.30114 11.8787C6.62347 12.1737 7.16839 12.0813 7.40405 11.8446C8.02755 11.2196 9.01305 10.2554 9.01305 10.2554L9.4278 10.5929C9.4278 10.5929 11.2696 12.0621 12.2763 12.7537C12.8691 13.1612 13.2805 13.5862 13.9476 13.5887C14.2875 13.5904 14.8326 13.4212 15.1929 13.0087C15.431 12.7362 15.5837 12.3004 15.6428 11.9096C15.7771 11.0221 17.3531 1.42541 17.3464 1.08957C17.3357 0.553738 16.885 0.252065 16.5103 0.255398C16.275 0.257898 16.0811 0.326241 15.6496 0.457908C12.3117 1.47708 1.7843 4.7929 1.56322 4.8854ZM14.0131 2.7554C14.0131 2.7554 9.61472 6.58374 7.85714 8.34541C7.29405 8.90958 7.2543 9.8779 7.2543 9.8779L6.34581 6.97123L14.0131 2.7554Z" fill="rgb(22,184,216)"/>
                                        </svg> : 
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" width="18" height="25" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" fill="rgb(22,184,216)" />
                                        </svg>
                                    }
                                    
                                </button>
                                <button className="ml-4 text-white px-4 py-2 rounded-lg bg-gray-100" onClick={startListening} disabled={isListening}>
                                    <svg width="18" height="25" viewBox="0 0 16 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1.66504 8.31428C1.88656 9.83637 2.64869 11.2278 3.81199 12.2341C4.9753 13.2403 6.462 13.7941 8.00012 13.7941M8.00012 13.7941C9.53825 13.7941 11.025 13.2403 12.1883 12.2341C13.3516 11.2278 14.1137 9.83637 14.3352 8.31428M8.00012 13.7941V17M8.00104 1C7.27359 1 6.57593 1.28898 6.06155 1.80336C5.54716 2.31775 5.25818 3.01541 5.25818 3.74286V7.4C5.25818 8.12745 5.54716 8.82511 6.06155 9.33949C6.57593 9.85388 7.27359 10.1429 8.00104 10.1429C8.72849 10.1429 9.42615 9.85388 9.94053 9.33949C10.4549 8.82511 10.7439 8.12745 10.7439 7.4V3.74286C10.7439 3.01541 10.4549 2.31775 9.94053 1.80336C9.42615 1.28898 8.72849 1 8.00104 1Z" stroke="#919191" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                    </svg>

                                </button>
                            </form>
                        </div>
                        {currentChat.length !== 1 && sourcesData.length > 0 && (
                            <div className="max-w-xs mx-auto flex flex-col items-center bg-white pl-2 pr-2 rounded-lg shadow-md">
                                {sourcesData.length > 0 && (
                                    <div className="mt-1 mb-1">
                                        <h2 className="text-lg font-semibold text-gray-700 text-center mb-2">Sources:</h2>
                                        <div className="source-links flex flex-col items-center space-y-2">
                                            {sourcesData.map((currSource, index) => (
                                                <div 
                                                    key={index} 
                                                    className="border bg-gray-100 text-gray-500 shadow-md p-2 pb-3 max-w-xs text-left rounded-lg hover:bg-gray-200 transition duration-200 ml-2 mr-2"
                                                >
                                                    <a
                                                        href={currSource.url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block mb-2"
                                                    >
                                                        <h2 className="text-sm font-bold">{currSource.heading}</h2>
                                                    </a>
                                                    <p className="text-xs line-clamp-3">{currSource.text}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
     
                    </>
                }
		    </div>
    )

}


