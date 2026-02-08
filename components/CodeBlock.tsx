
import React, { useState } from 'react';
import { CopyIcon } from './icons/CopyIcon';
import { CheckIcon } from './icons/CheckIcon';

interface CodeBlockProps {
  code: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ code }) => {
  const [isCopied, setIsCopied] = useState(false);

  // Clean the code by removing markdown fences and leading/trailing whitespace
  const cleanCode = code.replace(/^```(?:\w+\n)?/, '').replace(/```$/, '').trim();

  const handleCopy = () => {
    navigator.clipboard.writeText(cleanCode).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  };

  return (
    <div className="relative group bg-slate-950 rounded-md my-2 -mx-4">
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-1.5 rounded-md text-slate-400 bg-slate-800/50 opacity-0 group-hover:opacity-100 transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-cyan-500"
        aria-label="Copy code"
      >
        {isCopied ? (
          <CheckIcon className="w-4 h-4 text-green-400" />
        ) : (
          <CopyIcon className="w-4 h-4" />
        )}
      </button>
      <pre className="p-4 text-sm overflow-x-auto text-cyan-200">
        <code className="font-mono">{cleanCode}</code>
      </pre>
    </div>
  );
};
