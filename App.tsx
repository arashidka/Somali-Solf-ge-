
import React, { useState, useRef, useEffect } from 'react';
import { Header } from './components/Header';
import { Uploader } from './components/Uploader';
import { ProcessingState } from './components/ProcessingState';
import { SheetDisplay } from './components/SheetDisplay';
import { FileData, ProcessingStep } from './types';
import { processMediaFile } from './geminiService';

const App: React.FC = () => {
  const [file, setFile] = useState<FileData | null>(null);
  const [fileHistory, setFileHistory] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [steps, setSteps] = useState<ProcessingStep[]>([
    { id: 'upload', label: 'Preparing Media', status: 'pending' },
    { id: 'analysis', label: 'Musicology Analysis', status: 'pending' },
    { id: 'transcription', label: 'Solfège Transcription', status: 'pending' },
  ]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const playbackMonitorRef = useRef<number | null>(null);

  const updateStep = (id: string, status: ProcessingStep['status']) => {
    setSteps(prev => prev.map(step => step.id === id ? { ...step, status } : step));
  };

  const handleFileUpload = async (uploadedFile: FileData) => {
    // Clear old blob URLs if any
    fileHistory.forEach(url => URL.revokeObjectURL(url));
    setFileHistory([uploadedFile.fileUrl]);
    
    setFile(uploadedFile);
    setIsProcessing(true);
    setResult(null);
    setError(null);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));

    try {
      updateStep('upload', 'processing');
      await new Promise(r => setTimeout(r, 600));
      updateStep('upload', 'completed');

      updateStep('analysis', 'processing');
      const transcription = await processMediaFile(uploadedFile);
      updateStep('analysis', 'completed');

      updateStep('transcription', 'processing');
      setResult(transcription);
      updateStep('transcription', 'completed');
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setSteps(prev => prev.map(s => s.status === 'processing' ? { ...s, status: 'error' } : s));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    fileHistory.forEach(url => URL.revokeObjectURL(url));
    setFileHistory([]);
    if (playbackMonitorRef.current) cancelAnimationFrame(playbackMonitorRef.current);
    setFile(null);
    setResult(null);
    setError(null);
    setIsProcessing(false);
    setSteps(steps.map(s => ({ ...s, status: 'pending' })));
    // Reset global playback event
    window.dispatchEvent(new CustomEvent('somali-playback-tick', { detail: { time: 0 } }));
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      // Dispatch high-frequency event for optimized measure rendering
      window.dispatchEvent(new CustomEvent('somali-playback-tick', { 
        detail: { time: audioRef.current.currentTime } 
      }));
    }
  };

  const seekAndPlay = (startTime: number, endTime: number) => {
    if (audioRef.current) {
      if (playbackMonitorRef.current) {
        cancelAnimationFrame(playbackMonitorRef.current);
      }

      const safeStart = Math.max(0, startTime);
      const safeEnd = Math.max(safeStart + 0.1, endTime);

      audioRef.current.currentTime = safeStart;
      audioRef.current.play().catch(err => console.warn("Auto-play blocked or failed:", err));
      
      const monitor = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        if (current >= safeEnd) {
          audioRef.current.pause();
          audioRef.current.currentTime = safeEnd;
          playbackMonitorRef.current = null;
          // One last tick for accuracy
          window.dispatchEvent(new CustomEvent('somali-playback-tick', { detail: { time: safeEnd } }));
        } else if (audioRef.current.paused) {
          playbackMonitorRef.current = null;
        } else {
          playbackMonitorRef.current = requestAnimationFrame(monitor);
        }
      };
      
      playbackMonitorRef.current = requestAnimationFrame(monitor);
    }
  };

  useEffect(() => {
    return () => {
      if (playbackMonitorRef.current) cancelAnimationFrame(playbackMonitorRef.current);
      fileHistory.forEach(url => URL.revokeObjectURL(url));
    };
  }, [fileHistory]);

  return (
    <div className="min-h-screen flex flex-col pb-16 selection:bg-somali-blue selection:text-white relative">
      <Header />

      <main className="flex-grow container mx-auto px-4 mt-12 max-w-6xl">
        {!file && !isProcessing && !result ? (
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-4xl md:text-5xl font-black text-slate-800 mb-6 tracking-tight leading-tight">
                Transcribe <span className="text-somali-blue">Somali Music</span> with AI Precision
              </h2>
              <p className="text-lg text-slate-500 max-w-xl mx-auto leading-relaxed">
                Unlock the melody of the Horn of Africa. Convert any song into formal solfège notation and Somali lyrics instantly.
              </p>
            </div>
            <Uploader onUpload={handleFileUpload} disabled={isProcessing} />
          </div>
        ) : (
          <div className="flex flex-col space-y-8">
            {file && (
              <div className="sticky top-24 z-50 bg-white/95 backdrop-blur-md rounded-3xl shadow-xl border border-slate-100 p-4 md:p-6 flex flex-col md:flex-row items-center gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center space-x-4 flex-grow w-full md:w-auto">
                  <div className="w-12 h-12 bg-somali-blue text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-somali-blue/30">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2A1 1 0 007 8z" />
                    </svg>
                  </div>
                  <div className="overflow-hidden">
                    <p className="font-bold text-slate-800 truncate text-sm">{file.name}</p>
                    <p className="text-[10px] font-black text-somali-blue uppercase tracking-widest">Master Audio Engine</p>
                  </div>
                  <audio 
                    ref={audioRef}
                    src={file.fileUrl} 
                    className="flex-grow h-10"
                    controls
                    onTimeUpdate={onTimeUpdate}
                  />
                </div>
                {!isProcessing && result && (
                  <div className="flex items-center space-x-2 px-4 py-2 bg-somali-light rounded-full border border-somali-blue/10">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-black text-somali-blue uppercase tracking-widest">Phase Locked Sync</span>
                  </div>
                )}
              </div>
            )}

            <div className="w-full bg-white rounded-[2.5rem] shadow-2xl shadow-somali-blue/5 overflow-hidden border border-slate-100 min-h-[600px]">
              {(isProcessing || (file && !result)) && (
                <div className="p-10 md:p-16">
                  <div className="max-w-xl mx-auto">
                    <ProcessingState steps={steps} currentFile={file} />
                    {error && (
                      <div className="mt-12 p-6 bg-red-50 border border-red-100 rounded-3xl text-red-600 flex items-start space-x-4">
                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-bold text-lg">Analysis Interrupted</p>
                          <p className="text-sm mt-1 opacity-80">{error}</p>
                          <button 
                            onClick={reset}
                            className="mt-4 px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
                          >
                            Restart Engine
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {result && !isProcessing && (
                <div className="p-6 md:p-10">
                  <div className="mb-8 flex items-center justify-between">
                    <button 
                      onClick={reset}
                      className="group flex items-center text-sm font-bold text-slate-400 hover:text-somali-blue transition-all"
                    >
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center mr-2 group-hover:bg-somali-light transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                      </div>
                      New Project
                    </button>
                  </div>
                  <SheetDisplay 
                    result={result} 
                    onSeek={seekAndPlay}
                  />
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="container mx-auto px-4 mt-12 text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
           <div className="w-6 h-4 bg-somali-blue rounded-sm shadow-sm flex items-center justify-center">
             <div className="text-[6px] text-white">★</div>
           </div>
           <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Somali Musicology Institute</span>
        </div>
        <p className="text-slate-400 text-xs font-medium">© {new Date().getFullYear()} Somali Solfège Engine • Cultural Preservation Initiative</p>
      </footer>
    </div>
  );
};

export default App;
