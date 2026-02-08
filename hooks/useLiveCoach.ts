
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SessionState, ChatMessage, CodeSnippet } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioService';

const getSystemInstruction = (userGoal: string) => `You are Coachify, an AI coding mentor. Your goal is to teach by guiding, not by giving away answers.

**CODE GENERATION RULE (VERY IMPORTANT):**
- When the user asks you to write or generate code, you MUST NOT write the code yourself.
- Instead, you MUST confirm the request by including the exact phrase "CODE_REQUEST_CONFIRMED" in your spoken response. This phrase triggers a separate tool that generates the code.
- Example User: "Give me the code for a login form."
- Example You (CORRECT): "Okay, CODE_REQUEST_CONFIRMED. I'll get that login form code ready for you in the code panel."
- Example You (INCORRECT): "Sure, here's the code: <form>..."

**TEACHING STYLE:**
- Ask leading questions.
- Encourage the user to solve problems themselves.
- Provide hints when they are stuck.
- Be friendly, patient, and encouraging.

**USER'S GOAL:**
- The user wants to learn about: "${userGoal || "general programming concepts"}". Keep this goal in mind.`;


const CODE_GENERATION_TRIGGERS = [
    'code_request_confirmed'
];

const parseCoachTranscript = (fullTranscript: string): string => {
  const ctrlSequenceRegex = /<ctrl\d+>/;
  const match = fullTranscript.match(ctrlSequenceRegex);
  if (match && match.index !== undefined) {
    return fullTranscript.substring(match.index + match[0].length);
  }

  if (fullTranscript.toLowerCase().trim().startsWith('thought')) {
    return '';
  }

  return fullTranscript;
};

