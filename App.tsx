
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, Modality, Blob as GeminiBlob, LiveServerMessage } from '@google/genai';
import { Transcription, SessionState } from './types';
import { encode, decode, decodeAudioData } from './utils/audioProcessing';
import ScreenPreview from './components/ScreenPreview';
import CodeVault from './components/CodeVault';

const SYSTEM_INSTRUCTION = `You are a senior software engineer, mentor, and real-time coding coach.
Observe the screen snapshots, listen to the user, and guide them towards their goal.
Teaching First: Prefer hints and guiding questions. Explain why, not just what.
Proactive but Minimal Intervention: Respond in 1-3 sentences by default.
Think: pair programming with a great mentor.
Always maintain a calm, encouraging, senior-engineer tone.

IF YOU PROVIDE CODE: Wrap it in markdown code blocks like this:
\`\`\`javascript
const code = "here";
\`\`\`
These snippets will be automatically extracted and placed in the user's Code Vault for easy copying.`;

interface Snippet {
  id: string;
  code: string;
  language: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [session, setSession] = useState<SessionState>({
    isConnected: false,
    isSharing: false,
    isMuted: false,
    goal: '',
    milestone: 'Setting up session...'
  });

  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [snippets, setSnippets] = useState<Snippet[]>([]);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [activeTab, setActiveTab] = useState<'transcription' | 'code'>('transcription');
  
  // Audio Refs
  const inputAudioCtxRef = useRef<AudioContext | null>(null);
  const outputAudioCtxRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const activeSessionRef = useRef<any>(null);
  const transcriptionBufferRef = useRef({ user: '', coach: '' });

  // Cleanup effect
  useEffect(() => {
    return () => {
      if (activeSessionRef.current) activeSessionRef.current.close();
      if (inputAudioCtxRef.current) inputAudioCtxRef.current.close();
      if (outputAudioCtxRef.current) outputAudioCtxRef.current.close();
      screenStream?.getTracks().forEach(track => track.stop());
    };
  }, [screenStream]);

  const extractSnippets = (text: string) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    let match;
    const newSnippets: Snippet[] = [];
    
    while ((match = codeBlockRegex.exec(text)) !== null) {
      newSnippets.push({
        id: Math.random().toString(36).substr(2, 9),
        language: match[1] || 'plaintext',
        code: match[2].trim(),
        timestamp: Date.now()
      });
    }

