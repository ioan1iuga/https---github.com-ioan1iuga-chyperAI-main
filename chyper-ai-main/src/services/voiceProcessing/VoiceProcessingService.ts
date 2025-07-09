import { logger } from '../../utils/errorHandling';

interface VoiceRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
  onInterimResult?: (transcript: string, isFinal: boolean) => void;
}

interface VoiceSynthesisOptions {
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: any) => void;
}

class VoiceProcessingService {
  private recognition: SpeechRecognition | null = null;
  private isRecording: boolean = false;
  private voices: SpeechSynthesisVoice[] = [];
  private preferredVoice: string | null = null;
  
  constructor() {
    // Initialize voice recognition and synthesis
    this.initVoiceRecognition();
    this.initVoiceSynthesis();
  }
  
  /**
   * Initialize speech recognition capability
   */
  private initVoiceRecognition(): void {
    if (typeof window !== 'undefined') {
      try {
        // Check for browser support
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (SpeechRecognition) {
          this.recognition = new SpeechRecognition();
          logger.info('Voice recognition initialized');
        } else {
          logger.warn('Speech recognition not supported in this browser');
        }
      } catch (error) {
        logger.error('Error initializing voice recognition', error);
      }
    }
  }
  
  /**
   * Initialize speech synthesis capability
   */
  private initVoiceSynthesis(): void {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        // Load available voices
        const loadVoices = () => {
          this.voices = window.speechSynthesis.getVoices();
          
          // Try to select a preferred voice (English, female)
          const preferredVoices = this.voices.filter(voice => 
            voice.lang.startsWith('en') && voice.name.includes('Female')
          );
          
          if (preferredVoices.length > 0) {
            this.preferredVoice = preferredVoices[0].name;
          } else if (this.voices.length > 0) {
            this.preferredVoice = this.voices[0].name;
          }
          
          logger.debug('Voice synthesis initialized', { 
            voicesCount: this.voices.length,
            preferredVoice: this.preferredVoice 
          });
        };
        
        // Chrome loads voices asynchronously
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
          window.speechSynthesis.onvoiceschanged = loadVoices;
        }
        
