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
          },
          onclose: () => {
            setStatus('closed');
          },
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: scenario.voiceGender === 'male' ? 'Zephyr' : 'Kore' } },
          },
          systemInstruction: `You are roleplaying as ${scenario.customerName}, whose personality is: ${scenario.personality}. Keep your answers short and in character. The user is a bank teller trying to verify a transaction.`,
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

  const renderStatus = () => {
    switch (status) {
      case 'idle':
        return <button onClick={startCall} className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg text-xl font-display">Start Call</button>;
      case 'connecting':
        return <p className="text-yellow-500 dark:text-yellow-400 animate-pulse">Connecting...</p>;
      case 'connected':
        return <p className="text-green-600 dark:text-green-400">Connected - Speak into your microphone</p>;
      case 'error':
        return <p className="text-red-600 dark:text-red-500">Connection Error. Please try again.</p>;
      case 'closed':
        return <p className="text-gray-600 dark:text-gray-400">Call Ended.</p>;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 animate-fade-in">
      <div className="bg-white dark:bg-gray-800 border border-green-500 rounded-lg shadow-2xl p-8 max-w-sm w-full text-center">
        <h3 className="text-3xl font-display text-green-600 dark:text-green-400 mb-4">Voice Call</h3>
        <p className="text-gray-700 dark:text-gray-300 mb-6">Attempting to call: <span className="font-bold">{scenario.customerName}</span></p>
        <div className="h-20 flex items-center justify-center">
            {renderStatus()}
        </div>
        <button onClick={endCall} className="mt-6 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-300 text-lg font-display">
          {status === 'connected' ? 'End Call' : 'Close'}
        </button>
      </div>
    </div>
  );
};

export default PhoneCallModal;