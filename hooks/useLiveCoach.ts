
import { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI, LiveSession, LiveServerMessage, Modality, Blob } from '@google/genai';
import { SessionState, ChatMessage, CodeSnippet } from '../types';
import { encode, decode, decodeAudioData } from '../services/audioService';

const getSystemInstruction = (userGoal: string) => `You are Coachify, an AI coding mentor. Your responses are machine-parsed. Follow these rules.

**UNBREAKABLE RULE: CODE GENERATION**
- If the user asks for code, you MUST NOT send the code in your response.
- Instead, you MUST verbally confirm the request. Your verbal confirmation acts as a trigger for a separate tool to generate the code.
- Example User Request: "Can you give me the boilerplate for an HTML file?"
- Example **CORRECT** Verbal Response: "Certainly. I'll generate that HTML boilerplate and send it to the code window."
- Example **INCORRECT** Response: (Sending audio and a text block with code). This will fail.

**OTHER RULES:**
- Any text part marked with \`"thought": true\` is for your internal reasoning ONLY. It will NOT be shown to the user.
- Guide, don't just give answers. Use hints and leading questions.
- The user's current goal is: "${userGoal}".`;

const CODE_GENERATION_TRIGGERS = [
    'i\'ll generate',
    'generating the code',
    'sent the code',
    'sending the code',
    'here is the code',
    'code window'
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

  const sessionRef = useRef<LiveSession | null>(null);
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
      if (isFetchingCodeRef.current || !userPrompt) return;
      isFetchingCodeRef.current = true;
      setIsGeneratingCode(true);
      
      const goal = userGoalRef.current;
      console.log(`[fetchCodeSnippet] Triggered for prompt: "${userPrompt}" with goal: "${goal}"`);
      
      const codeGenPrompt = `You are an expert coding coach helping users learn programming through hands-on practice.

## Context
- User's learning goal: ${goal || "Not specified yet"}
- Current request: ${userPrompt || "User just started"}

## Your Role
You provide code snippets that help users progress toward their learning goal, one step at a time. You balance showing complete, working examples with leaving room for learning.

## Instructions

1. **Interpret the request:**
   - If the user has no goal yet, ask them what they want to learn or build
   - If they have a goal but no specific request, provide the logical first step (setup, boilerplate, or foundational code)
   - For conversational prompts like "next", "continue", "send it", or "okay", provide the next incremental code piece
   - For specific technical requests, provide targeted code that addresses their question while advancing their goal

2. **Code quality:**
   - Write clean, well-commented code that explains key concepts
   - Use meaningful variable names that teach good practices
   - Include inline comments for learning points (e.g., "// This loop iterates through each item")
   - Follow language-specific best practices and conventions

3. **Pedagogical approach:**
   - Build incrementally - don't provide everything at once
   - Each snippet should introduce 1-2 new concepts
   - Include TODO comments where the user should practice or extend the code
   - Add brief comments explaining "why" not just "what"

4. **Response format:**
   - If no goal is set: Respond conversationally asking what they want to learn
   - If providing code: Give a one-sentence intro, then the code block, then 1-2 learning tips
   - Always use proper markdown code fences with language specification

## Example Outputs

**No goal set:**
"Hi! I'd love to help you learn to code. What would you like to build or learn? For example: a website, a Discord bot, data analysis with Python, or something else?"

**With goal:**
"Let's start with the basic Express server setup:

\`\`\`javascript
// Import the Express framework
const express = require('express');
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Your first route - responds to GET requests at the root URL
app.get('/', (req, res) => {
  res.json({ message: 'Hello! Your server is running.' });
});

// TODO: Add your own routes here

// Start the server
app.listen(PORT, () => {
  console.log(\`Server running on http://localhost:\${PORT}\`);
});
\`\`\`

💡 **Try it:** Run this with \`node server.js\` and visit http://localhost:3000 in your browser.
💡 **Next step:** We'll add a POST route to handle form submissions."`;


      try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: codeGenPrompt,
        });
        
        const codeText = response.text;
        if (codeText) {
             console.debug('[fetchCodeSnippet] Code snippet received:', codeText);
             setCodeHistory(prev => [...prev, {
                userPrompt: userPrompt.trim(),
                code: codeText,
                timestamp: new Date(),
            }]);
        } else {
            console.error('[fetchCodeSnippet] Received an empty code response from generateContent.');
        }

      } catch (err) {
          console.error('[fetchCodeSnippet] Error fetching code snippet:', err);
      } finally {
          isFetchingCodeRef.current = false;
          setIsGeneratingCode(false);
          lastUserPromptRef.current = ''; // Clear prompt after attempting to fetch
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

              const fullTextLower = fullTranscript.toLowerCase();
              if (CODE_GENERATION_TRIGGERS.some(trigger => fullTextLower.includes(trigger))) {
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
              currentUserTurnText.current = '';
              currentCoachTurnText.current = '';
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
