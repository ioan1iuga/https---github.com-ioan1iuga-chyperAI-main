import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useAuth } from './AuthContext';
import { useAI } from './AIContext';
import { useProjects } from './ProjectsContext';
import { logger } from '../utils/errorHandling';
import AIApiClient from '../services/api/AIApiClient';
import GitHubIntegrationService from '../services/github/GitHubIntegrationService';
import CloudflareDeploymentService from '../services/deployment/CloudflareDeploymentService';
import FileProcessingService from '../services/fileProcessing/FileProcessingService';
import VoiceProcessingService from '../services/voiceProcessing/VoiceProcessingService';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  source: 'text' | 'voice' | 'file';
  timestamp: Date;
  status?: 'pending' | 'processed' | 'error';
  metadata?: Record<string, any>;
}

interface SessionState {
  id: string;
  title: string;
  messages: Message[];
  activeProjectId?: string;
  activeFileId?: string;
  metadata: Record<string, any>;
}

interface Command {
  name: string;
  description: string;
  syntax: string;
  handler: (args: string) => Promise<void>;
}

interface Assistant {
  id: string;
  name: string;
  type: string;
  capabilities: string[];
  isActive: boolean;
}

interface FileUpload {
  id: string;
  name: string;
  type: string;
  size: number;
  content?: string;
  url?: string;
  analysis?: Record<string, any>;
}

interface MasterChatContextType {
  session: SessionState | null;
  messages: Message[];
  isProcessing: boolean;
  isRecording: boolean;
  activeAssistant: Assistant | null;
  assistants: Assistant[];
  fileUploads: FileUpload[];
  
  // Session management
  createSession: () => void;
  loadSession: (id: string) => Promise<void>;
  clearSession: () => void;
  
  // Message handling
  sendMessage: (content: string, source?: 'text' | 'voice' | 'file') => Promise<void>;
  sendVoiceMessage: (audioBlob: Blob) => Promise<void>;
  uploadFile: (file: File) => Promise<void>;
  
  // Assistant management
  setActiveAssistant: (id: string) => void;
  createAssistant: (name: string, type: string) => Promise<void>;
  
  // Command handling
  executeCommand: (command: string, args?: string) => Promise<void>;
  getAvailableCommands: () => Command[];
  
  // Voice input/output
  startVoiceRecording: () => void;
  stopVoiceRecording: () => void;
  speakResponse: (text: string) => void;
  
  // GitHub integration
  createGitHubRepository: (name: string, isPrivate?: boolean) => Promise<string>;
  
  // Cloudflare deployment
  deployToCloudflare: (projectId: string, options?: any) => Promise<string>;
  
  // Project assistance
  createProjectFromPrompt: (prompt: string) => Promise<string>;
  
  // Route to specialized assistant
  routeToAssistant: (assistantId: string, contextData?: any) => Promise<void>;
}

const MasterChatContext = createContext<MasterChatContextType | undefined>(undefined);

export const useMasterChat = () => {
  const context = useContext(MasterChatContext);
  if (!context) {
    throw new Error('useMasterChat must be used within a MasterChatProvider');
  }
  return context;
};

