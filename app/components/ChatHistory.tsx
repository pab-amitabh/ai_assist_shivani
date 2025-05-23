import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Login from "./Login";
import React from "react";
import HomePage from "./HomePage";
import { usePathname } from "next/navigation";

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
    modelType: string;  // <<< ADDED
    commentAddedAt?: Date | null;
    createdAt?: Date | null;
}

export default function ChatHistory( { currentChat, setCurrentChat, currChatId, setCurrChatId, chatHistory, setChatHistory } : { 
    currentChat: { 
        message: string; 
        sender: string; 
        messageType: string; 
        messageId: string; 
        rating: number;
        reviewComments: string;
        modelType: string;    // <<< ADDED
        commentAddedAt?: Date | null;
        createdAt?: Date | null;
    }[], 
    setCurrentChat: React.Dispatch<React.SetStateAction<{
        message: string; 
        sender: string; 
        messageType: string; 
        messageId: string; 
        rating: number;
        reviewComments: string;
        modelType: string;   // <<< ADDED
        commentAddedAt?: Date | null;
        createdAt?: Date | null;
    }[]>>, 
    currChatId: string, 
    setCurrChatId: Function, 
    chatHistory: Chat[], 
    setChatHistory: Function 
})
 {
	
	const { data: session } = useSession();
	const [isOpen, setIsOpen] = useState<boolean>(false);
    const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState(null);
    const pathname = usePathname();
    const [mode, setMode] = useState("chatbot");

    useEffect(() => {
    if (pathname?.includes("travel")) setMode("travel");
    else setMode("chatbot");
    }, [pathname]);

	// useEffect(() => {console.log("it changed")}, [isOpen])

    const toggleDropdown = (index: any) => {
        setOpenDropdown(openDropdown === index ? null : index); // Toggle only the clicked dropdown
    };

	const updateChatHistory = async (email:string) => {
		let response = await fetch("/api/getChatHistory", {
			method: 'POST',
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email: email, mode:mode })
		})

		let userChatHistory = await response.json();
		await setChatHistory(userChatHistory.userChats);
		console.log("this is after setting", chatHistory);
	}
	

	useEffect(() => {
		async function getChatHistory(email:string) {
			let response = await fetch("/api/getChatHistory", {
				method: 'POST',
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ email: email, mode:mode })
			})

			let userChatHistory = await response.json();
			console.log("chatHistory in the func", userChatHistory);

			if (userChatHistory.userChats.length === 0 && !createdFirstChat) {
                console.log("Creating first chat in ChatHistory.tsx")
                setCreatedFirstChat(true);
				await fetch("/api/createFirstChat", {
					method: 'POST',
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: email, mode:mode})
				})
                
				response = await fetch("/api/getChatHistory", {
					method: 'POST',
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: email, mode:mode })
				})
	
				userChatHistory = await response.json();
                console.log('here:::',userChatHistory)
			}
            
			if (!chatHistory || chatHistory.length === 0) {
                const messages = userChatHistory.userChats[0].messages;
                // console.log('get chat history::',messages);
                const messageList = messages.map((message: Message) => ({
                    message: message.content,
                    sender: message.sender,
                    messageType: message.messageType,
                    messageId: message.id,
                    rating: message.rating,
                    reviewComments: message.reviewComments,
                    modelType: message.modelType,   // <<< ADD this line
                    commentAddedAt: message.commentAddedAt,
                    createdAt: message.createdAt
                }));
                
				await setCurrentChat(messageList);
				await setChatHistory(userChatHistory.userChats);
				await setCurrChatId(userChatHistory.userChats[0].id);
			}
			
		}
		if (session && session.user && session.user.email) {
			getChatHistory(session.user.email);
			
		}
		
	}, [session])

	const changeChat = async (index: number) => {
		if (chatHistory) {
            console.log("Changing from: ", currentChat)
            console.log("Changing to: ", chatHistory[index].messages)
            const messages=chatHistory[index].messages

            const messageList = messages.map((message: Message) => ({
                message: message.content,
                sender: message.sender,
                messageType: message.messageType,
                messageId: message.id,
                rating: message.rating,
                reviewComments: message.reviewComments,
                modelType: message.modelType,    // <<< ADD this line
                commentAddedAt: message.commentAddedAt,
                createdAt: message.createdAt
            }));
            
			await setCurrentChat(messageList);
			await setCurrChatId(chatHistory[index].id);
            console.log("Changed Chat: ", currentChat)
			if (session && session.user && session.user.email) {
				await updateChatHistory(session.user.email);
			}


		}
		else {
			console.log("chatHistory is null");
		}
	}

	const createChat = async () => {
		if (session && session.user && session.user.email) {
			const response = await fetch("/api/createChat", {
				method: "POST",
				body: JSON.stringify({
					email: session.user.email,
                    mode: mode
				})
			})
            
			const updatedChatHistory = await response.json();
            console.log('here::',updatedChatHistory)
			// console.log(updatedChatHistory.userChats.length)
            const messages=updatedChatHistory.userChats[updatedChatHistory.userChats.length - 1].messages
            const messageList = messages.map((message: Message) => ({
                message: message.content,
                sender: message.sender,
                messageType: message.messageType,
                messageId: message.id,
                rating: message.rating,
                reviewComments: message.reviewComments,
                modelType: message.modelType,   // <<< ADD this line
                commentAddedAt: message.commentAddedAt,
                createdAt: message.createdAt
            }));
            
			await setCurrentChat(messageList);
			await setCurrChatId(updatedChatHistory.userChats[updatedChatHistory.userChats.length - 1].id);
            if (session && session.user && session.user.email) {
                await updateChatHistory(session.user.email);
            }
			// await setChatHistory(updatedChatHistory.userChats);
			
		}
	} 

    const handleDelete = async(ChatId: String) => {
        const response=await fetch('/api/deleteChat',{
            method: "POST",
            headers:{
                "Content-Type": "application/json",
            },
            body: JSON.stringify({chatId: ChatId})
        })
        if (session && session.user && session.user.email) {
            await updateChatHistory(session.user.email);
        }
    }

    const handleArchive = async(chatId: String) => {
        const response=await fetch('/api/handleArchive',{
            method: 'POST',
            headers: {
                "Content-type": "application/json",
            },
            body: JSON.stringify({chatId: chatId})
        })
        if (session && session.user && session.user.email) {
            await updateChatHistory(session.user.email);
        }
    }

    const toTitleCase = (str: string) => {
        return str.replace(/\w\S*/g, (txt) => 
            txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
        );
    };

	if (!chatHistory) {
		return (
			<div>
			</div>
		)
	}
	if (!session?.user) {
		return (
			<div>
				{/* <div className="flex DESKTOP hidden md:block mt-2 items-center justify-center w-40"> */}
				<HomePage/>
				{/* </div> */}
			
				<div className="MOBILE md:hidden">
					<button
					className="h-10 w-10 border-2 border-black rounded flex flex-col justify-center items-center group"
					onClick={() => setIsOpen(!isOpen)}
				>
					<svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round"  className="h-6 w-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
				</button>
				{isOpen &&
				<div className=""> 
					<div className="flex-row absolute top-0 left-0 w-40 bg-gray-300 h-full">
						<div className="pt-2 pl-2">
							<Login/>
							<div className="white-space normal ml-2">Sign In to create multiple chats!</div>
						</div >
						<div className="flex flex-col h-screen max-h-[75vh] overflow-y-auto p-2 pr-2 mb-8 mr-2">
						</div>
						
					</div>
					<button
					className="h-10 w-10 border-2 border-black rounded flex flex-col justify-center items-center group absolute top-0 left-40 right-20 ml-2"
					onClick={() => setIsOpen(!isOpen)}
				>
					<svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-black" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
				</button>
				</div>
				}
				
			</div>
			</div>
			
			
		)
	} 
    
	return (
        <div className="w-60 bg-white pt-1 pl-4 pr-4  shadow-lg hidden md:block">
            <div className="mt-4 w-full max-w-xs p-4 bg-white border-2 border-gray-400 text-gray-700 rounded-xl shadow-md text-center font-bold cursor-pointer" style={{borderColor: "rgb(22,184,216)", borderStyle: "solid"}} onClick={createChat}>
                Create a new Chat
            </div>
            <h5 className="text-sm font-semibold text-gray-500 mb-4 mt-4">Recent Chats</h5>
            <ul className="space-y-2">
                {chatHistory.map((value, index) => (
                    <li 
                        key={index} 
                        onClick={() => changeChat(index)} 
                        className={`bg-gray-100 px-2 py-1 cursor-pointer items-center flex rounded-lg ${currChatId === value.id ? "text-gray-700" : "bg-white text-gray-400"}`}
                    >
                        <div className="w-full text-xs justify-between truncate flex pr-2 ">
                            {value.messages && value.messages.map((each_message, index) => (
                                <React.Fragment key={index}>
                                    {value.messages.length > 1 
                                        ? (index === 1 ? toTitleCase(each_message.content) : null) 
                                        : "New Chat"
                                    }
                                </React.Fragment>
                                
                            ))}
                            {/* <button type="button"><img src="send_icon.svg" height="12" width="12px" className="ml-2" /></button> */}
                        </div>
                        <div className="relative">
                                <button 
                                    className="flex items-center space-x-2 px-1 py-1 rounded-lg hover:bg-gray-100 transition"
                                     id={`chat_options_${index}`} onClick={(e) => {
                                        e.stopPropagation(); // Prevents clicking on the chat item
                                        toggleDropdown(index);
                                    }} 
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM12.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0ZM18.75 12a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z" />
                                    </svg>
                                </button>

                                {/* Dropdown Menu */}
                                {openDropdown === index && (
                                    <div className="absolute right-0 w-30 text-wrap bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                                        <ul className="py-1 text-sm text-gray-700">
                                            <li>
                                                <button className="w-full text-left px-4 py-1" id={`archieve_chat_options_${index}`} onClick={(e) => {
                                                e.stopPropagation();
                                                handleArchive(value.id);
                                                setOpenDropdown(null);
                                            }}>
                                                    Archive
                                                </button>
                                                {/* <hr className="border-gray-200 my-2 mx-2"/> */}
                                                {/* <button className="w-full text-left px-4 py-1" id={`delete_chat_options_${index}`} onClick={(e) => {
                                                e.stopPropagation();
                                                handleDelete(value.id);
                                                setOpenDropdown(null);
                                                }}>
                                                    Delete
                                                </button> */}
                                            </li>
                                        </ul>
                                    </div>
                                )}
                        </div>
                    </li>
                ))}
            </ul>

        </div>
	  )
}


