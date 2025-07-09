import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  X,
  Mic,
  MicOff,
  Paperclip,
  Code,
  FileText,
  Zap,
  Upload,
  Download,
  Loader,
  Bot,
  Play,
  FilePlus2,
  RefreshCw,
  Github,
  CloudCog,
  Settings,
  Plus,
  Activity,
  XCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Workflow
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useEnhancedAuth } from '../contexts/EnhancedAuthContext';
import { useAI } from '../contexts/AIContext';
import { useProjects } from '../contexts/ProjectsContext';
import { useMasterChat } from '../contexts/MasterChatContext';
import AIApiClient from '../services/api/AIApiClient';
import { logger } from '../utils/errorHandling';
import { toastManager } from '../utils/toastManager';
import { useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  type: 'user' | 'agent' | 'system' | 'file' | 'voice';
  content: string;
  timestamp: Date;
  status?: 'pending' | 'processed' | 'error';
  metadata?: {
    filePath?: string;
    fileType?: string;
    fileName?: string;
    fileSize?: number;
    repoUrl?: string;
    deploymentUrl?: string;
    actionType?: string;
    workflowId?: string;
  };
}

interface WorkflowStatus {
  id: string;
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  steps: {
    id: string;
    name: string;
    status: 'pending' | 'in-progress' | 'completed' | 'failed';
    agentType: string;
  }[];
  progress: number;
}