        // Initial load of voices
        loadVoices();
      } catch (error) {
        logger.error('Error initializing voice synthesis', error);
      }
    } else {
      logger.warn('Speech synthesis not supported in this browser');
    }
  }
  
  /**
   * Check if voice recognition is supported
   */
  isVoiceRecognitionSupported(): boolean {
    return !!this.recognition;
  }
  
  /**
   * Check if voice synthesis is supported
   */
  isVoiceSynthesisSupported(): boolean {
    return typeof window !== 'undefined' && !!window.speechSynthesis;
  }
  
  /**
   * Start voice recognition
   * @returns A function to stop the recording
   */
  startVoiceRecognition(
    onResult: (transcript: string, confidence: number) => void,
    onError: (error: Error) => void,
    options: VoiceRecognitionOptions = {}
  ): () => void {
    if (!this.recognition) {
      onError(new Error('Speech recognition not supported in this browser'));
      return () => {}; // Return empty stop function
    }
    
    if (this.isRecording) {
      this.stopVoiceRecognition();
    }
    
    try {
      // Configure recognition
      this.recognition.continuous = options.continuous ?? true;
      this.recognition.interimResults = options.interimResults ?? true;
      this.recognition.lang = options.lang ?? 'en-US';
      
      // Set event handlers
      this.recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
            onResult(finalTranscript, confidence);
          } else {
            interimTranscript += transcript;
            if (options.onInterimResult) {
              options.onInterimResult(interimTranscript, false);
            }
          }
        }
      };
      
      this.recognition.onerror = (event) => {
        logger.error('Voice recognition error', { error: event.error });
        onError(new Error(`Speech recognition error: ${event.error}`));
      };
      
      this.recognition.onstart = () => {
        this.isRecording = true;
        logger.debug('Voice recognition started');
      };
      
      this.recognition.onend = () => {
        this.isRecording = false;
        logger.debug('Voice recognition ended');
      };
      
      // Start recognition
      this.recognition.start();
      
      // Return stop function
      return () => this.stopVoiceRecognition();
    } catch (error) {
      logger.error('Error starting voice recognition', error);
      onError(error instanceof Error ? error : new Error('Unknown error starting voice recognition'));
      return () => {}; // Return empty stop function
    }
  }
  
  /**
   * Stop voice recognition
   */
  stopVoiceRecognition(): void {
    if (this.recognition && this.isRecording) {
      try {
        this.recognition.stop();
        this.isRecording = false;
        logger.debug('Voice recognition stopped');
      } catch (error) {
        logger.error('Error stopping voice recognition', error);
      }
    }
  }
  
  /**
   * Speak text using speech synthesis
   */
  speakText(text: string, options: VoiceSynthesisOptions = {}): void {
    if (!this.isVoiceSynthesisSupported()) {
      logger.warn('Speech synthesis not supported in this browser');
      if (options.onError) {
        options.onError(new Error('Speech synthesis not supported'));
      }
      return;
    }
    
    try {
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      
      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice if specified or use preferred voice
      if (options.voice) {
        const selectedVoice = this.voices.find(v => v.name === options.voice);
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
      } else if (this.preferredVoice) {
        const defaultVoice = this.voices.find(v => v.name === this.preferredVoice);
        if (defaultVoice) {
          utterance.voice = defaultVoice;
        }
      }
      
      // Set other options
      if (options.rate !== undefined) utterance.rate = options.rate;
      if (options.pitch !== undefined) utterance.pitch = options.pitch;
      if (options.volume !== undefined) utterance.volume = options.volume;
      
      // Set event handlers
      if (options.onStart) utterance.onstart = options.onStart;
      if (options.onEnd) utterance.onend = options.onEnd;
      if (options.onError) utterance.onerror = options.onError;
      
      // Speak the text
      window.speechSynthesis.speak(utterance);
      logger.debug('Speaking text', { textLength: text.length });
    } catch (error) {
      logger.error('Error speaking text', error);
      if (options.onError) {
        options.onError(error);
      }
    }
  }
  
  /**
   * Get list of available voices
   */
  getAvailableVoices(): SpeechSynthesisVoice[] {
    if (this.isVoiceSynthesisSupported()) {
      this.voices = window.speechSynthesis.getVoices();
      return this.voices;
    }
    return [];
  }
  
  /**
   * Set preferred voice for speech synthesis
   */
  setPreferredVoice(voiceName: string): boolean {
    if (this.isVoiceSynthesisSupported()) {
      const voices = this.getAvailableVoices();
      const voice = voices.find(v => v.name === voiceName);
      
      if (voice) {
        this.preferredVoice = voiceName;
        localStorage.setItem('preferred_voice', voiceName);
        logger.debug('Preferred voice set', { voice: voiceName });
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Upload voice recording to storage
   */
  async uploadVoiceRecording(
    audioBlob: Blob,
    fileName: string = `recording-${Date.now()}.webm`
  ): Promise<{ url: string; duration: number }> {
    try {
      // In a real implementation, this would upload the audio blob to storage
      // For now, we'll create an object URL and return it
      const url = URL.createObjectURL(audioBlob);
      
      // Get duration (approximation)
      const audio = new Audio();
      audio.src = url;
      
      const getDuration = () => new Promise<number>((resolve) => {
        audio.onloadedmetadata = () => {
          resolve(audio.duration);
        };
      });
      
      const duration = await getDuration();
      
      logger.debug('Voice recording prepared', { fileName, duration });
      
      return { url, duration };
    } catch (error) {
      logger.error('Error uploading voice recording', error);
      throw error;
    }
  }
  
  /**
   * Process voice recording with speech-to-text
   */
  async transcribeVoiceRecording(
    audioBlob: Blob
  ): Promise<{ text: string; confidence: number }> {
    try {
      // In a real implementation, this would send the audio to a speech-to-text service
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      logger.debug('Voice transcription completed');
      
      return {
        text: 'This is a simulated transcription of your voice recording.',
        confidence: 0.92
      };
    } catch (error) {
      logger.error('Error transcribing voice recording', error);
      throw error;
    }
  }
}

export default new VoiceProcessingService();