// Type definitions for file processing service

export interface ProcessedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  content: string | ArrayBuffer;
  language?: string;
  extension?: string;
  path?: string;
  metadata?: {
    wordCount?: number;
    lineCount?: number;
    charCount?: number;
    hasExtractedText?: boolean;
    isLargeFile?: boolean;
  };
}

export interface FileAnalysisResult {
  wordCount: number;
  lineCount: number;
  charCount: number;
  language?: string;
  extension?: string;
  isBinary: boolean;
  isLargeFile: boolean;
  isCode: boolean;
  isDocument: boolean;
  isImage: boolean;
  isAudio: boolean;
  isVideo: boolean;
  isArchive: boolean;
}

export interface FileProcessingOptions {
  maxFileSize?: number;
  allowedExtensions?: string[];
  allowedMimeTypes?: string[];
}

export interface FileExtractOptions {
  extractText?: boolean;
  extractMetadata?: boolean;
  maxExtractSize?: number;
}