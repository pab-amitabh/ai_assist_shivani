"use client";

import React from "react";
import Header from "../components/header";
import { useSession } from "next-auth/react";

const EligibilityPage = () => {
    const { data: session } = useSession();

    const eligibilityTools = [
        {
            name: "Travel Eligibility Checker",
            route: "/travel",
            description: "Quick eligibility checker for travel",
            allowedEmails: [
                "amitabh@policyadvisor.com",
                "jiten@policyadvisor.com",
                "heena@policyadvisor.com",
                "pankaj@policyadvisor.com",
                "shivani@policyadvisor.com",
            ]
        },
        {
            name: "Simplified Life Checker",
            route: "/eligibilitychecker",
            description: "Quick eligibility checker for simplified life",
            allowedEmails: [
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
                "visnu@policyadvisor.com", "pankaj@policyadvsior.com", "mayank@policyadvisor.com"
            ]
        },
        {
            name: "Traditional Life Checker",
            route: "/traditional",
            description: "Detailed underwriting analysis",
            allowedEmails:  [
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
                "visnu@policyadvisor.com", "pankaj@policyadvsior.com", "mayank@policyadvisor.com"
            ]
        },
        {
            name: "Quotes Checker (Life)",
            route: "/quotechecker",
            description: "Compare quotes from providers",
            allowedEmails: [
                "amitabh@policyadvisor.com",
                "jiten@policyadvisor.com",
                "heena@policyadvisor.com",
                "pankaj@policyadvisor.com",
                "shivani@policyadvisor.com",
            ]
        }
    ];

    const userEmail = session?.user?.email ?? "";

    const visibleTools = eligibilityTools.filter(tool =>
        tool.allowedEmails.includes(userEmail)
    );

    return (
        <>
            <Header />
            <div className="p-10">
                <h1 className="text-2xl font-semibold mb-6 text-gray-800">Eligibility Tools</h1>
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
                    <p className="text-gray-600">You don’t have access to any eligibility tools.</p>
                )}
            </div>
        </>
    );
};

export default EligibilityPage;
