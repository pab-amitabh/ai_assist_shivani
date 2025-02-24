'use client';

import { getServerSession } from "next-auth";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { IonIcon } from '@ionic/react';
import { checkmarkCircleOutline } from 'ionicons/icons';

export default function ReviewMessages() {
    const { data: session } = useSession();
    const [userMessages, setUserMessages] = useState<
        {id:string; content: string; isResolved: boolean; reviewComments: string; createdAt: string; reviewAdvisorComments: string; reviewerAction: string; reviewAdvisorCommentedOn: string; question: {content: string} }[]
    >([]);
    const [reviewerComments,setReviewerComments] = useState<{[key:string]:string}>({});
    const [reviewerAction,setReviewerAction] = useState<{[key:string]:string}>({});
    let count=0
    const currentDate=new Date();
    const allowed_emails=["amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "anushae.hassan@gmail.com", "ulkeshak23@gmail.com", "heenabanka@gmail.com","shivani.lpu71096@gmail.com","pollardryan525@gmail.com"]

    useEffect(() => {
        if (session && session.user && session.user.email) {
            const userMessagesDB = async () => {
                const response = await fetch('/api/userMessages', {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json"
                    }
                });
                const res = await response.json();
                const result = res['messages'];
                setUserMessages(result);
            };

            userMessagesDB();
        }
    }, [session]);

    const saveReviewerComments = async(message_id: string) => {
        if (reviewerComments[message_id]) {
            const response=await fetch('/api/userMessages',{
                method: "POST",
                headers: {
                    "Content-type": "application/json"
                },
                body: JSON.stringify({message_id: message_id, reviewer_comments: reviewerComments[message_id]})
            })
            const res=await response.json()
            console.log(res.status)
        }
    }

    const updateReviewerComments = (message_id: string,e: any,count:number) => {
        setReviewerComments((prev)=>({
            ...prev,
            [message_id]: e.target.value
        }))
    }

    const updateReviewerAction = async(message_id:string,selectedValue:string) => {
        if (selectedValue) {
            const response = await fetch('/api/updateReviewerAction',{
                method: "POST",
                headers: {
                    "Content-type":"application/json"
                },
                body: JSON.stringify({message_id:message_id,reviewer_action:selectedValue})
            })
        }
    }

    const saveReviewerAction = (message_id: string, e: any) => {
        const selectedValue = e.target.value;
        setReviewerAction((prev)=>({
            ...prev,
            [message_id]: selectedValue
        }))
        updateReviewerAction(message_id,selectedValue)
    }
 
    return (
        <div className="rounded-xl  m-auto w-full overflow-x-auto ">
            {session && session.user && allowed_emails?.includes(session.user.email || "") ?
                <table className="table-auto w-full border-collapse border border-gray-300">
                    <thead className="bg-[rgb(0,182,228)]">
                        <tr className="text-left text-white">
                            <th className="border px-4 py-2">S.No</th>
                            <th className="border px-4 py-2">Created On</th>
                            <th className="border px-4 py-2">Question</th>
                            <th className="border px-4 py-2">Answer</th>
                            <th className="border px-4 py-2">Sources</th>
                            {/* <th className="border px-4 py-2">AI Generated</th> */}
                            <th className="border px-4 py-2">User Comments</th>
                            <th className="border px-4 py-2">Reviewer Action</th>
                            <th className="border px-4 py-2">Reviewer Comments</th>
                        </tr>
                    </thead>
                    <tbody>
                        {userMessages.map((each_message, index) => {
                            const ignoreMessage = "I'm here and ready to assist you! How can I help you today?";
                            if (each_message.content.includes(ignoreMessage)) return null;
                            let message = each_message.content;
                            let sources = "";
                            let all_sources = [];
                            const urls_data = {} as { [key: string]: any };
                            const reviewDate=new Date(each_message.reviewAdvisorCommentedOn);
                            count+=1
                            if (message.includes('Sources:')) {
                                const messageData = message.split('Sources:');
                                message = messageData[0]; 
                                sources = messageData[1]; 
                                all_sources=sources.split("End of Source by LLM")
                                let get_urls_message='';
                                let get_urls='';
                                let get_comment='';
                                for (let i=0; i<all_sources.length-1 ;i++){
                                    get_urls_message=all_sources[i].split('](')[0]
                                    get_urls=get_urls_message.split('/ ')[0].replace(' \n * [','')
                                    get_comment=get_urls_message.split('/ ')[1]
                                    urls_data[get_urls]=get_comment
                                }
                            }
                            return (
                                <tr key={index} className="border-b">
                                    <td className="border px-4 py-2">{count}</td>
                                    <td className="border px-4 py-2">{new Date(each_message.createdAt).toLocaleString()}</td>
                                    <td className="border px-4 py-2">{each_message.question.content}</td>
                                    <td className="border px-4 py-2">
                                        <div className="h-40 max-h-40 overflow-y-auto">
                                            <ReactMarkdown remarkPlugins={[remarkGfm]} >
                                                {message}
                                            </ReactMarkdown>
                                        </div>
                                    </td>
                                    <td className="border px-4 py-2">
                                        <div className="h-40 max-h-40 overflow-y-auto">
                                            {each_message.isResolved? <p className="text-sm text-gray-500 ">Generated by OpenAI</p> : 
                                                <ul className="text-sm text-gray-500 ">
                                                    {Object.entries(urls_data).map(([key,value])=>(
                                                        <li key={key}><a href={key} title={key}><IonIcon icon={checkmarkCircleOutline} style={{color:'pink',fontSize:'13px'}} /> {value}</a></li>
                                                    ))}
                                                </ul>
                                            }
                                        </div>
                                    </td>
                                    {/* <td className="border px-4 py-2">{each_message.isResolved ? "✅" : "❌"}</td> */}
                                    <td className="border px-4 py-2">{each_message.reviewComments}</td>
                                    <td className="border px-4 py-2">
                                        {/* <label htmlFor="countries" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">Select an action</label> */}
                                        <select id={`countries_${count}`} className="bg-gray-50 w-full border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-1 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" value={reviewerAction[each_message.id] || each_message.reviewerAction} onChange={(e)=>saveReviewerAction(each_message.id,e)}>
                                            <option defaultValue={""}>Choose an action</option>
                                            <option value="overruled">Overruled</option>
                                            <option value="source_incorrect">Source Incorrect</option>
                                            <option value="source_information_incorrect">Information Incorrect</option>
                                        </select>
                                    </td>
                                    <td className="border px-4 py-2">
                                        <div className="h-30 max-h-30">
                                            <textarea data-id={`reviewer_comments_${count}`} className="block h-40 max-h-40 p-2.5 mb-2 w-full text-sm text-gray-900 bg-gray-50 rounded-lg border border-gray-300 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" placeholder="Enter your thoughts here..." value={reviewerComments[each_message.id] || each_message.reviewAdvisorComments} onChange={(e)=>updateReviewerComments(each_message.id,e,count)} />
                                            {currentDate > reviewDate  &&
                                                <button data-id={`reviewer_comments_submit_${count}`} type="button" className=" focus:outline-none w-full text-white bg-[rgb(216,22,113)] hover:bg-[rgb(216,22,113)]-700 focus:ring-4 focus:ring-[rgb(216,22,113)] font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 " onClick={()=>saveReviewerComments(each_message.id)} >Submit</button>
                                            }
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table> :
                <div className="flex flex-inline w-1/2 m-auto border-1 bg-gray font-bold align-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                </svg><span className="ml-3">Sorry!!! You have insufficient permissions...</span>
                </div>
            }
        </div>
    );
}
