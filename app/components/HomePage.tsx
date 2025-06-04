"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useSession } from "next-auth/react";
import Image from "next/image";
import LoginButton from './LoginButton';
import Header from '../components/header';

const HomePage = () => {
    const { data: session } = useSession();
    const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);

    const [isUnlocked, setIsUnlocked] = useState<boolean>(false);
    const [username, setUsername] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [error, setError] = useState<string>("");

    const VALID_USERNAME = "PAB";
    const VALID_PASSWORD = "Policy@2018$Advisor";

    
    useEffect(() => {
        const unlocked = localStorage.getItem("unlocked");
        if (unlocked === "true") {
            setIsUnlocked(true);
        }
    }, []);

    const handleUnlock = () => {
        if (username === VALID_USERNAME && password === VALID_PASSWORD) {
            setIsUnlocked(true);
            setError("");
            localStorage.setItem("unlocked", "true");
        } else {
            setError("Invalid credentials. Try again.");
        }
    };

    if (!isUnlocked) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-100 px-4">
                <div className="bg-white p-6 rounded-xl shadow-md w-full max-w-sm">
                    <h2 className="text-xl font-semibold mb-4 text-center">Enter Access Credentials</h2>
                    <input
                        type="text"
                        placeholder="Username"
                        className="w-full mb-3 px-4 py-2 border rounded-lg"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                    />
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full mb-3 px-4 py-2 border rounded-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    {error && <p className="text-red-500 text-sm mb-2">{error}</p>}
                    <button
                        onClick={handleUnlock}
                        className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
                    >
                        Submit
                    </button>
                </div>
            </div>
        );
    }

    if (session && session.user) {
        const userEmail = session.user.email ?? "";

        const aiAssistAllowedEmails = [
            "amitabh.bhatia@gmail.com", "jitenpuri@gmail.com", "anushae.hassan@gmail.com",
            "ulkeshak23@gmail.com", "heenabanka@gmail.com", "shivani.lpu71096@gmail.com",
            "pollardryan525@gmail.com", "amitabh@policyadvisor.com", "jiten@policyadvisor.com",
            "shivani@policyadvisor.com", "anushae@policyadvisor.com", "babita@policyadvisor.com",
            "brandon@policyadvisor.com", "carly@policyadvisor.com", "colep@policyadvisor.com",
            "diarmuid@policyadvisor.com", "harshmeet@policyadvisor.com", "heena@policyadvisor.com",
            "hemin@policyadvisor.com", "jason@policyadvisor.com", "khaleel@policyadvisor.com",
            "matthewc@policyadvisor.com", "merab@policyadvisor.com", "nikal@policyadvisor.com",
            "parmeet@policyadvisor.com", "priyanka@policyadvisor.com", "reidc@policyadvisor.com",
            "ripenjeet@policyadvisor.com", "ruchita@policyadvisor.com", "ryanp@policyadvisor.com",
            "subir@policyadvisor.com", "ulkesha@policyadvisor.com", "vanessa@policyadvisor.com",
            "visnu@policyadvisor.com", "pankaj@policyadvsior.com", "mayank@policyadvisor.com",
            "siling@policyadvisor.com"
        ];

        const mainTools = [
            {
                name: "AI Assist",
                route: "/assist",
                description: "Your AI-powered assistant",
                allowed: aiAssistAllowedEmails.includes(userEmail)
            },
            {
                name: "Eligibility & Quote Checker",
                route: "/eligibility",
                description: "Check insurance eligibility",
                allowed: true
            },
            {
                name: "Conversational AI",
                route: "/conversational",
                description: "Talk to AI about insurance or more",
                allowed: true
            },
            {
                name: "Letter Generator",
                route: "/lettergenerator",
                description: "Generate policy replacement letters",
                allowed: true
            }
        ];

        return (
            <>
                <Header />
                <div className='pl-10 pr-10'>
                    <h1 className="text-2xl font-semibold text-gray-800 mt-20 mb-6">
                        Hi {session.user.name?.split(" ")[0]}, Welcome to your AI world...
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {mainTools.filter(tool => tool.allowed).map((tool) => (
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
                </div>
            </>
        );
    } else {
        return (
            <div className="relative w-screen h-screen overflow-hidden">
                <img
                    src="/homepage_background1.png"
                    className="absolute top-0 left-0 w-full h-full object-cover"
                    alt="Background"
                />
                <Header />
                <Suspense fallback={null}>
                    <LoginButton />
                </Suspense>
            </div>
        );
    }
};

export default HomePage;
