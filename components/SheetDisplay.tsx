
import React, { useMemo, useEffect, useRef, useState } from 'react';

interface SheetDisplayProps {
  result: string;
  onSeek: (start: number, end: number) => void;
}

// Resilient timestamp conversion supporting [MM:SS], (MM:SS.ms), etc.
const timeToSeconds = (timeStr: string): number => {
  if (!timeStr) return 0;
  // Cleanup common non-numeric chars but keep colon and dot
  const clean = timeStr.replace(/[^\d:.]/g, '');
  const parts = clean.split(':');
  if (parts.length === 2) {
    const mins = parseInt(parts[0], 10);
    const secs = parseFloat(parts[1]);
    return mins * 60 + secs;
  }
  return parseFloat(clean) || 0;
};

interface Token {
  text: string;
  startTime: number;
  endTime: number;
}

// Sub-component for individual measures with decoupled high-perf rendering
const MeasureBlock: React.FC<{ 
  measureText: string; 
  mStart: number;
  mEnd: number;
  onSyncPlay: (start: number, end: number) => void;
}> = ({ measureText, mStart, mEnd, onSyncPlay }) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isActive, setIsActive] = useState(false);
  const lines = measureText.trim().split('\n');
  const mDuration = mEnd - mStart;
  const RUBATO_BUFFER = 0.95; // 5% safety factor to prevent visual outrun

  const header = lines[0];
  const titleMatch = header.match(/Measure \[\d+\]/);
  const title = titleMatch ? titleMatch[0] : 'Measure';

  const { solfegeTokens, lyricTokens } = useMemo(() => {
    const sLine = lines.find(l => l.startsWith('Solfège:'))?.replace('Solfège:', '').trim() || '';
    const lLine = lines.find(l => l.startsWith('Lyrics:'))?.replace('Lyrics:', '').trim() || '';

    const noteRegex = /(Do|Re|Mi|Fa|Sol|La|Ti)([¹²³⁴⁵⁶⁷⁸]*)?([♩♪]*)?/g;
    const sMatches = Array.from(sLine.matchAll(noteRegex));
    
    let totalWeight = 0;
    const weights = sMatches.map(m => {
      const sym = m[3] || '';
      const w = sym === '♪' ? 1 : 2;
      totalWeight += w;
      return w;
    });

    let currentOffset = 0;
    const sTokens: Token[] = sMatches.map((m, i) => {
      const w = weights[i];
      // Apply Rubato buffer to internal note timing
      const start = mStart + (currentOffset / totalWeight) * mDuration * RUBATO_BUFFER;
      const duration = (w / totalWeight) * mDuration * RUBATO_BUFFER;
      currentOffset += w;
      return { text: m[0], startTime: start, endTime: start + duration };
    });

    const lWords = lLine.split(/\s+/).filter(w => w.length > 0);
    const lTokens: Token[] = [];
    
    if (lWords.length === sTokens.length) {
      lWords.forEach((word, i) => {
        lTokens.push({ text: word, startTime: sTokens[i].startTime, endTime: sTokens[i].endTime });
      });
    } else {
      const wordDur = (mDuration * RUBATO_BUFFER) / Math.max(1, lWords.length);
      lWords.forEach((word, i) => {
        const start = mStart + i * wordDur;
        lTokens.push({ text: word, startTime: start, endTime: start + wordDur });
      });
    }

    return { solfegeTokens: sTokens, lyricTokens: lTokens };
  }, [measureText, mStart, mEnd, mDuration]);

  // Decoupled playback listener for 60fps updates without React re-renders
  useEffect(() => {
    const handleTick = (e: any) => {
      const time = e.detail.time;
      const currentlyActive = time >= mStart && time < mEnd;
      
      // Update local state only on active status change (low frequency)
      if (currentlyActive !== isActive) {
        setIsActive(currentlyActive);
        if (currentlyActive && elementRef.current) {
          elementRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }

      // Update progress bar via direct DOM manipulation (high frequency, optimized)
      if (currentlyActive && progressBarRef.current) {
        const progress = Math.min(100, Math.max(0, ((time - mStart) / mDuration) * 100));
        progressBarRef.current.style.width = `${progress}%`;
      } else if (!currentlyActive && progressBarRef.current) {
        progressBarRef.current.style.width = '0%';
      }
    };

    window.addEventListener('somali-playback-tick', handleTick);
    return () => window.removeEventListener('somali-playback-tick', handleTick);
  }, [isActive, mStart, mEnd, mDuration]);

  return (
    <div 
      ref={elementRef}
      onClick={() => onSyncPlay(mStart, mEnd)}
      className={`relative min-w-[280px] flex-grow h-44 p-4 border-r border-b border-slate-200 bg-white transition-all duration-300 cursor-pointer group hover:bg-somali-light/10 ${
        isActive ? 'bg-somali-light/30 border-l-4 border-l-somali-blue ring-4 ring-somali-blue/5' : ''
      }`}
    >
      <div className={`absolute top-2 left-2 text-[10px] font-black uppercase tracking-widest transition-colors ${
        isActive ? 'text-somali-blue' : 'text-slate-300'
      }`}>
        {title}
      </div>

      {/* High-Performance Progress Bar */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-100 z-20">
        <div 
          ref={progressBarRef}
          className="h-full bg-somali-blue shadow-[0_0_8px_rgba(65,137,221,0.5)] w-0"
        />
      </div>

      {isActive && (
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-somali-blue opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-somali-blue"></span>
          </span>
        </div>
      )}

      <div className="mt-4 flex flex-col h-full justify-center">
        <div className="flex items-center space-x-3 mb-6 overflow-x-auto no-scrollbar whitespace-nowrap">
          {solfegeTokens.map((t, i) => (
            <TokenSpan key={i} token={t} mStart={mStart} mEnd={mEnd} type="solfege" />
          ))}
        </div>

        <div className="flex items-center space-x-2 overflow-x-auto no-scrollbar whitespace-nowrap">
          {lyricTokens.map((t, i) => (
            <TokenSpan key={i} token={t} mStart={mStart} mEnd={mEnd} type="lyric" />
          ))}
        </div>
      </div>
      
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-20 opacity-[0.03] pointer-events-none flex flex-col justify-between">
        {[1,2,3,4,5].map(i => <div key={i} className="h-px bg-black w-full" />)}
      </div>
    </div>
  );
};

// Even more granular component for specific note/syllable highlighting
const TokenSpan: React.FC<{ token: Token, mStart: number, mEnd: number, type: 'solfege' | 'lyric' }> = ({ token, mStart, mEnd, type }) => {
  const [isTokenActive, setIsTokenActive] = useState(false);

  useEffect(() => {
    const handleTick = (e: any) => {
      const time = e.detail.time;
      const active = time >= token.startTime && time < token.endTime;
      if (active !== isTokenActive) setIsTokenActive(active);
    };
    window.addEventListener('somali-playback-tick', handleTick);
    return () => window.removeEventListener('somali-playback-tick', handleTick);
  }, [isTokenActive, token]);

  if (type === 'solfege') {
    return (
      <span className={`text-xl font-mono transition-all duration-150 rounded px-1 ${
        isTokenActive ? 'text-somali-blue font-black scale-125 translate-y-[-4px]' : 'text-slate-700'
      }`}>
        {token.text}
      </span>
    );
  }

  return (
    <span className={`text-sm font-sans transition-all duration-200 px-1 py-0.5 rounded ${
      isTokenActive ? 'bg-slate-800 text-white font-bold' : 'text-slate-500 font-medium'
    }`}>
      {token.text}
    </span>
  );
};

export const SheetDisplay: React.FC<SheetDisplayProps> = ({ result, onSeek }) => {
  const [visibleCount, setVisibleCount] = useState(12); // Initial visible measures for lazy load

  const parsedData = useMemo(() => {
    const sections = result.split('--------------------------------------------------------------------------');
    const header = sections[0]?.replace(/=+/g, '').trim() || '';
    const body = sections[1] || '';
    const rawMeasures = body.split(/(?=Measure \[\d+\])/g).filter(m => m.trim().startsWith('Measure'));
    
    // Resilient "Healing" Parser
    let parsed = rawMeasures.map(m => {
      // Regex supporting multiple bracket/paren formats
      const timeMatch = m.match(/(?:\[|\()?\s*(\d{1,2}:\d{1,2}(?:\.\d+)?)\s*-\s*(\d{1,2}:\d{1,2}(?:\.\d+)?)\s*(?:\]|\))?/);
      const start = timeMatch ? timeToSeconds(timeMatch[1]) : 0;
      const end = timeMatch ? timeToSeconds(timeMatch[2]) : start + 2;
      return { text: m, start, end };
    });

    // Sanity check: Adjust overlapping boundaries
    for (let i = 0; i < parsed.length - 1; i++) {
      if (parsed[i].end > parsed[i + 1].start) {
        const midpoint = (parsed[i].end + parsed[i + 1].start) / 2;
        parsed[i].end = midpoint;
        parsed[i + 1].start = midpoint;
      }
    }
    
    return { header, measures: parsed };
  }, [result]);

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([result], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "Somali-Solfege-Sheet.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Simple Intersection Observer implementation for lazy rendering
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        setVisibleCount(prev => Math.min(prev + 12, parsedData.measures.length));
      }
    }, { threshold: 0.1 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [parsedData.measures.length]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-somali-light/30 p-4 rounded-2xl border border-somali-blue/10">
        <div>
          <h3 className="text-xl font-black text-somali-blue tracking-tight">Sheet Music Score</h3>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-0.5">High Performance Sync Mode</p>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => window.print()}
            className="px-4 py-2.5 text-sm font-bold text-slate-600 hover:text-somali-blue transition-all bg-white rounded-xl border border-slate-200 shadow-sm"
          >
            Print
          </button>
          <button 
            onClick={downloadTxt}
            className="px-5 py-2.5 text-sm font-bold text-white bg-somali-blue hover:bg-somali-dark transition-all rounded-xl shadow-lg shadow-somali-blue/20"
          >
            Export .txt
          </button>
        </div>
      </div>

      <div className="bg-white border-2 border-slate-100 rounded-3xl shadow-2xl overflow-hidden print:border-0 print:shadow-none">
        <div className="bg-somali-blue px-8 py-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <div className="relative z-10">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] mb-4 opacity-60">Somali Solfège Technical Sheet</h2>
            <pre className="font-mono text-sm md:text-lg whitespace-pre-wrap leading-relaxed">
              {parsedData.header}
            </pre>
          </div>
        </div>

        <div className="w-full flex flex-wrap border-t border-slate-200">
          {parsedData.measures.slice(0, visibleCount).map((measure, idx) => (
            <MeasureBlock 
              key={idx} 
              measureText={measure.text} 
              mStart={measure.start}
              mEnd={measure.end}
              onSyncPlay={onSeek}
            />
          ))}
          {visibleCount < parsedData.measures.length && (
            <div ref={loadMoreRef} className="w-full p-8 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
              Loading more measures...
            </div>
          )}
          {parsedData.measures.length === 0 && (
            <div className="w-full p-20 text-center">
              <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Waiting for transcription results...</p>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] gap-4">
          <div className="flex items-center">
            <span className="w-1.5 h-1.5 bg-somali-blue rounded-full mr-2"></span>
            Performance Optimized Layout (60FPS Decoupled Sync)
          </div>
          <div>Digital Archive Reference: {Math.random().toString(36).substring(7).toUpperCase()}</div>
        </div>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};
