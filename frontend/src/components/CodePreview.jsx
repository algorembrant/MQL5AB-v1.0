import React, { useState } from 'react';
import { Download, Copy, Check, Code, Maximize2 } from 'lucide-react';

const CodePreview = ({ code, strategyName }) => {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${strategyName || 'strategy'}.mq5`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!code) {
    return (
      <div className="bg-gray-900/50 border border-gray-800 rounded-lg p-8 text-center">
        <div className="max-w-md mx-auto space-y-4">
          <div className="w-16 h-16 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto">
            <Code size={32} className="text-cyan-400" />
          </div>
          <h3 className="text-xl font-bold text-white">No Code Generated</h3>
          <p className="text-gray-400 text-sm">
            Create a strategy to generate MQL5 code automatically
          </p>
        </div>
      </div>
    );
  }

  const lineCount = code.split('\n').length;
  const charCount = code.length;

  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800/50 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center">
              <Code size={20} className="text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Generated MQL5 Code</h3>
              <p className="text-xs text-gray-400">
                {lineCount} lines • {charCount} characters
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              title={expanded ? 'Collapse' : 'Expand'}
            >
              <Maximize2 size={16} className="text-gray-300" />
            </button>
            
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-green-400" />
                  <span className="text-green-400 text-sm font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={16} className="text-gray-300" />
                  <span className="text-gray-300 text-sm font-semibold">Copy</span>
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 rounded-lg transition-colors"
            >
              <Download size={16} className="text-white" />
              <span className="text-white text-sm font-semibold">Download .mq5</span>
            </button>
          </div>
        </div>
      </div>

      {/* Code Display */}
      <div className={`relative ${expanded ? 'max-h-[800px]' : 'max-h-96'} overflow-y-auto`}>
        <pre className="bg-black p-6 text-sm leading-relaxed">
          <code className="text-green-400 font-mono">
            {code.split('\n').map((line, idx) => (
              <div key={idx} className="flex hover:bg-gray-900/50">
                <span className="text-gray-600 w-12 text-right pr-4 select-none">
                  {idx + 1}
                </span>
                <span className="flex-1">{line || ' '}</span>
              </div>
            ))}
          </code>
        </pre>
      </div>

      {/* Footer Instructions */}
      <div className="bg-gray-800/50 border-t border-gray-700 px-6 py-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <span className="text-blue-400 text-sm font-bold">📝</span>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-white mb-2">How to Use This Code</h4>
            <ol className="text-xs text-gray-400 space-y-1 list-decimal list-inside">
              <li>Download the .mq5 file using the button above</li>
              <li>Open MetaEditor (F4 in MT5 or Tools → MetaQuotes Language Editor)</li>
              <li>Copy the file to: <code className="text-cyan-400 bg-gray-900 px-1 rounded">MQL5/Experts/</code> folder</li>
              <li>Compile the code (F7) and check for errors</li>
              <li>Attach the Expert Advisor to your chart in MT5</li>
              <li>Configure input parameters and enable auto-trading</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Code Quality Indicators */}
      <div className="bg-gradient-to-r from-gray-800/50 to-gray-900/50 border-t border-gray-700 px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Pure MQL5</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">MT5 Compatible</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-gray-400">Risk Management Included</span>
            </div>
          </div>
          <div className="text-gray-500">
            Generated by MQL5 Algo Bot Builder
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodePreview;