"use client";

import React, { useState, Suspense } from 'react';
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import LoginButton from './LoginButton'; // Make sure the path is correct
import Header from '../components/header';

const HomePage = () => {
    const { data: session } = useSession();
    const [createdFirstChat, setCreatedFirstChat] = useState<boolean>(false);

    if (session && session.user) {
        const tools = [
            {
                name: "Home",
                route: "/home",
                description: "Main dashboard",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            },
            {
                name: "AI Assist", route: "/assist", description: "Your AI-powered assistant", allowedEmails: [
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
                    "visnu@policyadvisor.com"
                ]
            },
            {
                name: "Eligibility Checker AI", route: "/eligibilitychecker", description: "Check insurance eligibility instantly",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            },
            {
                name: "Traditional Underwriting AI", route: "/traditional", description: "Traditional life insurance checks",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            },
            {
                name: "Quote Checker AI", route: "/quotechecker", description: "Compare and analyze quotes",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            },
            {
                name: "Training AI", route: "/training", description: "Train yourself with insurance scenarios",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            },
            {
                name: "Service AI", route: "/service", description: "AI to help with servicing policies",
                allowedEmails: [
                    "amitabh@policyadvisor.com",
                    "jiten@policyadvisor.com",
                    "shivani@policyadvisor.com",
                    "heena@policyadvisor.com",
                    "pankaj@policyadvisor.com"
                ]
            }
        ];


        const allowedTools = tools.filter(tool =>
            tool.allowedEmails.includes(session?.user?.email ?? "")
        );

        return (
            <>
            <Header></Header>
                <div className='pl-10 pr-10'>
                    <h1 className="text-2xl font-semibold text-gray-800 mt-20 mb-6">
                        Hi {session.user.name?.split(" ")[0]}, Welcome to your AI world...
                    </h1>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                        {allowedTools.map((tool) => (
                            <div
                                key={tool.name}
                                onClick={() => window.location.href = tool.route}
                                className="cursor-pointer p-5 bg-white border border-gray-200 rounded-xl hover:shadow-md transition"
                            >
                                <h2 className="text-xl font-semibold text-gray-800">{tool.name}</h2>
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
}

export default HomePage;
