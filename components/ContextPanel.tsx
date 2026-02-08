
import React from 'react';
import { CodeIcon } from './icons/CodeIcon';
import { TargetIcon } from './icons/TargetIcon';
import { CameraIcon } from './icons/CameraIcon';

interface ContextPanelProps {
  userGoal: string;
  onGoalChange: (goal: string) => void;
  isSessionActive: boolean;
  screenCapture: string | null;
  isScreenSharingActive: boolean;
}

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-white dark:bg-slate-800/80 rounded-lg p-4 border border-slate-200 dark:border-slate-700 transition-colors duration-200">
    <div className="flex items-center text-slate-500 dark:text-slate-400 mb-2">
      {icon}
      <h3 className="ml-2 font-semibold text-sm uppercase tracking-wider">{title}</h3>
    </div>
    {children}
  </div>
);

export const ContextPanel: React.FC<ContextPanelProps> = ({ userGoal, onGoalChange, isSessionActive, screenCapture, isScreenSharingActive }) => {
  const getPlaceholder = () => {
    if (isScreenSharingActive) {
      return (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <div className="relative flex items-center justify-center">
            <CodeIcon className="w-16 h-16 text-cyan-500 dark:text-cyan-600" />
            <span className="absolute h-full w-full rounded-full bg-cyan-400 dark:bg-cyan-500 opacity-50 animate-ping"></span>
          </div>
          <p className="font-semibold text-slate-700 dark:text-slate-300 mt-4">Screen Sharing Active</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">A snapshot is sent when you speak.</p>
        </div>
      );
    }
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
          <CameraIcon className="w-16 h-16 text-slate-400 dark:text-slate-600 mb-4" />
          <p className="font-semibold text-slate-500 dark:text-slate-400">Screen Share Inactive</p>
          <p className="text-sm text-slate-600 dark:text-slate-500">Click "Share Screen" below to begin.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      <Section title="Live Screen" icon={<CodeIcon className="h-5 w-5" />}>
        <div className="aspect-video bg-slate-200 dark:bg-slate-900 rounded-md overflow-hidden border border-slate-300 dark:border-slate-600 flex items-center justify-center relative transition-colors duration-200">
            {screenCapture ? (
                <img 
                  src={screenCapture} 
                  alt="User's shared screen" 
                  className="object-contain w-full h-full"
                />
            ) : (
                <div className="w-full h-full bg-black/5 dark:bg-black/20">
                    {getPlaceholder()}
                </div>
            )}
        </div>
      </section>
      
      <Section title="User Goal" icon={<TargetIcon className="h-5 w-5" />}>
         <textarea
            value={userGoal}
            onChange={(e) => onGoalChange(e.target.value)}
            disabled={isSessionActive}
            className="w-full h-24 p-2 bg-slate-100 dark:bg-slate-900/50 rounded-md text-cyan-600 dark:text-cyan-400 font-medium border border-slate-300 dark:border-slate-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition disabled:opacity-70 disabled:cursor-not-allowed"
            placeholder="Write your goal here..."
         />
      </section>
    </div>
  );
};
