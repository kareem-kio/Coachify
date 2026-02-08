
import React from 'react';
import { SessionState } from '../types';
import { MicIcon } from './icons/MicIcon';
import { SquareIcon } from './icons/SquareIcon';
import { CameraIcon } from './icons/CameraIcon';
import { CameraOffIcon } from './icons/CameraOffIcon';

interface ControlBarProps {
  sessionState: SessionState;
  onStart: () => void;
  onStop: () => void;
  onStartScreenShare: () => void;
  onStopScreenShare: () => void;
  isScreenSharingActive: boolean;
}

export const ControlBar: React.FC<ControlBarProps> = ({
  sessionState,
  onStart,
  onStop,
  onStartScreenShare,
  onStopScreenShare,
  isScreenSharingActive,
}) => {
  const isSessionActive = sessionState === SessionState.ACTIVE;
  const isConnecting = sessionState === SessionState.CONNECTING;

  const handleShareClick = () => {
    if (isScreenSharingActive) {
      onStopScreenShare();
    } else {
      onStartScreenShare();
    }
  };

  return (
    <div className="flex justify-center items-center space-x-4">
      {isSessionActive || isConnecting ? (
        <button
          onClick={onStop}
          disabled={isConnecting}
          className="flex items-center justify-center w-48 h-12 px-6 bg-red-600 text-white font-semibold rounded-full shadow-lg hover:bg-red-700 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-red-400 disabled:bg-red-800 disabled:cursor-not-allowed"
        >
          <SquareIcon className="h-5 w-5 mr-2" />
          <span>End Session</span>
        </button>
      ) : (
        <button
          onClick={onStart}
          className="flex items-center justify-center w-48 h-12 px-6 bg-cyan-500 text-white font-semibold rounded-full shadow-lg hover:bg-cyan-600 transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-cyan-300"
        >
          <MicIcon className="h-5 w-5 mr-2" />
          <span>Start Coaching</span>
        </button>
      )}
      {isSessionActive && (
        <button
          onClick={handleShareClick}
          className={`flex items-center justify-center w-48 h-12 px-6 font-semibold rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 ${
            isScreenSharingActive
              ? 'bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-400'
              : 'bg-slate-200 text-slate-800 hover:bg-slate-300 focus:ring-slate-400 dark:bg-slate-600 dark:text-white dark:hover:bg-slate-700 dark:focus:ring-slate-500'
          }`}
        >
          {isScreenSharingActive ? (
            <>
              <CameraOffIcon className="h-5 w-5 mr-2" />
              <span>Stop Sharing</span>
            </>
          ) : (
            <>
              <CameraIcon className="h-5 w-5 mr-2" />
              <span>Share Screen</span>
            </>
          )}
        </button>
      )}
    </div>
  );
};
