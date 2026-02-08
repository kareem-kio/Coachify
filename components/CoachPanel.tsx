
import React, { useEffect, useRef, useState } from 'react';
import { SessionState, ChatMessage, CodeSnippet } from '../types';
import { LoadingIcon } from './icons/LoadingIcon';
import { MicIcon } from './icons/MicIcon';
import { AlertTriangleIcon } from './icons/AlertTriangleIcon';
import { CodeBlock } from './CodeBlock';
import { CodeIcon } from './icons/CodeIcon';

interface ChatPanelProps {
  sessionState: SessionState;
  history: ChatMessage[];
  codeHistory: CodeSnippet[];
  error: string | null;
  isGeneratingCode: boolean;
}

const StatusIndicator: React.FC<{ sessionState: SessionState; isGeneratingCode: boolean }> = ({ sessionState, isGeneratingCode }) => {
  if (isGeneratingCode) {
    return (
      <div className="flex items-center space-x-2 text-cyan-500 dark:text-cyan-400">
        <LoadingIcon className="animate-spin h-5 w-5" />
        <span>Generating Code...</span>
      </div>
    );
  }
  
  switch (sessionState) {
    case SessionState.CONNECTING:
      return (
        <div className="flex items-center space-x-2 text-yellow-500 dark:text-yellow-400">
          <LoadingIcon className="animate-spin h-5 w-5" />
          <span>Connecting...</span>
        </div>
      );
    case SessionState.ACTIVE:
      return (
        <div className="flex items-center space-x-2 text-green-500 dark:text-green-400">
          <div className="relative flex items-center justify-center h-5 w-5">
            <MicIcon className="h-5 w-5" />
            <span className="absolute h-full w-full rounded-full bg-green-500 dark:bg-green-400 opacity-75 animate-ping"></span>
          </div>
          <span>Listening & Guiding</span>
        </div>
      );
    case SessionState.ERROR:
      return (
        <div className="flex items-center space-x-2 text-red-500 dark:text-red-500">
          <AlertTriangleIcon className="h-5 w-5" />
          <span>Error</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
          <MicIcon className="h-5 w-5" />
          <span>Idle</span>
        </div>
      );
  }
};

const ChatView: React.FC<{ history: ChatMessage[] }> = ({ history }) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="flex-grow bg-slate-100/50 dark:bg-slate-900/50 rounded-md p-4 overflow-y-auto border border-slate-200 dark:border-slate-700 space-y-4 transition-colors duration-200">
      {history.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
          <p>Start the session to begin the conversation...</p>
        </div>
      ) : (
        history.map((msg, index) => (
          <div key={index} className={`w-full flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div className="flex flex-col max-w-[80%]">
              <div className={`px-1 mb-1 flex items-baseline gap-2 ${msg.sender === 'user' ? 'self-start' : 'self-end'}`}>
                <span className="font-semibold text-sm text-slate-600 dark:text-slate-300 transition-colors duration-200">
                  {msg.sender === 'user' ? 'You' : 'Coachify'}
                </span>
                <span className="text-xs text-slate-400 dark:text-slate-500 transition-colors duration-200">
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div
                className={`rounded-lg px-4 py-2 whitespace-pre-wrap transition-colors duration-200 ${
                  msg.sender === 'user'
                    ? 'bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-none'
                    : 'bg-cyan-100/50 dark:bg-cyan-900/50 text-cyan-900 dark:text-cyan-100 rounded-br-none'
                }`}
              >
                <span>{msg.text}</span>
              </div>
            </div>
          </div>
        ))
      )}
      <div ref={chatEndRef} />
    </div>
  );
};

const CodeView: React.FC<{ codeHistory: CodeSnippet[] }> = ({ codeHistory }) => {
  const codeEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    codeEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [codeHistory]);
  
  return (
    <div className="flex-grow bg-slate-100/50 dark:bg-slate-900/50 rounded-md p-4 overflow-y-auto border border-slate-200 dark:border-slate-700 space-y-6 transition-colors duration-200">
      {codeHistory.length === 0 ? (
        <div className="flex items-center justify-center h-full text-slate-400 dark:text-slate-500">
          <p>Code snippets from the coach will appear here.</p>
        </div>
      ) : (
        codeHistory.map((snippet, index) => (
          <div key={index} className="bg-slate-100 dark:bg-slate-800/60 p-4 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors duration-200">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic">
              <p>In response to: "{snippet.userPrompt}"</p>
              <p className="text-slate-400 dark:text-slate-500">{snippet.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <CodeBlock code={snippet.code} />
          </div>
        ))
      )}
      <div ref={codeEndRef} />
    </div>
  );
}

export const ChatPanel: React.FC<ChatPanelProps> = ({ sessionState, history, codeHistory, error, isGeneratingCode }) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'code'>('chat');

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl p-6 flex flex-col h-[70vh] max-h-[700px] transition-colors duration-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex border-b border-slate-200 dark:border-slate-700 transition-colors duration-200">
            <button 
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'border-b-2 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <MicIcon className="h-4 w-4" /> Chat
            </button>
            <button 
                onClick={() => setActiveTab('code')}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'code' ? 'border-b-2 border-cyan-500 dark:border-cyan-400 text-cyan-600 dark:text-cyan-300' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <CodeIcon className="h-4 w-4" /> Code
            </button>
        </div>
        <StatusIndicator sessionState={sessionState} isGeneratingCode={isGeneratingCode} />
      </div>
      
      {error ? (
        <div className="text-red-500 dark:text-red-400 flex flex-col items-center justify-center h-full">
          <AlertTriangleIcon className="w-12 h-12 mb-4" />
          <p className="font-semibold">An error occurred:</p>
          <p className="text-sm text-center">{error}</p>
        </div>
      ) : (
        activeTab === 'chat' ? <ChatView history={history} /> : <CodeView codeHistory={codeHistory} />
      )}
    </div>
  );
};