export const useLiveCoach = () => {
  const [sessionState, setSessionState] = useState<SessionState>(SessionState.IDLE);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [codeHistory, setCodeHistory] = useState<CodeSnippet[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [screenCapture, setScreenCapture] = useState<string | null>(null);
  const [isScreenSharingActive, setIsScreenSharingActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);

  const sessionRef = useRef<any | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const mediaStreamSourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const audioSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const isNewUserTurnRef = useRef(true);
  const lastUserPromptRef = useRef('');
  const userGoalRef = useRef('');
  const isScreenSharingActiveRef = useRef(isScreenSharingActive);
  const isMutedRef = useRef(isMuted);
  const currentUserTurnText = useRef('');
  const currentCoachTurnText = useRef('');
  const isFetchingCodeRef = useRef(false);
  const codeGenerationTriggeredRef = useRef(false);

  useEffect(() => {
    isScreenSharingActiveRef.current = isScreenSharingActive;
  }, [isScreenSharingActive]);

  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  
  const stopScreenShare = useCallback(() => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    setIsScreenSharingActive(false);
  }, []);

  const cleanup = useCallback(() => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }

    scriptProcessorRef.current?.disconnect();
    mediaStreamSourceRef.current?.disconnect();
    
    if (inputAudioContextRef.current && inputAudioContextRef.current.state !== 'closed') {
      inputAudioContextRef.current.close();
    }
    if (outputAudioContextRef.current && outputAudioContextRef.current.state !== 'closed') {
      outputAudioContextRef.current.close();
    }
    
    mediaStreamRef.current?.getTracks().forEach(track => track.stop());
    
    audioSourcesRef.current.forEach(source => source.stop());
    audioSourcesRef.current.clear();

    stopScreenShare();
    
    setSessionState(SessionState.IDLE);
    setScreenCapture(null);
    nextStartTimeRef.current = 0;
  }, [stopScreenShare]);
  
  const fetchCodeSnippet = useCallback(async (userPrompt: string) => {
      if (isFetchingCodeRef.current || !userPrompt.trim()) return;
      isFetchingCodeRef.current = true;
      setIsGeneratingCode(true);
      
      const goal = userGoalRef.current;
      console.log(`[fetchCodeSnippet] Triggered for prompt: "${userPrompt}" with goal: "${goal}"`);
      
      const codeGenPrompt = `You are an expert code generation assistant. The user is learning to code with an AI mentor.
Their overall goal is: "${goal}".
Their immediate request is: "${userPrompt}".

Generate a clean, well-commented, and educational code snippet that directly addresses their request.
- Prioritize clarity and best practices.
- Add 1-2 comments explaining the "why" behind key parts of the code.
- If appropriate, add a single TODO comment to suggest a next step or an improvement.
- Provide only the raw code inside a single markdown block. Do not add any extra explanation before or after the code block.`;

      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: codeGenPrompt,
        });
        
        const codeText = response.text;
        if (codeText) {
             console.debug('[fetchCodeSnippet] Code snippet received');
             setCodeHistory(prev => [...prev, {
                userPrompt: userPrompt.trim(),
                code: codeText,
                timestamp: new Date(),
            }]);
        } else {
            console.error('[fetchCodeSnippet] Received an empty code response');
        }

      } catch (err: any) {
          console.error('[fetchCodeSnippet] Error fetching code snippet:', err);
          setError(`Code generation failed: ${err.message}`);
      } finally {
          isFetchingCodeRef.current = false;
          setIsGeneratingCode(false);
      }
  }, []);

  const captureAndSendFrame = useCallback(async () => {
    if (!sessionRef.current || !screenStreamRef.current) {
      return;
    }
    try {
      const track = screenStreamRef.current.getVideoTracks()[0];
      const imageCapture = new (window as any).ImageCapture(track);
      const bitmap = await imageCapture.grabFrame();

      const canvas = document.createElement('canvas');
      canvas.width = bitmap.width;
      canvas.height = bitmap.height;
      const context = canvas.getContext('2d');
      context?.drawImage(bitmap, 0, 0);

      const dataUrl = canvas.toDataURL('image/jpeg');
      setScreenCapture(dataUrl);

      const base64Data = dataUrl.split(',')[1];
      
      const imageBlob: Blob = {
        data: base64Data,
        mimeType: 'image/jpeg',
      };
      
      sessionRef.current.sendRealtimeInput({ media: imageBlob });
    } catch (err) {
      console.error("Error capturing and sending frame:", err);
    }
  }, []);

  const startScreenShare = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: "always" } as any,
        audio: false,
      });
      screenStreamRef.current = stream;
      setIsScreenSharingActive(true);
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
      setIsScreenSharingActive(false);
    }
  }, [stopScreenShare]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const startSession = useCallback(async (userGoal: string) => {
    setSessionState(SessionState.CONNECTING);
    setError(null);
    setChatHistory([]);
    setCodeHistory([]);
    setScreenCapture(null);
    setIsMuted(false);
    isNewUserTurnRef.current = true;
    userGoalRef.current = userGoal;
    codeGenerationTriggeredRef.current = false;

    try {
      if (!process.env.API_KEY) {
        throw new Error("API_KEY environment variable not set.");
      }
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: getSystemInstruction(userGoal),
          inputAudioTranscription: {},
          outputAudioTranscription: {},
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
          },
        },
        callbacks: {
          onopen: () => {
            setSessionState(SessionState.ACTIVE);
            
            mediaStreamSourceRef.current = inputAudioContextRef.current!.createMediaStreamSource(mediaStreamRef.current!);
            scriptProcessorRef.current = inputAudioContextRef.current!.createScriptProcessor(4096, 1, 1);

            scriptProcessorRef.current.onaudioprocess = (audioProcessingEvent) => {
              if (isMutedRef.current) {
                return;
              }
              
              const inputData = audioProcessingEvent.inputBuffer.getChannelData(0);
              let sum = 0.0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              const VAD_THRESHOLD = 0.01;

              if (isScreenSharingActiveRef.current && isNewUserTurnRef.current && rms > VAD_THRESHOLD) {
                captureAndSendFrame();
                isNewUserTurnRef.current = false;
              }

              const pcmBlob: Blob = {
                  data: encode(new Uint8Array(new Int16Array(inputData.map(v => v * 32768)).buffer)),
                  mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmBlob });
              });
            };

            mediaStreamSourceRef.current.connect(scriptProcessorRef.current);
            scriptProcessorRef.current.connect(inputAudioContextRef.current!.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            console.groupCollapsed(`Message received from AI @ ${new Date().toLocaleTimeString()}`);
            console.debug(JSON.stringify(message, null, 2));
            console.groupEnd();

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
              currentUserTurnText.current += text;
              lastUserPromptRef.current += text;
              
              setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last?.sender === 'user') {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1] = { ...last, text: last.text + text };
                  return newHistory;
                }
                return [...prev, { sender: 'user', text, timestamp: new Date() }];
              });
            }
            
            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              currentCoachTurnText.current += text;
              isNewUserTurnRef.current = true;
              
              const fullTranscript = currentCoachTurnText.current;
              const displayableText = parseCoachTranscript(fullTranscript);

              // Check for code generation trigger
              const fullTextLower = fullTranscript.toLowerCase();
              const shouldGenerateCode = CODE_GENERATION_TRIGGERS.some(trigger => fullTextLower.includes(trigger));
              
              if (shouldGenerateCode && !codeGenerationTriggeredRef.current && lastUserPromptRef.current.trim()) {
                codeGenerationTriggeredRef.current = true;
                fetchCodeSnippet(lastUserPromptRef.current);
              }

              setChatHistory(prev => {
                const last = prev[prev.length - 1];
                if (last?.sender === 'coach') {
                  const newHistory = [...prev];
                  newHistory[newHistory.length - 1] = { ...last, text: displayableText };
                  return newHistory;
                }
                if (displayableText.trim()) {
                    return [...prev, { sender: 'coach', text: displayableText, timestamp: new Date() }];
                }
                return prev;
              });
            }

            if (message.serverContent?.turnComplete) {
              if (currentUserTurnText.current.trim()) {
                console.debug('User turn:', currentUserTurnText.current.trim());
              }
              if (currentCoachTurnText.current.trim()) {
                console.debug("Coach's response:", currentCoachTurnText.current.trim());
              }
              // Reset for next turn
              currentUserTurnText.current = '';
              currentCoachTurnText.current = '';
              lastUserPromptRef.current = '';
              codeGenerationTriggeredRef.current = false;
            }

            const base64Audio = message.serverContent?.modelTurn?.parts
              .find(part => part.inlineData?.mimeType.startsWith('audio/'))
              ?.inlineData?.data;

            if (base64Audio && outputAudioContextRef.current) {
              const audioCtx = outputAudioContextRef.current;
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, audioCtx.currentTime);
              
              const audioBuffer = await decodeAudioData(decode(base64Audio), audioCtx, 24000, 1);
              
              const source = audioCtx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioCtx.destination);
              
              source.addEventListener('ended', () => {
                audioSourcesRef.current.delete(source);
              });
              
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += audioBuffer.duration;
              audioSourcesRef.current.add(source);
            }
            
            const interrupted = message.serverContent?.interrupted;
            if (interrupted) {
              for (const source of audioSourcesRef.current.values()) {
                source.stop();
              }
              audioSourcesRef.current.clear();
              nextStartTimeRef.current = 0;
            }
          },
          onerror: (e: ErrorEvent) => {
            console.error('Session error:', e);
            setError(`Session failed: ${e.message}`);
            setSessionState(SessionState.ERROR);
            cleanup();
          },
          onclose: () => {
            cleanup();
          },
        },
      });
      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to start session:", err);
      setError(`Failed to start session: ${err.message}`);
      setSessionState(SessionState.ERROR);
      cleanup();
    }
  }, [cleanup, captureAndSendFrame, fetchCodeSnippet]);

  const stopSession = useCallback(() => {
    cleanup();
  }, [cleanup]);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    sessionState,
    startSession,
    stopSession,
    chatHistory,
    codeHistory,
    error,
    startScreenShare,
    stopScreenShare,
    isScreenSharingActive,
    screenCapture,
    isMuted,
    toggleMute,
    isGeneratingCode,
  };
};
