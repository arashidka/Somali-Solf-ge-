
export interface ProcessingStep {
  id: string;
  label: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export interface TranscriptionResult {
  raw: string;
  title: string;
  scale: string;
  time: string;
  tempo: string;
  confidence: {
    vocal: string;
    melody: string;
    lyrics: string;
  };
}

export interface FileData {
  base64: string;
  mimeType: string;
  name: string;
  size: number;
  fileUrl: string; // Added to support video/audio sync
}
