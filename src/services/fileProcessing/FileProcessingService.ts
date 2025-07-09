// File Processing Service for handling different file types
import { v4 as uuidv4 } from 'uuid';

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

export class FileProcessingService {
  private maxFileSize: number = 10 * 1024 * 1024; // 10MB default
  private textExtensions: string[] = ['txt', 'md', 'csv', 'tsv', 'log', 'xml', 'svg', 'html', 'htm', 'css', 'scss', 'less'];
  private documentExtensions: string[] = ['doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'odt', 'ods', 'odp', 'pages', 'numbers', 'key', 'pdf', 'rtf', 'tex'];
  private binaryDocumentExtensions: string[] = ['pdf', 'docx', 'pptx', 'xlsx', 'doc', 'ppt', 'xls', 'odt', 'ods', 'odp'];
  private imageExtensions: string[] = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg'];
  private audioExtensions: string[] = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a'];
  private videoExtensions: string[] = ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv'];
  private archiveExtensions: string[] = ['zip', 'rar', 'tar', 'gz', '7z', 'bz2', 'xz', 'iso'];
  private uploadBaseUrl: string = 'https://storage.chyper-ai.com/'; // Base URL for uploaded files
  
  private codeFileExtensions: Record<string, string[]> = {
    javascript: ['js', 'jsx', 'mjs', 'cjs'],
    typescript: ['ts', 'tsx', 'd.ts'],
    python: ['py', 'pyw', 'ipynb'],
    java: ['java', 'class', 'jar'],
    csharp: ['cs', 'csx'],
    cpp: ['cpp', 'cc', 'cxx', 'c++', 'h', 'hpp', 'hxx', 'h++'],
    c: ['c', 'h'],
    go: ['go'],
    rust: ['rs'],
    ruby: ['rb'],
    php: ['php', 'phtml', 'php3', 'php4', 'php5', 'php7', 'phps'],
    swift: ['swift'],
    kotlin: ['kt', 'kts'],
    dart: ['dart'],
    scala: ['scala'],
    shell: ['sh', 'bash', 'zsh', 'fish'],
    sql: ['sql'],
    html: ['html', 'htm', 'xhtml'],
    css: ['css', 'scss', 'sass', 'less'],
    xml: ['xml', 'xsl', 'xsd', 'rss', 'svg', 'wsdl'],
    json: ['json', 'jsonl', 'geojson'],
    yaml: ['yml', 'yaml'],
    markdown: ['md', 'markdown'],
    graphql: ['graphql', 'gql'],
    terraform: ['tf', 'tfvars', 'hcl'],
    dockerfile: ['dockerfile'],
    makefile: ['makefile'],
    toml: ['toml'],
    ini: ['ini', 'cfg', 'conf'],
    env: ['env']
  };

  constructor(options?: { maxFileSize?: number }) {
    if (options?.maxFileSize) {
      this.maxFileSize = options.maxFileSize;
    }
  }

  /**
   * Process a file and extract its content and metadata
   */
  async processFile(file: File): Promise<ProcessedFile> {
    // Check file size first
    if (this.isFileTooLarge(file)) {
      throw new Error(`File is too large. Maximum size is ${this.maxFileSize / (1024 * 1024)}MB`);
    }

    const extension = this.getFileExtension(file.name);
    const mimeType = file.type || this.getMimeTypeFromExtension(extension);
    const isText = this.isTextFile(mimeType, extension);
    const isArchive = this.isArchiveFile(mimeType, extension);
    const isImage = this.isImageFile(mimeType, extension);
    const isAudio = this.isAudioFile(mimeType, extension);
    const isVideo = this.isVideoFile(mimeType, extension);
    const isDocument = this.isDocumentFile(mimeType, extension);
    const isBinaryDocument = this.isBinaryDocumentFile(extension);
    
    let content: string | ArrayBuffer;
    let metadata: ProcessedFile['metadata'] = {};
    
    try {
      if (isArchive) {
        // For archives, we'll extract and process the files inside
        const archiveContent = await this.readFileAsArrayBuffer(file);
        const extractedFiles = await this.extractCodeFilesFromArchive(archiveContent, extension);
        
        // For now, just return the archive info
        content = `Archive: ${file.name} (${extractedFiles.length} files extracted)`;
        metadata = {
          isLargeFile: file.size > this.maxFileSize / 2
        };
      } else if (isImage || isAudio || isVideo) {
        // For media files, we'll just store the file info
        content = `Media file: ${file.name} (${file.size} bytes)`;
        metadata = {
          isLargeFile: file.size > this.maxFileSize / 2
        };
      } else if (isBinaryDocument) {
        // For binary documents like PDFs, we'll extract text if possible
        const docContent = await this.readFileAsArrayBuffer(file);
        const extractedText = await this.extractTextFromDocument(docContent, extension);
        
        content = extractedText || `Document: ${file.name} (${file.size} bytes)`;
        metadata = {
          hasExtractedText: !!extractedText,
          isLargeFile: file.size > this.maxFileSize / 2
        };
      } else if (isText) {
        // For text files, read as text
        content = await this.readFileContent(file);
        
        // Analyze text content
        const analysis = this.analyzeTextContent(content as string);
        metadata = {
          wordCount: analysis.wordCount,
          lineCount: analysis.lineCount,
          charCount: analysis.charCount,
          isLargeFile: file.size > this.maxFileSize / 2
        };
      } else {
        // For other binary files, read as ArrayBuffer
        content = await this.readFileAsArrayBuffer(file);
        metadata = {
          isLargeFile: file.size > this.maxFileSize / 2
        };
      }
    } catch (error) {
      console.error('Error processing file:', error);
      throw new Error(`Error processing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Determine language for code files
    const language = this.detectLanguage(file.name, extension);

    // Generate a unique ID for the file
    const id = `${Date.now()}_${uuidv4().substring(0, 8)}`;
    
    // Create file path (could be customized based on project structure)
    const filePath = `uploads/${id}/${file.name}`;

    return {
      id,
      name: file.name,
      type: mimeType,
      size: file.size,
      content,
      language,
      extension,
      path: filePath,
      metadata
    };
  }

  /**
   * Process a file specifically for AI analysis
   */
  async processFileForAI(file: File): Promise<{
    content: string;
    metadata: {
      filename: string;
      language?: string;
      extension?: string;
      wordCount: number;
      lineCount: number;
      charCount: number;
    };
  }> {
    const processedFile = await this.processFile(file);
    
    // Ensure we have string content for AI
    let textContent: string;
    if (typeof processedFile.content === 'string') {
      textContent = processedFile.content;
    } else {
      // For binary content, we'll use a placeholder or extracted text
      textContent = processedFile.metadata?.hasExtractedText 
        ? processedFile.content.toString() 
        : '';
    }

    return {
      content: textContent,
      metadata: {
        filename: processedFile.name,
        language: processedFile.language,
        extension: processedFile.extension,
        wordCount: processedFile.metadata?.wordCount || 0,
        lineCount: processedFile.metadata?.lineCount || 0,
        charCount: processedFile.metadata?.charCount || 0
      }
    };
  }

  /**
   * Upload a file to storage and return the URL and file path
   */
  async uploadFile(file: File): Promise<{ url: string; filePath: string }> {
    try {
      // Generate a unique ID for the file
      const id = `${Date.now()}_${uuidv4().substring(0, 8)}`;
      
      // Create file path (could be customized based on project structure)
      const filePath = `uploads/${id}/${file.name}`;
      
      // In a real implementation, this would upload the file to a storage service
      // For now, we'll simulate a successful upload
      
      // Construct the URL where the file would be accessible
      const url = `${this.uploadBaseUrl}${filePath}`;
      
      console.log(`File uploaded: ${file.name} to ${filePath}`);
      
      return { url, filePath };
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyze a file to get statistics and metadata
   */
  async analyzeFile(file: File): Promise<FileAnalysisResult> {
    const extension = this.getFileExtension(file.name);
    const mimeType = file.type || this.getMimeTypeFromExtension(extension);
    
    const isText = this.isTextFile(mimeType, extension);
    const isCode = this.isCodeFile(extension);
    const isDocument = this.isDocumentFile(mimeType, extension);
    const isBinary = !isText;
    const isImage = this.isImageFile(mimeType, extension);
    const isAudio = this.isAudioFile(mimeType, extension);
    const isVideo = this.isVideoFile(mimeType, extension);
    const isArchive = this.isArchiveFile(mimeType, extension);
    const isLargeFile = this.isFileTooLarge(file);

    let wordCount = 0;
    let lineCount = 0;
    let charCount = 0;

    if (isText && !isLargeFile) {
      try {
        const content = await this.readFileContent(file);
        const analysis = this.analyzeTextContent(content);
        wordCount = analysis.wordCount;
        lineCount = analysis.lineCount;
        charCount = analysis.charCount;
      } catch (error) {
        console.error('Error analyzing file:', error);
      }
    }

    const language = this.detectLanguage(file.name, extension);

    return {
      wordCount,
      lineCount,
      charCount,
      language,
      extension,
      isBinary,
      isLargeFile,
      isCode,
      isDocument,
      isImage,
      isAudio,
      isVideo,
      isArchive
    };
  }

  /**
   * Read file content as text
   */
  private async readFileContent(file: File): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error('File content is not text'));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error('Error reading file'));
      };
      
      reader.readAsText(file);
    });
  }

  /**
   * Read file as ArrayBuffer
   */
  private async readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise<ArrayBuffer>((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        if (reader.result instanceof ArrayBuffer) {
          resolve(reader.result);
        } else {
          reject(new Error('File content is not an ArrayBuffer'));
        }
      };
      
      reader.onerror = () => {
        reject(reader.error || new Error('Error reading file'));
      };
      
      reader.readAsArrayBuffer(file);
    });
  }

  /**
   * Extract text from binary documents like PDFs
   */
  private async extractTextFromDocument(content: ArrayBuffer, extension: string): Promise<string> {
    // In a real implementation, this would use libraries like pdf.js for PDFs,
    // or mammoth.js for Word documents
    
    // For now, return a placeholder
    return '';
  }

  /**
   * Extract code files from archives
   */
  private async extractCodeFilesFromArchive(content: ArrayBuffer, extension: string): Promise<ProcessedFile[]> {
    // In a real implementation, this would use libraries like jszip
    
    // For now, return an empty array
    return [];
  }

  /**
   * Analyze text content to get statistics
   */
  private analyzeTextContent(content: string): { wordCount: number; lineCount: number; charCount: number } {
    const lines = content.split(/\r\n|\r|\n/);
    const lineCount = lines.length;
    const charCount = content.length;
    
    // Count words (simple implementation)
    const words = content.trim().split(/\s+/);
    const wordCount = words.length;
    
    return {
      wordCount,
      lineCount,
      charCount
    };
  }

  /**
   * Check if a file is too large to process
   */
  private isFileTooLarge(file: File): boolean {
    return file.size > this.maxFileSize;
  }

  /**
   * Get file extension from filename
   */
  private getFileExtension(filename: string): string {
    const parts = filename.split('.');
    if (parts.length === 1) {
      return '';
    }
    return parts[parts.length - 1].toLowerCase();
  }

  /**
   * Detect language based on file extension
   */
  private detectLanguage(filename: string, extension: string): string | undefined {
    // Check for special files without extensions
    if (!extension) {
      const lowerFilename = filename.toLowerCase();
      if (lowerFilename === 'dockerfile') return 'dockerfile';
      if (lowerFilename === 'makefile') return 'makefile';
      if (lowerFilename === '.env' || lowerFilename.endsWith('.env')) return 'env';
      return undefined;
    }
    
    // Check code file extensions
    for (const [language, extensions] of Object.entries(this.codeFileExtensions)) {
      if (extensions.includes(extension)) {
        return language;
      }
    }
    
    // Check other known extensions
    if (this.textExtensions.includes(extension)) {
      if (extension === 'md' || extension === 'markdown') return 'markdown';
      if (extension === 'csv' || extension === 'tsv') return 'csv';
      if (extension === 'xml' || extension === 'svg') return 'xml';
      if (extension === 'html' || extension === 'htm') return 'html';
      return 'text';
    }
    
    return undefined;
  }

  /**
   * Check if a file is a text file
   */
  private isTextFile(mimeType: string, extension: string): boolean {
    if (mimeType.startsWith('text/') || mimeType === 'application/json') return true;
    
    // Treat known binary-docs as *not* text
    if (this.binaryDocumentExtensions.includes(extension)) return false;
    
    // code & plain docs
    if (this.textExtensions.includes(extension)) return true;
    for (const exts of Object.values(this.codeFileExtensions)) {
      if (exts.includes(extension)) return true;
    }
    return false;
  }

  /**
   * Check if a file is a binary document file
   */
  private isBinaryDocumentFile(extension: string): boolean {
    return this.binaryDocumentExtensions.includes(extension);
  }

  /**
   * Check if a file is a document file
   */
  private isDocumentFile(mimeType: string, extension: string): boolean {
    if (mimeType.startsWith('application/vnd.openxmlformats-officedocument') ||
        mimeType.startsWith('application/vnd.ms-') ||
        mimeType === 'application/pdf') {
      return true;
    }
    
    return this.documentExtensions.includes(extension);
  }

  /**
   * Check if a file is an image
   */
  private isImageFile(mimeType: string, extension: string): boolean {
    if (mimeType.startsWith('image/')) return true;
    return this.imageExtensions.includes(extension);
  }

  /**
   * Check if a file is an audio file
   */
  private isAudioFile(mimeType: string, extension: string): boolean {
    if (mimeType.startsWith('audio/')) return true;
    return this.audioExtensions.includes(extension);
  }

  /**
   * Check if a file is a video file
   */
  private isVideoFile(mimeType: string, extension: string): boolean {
    if (mimeType.startsWith('video/')) return true;
    return this.videoExtensions.includes(extension);
  }

  /**
   * Check if a file is an archive
   */
  private isArchiveFile(mimeType: string, extension: string): boolean {
    if (mimeType.includes('zip') || 
        mimeType.includes('tar') || 
        mimeType.includes('compressed') || 
        mimeType.includes('archive')) {
      return true;
    }
    
    return this.archiveExtensions.includes(extension);
  }

  /**
   * Check if a file is a code file
   */
  private isCodeFile(extension: string): boolean {
    if (!extension) return false;
    
    // Check if the extension is in any of the code language arrays
    for (const extensions of Object.values(this.codeFileExtensions)) {
      if (extensions.includes(extension)) {
        return true;
      }
    }
    
    return false;
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(extension: string): string {
    const mimeMap: Record<string, string> = {
      // Text
      'txt': 'text/plain',
      'html': 'text/html',
      'htm': 'text/html',
      'css': 'text/css',
      'csv': 'text/csv',
      'md': 'text/markdown',
      'xml': 'text/xml',
      
      // Code
      'js': 'application/javascript',
      'jsx': 'application/javascript',
      'ts': 'application/typescript',
      'tsx': 'application/typescript',
      'json': 'application/json',
      'py': 'text/x-python',
      'java': 'text/x-java',
      'c': 'text/x-c',
      'cpp': 'text/x-c++',
      'cs': 'text/x-csharp',
      'go': 'text/x-go',
      'rs': 'text/x-rust',
      'rb': 'text/x-ruby',
      'php': 'text/x-php',
      
      // Documents
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'ppt': 'application/vnd.ms-powerpoint',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      
      // Images
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'svg': 'image/svg+xml',
      'webp': 'image/webp',
      
      // Audio
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav',
      'ogg': 'audio/ogg',
      
      // Video
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'avi': 'video/x-msvideo',
      
      // Archives
      'zip': 'application/zip',
      'rar': 'application/x-rar-compressed',
      'tar': 'application/x-tar',
      'gz': 'application/gzip',
      '7z': 'application/x-7z-compressed'
    };
    
    return mimeMap[extension] || 'application/octet-stream';
  }
}

export default new FileProcessingService();