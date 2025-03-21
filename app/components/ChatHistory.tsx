import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import Login from "./Login";
import React from "react";
import HomePage from "./HomePage";

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

export default function ChatHistory( { currentChat, setCurrentChat, currChatId, setCurrChatId, chatHistory, setChatHistory } : { currentChat: { message: string; sender: string; messageType: string; messageId: string; rating: number;reviewComments: string;commentAddedAt?: Date | null;}[], setCurrentChat: React.Dispatch<React.SetStateAction<{ message: string; sender: string; messageType: string; messageId: string; rating: number;reviewComments: string;commentAddedAt?: Date | null;}[]>>, currChatId: string, setCurrChatId: Function, chatHistory: Chat[], setChatHistory: Function }) {
	
	const { data: session } = useSession();
	const [isOpen, setIsOpen] = useState<boolean>(false);
    const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);
    const [openDropdown, setOpenDropdown] = useState(null);

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
			body: JSON.stringify({ email: email })
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
				body: JSON.stringify({ email: email })
			})

			let userChatHistory = await response.json();
			// console.log("chatHistory in the func", userChatHistory);

			if (userChatHistory.userChats.length === 0 && !createdFirstChat) {
                console.log("Creating first chat in ChatHistory.tsx")
                setCreatedFirstChat(true);
				await fetch("/api/createFirstChat", {
					method: 'POST',
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: email })
				})
                
				response = await fetch("/api/getChatHistory", {
					method: 'POST',
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({ email: email })
				})
	
				userChatHistory = await response.json();
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
				})
			})
            
			const updatedChatHistory = await response.json();
			// console.log(updatedChatHistory.userChats.length)
            const messages=updatedChatHistory.userChats[updatedChatHistory.userChats.length - 1].messages
            const messageList = messages.map((message: Message) => ({
                message: message.content,
                sender: message.sender,
                messageType: message.messageType,
                messageId: message.id,
                rating: message.rating,
                reviewComments: message.reviewComments,
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
		// <div>
		// 	<div className="DEKSTOP hidden md:block bg-[rgb(0,182,228)] w-48">
		// 		<div className="p-2">
		// 			<button  className="bg-white text-gray-800 font-bold py-2 px-4 rounded shadow hover:bg-gray-200 mb-4 mt-2 w-full" onClick={createChat}>New Chat</button>
		// 		</div >
        //         <div className="font-bold ml-2">My Chats</div>
		// 		<div className="flex flex-col h-screen max-h-[70vh] overflow-y-auto p-2 mb-5">
        //                 {chatHistory.map((value, index) => (
        //                     <div key={index} className="flex items-center w-full space-x-1">
        //                         {/* Chat Button (Takes 2/3 of width) */}
        //                         <button
        //                             onClick={() => changeChat(index)}
        //                             className={`w-3/5 flex items-center justify-between mb-1.5 px-8 py-2 rounded transition-colors 
        //                                 ${currChatId === value.id ? "bg-[rgb(216,22,113)] text-white" : "bg-white text-black border border-gray-300"}`}
        //                         >
        //                             <div className="text-sm font-bold">
        //                                 Chat{index + 1}
        //                             </div>
        //                         </button>

        //                         <button
        //                             onClick={() => handleArchive(value.id)}
        //                             className={`w-1/5 flex items-center justify-center mb-1.5 px-1 py-2 rounded transition-colors 
        //                                 ${currChatId === value.id ? "bg-[rgb(216,22,113)]" : "bg-white border border-gray-300"}`}
        //                                 title="Archive">
        //                             <svg xmlns="http://www.w3.org/2000/svg" className={`w-6 h-5 ${currChatId === value.id ? "text-white" : "text-black"}`} fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" >
        //                             <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
        //                             </svg>

        //                         </button>
                                
        //                         {/* Delete Button (Takes 1/3 of width) */}
        //                         <button
        //                             onClick={() => handleDelete(value.id)}
        //                             className={`w-1/5 flex items-center justify-center mb-1.5 px-1 py-2 rounded transition-colors 
        //                                 ${currChatId === value.id ? "bg-[rgb(216,22,113)]" : "bg-white border border-gray-300"}`}
        //                         title="Delete">
        //                             <svg
        //                                 className={`w-6 h-5 ${currChatId === value.id ? "text-white" : "text-black"}`}
        //                                 fill="none"
        //                                 stroke="currentColor"
        //                                 strokeWidth="30"
        //                                 xmlns="http://www.w3.org/2000/svg"
        //                                 viewBox="0 0 448 512"
        //                             >
        //                                 <path d="M432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.7 23.7 0 0 0 -21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0 -16-16zM53.2 467a48 48 0 0 0 47.9 45h245.8a48 48 0 0 0 47.9-45L416 128H32z"/>
        //                             </svg>
        //                         </button>

                                
                                
        //                     </div>



        //                 ))}
        //             </div>

		// 		<Login/>
		// 	</div>

		// 	<div className="MOBILE md:hidden w-full h-full">
		// 	<button
		// 			className="h-10 w-10 border-2 border-black rounded flex flex-col justify-center items-center group"
		// 			onClick={() => setIsOpen(!isOpen)}
		// 		>
		// 			<svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
		// 		</button>
		// 		{isOpen &&
		// 		<div className=""> 
		// 			<div className="flex-row absolute top-0 left-0 w-100 bg-gray-300">
		// 				<div className="">
		// 					<button  className="bg-white text-gray-800 font-bold py-2 px-4 rounded shadow hover:bg-gray-200 mb-4 mt-2" onClick={createChat}>Create a new Chat!</button>
		// 				</div >
		// 				<div className="flex flex-col h-screen max-h-[75vh] overflow-y-auto p-2 pr-2 mb-8 mr-2">
		// 				{chatHistory.map((value, index) => (
		// 					<div key={index} className="flex items-center justify-center">
		// 					<button onClick={() => changeChat(index)}
		// 					key={index}
		// 					className= {`flex items-center justify-center m-0 px-4 py-3 space-x-2 rounded-lg` + `${currChatId === value.id ? " bg-gray-300" : " hover:bg-gray-200"}`}  
		// 					>
					
		// 					<div className="text-lg font-medium text-gray-900">
		// 						Chat {index + 1}
		// 					</div>
                            
		// 					<svg 
		// 						className="w-6 h-6 text-gray-500"
		// 						fill="none"
		// 						stroke="currentColor"
		// 						viewBox="0 0 24 24"
		// 						xmlns="http://www.w3.org/2000/svg"
		// 					>
		// 						<path
		// 						strokeLinecap="round" 
		// 						strokeLinejoin="round"
		// 						strokeWidth={2}
		// 						d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
		// 						/>
		// 					</svg>
		// 					</button>
		// 					</div>
							
					
		// 				))}
					
						
		// 				</div>
		// 				<Login/>
		// 			</div>
		// 			<button
		// 			className="h-10 w-10 border-2 border-black rounded flex flex-col justify-center items-center group absolute top-0 left-40 right-20 ml-5"
		// 			onClick={() => setIsOpen(!isOpen)}
		// 		>
		// 			<svg stroke="currentColor" fill="none" strokeWidth="1.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-black" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
		// 		</button>
		// 		</div>
		// 		}
				

		// 	</div>
		// </div>

        // <div className="flex min-h-screen w-full">
        //     <div className="w-64 bg-white p-6 shadow-lg hidden md:block">
        //         <div className="mt-4 w-full max-w-xs p-4 bg-white border border-gray-400 rounded-lg shadow-md text-center font-bold cursor-pointer" onClick={createChat}>
        //                 Create a new Chat
        //             </div>
        //         {/* <button className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg mb-6">+ New chat</button> */}
        //         <h2 className="text-lg font-semibold text-gray-700 mb-4 mt-4">Recent Chats</h2>
        //         <ul className="space-y-2 text-gray-500">
        //             {chatHistory.map((value, index) => (
        //                 // <div key={index} className="flex items-center w-full space-x-1">
        //                     <li onClick={() => changeChat(index)} className={`bg-gray-200 px-4 py-2 cursor-pointer rounded-lg ${currChatId === value.id ? "bg-[rgb(216,22,113)] text-white" : "bg-white text-black "}`}>Chat {index + 1}</li>
        //                 // </div>
        //             ))}
        //         </ul>
        //     </div>
            
        //     <div className="flex-1 p-6 flex flex-col items-center">
        //         <div className="w-full max-w-4xl flex justify-between items-center bg-white p-4 rounded-lg shadow-md">
        //             <div>
        //                 <h1 className="text-xl font-semibold">PolicyAdvisor AI Assist</h1>
        //                 {/* <p className="text-gray-500 text-sm">Started 2 / 06 / 2024</p> */}
        //             </div>
        //             <div className="flex items-center space-x-2">
        //                 {/* <span className="text-gray-600">{session.user.name ? session.user.name :  "User"}</span> */}
        //                 <div className="w-10 h-10 bg-gray-300 rounded-full"><button type='button'><img src={session.user.image ? session.user.image : "/user-icon.webp"} className="rounded-full"/></button></div>
        //             </div>
        //         </div>
                
                
                
        //     </div>
        // </div>

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


