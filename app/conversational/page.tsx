// pages/chat.tsx
"use client";

import React from "react";
import Header from "../components/header";
import { useSession } from "next-auth/react";

const ConversationalAIPage = () => {
    const { data: session } = useSession();
    const userEmail = session?.user?.email ?? "";

    const conversationalTools = [
        {
            name: "Product Information (All) AI",
            route: "/home",
            description: "Product info for clients",
            allowedEmails: [
                "amitabh@policyadvisor.com",
                "jiten@policyadvisor.com",
                "shivani@policyadvisor.com",
                "heena@policyadvisor.com",
                "pankaj@policyadvisor.com"
            ]
        },
        {
            name: "Policy Servicing AI",
            route: "/service",
            description: "Support for servicing policies",
            allowedEmails: [
                "amitabh@policyadvisor.com",
                "jiten@policyadvisor.com",
                "shivani@policyadvisor.com",
                "heena@policyadvisor.com",
                "pankaj@policyadvisor.com"
            ]
        },
        {
            name: "Product Training (Travel) AI",
            route: "/training",
            description: "Train using insurance scenarios",
            allowedEmails: [
                "amitabh@policyadvisor.com",
                "jiten@policyadvisor.com",
                "shivani@policyadvisor.com",
                "heena@policyadvisor.com",
                "pankaj@policyadvisor.com"
            ]
        }
    ];

    const visibleTools = conversationalTools.filter(tool =>
        tool.allowedEmails.includes(userEmail)
    );

    return (
        <>
            <Header />
            <div className="p-10">
                <h1 className="text-2xl font-semibold mb-6 text-gray-800">Conversational AI Tools</h1>
                {visibleTools.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {visibleTools.map((tool) => (
                            <div
                                key={tool.name}
                                onClick={() => window.location.href = tool.route}
                                className="cursor-pointer p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
                            >
                                <h2 className="text-md font-semibold text-gray-800">{tool.name}</h2>
                                <p className="text-sm text-gray-500 mt-2">{tool.description}</p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-600">You don’t have access to any conversational AI tools.</p>
                )}
            </div>
        </>
    );
};

export default ConversationalAIPage;
