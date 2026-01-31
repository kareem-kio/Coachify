
import React, { useState } from 'react';

interface Snippet {
  id: string;
  code: string;
  language: string;
  timestamp: number;
}

interface CodeVaultProps {
  snippets: Snippet[];
  onClear: () => void;
}

const CodeVault: React.FC<CodeVaultProps> = ({ snippets, onClear }) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (snippets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-neutral-600 p-8 text-center">
        <svg className="w-10 h-10 mb-3 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-xs font-mono uppercase tracking-tighter">No snippets captured yet</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4 px-2">
        <h3 className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em] mono">Snippet Library</h3>
        <button 
          onClick={onClear}
          className="text-[10px] text-neutral-600 hover:text-red-400 transition-colors uppercase font-bold"
        >
          Clear All
        </button>
      </div>
      <div className="flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        {snippets.map((s) => (
          <div key={s.id} className="group relative bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden shadow-sm">
            <div className="flex justify-between items-center px-4 py-2 bg-neutral-900/50 border-b border-neutral-800">
              <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest">{s.language || 'code'}</span>
              <button 
                onClick={() => copyToClipboard(s.code, s.id)}
                className={`text-[10px] font-bold px-2 py-1 rounded transition-all flex items-center gap-1.5 ${copiedId === s.id ? 'text-green-400 bg-green-500/10' : 'text-neutral-400 hover:text-white bg-neutral-800'}`}
              >
                {copiedId === s.id ? (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                    COPIED
                  </>
                ) : (
                  <>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    COPY
                  </>
                )}
              </button>
            </div>
            <pre className="p-4 text-xs font-mono text-neutral-300 overflow-x-auto whitespace-pre leading-relaxed scrollbar-hide">
              <code>{s.code}</code>
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CodeVault;