    if (newSnippets.length > 0) {
      setSnippets(prev => [...newSnippets, ...prev]);
      setActiveTab('code'); // Auto-switch to code tab when new snippet arrives
    }
  };

  const toggleScreenShare = async () => {
    if (session.isSharing) {
      screenStream?.getTracks().forEach(track => track.stop());
      setScreenStream(null);
      setSession(prev => ({ ...prev, isSharing: false }));
    } else {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
          throw new Error("Your browser environment does not support screen sharing.");
        }
        
        const stream = await navigator.mediaDevices.getDisplayMedia({ 
          video: true,
          audio: false 
        });
        
        setScreenStream(stream);
        setSession(prev => ({ ...prev, isSharing: true }));
        stream.getVideoTracks()[0].onended = () => {
          setSession(prev => ({ ...prev, isSharing: false }));
          setScreenStream(null);
        };
      } catch (err: any) {
        console.error("Screen share failed:", err);
        alert("Screen sharing failed: " + (err.message || "Unknown error"));
      }
    }
  };

  const startSession = async () => {
    if (!session.goal) {
      alert("Please state your goal first!");
      return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
    
    inputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    outputAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    const outputNode = outputAudioCtxRef.current.createGain();
    outputNode.connect(outputAudioCtxRef.current.destination);

    try {
      const micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
          systemInstruction: SYSTEM_INSTRUCTION + `\n\nUser's Current Goal: ${session.goal}`,
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setSession(prev => ({ ...prev, isConnected: true }));
            const source = inputAudioCtxRef.current!.createMediaStreamSource(micStream);
            const scriptProcessor = inputAudioCtxRef.current!.createScriptProcessor(4096, 1, 1);
            
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const int16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmBlob: GeminiBlob = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              
              sessionPromise.then(s => {
                if (!session.isMuted) s.sendRealtimeInput({ media: pcmBlob });
              });
            };
            
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioCtxRef.current!.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            if (msg.serverContent?.inputTranscription) {
              transcriptionBufferRef.current.user += msg.serverContent.inputTranscription.text;
            }
            if (msg.serverContent?.outputTranscription) {
              transcriptionBufferRef.current.coach += msg.serverContent.outputTranscription.text;
            }
            if (msg.serverContent?.turnComplete) {
              const userText = transcriptionBufferRef.current.user;
              const coachText = transcriptionBufferRef.current.coach;
              if (userText) setTranscriptions(prev => [...prev, { role: 'user', text: userText, timestamp: Date.now() }]);
              if (coachText) {
                setTranscriptions(prev => [...prev, { role: 'coach', text: coachText, timestamp: Date.now() }]);
                extractSnippets(coachText);
              }
              transcriptionBufferRef.current = { user: '', coach: '' };
            }

            const base64Audio = msg.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && outputAudioCtxRef.current) {
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioCtxRef.current.currentTime);
              const audioBuffer = await decodeAudioData(decode(base64Audio), outputAudioCtxRef.current, 24000, 1);
              const source = outputAudioCtxRef.current.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(outputNode);
              source.onended = () => sourcesRef.current.delete(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              sourcesRef.current.add(source);
            }

            if (msg.serverContent?.interrupted) {
              sourcesRef.current.forEach(s => s.stop());
              sourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e) => console.error("Gemini Error:", e),
          onclose: () => {
            setSession(prev => ({ ...prev, isConnected: false }));
            activeSessionRef.current = null;
          }
        }
      });

      activeSessionRef.current = await sessionPromise;
    } catch (err) {
      console.error("Failed to start session:", err);
    }
  };

  const handleFrame = useCallback((base64: string) => {
    if (activeSessionRef.current && session.isConnected) {
      activeSessionRef.current.sendRealtimeInput({
        media: { data: base64, mimeType: 'image/jpeg' }
      });
    }
  }, [session.isConnected]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-6xl flex justify-between items-center mb-8 border-b border-neutral-800 pb-6">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center bg-blue-600 shadow-lg glow ${session.isConnected ? 'coach-pulse' : ''}`}>
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">GEMINI MULTIMODAL COACH</h1>
            <p className="text-xs text-neutral-500 font-mono tracking-widest uppercase">Senior Engineering Mentor • Live V2.5</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          {session.isConnected ? (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 text-green-400 text-xs font-bold border border-green-500/20">
              <span className="w-2 h-2 rounded-full bg-green-500" /> CONNECTED
            </span>
          ) : (
            <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-800 text-neutral-500 text-xs font-bold border border-neutral-700">
              OFFLINE
            </span>
          )}
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 flex flex-col gap-6">
          <section className="bg-neutral-900/50 rounded-2xl p-6 border border-neutral-800 shadow-inner">
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-3 mono tracking-widest">Active Goal</label>
            <div className="flex gap-3">
              <input 
                type="text" 
                placeholder="e.g., Build a custom React hook for window resizing"
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={session.goal}
                onChange={(e) => setSession(prev => ({ ...prev, goal: e.target.value }))}
                disabled={session.isConnected}
              />
              {!session.isConnected ? (
                <button 
                  onClick={startSession}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors flex items-center gap-2"
                >
                  START COACHING
                </button>
              ) : (
                <button 
                  onClick={() => activeSessionRef.current?.close()}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-bold shadow-lg transition-colors"
                >
                  END SESSION
                </button>
              )}
            </div>
          </section>

          <section className="bg-neutral-900 border border-neutral-800 rounded-2xl p-2 relative">
            <div className="absolute top-6 right-6 z-10 flex gap-2">
              <button onClick={toggleScreenShare} className={`p-2 rounded-lg border transition-all ${session.isSharing ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-neutral-800/80 border-neutral-700 text-neutral-300'}`}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
            <ScreenPreview stream={screenStream} isActive={session.isSharing} onFrame={handleFrame} />
          </section>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-6 h-[600px]">
          <section className="flex-1 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col overflow-hidden shadow-2xl">
            {/* Tabs */}
            <div className="flex border-b border-neutral-800 bg-neutral-900/50">
              <button 
                onClick={() => setActiveTab('transcription')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === 'transcription' ? 'text-blue-400 bg-neutral-950/50' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Feedback
              </button>
              <button 
                onClick={() => setActiveTab('code')}
                className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all relative ${activeTab === 'code' ? 'text-blue-400 bg-neutral-950/50' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Code Vault
                {snippets.length > 0 && (
                  <span className="absolute top-2 right-4 w-4 h-4 bg-blue-600 text-white text-[8px] flex items-center justify-center rounded-full animate-pulse">
                    {snippets.length}
                  </span>
                )}
              </button>
            </div>
            
            <div className="flex-1 p-6 overflow-hidden">
              {activeTab === 'transcription' ? (
                <div className="h-full overflow-y-auto custom-scrollbar flex flex-col gap-6 pr-2">
                  {transcriptions.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-neutral-600 text-center px-8 opacity-40">
                      <p className="text-sm">Speak or start coding to begin...</p>
                    </div>
                  ) : (
                    transcriptions.map((t, i) => (
                      <div key={i} className={`flex flex-col ${t.role === 'coach' ? 'items-start' : 'items-end'}`}>
                        <span className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${t.role === 'coach' ? 'text-blue-500' : 'text-neutral-500'}`}>
                          {t.role === 'coach' ? 'Mentor' : 'You'}
                        </span>
                        <div className={`max-w-[90%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${t.role === 'coach' ? 'bg-blue-600/10 text-blue-100 border border-blue-500/10' : 'bg-neutral-800 text-neutral-300'}`}>
                          {t.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              ) : (
                <CodeVault snippets={snippets} onClear={() => setSnippets([])} />
              )}
            </div>
            
            {session.isConnected && (
              <div className="bg-neutral-950 px-6 py-3 border-t border-neutral-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 coach-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                  <span className="text-[10px] text-neutral-500 font-mono tracking-tighter">COACH_ACTIVE</span>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
