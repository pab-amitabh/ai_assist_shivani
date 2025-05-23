'use client'
import { useReactMediaRecorder } from "react-media-recorder-2";
import { useState, useCallback } from "react";


export default function AudioRecorder() {
    const [audioBlob, setAudioBlob] = useState(null);
    const [llmResponse, setLLMResponse] = useState("");
    // const [userInputText, setUserInputText] = useState("");

    const onStop = useCallback((blobUrl: any, blob: any) => {
        console.log('Recording stopped: ', blobUrl);
        // Here you can handle the recorded audio, e.g., send it to an API
        setAudioBlob(blob);
    }, []);

    const [isRecording, setIsRecording] = useState(false);
    const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({ audio: true, video: false, onStop: onStop, 
        mediaRecorderOptions: {mimeType: "audio/wav"}})

    
    const getResponse = async () => {
        const response = await fetch('/api/getLLMResponse', {
            method: 'POST',
            body: JSON.stringify({query: "What are the Key features of professional association benefits?"}),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        // console.log(data)
        const res = data.res;
        setLLMResponse(res);
        // setLLMResponse(JSON.stringify(response));
    }

    const handleSendToAPI = async () => {
        if (!audioBlob) {
            return;
        }

        const wavFile = new File([audioBlob], 'recording.wav', {type: "audio/wav"});
        const formData = new FormData();
        formData.append('file', wavFile);

        

        const inputInText = await fetch('/api/speechToText', {
            method: 'POST',
            body: formData,
        });

        const inputInTextData = await inputInText.json();
        console.log("Input In Text Data: ",inputInTextData.transcription)
        const inputInTextString = inputInTextData.transcription;


        const response = await fetch('/api/getLLMResponse', {
            method: 'POST',
            body: JSON.stringify({query: inputInTextString}),
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        const res = data.res;
        setLLMResponse(res);

        const llmspeech = await fetch('/api/textToSpeech', {
            method: 'POST',
            body: JSON.stringify({text: res}),
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!llmspeech.ok) {
            throw new Error("Error in converting text to speech");
        }

        const resAudioBlob = await llmspeech.blob();
        const resAudioURL = URL.createObjectURL(resAudioBlob);
        const audio = new Audio(resAudioURL)
        audio.addEventListener('canplaythrough', () => {
            setTimeout(() => audio.play(), 100);
          }, { once: true });
        audio.play();

        audio.onended = () => URL.revokeObjectURL(resAudioURL);

        

    }



    const handleStartRecording = () => {
        setIsRecording(true);
        startRecording();
    };

    const handleStopRecording = () => {
        setIsRecording(false);
        stopRecording();
    };

  return (
    <div>
        <p>Status: {status}</p>
            <button onClick={handleStartRecording} disabled={isRecording} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Start Recording
            </button>
            <button onClick={handleStopRecording} disabled={!isRecording} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Stop Recording
            </button>
            {mediaBlobUrl && <audio src={mediaBlobUrl} controls />}
            <button onClick={handleSendToAPI} disabled={!mediaBlobUrl} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                Transcribe
            </button>
            <p className="text-lg font-serif text-gray-800 leading-relaxed">{llmResponse}</p>
            <button onClick = {getResponse} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">Press</button>
    </div>
  );
}