const MasterChatAgentFull: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user, profile } = useEnhancedAuth();
  const { createSession } = useAI();
  const { projects, createProject } = useProjects();
  const { activeWorkflow, getWorkflowStatus, cancelWorkflow } = useMasterChat();
  const isDark = theme === 'dark';
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'agent',
      content: `Hello${profile?.name ? ' ' + profile.name : ''}! I'm your AI orchestrator. I can help you build, deploy, and manage your applications. You can:

1. Send me text instructions
2. Upload files or code
3. Use voice commands (click the microphone icon)

Tell me what you'd like to build or deploy today, or how I can help with your existing projects.`,
      timestamp: new Date()
    }
  ]);
  
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [activeSpeechRecognition, setActiveSpeechRecognition] = useState<{ stop: () => void } | null>(null);
  const [assistants, setAssistants] = useState<Array<{ id: string; name: string; type: string }>>([]);
  const [activeAssistantId, setActiveAssistantId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [localWorkflow, setLocalWorkflow] = useState<WorkflowStatus | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Update local workflow state when activeWorkflow changes
  useEffect(() => {
    if (activeWorkflow) {
      setLocalWorkflow(activeWorkflow);
    }
  }, [activeWorkflow]);
  
  // Poll for workflow status updates
  useEffect(() => {
    if (localWorkflow && (localWorkflow.status === 'pending' || localWorkflow.status === 'in-progress')) {
      const interval = setInterval(() => {
        const updatedStatus = getWorkflowStatus(localWorkflow.id);
        if (updatedStatus) {
          setLocalWorkflow(updatedStatus);
        }
      }, 2000);
      
      return () => clearInterval(interval);
    }
  }, [localWorkflow, getWorkflowStatus]);

  // Initialize assistants when user is loaded
  useEffect(() => {
    if (user) {
      // In a real implementation, fetch assistants from API
      const defaultAssistants = [
        { id: 'code-assistant', name: 'Code Assistant', type: 'code' },
        { id: 'deploy-assistant', name: 'Deployment Assistant', type: 'deploy' },
        { id: 'github-assistant', name: 'GitHub Assistant', type: 'github' },
      ];
      setAssistants(defaultAssistants);
      setActiveAssistantId('code-assistant');
    }
  }, [user]);

  const handleSendMessage = async () => {
    if (!input.trim() && !isGeneratingCode) return;
    
    const messageText = input.trim();
    setInput('');
    
    // Add user message to chat
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageText,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsProcessing(true);

    try {
      // Process message with AI
      logger.info('Processing user message', { messageLength: messageText.length });
      
      // Determine if message is a command
      const commandMatch = messageText.match(/^\/(\w+)\s*(.*)?$/);
      
      if (commandMatch) {
        await handleCommand(commandMatch[1], commandMatch[2]);
      } else {
        // Regular message - process with AI
        await processWithAI(messageText);
        
        // Check if the response contains a workflow ID
        const lastMessage = messages[messages.length - 1];
        if (lastMessage?.metadata?.workflowId) {
          const workflowStatus = getWorkflowStatus(lastMessage.metadata.workflowId);
          if (workflowStatus) {
            setLocalWorkflow(workflowStatus);
          }
        }
      }
    } catch (error) {
      logger.error('Error processing message', error);
      
      // Add error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        type: 'system',
        content: `Error: ${error instanceof Error ? error.message : 'An unexpected error occurred'}`,
        timestamp: new Date(),
        status: 'error'
      };
      
      setMessages(prev => [...prev, errorMessage]);
      toastManager.error('Failed to process message');
    } finally {
      setIsProcessing(false);
    }
  };

  const processWithAI = async (message: string) => {
    // First, analyze the message to determine the intent
    setIsGeneratingCode(true);
    
    try {
      // Add a "thinking" message
      const thinkingMessageId = Date.now().toString();
      setMessages(prev => [...prev, {
        id: thinkingMessageId,
        type: 'agent',
        content: 'Thinking...',
        timestamp: new Date(),
        status: 'pending'
      }]);

      // In a production implementation, this would call the AI API
      const intentAnalysisPrompt = `
        Analyze the following user message to determine the intent:
        
        User Message: ${message}
        
        Classify into one of these categories:
        1. Create a new project
        2. Modify existing code
        3. Deploy application
        4. GitHub integration
        5. General question
        
        Also extract any key parameters like:
        - Project type/framework
        - File paths
        - Environment information
        - Repository details
      `;

      // Simulate AI processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Determine intent based on message content
      let intent = 'unknown';
      let responseContent = '';
      
      if (message.toLowerCase().includes('create') || message.toLowerCase().includes('new project') || message.toLowerCase().includes('build')) {
        intent = 'create-project';
        
        // Extract project type if mentioned
        let framework = 'React';
        if (message.toLowerCase().includes('vue')) framework = 'Vue';
        if (message.toLowerCase().includes('angular')) framework = 'Angular';
        if (message.toLowerCase().includes('next') || message.toLowerCase().includes('next.js')) framework = 'Next.js';
        
        // Create a new project
        const projectName = message.toLowerCase().includes('called') 
          ? message.split('called')[1].trim().split(' ')[0]
          : `Project-${Date.now().toString(36).substring(2, 7)}`;
        
        // Create project
        try {
          const newProject = await createProject(
            projectName,
            `Project created from Master Chat: ${message}`,
            framework
          );
          
          responseContent = `I've created a new ${framework} project named "${projectName}" for you. Would you like me to:
          
1. Set up the initial file structure
2. Initialize with a basic component
3. Configure deployment settings
4. Create a GitHub repository for this project

Let me know what you'd like to do next!`;
          
          // Create a new AI session for this project
          createSession(newProject.id, `${framework} Development Session`);
          
        } catch (error) {
          logger.error('Error creating project', error);
          responseContent = `I encountered an error while trying to create your project: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again or provide more details.`;
        }
      } else if (message.toLowerCase().includes('github') || message.toLowerCase().includes('repository') || message.toLowerCase().includes('repo')) {
        intent = 'github-integration';
        responseContent = `I'll help you with GitHub integration. To create a repository for your project, I'll need:

1. Repository name (or I can use your project name)
2. Whether it should be public or private
3. Any specific initialization options (README, .gitignore, license)

Would you like me to proceed with creating a GitHub repository? If you already have a GitHub token set up, I can do this right away.`;
      } else if (message.toLowerCase().includes('deploy') || message.toLowerCase().includes('publish') || message.toLowerCase().includes('cloudflare')) {
        intent = 'deploy';
        responseContent = `I'll help you deploy your application to Cloudflare Workers. To proceed, I'll need:

1. Which project you want to deploy
2. Any environment variables to configure
3. Domain settings (if applicable)

Would you like me to deploy your project to production or create a preview deployment?`;
      } else if (message.toLowerCase().includes('edit') || message.toLowerCase().includes('modify') || message.toLowerCase().includes('update') || message.toLowerCase().includes('fix')) {
        intent = 'modify-code';
        responseContent = `I'll help you modify your code. Please let me know:

1. Which project and file(s) you want to modify
2. What changes you want to make
3. Any specific requirements or constraints

You can also upload files directly if that's easier.`;
      } else {
        intent = 'general';
        responseContent = `I understand you're asking about "${message.slice(0, 50)}...". I can help you with:

- Creating new projects
- Writing and editing code
- Setting up GitHub repositories
- Deploying to Cloudflare Workers
- Managing your applications

What specific assistance do you need today?`;
      }

      // Replace the thinking message with the actual response
      setMessages(prev => prev.map(m => 
        m.id === thinkingMessageId 
          ? {
              ...m,
              content: responseContent,
              status: 'processed',
              metadata: { actionType: intent }
            }
          : m
      ));
      
    } catch (error) {
      logger.error('Error generating code response', error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Error generating response: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date(),
        status: 'error'
      }]);
    } finally {
      setIsGeneratingCode(false);
    }
  };
  
  const handleCommand = async (command: string, args: string) => {
    logger.info('Processing command', { command, args });
    
    switch (command.toLowerCase()) {
      case 'github':
        await handleGitHubCommand(args);
        break;
      case 'deploy':
        await handleDeployCommand(args);
        break;
      case 'create':
        await handleCreateCommand(args);
        break;
      case 'help':
        addHelpMessage();
        break;
      default:
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: `Unknown command: /${command}. Type /help to see available commands.`,
          timestamp: new Date()
        }]);
    }
  };

  const handleGitHubCommand = async (args: string) => {
    // Parse arguments (e.g., /github create myrepo --private)
    const createMatch = args.match(/create\s+([^\s]+)(?:\s+--([^\s]+))?/);
    
    if (createMatch) {
      const repoName = createMatch[1];
      const visibility = createMatch[2] === 'private' ? 'private' : 'public';
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Creating GitHub repository: ${repoName} (${visibility})...`,
        timestamp: new Date(),
        status: 'pending'
      }]);
      
      // Simulate repository creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const repoUrl = `https://github.com/user/${repoName}`;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Repository created successfully! You can access it at ${repoUrl}`,
        timestamp: new Date(),
        status: 'processed',
        metadata: { repoUrl }
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Invalid GitHub command syntax. Try: /github create repo-name [--private]`,
        timestamp: new Date()
      }]);
    }
  };

  const handleDeployCommand = async (args: string) => {
    // Parse arguments (e.g., /deploy my-project --prod)
    const deployMatch = args.match(/([^\s]+)(?:\s+--([^\s]+))?/);
    
    if (deployMatch) {
      const projectName = deployMatch[1];
      const environment = deployMatch[2] === 'prod' ? 'production' : 'preview';
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Deploying ${projectName} to ${environment}...`,
        timestamp: new Date(),
        status: 'pending'
      }]);
      
      // Simulate deployment
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const deploymentUrl = `https://${projectName}-${Date.now().toString(36).substring(2, 7)}.workers.dev`;
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Deployment successful! Your application is now live at ${deploymentUrl}`,
        timestamp: new Date(),
        status: 'processed',
        metadata: { deploymentUrl }
      }]);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Invalid deploy command syntax. Try: /deploy project-name [--prod]`,
        timestamp: new Date()
      }]);
    }
  };

  const handleCreateCommand = async (args: string) => {
    // Parse arguments (e.g., /create react-app my-project)
    const createMatch = args.match(/([^\s]+)\s+([^\s]+)/);
    
    if (createMatch) {
      const framework = createMatch[1];
      const projectName = createMatch[2];
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'agent',
        content: `Creating ${framework} project: ${projectName}...`,
        timestamp: new Date(),
        status: 'pending'
      }]);
      
      try {
        // Create project
        const newProject = await createProject(
          projectName,
          `Project created from Master Chat using /${framework} template`,
          framework
        );
        
        // Create a new AI session for this project
        createSession(newProject.id, `${framework} Development Session`);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'agent',
          content: `Project ${projectName} created successfully! You can now edit it in the workbench or deploy it to Cloudflare Workers.`,
          timestamp: new Date(),
          status: 'processed'
        }]);
      } catch (error) {
        logger.error('Error creating project', error);
        
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          type: 'system',
          content: `Error creating project: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date(),
          status: 'error'
        }]);
      }
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Invalid create command syntax. Try: /create framework project-name`,
        timestamp: new Date()
      }]);
    }
  };

  const addHelpMessage = () => {
    const helpContent = `
### Available Commands:

* **/create** *framework* *project-name* - Create a new project
* **/github** *create* *repo-name* [*--private*] - Create a GitHub repository
* **/deploy** *project-name* [*--prod*] - Deploy a project to Cloudflare Workers
* **/help** - Show this help message

### Other Features:

* 🎤 Click the microphone icon to use voice commands
* 📎 Upload files to include in your project
* 💻 Ask me to generate code, create files, or help with debugging
`;
    
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'agent',
      content: helpContent,
      timestamp: new Date()
    }]);
  };

  const handleStartVoiceRecording = () => {
    if (isRecording) return;
    
    try {
      setIsRecording(true);
      
      // Add recording message
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Voice recording started... Speak clearly and I\'ll convert your speech to text.',
        timestamp: new Date()
      }]);
      
      const recognition = AIApiClient.startVoiceRecognition(
        // On result callback
        (transcript) => {
          setInput(transcript);
        },
        // On error callback
        (error) => {
          logger.error('Voice recognition error', error);
          setMessages(prev => [...prev, {
            id: Date.now().toString(),
            type: 'system',
            content: `Voice recognition error: ${error.message}`,
            timestamp: new Date(),
            status: 'error'
          }]);
          setIsRecording(false);
        }
      );
      
      setActiveSpeechRecognition(recognition);
      
    } catch (error) {
      logger.error('Failed to start voice recording', error);
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: `Failed to start voice recording: ${error instanceof Error ? error.message : 'Your browser may not support this feature'}`,
        timestamp: new Date(),
        status: 'error'
      }]);
      
      setIsRecording(false);
    }
  };

  const handleStopVoiceRecording = () => {
    if (!isRecording || !activeSpeechRecognition) return;
    
    // Stop recording
    activeSpeechRecognition.stop();
    setActiveSpeechRecognition(null);
    setIsRecording(false);
    
    // Add voice message if input has content
    if (input.trim()) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'voice',
        content: input,
        timestamp: new Date()
      }]);
      
      // Process the message
      const messageToProcess = input;
      setInput('');
      processWithAI(messageToProcess);
    } else {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        type: 'system',
        content: 'Voice recording stopped. No speech detected.',
        timestamp: new Date()
      }]);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    // Process each file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Add file message
      const fileMessageId = Date.now().toString() + i;
      setMessages(prev => [...prev, {
        id: fileMessageId,
        type: 'file',
        content: `Uploading file: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        timestamp: new Date(),
        status: 'pending',
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type
        }
      }]);
      
      try {
        // Read file content
        const content = await readFileContent(file);
        
        // Update file message
        setMessages(prev => prev.map(m => 
          m.id === fileMessageId 
            ? {
                ...m,
                content: `File uploaded: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
                status: 'processed'
              }
            : m
        ));
        
        // Add agent response about the file
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '_response',
          type: 'agent',
          content: getFileAnalysisResponse(file, content),
          timestamp: new Date()
        }]);
        
      } catch (error) {
        logger.error('Error processing file', error);
        
        // Update file message with error
        setMessages(prev => prev.map(m => 
          m.id === fileMessageId 
            ? {
                ...m,
                content: `Error uploading file: ${file.name} - ${error instanceof Error ? error.message : 'Unknown error'}`,
                status: 'error'
              }
            : m
        ));
      }
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const readFileContent = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        if (e.target?.result) {
          resolve(e.target.result as string);
        } else {
          reject(new Error('Failed to read file'));
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Error reading file'));
      };
      
      if (file.type.startsWith('text') || file.type === 'application/json' || file.name.match(/\.(js|jsx|ts|tsx|html|css|md|json|yml|yaml|xml)$/i)) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    });
  };

  const getFileAnalysisResponse = (file: File, content: string): string => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    // Different responses based on file type
    if (fileExtension === 'json') {
      return `I've received your JSON file. Would you like me to:
      
1. Analyze the JSON structure
2. Convert it to another format
3. Use it to create a new project configuration`;
    } else if (['js', 'jsx', 'ts', 'tsx'].includes(fileExtension || '')) {
      return `I've received your ${fileExtension?.toUpperCase()} file. Would you like me to:
      
1. Review the code for improvements or bugs
2. Explain how it works
3. Transform or modify the code
4. Create unit tests for it`;
    } else if (['jpg', 'jpeg', 'png', 'gif', 'svg'].includes(fileExtension || '')) {
      return `I've received your image file. While I can't view the content, I can help you:
      
1. Use this image in your project
2. Create HTML/CSS to display it
3. Generate alt text descriptions for accessibility`;
    } else {
      return `I've received your ${fileExtension?.toUpperCase() || 'file'}. Let me know what you'd like to do with it, such as:
      
1. Include it in a project
2. Analyze its contents
3. Transform it to another format`;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessage = (message: Message) => {
    const isUser = message.type === 'user' || message.type === 'voice';
    const isSystem = message.type === 'system';
    const isFile = message.type === 'file';
    const isPending = message.status === 'pending';
    const hasWorkflow = message.metadata?.workflowId && !isUser;
    
    return (
      <div
        key={message.id}
        className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'} mb-4 animate-fadeIn`}
      >
        {!isUser && !isSystem && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
            <Bot size={16} className="text-white" />
          </div>
        )}
        
        <div className={`max-w-2xl ${isUser ? 'order-first' : ''}`}>
          <div className={`rounded-xl px-4 py-3 ${
            isUser
              ? 'bg-blue-600 text-white rounded-br-none'
              : isSystem
                ? isDark
                  ? 'bg-yellow-600/20 text-yellow-200 border border-yellow-800/50'
                  : 'bg-yellow-50 text-yellow-800 border border-yellow-200'
                : isFile
                  ? isDark
                    ? 'bg-green-600/20 text-green-200 border border-green-800/50'
                    : 'bg-green-50 text-green-800 border border-green-200'
                  : isDark
                    ? 'bg-gray-800 text-white rounded-bl-none'
                    : 'bg-gray-100 text-gray-800 rounded-bl-none'
          }`}>
            {isPending ? (
              <div className="flex items-center gap-2">
                <Loader size={16} className="animate-spin" />
                <span>{message.content}</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap break-words overflow-hidden">
                {/* Render message content with markdown-like formatting */}
                {isFile ? (
                  <div className="flex items-center gap-2">
                    <FileText size={16} />
                    <span>{message.content}</span>
                  </div>
                ) : message.type === 'voice' ? (
                  <div className="flex items-center gap-2">
                    <Mic size={16} />
                    <span>{message.content}</span>
                  </div>
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {message.content.split('\n').map((line, i) => {
                      // Check if line is a markdown heading
                      if (line.startsWith('###')) {
                        return <h3 key={i} className="text-base font-semibold mt-3 mb-2">{line.replace(/^###\s*/, '')}</h3>;
                      } else if (line.startsWith('*') && line.endsWith('*')) {
                        // Bold text
                        return <p key={i} className="font-bold">{line.replace(/^\*/, '').replace(/\*$/, '')}</p>;
                      } else if (line.startsWith('* ')) {
                        // Bullet point
                        return <p key={i} className="ml-2">• {line.replace(/^\*\s*/, '')}</p>;
                      } else {
                        return <p key={i}>{line}</p>;
                      }
                    })}
                  </div>
                )}
                
                {/* Render metadata actions if present */}
                {message.metadata?.repoUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={message.metadata.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      <Github size={12} />
                      <span>View Repository</span>
                    </a>
                  </div>
                )}
                
                {message.metadata?.deploymentUrl && (
                  <div className="mt-2 flex items-center gap-2">
                    <a
                      href={message.metadata.deploymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
                      } transition-colors`}
                    >
                      <Play size={12} />
                      <span>View Deployment</span>
                    </a>
                  </div>
                )}
                
                {/* Render workflow status if this message has a workflow */}
                {hasWorkflow && localWorkflow && message.metadata?.workflowId === localWorkflow.id && (
                  <div className="mt-3 border-t pt-2 border-gray-700/30">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Workflow size={14} className="text-blue-400" />
                        <span className="font-medium text-sm">Workflow: {localWorkflow.name.length > 30 ? localWorkflow.name.substring(0, 30) + '...' : localWorkflow.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {localWorkflow.status === 'pending' && <Clock size={14} className="text-yellow-400" />}
                        {localWorkflow.status === 'in-progress' && <Activity size={14} className="text-blue-400" />}
                        {localWorkflow.status === 'completed' && <CheckCircle2 size={14} className="text-green-400" />}
                        {localWorkflow.status === 'failed' && <AlertCircle size={14} className="text-red-400" />}
                        <span className="text-xs capitalize">{localWorkflow.status}</span>
                        
                        {(localWorkflow.status === 'pending' || localWorkflow.status === 'in-progress') && (
                          <button
                            onClick={() => cancelWorkflow(localWorkflow.id)}
                            className="p-1 rounded-full hover:bg-gray-700/50"
                            title="Cancel workflow"
                          >
                            <XCircle size={14} className="text-red-400" />
                          </button>
                        )}
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          localWorkflow.status === 'completed' ? 'bg-green-500' :
                          localWorkflow.status === 'failed' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}
                        style={{ width: `${localWorkflow.progress}%` }}
                      ></div>
                    </div>
                    
                    {/* Steps */}
                    <div className="mt-2 space-y-1">
                      {localWorkflow.steps.map((step, index) => (
                        <div key={step.id} className="flex items-center text-xs">
                          <div className="w-5 flex-shrink-0">
                            {step.status === 'pending' && <Clock size={12} className="text-gray-400" />}
                            {step.status === 'in-progress' && <Loader size={12} className="text-blue-400 animate-spin" />}
                            {step.status === 'completed' && <CheckCircle2 size={12} className="text-green-400" />}
                            {step.status === 'failed' && <XCircle size={12} className="text-red-400" />}
                          </div>
                          <div className="flex-1 flex items-center justify-between">
                            <span className="truncate">{index + 1}. {step.name}</span>
                            <span className={`ml-2 px-1.5 py-0.5 rounded text-xs ${
                              isDark ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                              {step.agentType}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center mt-1 text-xs text-gray-500">
            <span>{message.timestamp.toLocaleTimeString()}</span>
            
            {message.type === 'agent' && message.metadata?.actionType && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                {message.metadata.actionType}
              </span>
            )}
            
            {message.metadata?.workflowId && (
              <span className="ml-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300 flex items-center gap-1">
                <Workflow size={10} />
                <span>Workflow</span>
              </span>
            )}
          </div>
        </div>
        
        {isUser && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-500 flex items-center justify-center">
            {message.type === 'voice' ? (
              <Mic size={16} className="text-white" />
            ) : (
              <div className="text-white text-sm font-medium">
                {profile?.name?.charAt(0)?.toUpperCase() || 'U'}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };
  
  const handleBack = () => {
    navigate('/dashboard');
  };

  return (
    <div className={`h-screen flex flex-col ${
      isDark ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {/* Header */}
      <header className={`flex items-center justify-between p-4 border-b ${
        isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          <button 
            onClick={handleBack}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <X size={20} />
          </button>
          <div>
            <h1 className="text-xl font-bold">Master AI Orchestrator</h1>
            <p className="text-sm text-gray-500">Build, deploy, and manage your applications</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg transition-colors ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
            title="Settings"
          >
            <Settings size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className={`flex-1 flex ${
        isDark ? 'bg-gray-900' : 'bg-gray-100'
      } overflow-hidden`}>
        {/* Sidebar */}
        <div className={`w-64 border-r hidden md:block ${
          isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Assistants</h2>
              <button 
                className={`p-1 rounded transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Refresh assistants"
              >
                <RefreshCw size={14} />
              </button>
            </div>
            
            <div className="space-y-2">
              {assistants.map(assistant => (
                <button
                  key={assistant.id}
                  onClick={() => setActiveAssistantId(assistant.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                    activeAssistantId === assistant.id
                      ? 'bg-blue-600 text-white'
                      : isDark
                        ? 'hover:bg-gray-700 text-gray-300'
                        : 'hover:bg-gray-100 text-gray-700'
                  }`}
                >
                  {assistant.type === 'code' && <Code size={16} />}
                  {assistant.type === 'deploy' && <CloudCog size={16} />}
                  {assistant.type === 'github' && <Github size={16} />}
                  <span>{assistant.name}</span>
                </button>
              ))}
              
              <button
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors text-left ${
                  isDark
                    ? 'hover:bg-gray-700 text-gray-300 border border-gray-700 border-dashed'
                    : 'hover:bg-gray-100 text-gray-700 border border-gray-300 border-dashed'
                }`}
              >
                <Plus size={16} />
                <span>Add Assistant</span>
              </button>
            </div>
          </div>
          
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold">Recent Projects</h2>
            </div>
            
            <div className="space-y-2">
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                    isDark
                      ? 'bg-gray-750 text-gray-300'
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <FilePlus2 size={16} className="text-blue-400" />
                  <span className="text-sm truncate">{project.name}</span>
                </div>
              ))}
              
              {projects.length === 0 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  No projects yet
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map(renderMessage)}
            <div ref={messagesEndRef} />
            
            {/* Active workflow indicator (when no message has the workflow) */}
            {localWorkflow && !messages.some(m => m.metadata?.workflowId === localWorkflow.id) && (
              <div className={`p-3 rounded-lg mb-4 ${
                isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Workflow size={16} className="text-blue-400" />
                    <span className="font-medium">Active Workflow: {localWorkflow.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {localWorkflow.status === 'pending' && <Clock size={16} className="text-yellow-400" />}
                    {localWorkflow.status === 'in-progress' && <Activity size={16} className="text-blue-400" />}
                    {localWorkflow.status === 'completed' && <CheckCircle2 size={16} className="text-green-400" />}
                    {localWorkflow.status === 'failed' && <AlertCircle size={16} className="text-red-400" />}
                    <span className="text-sm capitalize">{localWorkflow.status}</span>
                    
                    {(localWorkflow.status === 'pending' || localWorkflow.status === 'in-progress') && (
                      <button
                        onClick={() => cancelWorkflow(localWorkflow.id)}
                        className="p-1 rounded-full hover:bg-gray-700/50"
                        title="Cancel workflow"
                      >
                        <XCircle size={16} className="text-red-400" />
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-2 bg-gray-700/30 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      localWorkflow.status === 'completed' ? 'bg-green-500' :
                      localWorkflow.status === 'failed' ? 'bg-red-500' :
                      'bg-blue-500'
                    }`}
                    style={{ width: `${localWorkflow.progress}%` }}
                  ></div>
                </div>
                
                {/* Steps */}
                <div className="mt-3 space-y-2">
                  {localWorkflow.steps.map((step, index) => (
                    <div key={step.id} className="flex items-center text-sm">
                      <div className="w-6 flex-shrink-0">
                        {step.status === 'pending' && <Clock size={14} className="text-gray-400" />}
                        {step.status === 'in-progress' && <Loader size={14} className="text-blue-400 animate-spin" />}
                        {step.status === 'completed' && <CheckCircle2 size={14} className="text-green-400" />}
                        {step.status === 'failed' && <XCircle size={14} className="text-red-400" />}
                      </div>
                      <div className="flex-1 flex items-center justify-between">
                        <span>{index + 1}. {step.name}</span>
                        <span className={`ml-2 px-2 py-0.5 rounded text-xs ${
                          isDark ? 'bg-gray-700' : 'bg-gray-200'
                        }`}>
                          {step.agentType}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className={`p-4 border-t ${
            isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
          }`}>
            <div className="flex items-end gap-2">
              <button
                onClick={handleFileUpload}
                className={`p-2 rounded-full transition-colors ${
                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
                title="Upload file"
              >
                <Paperclip size={20} />
              </button>
              
              <button
                onClick={isRecording ? handleStopVoiceRecording : handleStartVoiceRecording}
                className={`p-2 rounded-full transition-colors ${
                  isRecording
                    ? 'bg-red-500 text-white hover:bg-red-600'
                    : isDark
                      ? 'hover:bg-gray-700'
                      : 'hover:bg-gray-100'
                }`}
                title={isRecording ? 'Stop recording' : 'Start voice recording'}
              >
                {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
              </button>
              
              <div className="flex-1 relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message, command, or question..."
                  className={`w-full resize-none rounded-xl px-4 py-3 transition-colors ${
                    isDark 
                      ? 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                      : 'bg-white border border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
                  } focus:outline-none`}
                  rows={1}
                  style={{ minHeight: '2.5rem', maxHeight: '10rem' }}
                  disabled={isProcessing || isRecording}
                />
              </div>
              
              <button
                onClick={handleSendMessage}
                disabled={(!input.trim() && !isGeneratingCode) || isProcessing || isRecording}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl transition-colors"
              >
                {isProcessing ? <Loader size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
              
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelected}
                className="hidden"
                multiple
              />
            </div>
            
            <div className="flex justify-between items-center mt-2 px-2">
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>Type</span>
                <span className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-700">/help</span>
                <span>for available commands</span>
              </div>
              
              {isRecording && (
                <div className="flex items-center gap-2 text-red-500 text-xs">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span>Recording...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Settings modal */}
        {showSettings && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className={`w-full max-w-md p-6 rounded-lg shadow-xl ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold">Settings</h2>
                <button
                  onClick={() => setShowSettings(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                  }`}
                >
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">GitHub Access Token</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="mt-1 text-xs text-gray-500">Required for GitHub repository operations</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Cloudflare API Token</label>
                  <input
                    type="password"
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white' 
                        : 'bg-white border-gray-300 text-gray-900'
                    }`}
                    placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                  <p className="mt-1 text-xs text-gray-500">Required for deploying to Cloudflare Workers</p>
                </div>
                
                <div className="flex items-center justify-between mt-6">
                  <button
                    onClick={() => setShowSettings(false)}
                    className={`px-4 py-2 rounded-lg ${
                      isDark 
                        ? 'bg-gray-700 text-white' 
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  
                  <button
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                  >
                    Save Settings
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MasterChatAgentFull;