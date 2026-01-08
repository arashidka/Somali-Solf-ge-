
import React from 'react';
import { ProcessingStep, FileData } from '../types';

interface ProcessingStateProps {
  steps: ProcessingStep[];
  currentFile: FileData | null;
}

export const ProcessingState: React.FC<ProcessingStateProps> = ({ steps, currentFile }) => {
  return (
    <div className="w-full">
      {currentFile && (
        <div className="mb-12 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex items-center shadow-sm">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-somali-blue mr-5 shadow-lg shadow-somali-blue/5 border border-slate-100">
            {currentFile.mimeType.startsWith('video') ? (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            ) : (
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
              </svg>
            )}
          </div>
          <div className="flex-grow overflow-hidden">
            <p className="font-bold text-slate-800 truncate text-lg">{currentFile.name}</p>
            <div className="flex items-center mt-1">
              <span className="text-[10px] font-black text-somali-blue bg-somali-light px-2 py-0.5 rounded uppercase mr-2">
                {currentFile.mimeType.split('/')[1].toUpperCase()}
              </span>
              <span className="text-xs font-bold text-slate-400">{(currentFile.size / (1024 * 1024)).toFixed(2)} MB</span>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-8 relative">
        {/* Connector Line */}
        <div className="absolute left-6 top-4 bottom-4 w-1 bg-slate-100 rounded-full -translate-x-1/2 z-0"></div>

        {steps.map((step, idx) => (
          <div key={step.id} className="flex items-center relative z-10 group">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 shadow-md ${
              step.status === 'completed' ? 'bg-somali-blue text-white scale-110' : 
              step.status === 'processing' ? 'bg-somali-blue text-white animate-pulse shadow-somali-blue/40 ring-4 ring-somali-light' : 
              step.status === 'error' ? 'bg-red-500 text-white' :
              'bg-white text-slate-300 border-2 border-slate-100 group-hover:border-somali-blue/30'
            }`}>
              {step.status === 'completed' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              ) : step.status === 'error' ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <span className="text-base font-black">{idx + 1}</span>
              )}
            </div>
            
            <div className="ml-6 flex-grow">
              <div className="flex items-center justify-between">
                <p className={`text-lg font-bold tracking-tight ${
                  step.status === 'completed' ? 'text-slate-900' : 
                  step.status === 'processing' ? 'text-somali-blue' : 
                  'text-slate-400'
                }`}>
                  {step.label}
                </p>
                {step.status === 'processing' && (
                   <span className="text-[10px] font-black uppercase text-somali-blue tracking-widest animate-pulse">Running</span>
                )}
              </div>
              <div className="h-1.5 w-full bg-slate-100 rounded-full mt-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${
                    step.status === 'completed' ? 'w-full bg-somali-blue' : 
                    step.status === 'processing' ? 'w-1/2 bg-somali-blue animate-shimmer' : 
                    'w-0'
                  }`}
                  style={{
                    backgroundImage: step.status === 'processing' ? 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)' : 'none',
                    backgroundSize: '200% 100%'
                  }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-16 p-6 bg-somali-blue/5 rounded-3xl border border-somali-blue/10 text-center">
        <p className="text-xs font-bold text-somali-blue uppercase tracking-[0.2em] mb-2">Pro Tip</p>
        <p className="text-sm text-slate-600 leading-relaxed italic">
          "The AI works best with clear vocal isolations and rhythmic Somali percussion (durbaan)."
        </p>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
};