export const MasterChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const { activeProvider, currentModel } = useAI();
  const { createProject } = useProjects();
  
  // State
  const [session, setSession] = useState<SessionState | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [activeAssistant, setActiveAssistantState] = useState<Assistant | null>(null);
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [fileUploads, setFileUploads] = useState<FileUpload[]>([]);
  const [availableCommands, setAvailableCommands] = useState<Command[]>([]);
  const [voiceRecordingStop, setVoiceRecordingStop] = useState<(() => void) | null>(null);
  
  // Initialize default session on mount
  useEffect(() => {
    if (isAuthenticated && !session) {
      createSession();
      loadAssistants();
      loadCommands();
    }
  }, [isAuthenticated]);

  /**
   * Create a new chat session
   */
  const createSession = () => {
    const newSession: SessionState = {
      id: uuidv4(),
      title: 'New Master Chat Session',
      messages: [
        {
          id: uuidv4(),
          role: 'assistant',
          content: `Hello${user?.email ? ' ' + user.email.split('@')[0] : ''}! I'm your AI orchestrator. I can help you build, deploy, and manage your applications.`,
          source: 'text',
          timestamp: new Date()
        }
      ],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    };
    
    setSession(newSession);
    logger.info('Created new master chat session');
  };

  /**
   * Load chat session by ID
   */
  const loadSession = async (id: string) => {
    try {
      setIsProcessing(true);
      
      // In a real implementation, this would fetch from Supabase
      // For now, we'll simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Create a dummy session if not found
      const loadedSession: SessionState = {
        id,
        title: 'Loaded Session',
        messages: [
          {
            id: uuidv4(),
            role: 'assistant',
            content: 'Welcome back! How can I assist you today?',
            source: 'text',
            timestamp: new Date()
          }
        ],
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      };
      
      setSession(loadedSession);
      logger.info('Loaded master chat session', { sessionId: id });
    } catch (error) {
      logger.error('Error loading chat session', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Clear current session
   */
  const clearSession = () => {
    setSession(null);
    logger.info('Cleared master chat session');
  };

  /**
   * Send a text message
   */
  const sendMessage = async (content: string, source: 'text' | 'voice' | 'file' = 'text') => {
    if (!session) return;
    
    try {
      setIsProcessing(true);
      
      // Create user message
      const userMessage: Message = {
        id: uuidv4(),
        role: 'user',
        content,
        source,
        timestamp: new Date()
      };
      
      // Add message to session
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, userMessage],
          metadata: {
            ...prev.metadata,
            updatedAt: new Date().toISOString()
          }
        };
      });
      
      // Check if it's a command
      if (content.startsWith('/')) {
        const [commandName, ...args] = content.slice(1).split(' ');
        await executeCommand(commandName, args.join(' '));
        setIsProcessing(false);
        return;
      }
      
      // Process message with AI
      await processMessageWithAI(content, source, userMessage.id);
    } catch (error) {
      logger.error('Error sending message', error);
      
      // Add error message
      if (session) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'system',
          content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
          source: 'text',
          timestamp: new Date(),
          status: 'error'
        };
        
        setSession(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...prev.messages, errorMessage]
          };
        });
      }
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Send a voice message
   */
  const sendVoiceMessage = async (audioBlob: Blob) => {
    try {
      // Process the audio
      const { url, duration } = await VoiceProcessingService.uploadVoiceRecording(audioBlob);
      
      // Transcribe the audio
      const { text, confidence } = await VoiceProcessingService.transcribeVoiceRecording(audioBlob);
      
      // Send the transcribed message
      await sendMessage(text, 'voice');
      
      logger.debug('Voice message processed', { duration, confidence });
    } catch (error) {
      logger.error('Error processing voice message', error);
      throw error;
    }
  };

  /**
   * Upload a file
   */
  const uploadFile = async (file: File) => {
    try {
      setIsProcessing(true);
      
      // Add file upload to state
      const fileId = uuidv4();
      
      setFileUploads(prev => [
        ...prev,
        {
          id: fileId,
          name: file.name,
          type: file.type,
          size: file.size
        }
      ]);
      
      // Process the file
      const processedFile = await FileProcessingService.processFileForAI(file);
      
      // Upload the file
      const { url, filePath } = await FileProcessingService.uploadFile(file);
      
      // Update file upload with content and URL
      setFileUploads(prev => prev.map(f => 
        f.id === fileId
          ? {
              ...f,
              content: typeof processedFile.content === 'string' ? processedFile.content : '[Binary content]',
              url,
              analysis: processedFile.metadata.analysis
            }
          : f
      ));
      
      // Create a file message
      const fileContent = `File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      
      // Add message about the file
      if (session) {
        const fileMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content: fileContent,
          source: 'file',
          timestamp: new Date(),
          metadata: {
            fileName: file.name,
            fileType: file.type,
            fileSize: file.size,
            filePath,
            url
          }
        };
        
        setSession(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...prev.messages, fileMessage]
          };
        });
        
        // Generate a response about the file
        await processFileWithAI(processedFile, fileMessage.id);
      }
    } catch (error) {
      logger.error('Error uploading file', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Process a message with AI
   */
  const processMessageWithAI = async (content: string, source: 'text' | 'voice' | 'file', messageId: string) => {
    if (!session) return;
    
    try {
      // Add a "thinking" message
      const thinkingMessageId = uuidv4();
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, {
            id: thinkingMessageId,
            role: 'assistant',
            content: 'Thinking...',
            source: 'text',
            timestamp: new Date(),
            status: 'pending'
          }]
        };
      });
      
      // In a real implementation, this would call the AI API
      // For now, we'll simulate a response
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate response based on input type
      let response = '';
      
      if (source === 'voice') {
        response = `I received your voice message: "${content}". How would you like me to proceed?`;
      } else if (source === 'file') {
        response = `I've processed your file and analyzed its contents. What would you like to do with it?`;
      } else {
        // Text input - analyze intent
        if (content.toLowerCase().includes('create') || content.toLowerCase().includes('new project')) {
          response = `I'd be happy to help you create a new project. What type of project would you like to create? For example:
          
1. A React frontend application
2. A Node.js backend API
3. A full-stack application
4. A static website`;
        } else if (content.toLowerCase().includes('deploy') || content.toLowerCase().includes('publish')) {
          response = `I can help you deploy your application. Which project would you like to deploy and where? I support:
          
1. Cloudflare Workers
2. GitHub Pages
3. Netlify`;
        } else if (content.toLowerCase().includes('github') || content.toLowerCase().includes('repository')) {
          response = `I can help you with GitHub integration. Would you like me to:
          
1. Create a new repository
2. Push your existing project to GitHub
3. Set up continuous deployment`;
        } else {
          response = `I understand you're asking about "${content}". I can help with:
          
- Creating new projects
- Writing and editing code
- Setting up GitHub repositories
- Deploying to Cloudflare Workers
- Managing your applications
          
What specific help do you need today?`;
        }
      }
      
      // Replace the thinking message with the actual response
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === thinkingMessageId 
              ? {
                  ...m,
                  content: response,
                  status: 'processed'
                }
              : m
          )
        };
      });
    } catch (error) {
      logger.error('Error processing message with AI', error);
      
      // Update the thinking message with an error
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === messageId 
              ? {
                  ...m,
                  content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
                  status: 'error'
                }
              : m
          )
        };
      });
    }
  };

  /**
   * Process a file with AI
   */
  const processFileWithAI = async (processedFile: { content: string; metadata: Record<string, any> }, messageId: string) => {
    if (!session) return;
    
    try {
      // Add a "thinking" message
      const thinkingMessageId = uuidv4();
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, {
            id: thinkingMessageId,
            role: 'assistant',
            content: 'Analyzing file...',
            source: 'text',
            timestamp: new Date(),
            status: 'pending'
          }]
        };
      });
      
      // In a real implementation, this would call the AI API
      // For now, we'll simulate file analysis
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate response based on file type
      let response = '';
      
      const fileType = processedFile.metadata.analysis?.type || 'unknown';
      const fileName = processedFile.metadata.fileName || 'file';
      
      if (fileType === 'code') {
        const language = processedFile.metadata.analysis?.language || 'unknown';
        response = `I've analyzed your ${language} code file "${fileName}". Would you like me to:
        
1. Explain what this code does
2. Suggest improvements or optimizations
3. Find potential bugs or security issues
4. Create tests for this code`;
      } else if (fileType === 'text') {
        response = `I've processed your text file "${fileName}". Would you like me to:
        
1. Summarize the content
2. Extract key information
3. Format or convert the content`;
      } else if (fileType === 'image') {
        response = `I've received your image file "${fileName}". While I can't view the content, I can help you:
        
1. Use this image in your project
2. Generate HTML/CSS to display it
3. Create alt text descriptions for accessibility`;
      } else {
        response = `I've processed your ${fileType} file "${fileName}". Let me know what you'd like to do with it.`;
      }
      
      // Replace the thinking message with the actual response
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === thinkingMessageId 
              ? {
                  ...m,
                  content: response,
                  status: 'processed',
                  metadata: {
                    fileAnalysis: processedFile.metadata.analysis
                  }
                }
              : m
          )
        };
      });
    } catch (error) {
      logger.error('Error processing file with AI', error);
      
      // Update the thinking message with an error
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: prev.messages.map(m => 
            m.id === messageId 
              ? {
                  ...m,
                  content: `Error processing file: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
                  status: 'error'
                }
              : m
          )
        };
      });
    }
  };

  /**
   * Load available assistants
   */
  const loadAssistants = async () => {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use hard-coded assistants
      const defaultAssistants: Assistant[] = [
        {
          id: 'code-assistant',
          name: 'Code Assistant',
          type: 'code',
          capabilities: ['code-generation', 'code-analysis', 'error-handling'],
          isActive: true
        },
        {
          id: 'deployment-assistant',
          name: 'Deployment Assistant',
          type: 'deploy',
          capabilities: ['deploy-cloudflare', 'deploy-github-pages'],
          isActive: true
        },
        {
          id: 'github-assistant',
          name: 'GitHub Assistant',
          type: 'github',
          capabilities: ['repo-create', 'repo-push', 'pr-create'],
          isActive: true
        }
      ];
      
      setAssistants(defaultAssistants);
      setActiveAssistantState(defaultAssistants[0]);
      
      logger.debug('Loaded assistants', { count: defaultAssistants.length });
    } catch (error) {
      logger.error('Error loading assistants', error);
    }
  };

  /**
   * Set active assistant
   */
  const setActiveAssistant = (id: string) => {
    const assistant = assistants.find(a => a.id === id);
    if (assistant) {
      setActiveAssistantState(assistant);
      logger.debug('Set active assistant', { id, name: assistant.name });
    }
  };

  /**
   * Create a new assistant
   */
  const createAssistant = async (name: string, type: string) => {
    try {
      // In a real implementation, this would create in Supabase
      const newAssistant: Assistant = {
        id: uuidv4(),
        name,
        type,
        capabilities: [],
        isActive: true
      };
      
      setAssistants(prev => [...prev, newAssistant]);
      
      logger.info('Created new assistant', { id: newAssistant.id, name, type });
      return newAssistant.id;
    } catch (error) {
      logger.error('Error creating assistant', error);
      throw error;
    }
  };

  /**
   * Load available commands
   */
  const loadCommands = async () => {
    try {
      // Define default commands
      const commands: Command[] = [
        {
          name: 'help',
          description: 'Show available commands',
          syntax: '/help',
          handler: async () => {
            if (!session) return;
            
            const helpContent = `
### Available Commands

* **/create** *framework* *project-name* - Create a new project
* **/github** *create* *repo-name* [*--private*] - Create a GitHub repository
* **/deploy** *project-name* [*--prod*] - Deploy a project to Cloudflare Workers
* **/help** - Show this help message

### Other Features

* 🎤 Use voice commands by clicking the microphone icon
* 📎 Upload files to include in your project
* 💻 Ask me to generate code, create files, or help with debugging
`;
            
            const helpMessage: Message = {
              id: uuidv4(),
              role: 'assistant',
              content: helpContent,
              source: 'text',
              timestamp: new Date()
            };
            
            setSession(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                messages: [...prev.messages, helpMessage]
              };
            });
          }
        },
        {
          name: 'create',
          description: 'Create a new project',
          syntax: '/create [framework] [project-name]',
          handler: async (args: string) => {
            if (!session) return;
            
            const argParts = args.split(' ');
            const framework = argParts[0] || 'react';
            const projectName = argParts[1] || `project-${Date.now().toString(36).substring(2, 7)}`;
            
            // Add a pending message
            const pendingMessageId = uuidv4();
            
            setSession(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                messages: [...prev.messages, {
                  id: pendingMessageId,
                  role: 'assistant',
                  content: `Creating a new ${framework} project named "${projectName}"...`,
                  source: 'text',
                  timestamp: new Date(),
                  status: 'pending'
                }]
              };
            });
            
            try {
              // Create the project
              const newProject = await createProject(
                projectName,
                `Project created via Master Chat with framework: ${framework}`,
                framework
              );
              
              // Update the message
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: prev.messages.map(m => 
                    m.id === pendingMessageId 
                      ? {
                          ...m,
                          content: `Successfully created a new ${framework} project named "${projectName}". You can now:
                          
1. Edit the project in the workbench
2. Deploy it to Cloudflare Workers
3. Create a GitHub repository for it`,
                          status: 'processed',
                          metadata: { projectId: newProject.id }
                        }
                      : m
                  ),
                  activeProjectId: newProject.id
                };
              });
              
              logger.info('Created project via command', { projectId: newProject.id, name: projectName });
            } catch (error) {
              logger.error('Error creating project', error);
              
              // Update the message with error
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: prev.messages.map(m => 
                    m.id === pendingMessageId 
                      ? {
                          ...m,
                          content: `Error creating project: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
                          status: 'error'
                        }
                      : m
                  )
                };
              });
            }
          }
        },
        {
          name: 'github',
          description: 'Interact with GitHub',
          syntax: '/github [create] [repo-name] [--private]',
          handler: async (args: string) => {
            if (!session) return;
            
            const argParts = args.split(' ');
            const action = argParts[0];
            
            if (action === 'create') {
              const repoName = argParts[1] || `repo-${Date.now().toString(36).substring(2, 7)}`;
              const isPrivate = args.includes('--private');
              
              // Add a pending message
              const pendingMessageId = uuidv4();
              
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: [...prev.messages, {
                    id: pendingMessageId,
                    role: 'assistant',
                    content: `Creating ${isPrivate ? 'private' : 'public'} GitHub repository "${repoName}"...`,
                    source: 'text',
                    timestamp: new Date(),
                    status: 'pending'
                  }]
                };
              });
              
              try {
                // Check if GitHub integration is set up
                if (!GitHubIntegrationService.isAuthenticated()) {
                  throw new Error('GitHub integration is not set up. Please add your GitHub token in Settings.');
                }
                
                // Create the repository
                const repoUrl = await createGitHubRepository(repoName, isPrivate);
                
                // Update the message
                setSession(prev => {
                  if (!prev) return null;
                  
                  return {
                    ...prev,
                    messages: prev.messages.map(m => 
                      m.id === pendingMessageId 
                        ? {
                            ...m,
                            content: `Successfully created ${isPrivate ? 'private' : 'public'} GitHub repository "${repoName}".`,
                            status: 'processed',
                            metadata: { repoUrl }
                          }
                        : m
                    )
                  };
                });
                
                logger.info('Created GitHub repository via command', { repoName, isPrivate });
              } catch (error) {
                logger.error('Error creating GitHub repository', error);
                
                // Update the message with error
                setSession(prev => {
                  if (!prev) return null;
                  
                  return {
                    ...prev,
                    messages: prev.messages.map(m => 
                      m.id === pendingMessageId 
                        ? {
                            ...m,
                            content: `Error creating GitHub repository: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
                            status: 'error'
                          }
                        : m
                    )
                  };
                });
              }
            } else {
              // Unknown GitHub command
              const helpMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Unknown GitHub command. Available GitHub commands: `/github create [repo-name] [--private]`',
                source: 'text',
                timestamp: new Date()
              };
              
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: [...prev.messages, helpMessage]
                };
              });
            }
          }
        },
        {
          name: 'deploy',
          description: 'Deploy a project',
          syntax: '/deploy [project-name] [--prod]',
          handler: async (args: string) => {
            if (!session) return;
            
            const argParts = args.split(' ');
            const projectId = argParts[0] || (session.activeProjectId || '');
            const isProd = args.includes('--prod');
            
            if (!projectId) {
              const errorMessage: Message = {
                id: uuidv4(),
                role: 'assistant',
                content: 'Error: No project specified for deployment. Please specify a project ID or name.',
                source: 'text',
                timestamp: new Date(),
                status: 'error'
              };
              
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: [...prev.messages, errorMessage]
                };
              });
              
              return;
            }
            
            // Add a pending message
            const pendingMessageId = uuidv4();
            
            setSession(prev => {
              if (!prev) return null;
              
              return {
                ...prev,
                messages: [...prev.messages, {
                  id: pendingMessageId,
                  role: 'assistant',
                  content: `Deploying project "${projectId}" to ${isProd ? 'production' : 'development'}...`,
                  source: 'text',
                  timestamp: new Date(),
                  status: 'pending'
                }]
              };
            });
            
            try {
              // Check if Cloudflare integration is set up
              if (!CloudflareDeploymentService.isAuthenticated()) {
                throw new Error('Cloudflare integration is not set up. Please add your Cloudflare API token in Settings.');
              }
              
              // Deploy the project
              const deploymentUrl = await deployToCloudflare(projectId, { environment: isProd ? 'production' : 'development' });
              
              // Update the message
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: prev.messages.map(m => 
                    m.id === pendingMessageId 
                      ? {
                          ...m,
                          content: `Successfully deployed project to ${isProd ? 'production' : 'development'}.`,
                          status: 'processed',
                          metadata: { deploymentUrl }
                        }
                      : m
                  )
                };
              });
              
              logger.info('Deployed project via command', { projectId, environment: isProd ? 'production' : 'development' });
            } catch (error) {
              logger.error('Error deploying project', error);
              
              // Update the message with error
              setSession(prev => {
                if (!prev) return null;
                
                return {
                  ...prev,
                  messages: prev.messages.map(m => 
                    m.id === pendingMessageId 
                      ? {
                          ...m,
                          content: `Error deploying project: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
                          status: 'error'
                        }
                      : m
                  )
                };
              });
            }
          }
        }
      ];
      
      setAvailableCommands(commands);
      
      logger.debug('Loaded commands', { count: commands.length });
    } catch (error) {
      logger.error('Error loading commands', error);
    }
  };

  /**
   * Execute a command
   */
  const executeCommand = async (command: string, args: string = '') => {
    const cmd = availableCommands.find(c => c.name === command);
    
    if (cmd) {
      logger.debug('Executing command', { command, args });
      await cmd.handler(args);
    } else {
      // Unknown command
      if (session) {
        const errorMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: `Unknown command: /${command}. Type /help to see available commands.`,
          source: 'text',
          timestamp: new Date(),
          status: 'error'
        };
        
        setSession(prev => {
          if (!prev) return null;
          
          return {
            ...prev,
            messages: [...prev.messages, errorMessage]
          };
        });
      }
    }
  };

  /**
   * Get available commands
   */
  const getAvailableCommands = () => {
    return availableCommands;
  };

  /**
   * Start voice recording
   */
  const startVoiceRecording = () => {
    if (isRecording) return;
    
    try {
      setIsRecording(true);
      
      // Add recording message
      const recordingMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: 'Voice recording started... Speak clearly and I\'ll convert your speech to text.',
        source: 'text',
        timestamp: new Date()
      };
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, recordingMessage]
        };
      });
      
      // Start recording
      const stopRecording = VoiceProcessingService.startVoiceRecognition(
        // On result
        (transcript, confidence) => {
          if (confidence > 0.7) {
            // Stop recording when we get a good result
            stopVoiceRecording();
            
            // Send the transcribed message
            sendMessage(transcript, 'voice');
          }
        },
        // On error
        (error) => {
          logger.error('Voice recognition error', error);
          
          const errorMessage: Message = {
            id: uuidv4(),
            role: 'system',
            content: `Voice recognition error: ${error.message}`,
            source: 'text',
            timestamp: new Date(),
            status: 'error'
          };
          
          setSession(prev => {
            if (!prev) return null;
            
            return {
              ...prev,
              messages: [...prev.messages, errorMessage]
            };
          });
          
          setIsRecording(false);
        }
      );
      
      setVoiceRecordingStop(() => stopRecording);
      
      // Set a timeout to stop recording after 10 seconds
      setTimeout(() => {
        if (isRecording) {
          stopVoiceRecording();
        }
      }, 10000);
    } catch (error) {
      logger.error('Error starting voice recording', error);
      
      const errorMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Error starting voice recording: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        source: 'text',
        timestamp: new Date(),
        status: 'error'
      };
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, errorMessage]
        };
      });
      
      setIsRecording(false);
    }
  };

  /**
   * Stop voice recording
   */
  const stopVoiceRecording = () => {
    if (voiceRecordingStop) {
      voiceRecordingStop();
      setVoiceRecordingStop(null);
    }
    
    setIsRecording(false);
    logger.debug('Voice recording stopped');
  };

  /**
   * Speak response using text-to-speech
   */
  const speakResponse = (text: string) => {
    VoiceProcessingService.speakText(text);
  };

  /**
   * Create a GitHub repository
   */
  const createGitHubRepository = async (name: string, isPrivate: boolean = false): Promise<string> => {
    try {
      logger.info('Creating GitHub repository', { name, isPrivate });
      
      const repo = await GitHubIntegrationService.createRepository({
        name,
        private: isPrivate,
        description: `Repository created by ChyperAI Master Chat`,
        auto_init: true
      });
      
      return repo.html_url;
    } catch (error) {
      logger.error('Error creating GitHub repository', error);
      throw error;
    }
  };

  /**
   * Deploy to Cloudflare Workers
   */
  const deployToCloudflare = async (projectId: string, options: any = {}): Promise<string> => {
    try {
      logger.info('Deploying to Cloudflare Workers', { projectId });
      
      const result = await CloudflareDeploymentService.deployProject(
        projectId,
        options.entryPoint || 'src/index.js',
        options
      );
      
      if (!result.success) {
        throw new Error(result.error || 'Deployment failed');
      }
      
      return result.url;
    } catch (error) {
      logger.error('Error deploying to Cloudflare Workers', error);
      throw error;
    }
  };

  /**
   * Create a project from a prompt
   */
  const createProjectFromPrompt = async (prompt: string): Promise<string> => {
    try {
      logger.info('Creating project from prompt', { promptLength: prompt.length });
      
      // Extract project information from the prompt
      let framework = 'React';
      let projectName = `project-${Date.now().toString(36).substring(2, 7)}`;
      
      // Try to extract project type
      if (prompt.toLowerCase().includes('vue')) framework = 'Vue';
      if (prompt.toLowerCase().includes('angular')) framework = 'Angular';
      if (prompt.toLowerCase().includes('next.js') || prompt.toLowerCase().includes('next js')) framework = 'Next.js';
      
      // Try to extract project name
      const nameMatch = prompt.match(/called\s+["']?([a-zA-Z0-9_-]+)["']?/i);
      if (nameMatch) {
        projectName = nameMatch[1];
      }
      
      // Create the project
      const project = await createProject(
        projectName,
        `Project created from prompt: ${prompt.substring(0, 100)}${prompt.length > 100 ? '...' : ''}`,
        framework
      );
      
      return project.id;
    } catch (error) {
      logger.error('Error creating project from prompt', error);
      throw error;
    }
  };

  /**
   * Route a request to a specialized assistant
   */
  const routeToAssistant = async (assistantId: string, contextData: any = null) => {
    if (!session) return;
    
    try {
      logger.debug('Routing to assistant', { assistantId });
      
      // Set the active assistant
      setActiveAssistant(assistantId);
      
      // Add routing message
      const routingMessage: Message = {
        id: uuidv4(),
        role: 'system',
        content: `Routing to specialized assistant: ${assistants.find(a => a.id === assistantId)?.name || assistantId}`,
        source: 'text',
        timestamp: new Date()
      };
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, routingMessage]
        };
      });
      
      // In a real implementation, this would update the session with routing information
      // For now, we'll just add a message from the specialized assistant
      
      const assistantMessage: Message = {
        id: uuidv4(),
        role: 'assistant',
        content: `I'm the ${assistants.find(a => a.id === assistantId)?.name || 'specialized'} assistant. How can I help you with ${assistants.find(a => a.id === assistantId)?.type || 'specialized'} tasks?`,
        source: 'text',
        timestamp: new Date()
      };
      
      setSession(prev => {
        if (!prev) return null;
        
        return {
          ...prev,
          messages: [...prev.messages, assistantMessage]
        };
      });
    } catch (error) {
      logger.error('Error routing to assistant', error);
      throw error;
    }
  };
  
  // Context value
  const contextValue: MasterChatContextType = {
    session,
    messages: session?.messages || [],
    isProcessing,
    isRecording,
    activeAssistant,
    assistants,
    fileUploads,
    
    createSession,
    loadSession,
    clearSession,
    
    sendMessage,
    sendVoiceMessage,
    uploadFile,
    
    setActiveAssistant,
    createAssistant,
    
    executeCommand,
    getAvailableCommands,
    
    startVoiceRecording,
    stopVoiceRecording,
    speakResponse,
    
    createGitHubRepository,
    deployToCloudflare,
    
    createProjectFromPrompt,
    routeToAssistant
  };

  return (
    <MasterChatContext.Provider value={contextValue}>
      {children}
    </MasterChatContext.Provider>
  );
};

export default MasterChatContext;