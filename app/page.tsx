'use client'
import Image from "next/image";
import { useReactMediaRecorder } from "react-media-recorder-2";
import { useState, useCallback, useRef, useEffect } from "react";
import AudioRecorder from "./components/AudioRecorder";
import { ChatVertexAI } from "@langchain/google-vertexai";
import CommandActivation from "./components/commandActivation";


export default function Home() {

  return (
    <div className="w-full">
        <div className=" text-white p-2 w-full">
            <img src="/policyadvisor-logo.svg" className="w-48"></img>
        </div>
        {/* <AudioRecorder/> */}
        <CommandActivation/>
        {/* <button onClick={() => signIn()}>sign in</button> */}
    </div>
  );
}
