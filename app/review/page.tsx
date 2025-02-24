'use client'
import ReviewMessages from '../components/reviewMessages';
import React from 'react';

export default function Home(){
    return(
        <div className="w-full">
            <div className=" text-white p-2 w-full">
                <img src="/policyadvisor-logo.svg" className="w-48"></img>
            </div>
            <ReviewMessages />
        </div>
    )
}