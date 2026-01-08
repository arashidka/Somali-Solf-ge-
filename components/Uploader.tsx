
import React, { useRef, useState } from 'react';
import { FileData } from '../types';

interface UploaderProps {
  onUpload: (file: FileData) => void;
  disabled?: boolean;
}

export const Uploader: React.FC<UploaderProps> = ({ onUpload, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file: File) => {
    if (!file) return;

    const validTypes = ['audio/mpeg', 'audio/wav', 'audio/mp3', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type) && !file.name.toLowerCase().endsWith('.mp3')) {
      alert("Invalid file type. Please upload MP3, WAV, MP4, or MOV.");
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      alert("File is too large. Please upload media under 25MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      const fileUrl = URL.createObjectURL(file); // Create local URL for player
      onUpload({
        base64,
        mimeType: file.type || 'audio/mpeg',
        name: file.name,
        size: file.size,
        fileUrl
      });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div 
      className={`relative border-2 border-dashed rounded-3xl p-12 transition-all duration-300 ${
        isDragging ? 'border-somali-blue bg-somali-light/50 scale-[1.01]' : 'border-slate-200 hover:border-somali-blue/50 bg-white'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer shadow-sm hover:shadow-md'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
      }}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} 
        className="hidden" 
        accept=".mp3,.wav,.mp4,.mov,audio/*,video/*"
        disabled={disabled}
      />
      
      <div className="flex flex-col items-center">
        <div className="w-20 h-20 bg-somali-light text-somali-blue rounded-full flex items-center justify-center mb-6 ring-4 ring-somali-light/30">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-slate-800">Upload Media</h3>
        <p className="text-slate-500 text-center mt-2 max-w-xs leading-relaxed">
          Drag and drop your audio or video file here to begin transcription
        </p>
        
        <div className="mt-8 px-8 py-3 bg-somali-blue text-white font-bold rounded-xl hover:bg-somali-dark transition-all transform hover:scale-105 shadow-xl shadow-somali-blue/30 active:scale-95">
          Choose File
        </div>
      </div>
    </div>
  );
};
