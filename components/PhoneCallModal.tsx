import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed `LiveSession` from import as it is not an exported member of '@google/genai'.
import { GoogleGenAI, Modality, Blob as GenAiBlob, LiveServerMessage } from '@google/genai';
import { Scenario } from '../types';

interface PhoneCallModalProps {
  scenario: Scenario;
  onClose: () => void;
}

// FIX: Added a local interface for LiveSession to provide type safety for the session object.
interface LiveSession {
  sendRealtimeInput(input: { media: GenAiBlob }): void;
  close(): void;
}

// Audio encoding/decoding helpers
function encode(bytes: Uint8Array): string {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}
function createBlob(data: Float32Array): GenAiBlob {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
}
function decode(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}
async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}


const PhoneCallModal: React.FC<PhoneCallModalProps> = ({ scenario, onClose }) => {
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected' | 'error' | 'closed'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const sessionRef = useRef<Promise<LiveSession> | null>(null);
  const audioResources = useRef<{
    inputAudioContext: AudioContext;
    outputAudioContext: AudioContext;
    scriptProcessor: ScriptProcessorNode;
    mediaStream: MediaStream;
    source: MediaStreamAudioSourceNode;
  } | null>(null);

  const startCall = async () => {
    setStatus('connecting');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

      let nextStartTime = 0;
      const inputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputAudioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      const outputNode = outputAudioContext.createGain();
      outputNode.connect(outputAudioContext.destination); // FIX: Connect the output node to the speakers
      const sources = new Set<AudioBufferSourceNode>();

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            setStatus('connected');
            timerRef.current = setInterval(() => {
                setCallDuration(prev => prev + 1);
            }, 1000);
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (audioProcessingEvent) => {
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              const pcmBlob = createBlob(inputData);
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);
             audioResources.current = { inputAudioContext, outputAudioContext, scriptProcessor, mediaStream: stream, source };
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64EncodedAudioString = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64EncodedAudioString) {
              nextStartTime = Math.max(nextStartTime, outputAudioContext.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64EncodedAudioString), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.addEventListener('ended', () => { sources.delete(source); });
              source.start(nextStartTime);
              nextStartTime = nextStartTime + audioBuffer.duration;
              sources.add(source);
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Live session error:', e);
            setStatus('error');
            if (timerRef.current) clearInterval(timerRef.current);
          },
          onclose: () => {
            setStatus('closed');
            if (timerRef.current) clearInterval(timerRef.current);
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: scenario.voiceGender === 'male' ? 'Zephyr' : 'Kore' } },
          },
          systemInstruction: `You are roleplaying as ${scenario.customerName}, a subject under financial surveillance during the Cold War era. Your personality profile: ${scenario.personality}. You are being interrogated by a bank security analyst via encrypted telephone line. Speak with the tension and paranoia of the era - be suspicious, guarded, and use period-appropriate language. Keep responses brief and in character. The analyst is trying to verify a suspicious transaction that could be part of espionage funding.`,
        },
      });
      sessionRef.current = sessionPromise;
    } catch (err) {
      console.error('Failed to start call:', err);
      setStatus('error');
    }
  };

  const endCall = () => {
    if (sessionRef.current) {
        sessionRef.current.then(session => session.close());
    }
    if (audioResources.current) {
        audioResources.current.scriptProcessor.disconnect();
        audioResources.current.source.disconnect();
        audioResources.current.mediaStream.getTracks().forEach(track => track.stop());
        audioResources.current.inputAudioContext.close();
        audioResources.current.outputAudioContext.close();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    onClose();
  };
  
  useEffect(() => {
    // Cleanup on unmount
    return () => {
      if (status === 'connected' || status === 'connecting') {
        endCall();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const renderStatus = () => {
    switch (status) {      case 'idle':
        return <button onClick={startCall} className="bg-green-700 hover:bg-green-600 text-green-100 font-bold py-3 px-6 rounded-none text-xl font-mono border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.5)] tracking-wider">INITIATE SECURE LINE</button>;
      case 'connecting':
        return <div className="text-yellow-400 animate-pulse text-lg font-mono tracking-wider">ESTABLISHING ENCRYPTED CONNECTION...</div>;
      case 'connected':
        return (
            <div className="flex flex-col items-center">
                <div className="flex items-center text-green-400">
                    <span className="relative flex h-3 w-3 mr-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                    </span>
                    <p className="text-lg font-mono tracking-wider">SECURE LINE ACTIVE</p>
                </div>
                <p className="font-mono text-2xl mt-1 text-green-300">{formatTime(callDuration)}</p>
            </div>
        );
      case 'error':
        return <p className="text-red-400 text-lg font-mono tracking-wider">CONNECTION TERMINATED - SECURITY BREACH</p>;
      case 'closed':        return (
            <div className="flex flex-col items-center">
                 <p className="text-green-400 text-lg font-mono tracking-wider">TRANSMISSION ENDED</p>
                 <p className="font-mono text-2xl mt-1 text-green-300">{formatTime(callDuration)}</p>
            </div>
        );
      default:
        return null;
    }
  };
  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-black border-2 border-green-500 rounded-none shadow-[0_0_50px_rgba(34,197,94,0.8)] p-8 max-w-md w-full text-center">        <h3 className="text-3xl font-mono text-green-400 mb-2 tracking-wider">VOICE AUTHENTICATION PROTOCOL</h3>
        <div className="bg-black p-3 rounded-none mb-6 border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
            <p className="text-sm text-green-600 font-mono">SUBJECT</p>
            <p className="text-xl font-bold text-green-300 font-mono tracking-wide">{scenario.customerName}</p>
            <p className="text-xs text-green-600 mt-1 italic font-mono">BEHAVIORAL PROFILE: {scenario.personality.toUpperCase()}</p>
        </div>
        
        <div className="h-20 flex items-center justify-center">
            {renderStatus()}
        </div>        <button onClick={endCall} className="mt-6 w-full bg-red-700 hover:bg-red-600 text-red-100 font-bold py-2 px-4 rounded-none transition-all duration-300 text-lg font-mono border-2 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] tracking-wider">
          {status === 'connected' || status === 'connecting' ? 'TERMINATE CONNECTION' : 'ABORT PROTOCOL'}
        </button>
      </div>
    </div>
  );
};

export default PhoneCallModal;