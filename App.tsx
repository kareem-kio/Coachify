
import React, { useState, useEffect } from 'react';
import { ChatPanel } from './components/CoachPanel';
import { ContextPanel } from './components/ContextPanel';
import { ControlBar } from './components/ControlBar';
import { useLiveCoach } from './hooks/useLiveCoach';
import { SunIcon } from './components/icons/SunIcon';
import { MoonIcon } from './components/icons/MoonIcon';

function App() {
  const [userGoal, setUserGoal] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const {
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
  } = useLiveCoach();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [theme]);

  const handleStartSession = () => {
    startSession(userGoal || 'Write some code');
  };

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans flex flex-col transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-800/50 backdrop-blur-sm border-b border-slate-200 dark:border-slate-700 p-4 shadow-lg sticky top-0 z-10 flex justify-between items-center">
        <div className="w-8"></div> {/* Spacer */}
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="C"
            className="h-10 object-contain"
          />
          <span className="text-2xl font-bold tracking-wide ml-0.1" style={{ backgroundImage: 'linear-gradient(to right, #0f2d5d, #5ae0ac)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>oachify</span>
        </div>
        <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-cyan-500">
          {theme === 'dark' ? <SunIcon className="w-5 h-5 text-yellow-400" /> : <MoonIcon className="w-5 h-5 text-slate-700" />}
        </button>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
        <ChatPanel
          sessionState={sessionState}
          history={chatHistory}
          codeHistory={codeHistory}
          error={error}
          isGeneratingCode={isGeneratingCode}
        />
        <ContextPanel
          userGoal={userGoal}
          onGoalChange={setUserGoal}
          isSessionActive={sessionState !== 'IDLE'}
          screenCapture={screenCapture}
          isScreenSharingActive={isScreenSharingActive}
        />
      </main>

      <footer className="sticky bottom-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-t border-slate-200 dark:border-slate-700 py-4 px-4 md:px-8">
        <ControlBar
          sessionState={sessionState}
          onStart={handleStartSession}
          onStop={stopSession}
          onStartScreenShare={startScreenShare}
          onStopScreenShare={stopScreenShare}
          isScreenSharingActive={isScreenSharingActive}
          isMuted={isMuted}
          onToggleMute={toggleMute}
        />
      </footer>
    </div>
  );
}

export default App;
