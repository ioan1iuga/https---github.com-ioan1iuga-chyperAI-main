import { v4 as uuidv4 } from 'uuid';
import { LLMService } from './LLMService';
import { logger } from '../../utils/errorHandling';
import { LLMProvider, LLMModel } from '../../types/ai';
import FileProcessingService from '../fileProcessing/FileProcessingService';
import GitHubIntegrationService from '../github/GitHubIntegrationService';
import CloudflareDeploymentService from '../deployment/CloudflareDeploymentService';
import VoiceProcessingService from '../voiceProcessing/VoiceProcessingService';

// Types for specialized agents
export enum AgentType {
  CODE = 'code',
  DEPLOYMENT = 'deployment',
  GITHUB = 'github',
  TESTING = 'testing',
  DEBUGGING = 'debugging',
  DOCUMENTATION = 'documentation',
  ARCHITECTURE = 'architecture',
  SECURITY = 'security',
  PERFORMANCE = 'performance'
}

export interface Agent {
  id: string;
  name: string;
  type: AgentType;
  description: string;
  capabilities: string[];
  preferredModels: string[];
  isActive: boolean;
}

export interface AgentTask {
  id: string;
  agentId: string;
  prompt: string;
  context: any;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  startTime: Date;
  endTime?: Date;
  dependencies?: string[]; // IDs of tasks this task depends on
}

export interface WorkflowStep {
  id: string;
  name: string;
  description: string;
  agentType: AgentType;
  prompt: string;
  context?: any;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  result?: any;
  error?: Error;
  dependencies?: string[]; // IDs of steps this step depends on
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  steps: WorkflowStep[];
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export interface ProjectContext {
  projectId: string;
  files: {
    path: string;
    content: string;
    language?: string;
  }[];
  dependencies?: Record<string, string>;
  environment?: Record<string, string>;
  repositoryUrl?: string;
  deploymentUrl?: string;
}

export interface OrchestratorConfig {
  maxConcurrentTasks: number;
  defaultProvider: string;
  defaultModel: string;
  useCache: boolean;
  retryCount: number;
  retryDelay: number;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  prioritizeOpenSource: boolean;
}

export class LLMOrchestrator {
  private agents: Map<string, Agent>;
  private tasks: Map<string, AgentTask>;
  private workflows: Map<string, Workflow>;
  private projectContexts: Map<string, ProjectContext>;
  private config: OrchestratorConfig;
  private taskQueue: AgentTask[];
  private runningTasks: Set<string>;
  private eventListeners: Map<string, Function[]>;

  /**
   * Event handling methods
   */
  private emitEvent(eventName: string, data: any): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      for (const listener of listeners) {
        listener(data);
      }
    }
  }

  private addEventListener(eventName: string, listener: Function): void {
    if (!this.eventListeners.has(eventName)) {
      this.eventListeners.set(eventName, []);
    }
    this.eventListeners.get(eventName)?.push(listener);
  }

  private removeEventListener(eventName: string, listener: Function): void {
    const listeners = this.eventListeners.get(eventName);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  constructor(config?: Partial<OrchestratorConfig>) {
    this.agents = new Map();
    this.tasks = new Map();
    this.workflows = new Map();
    this.projectContexts = new Map();
    this.taskQueue = [];
    this.runningTasks = new Set();
    this.eventListeners = new Map();

    // Default configuration
    this.config = {
      maxConcurrentTasks: 3,
      defaultProvider: 'anthropic',
      defaultModel: 'claude-3-sonnet',
      useCache: true,
      retryCount: 2,
      retryDelay: 1000,
      logLevel: 'info',
      prioritizeOpenSource: true,
      ...config
    };

    this.initializeAgents();
    this.startTaskProcessor();
  }

  /**
   * Initialize default specialized agents
   */
  private initializeAgents() {
    const defaultAgents: Agent[] = [
      {
        id: 'code-agent',
        name: 'Code Agent',
        type: AgentType.CODE,
        description: 'Specializes in code generation, refactoring, and optimization',
        capabilities: ['code-generation', 'refactoring', 'optimization'],
        preferredModels: ['claude-3-opus', 'gpt-4', 'llama-3-70b'],
        isActive: true
      },
      {
        id: 'deployment-agent',
        name: 'Deployment Agent',
        type: AgentType.DEPLOYMENT,
        description: 'Handles deployment to various platforms including Cloudflare',
        capabilities: ['cloudflare-workers', 'netlify', 'vercel', 'github-pages'],
        preferredModels: ['claude-3-sonnet', 'gpt-3.5-turbo', 'llama-3-8b'],
        isActive: true
      },
      {
        id: 'github-agent',
        name: 'GitHub Agent',
        type: AgentType.GITHUB,
        description: 'Manages GitHub repositories, PRs, and issues',
        capabilities: ['repo-creation', 'pr-management', 'issue-tracking'],
        preferredModels: ['claude-3-sonnet', 'gpt-3.5-turbo', 'llama-3-8b'],
        isActive: true
      },
      {
        id: 'testing-agent',
        name: 'Testing Agent',
        type: AgentType.TESTING,
        description: 'Creates and runs tests for code',
        capabilities: ['unit-tests', 'integration-tests', 'e2e-tests'],
        preferredModels: ['claude-3-sonnet', 'gpt-4', 'llama-3-70b'],
        isActive: true
      },
      {
        id: 'debugging-agent',
        name: 'Debugging Agent',
        type: AgentType.DEBUGGING,
        description: 'Identifies and fixes bugs in code',
        capabilities: ['error-analysis', 'bug-fixing', 'code-review'],
        preferredModels: ['claude-3-opus', 'gpt-4', 'llama-3-70b'],
        isActive: true
      },
      {
        id: 'documentation-agent',
        name: 'Documentation Agent',
        type: AgentType.DOCUMENTATION,
        description: 'Creates and maintains documentation',
        capabilities: ['code-documentation', 'readme-generation', 'api-docs'],
        preferredModels: ['claude-3-sonnet', 'gpt-3.5-turbo', 'llama-3-8b'],
        isActive: true
      },
      {
        id: 'architecture-agent',
        name: 'Architecture Agent',
        type: AgentType.ARCHITECTURE,
        description: 'Designs system architecture and component relationships',
        capabilities: ['system-design', 'component-design', 'data-modeling'],
        preferredModels: ['claude-3-opus', 'gpt-4', 'llama-3-70b'],
        isActive: true
      },
      {
        id: 'security-agent',
        name: 'Security Agent',
        type: AgentType.SECURITY,
        description: 'Identifies and fixes security vulnerabilities',
        capabilities: ['vulnerability-scanning', 'security-review', 'best-practices'],
        preferredModels: ['claude-3-opus', 'gpt-4', 'llama-3-70b'],
        isActive: true
      },
      {
        id: 'performance-agent',
        name: 'Performance Agent',
        type: AgentType.PERFORMANCE,
        description: 'Optimizes code for performance',
        capabilities: ['performance-analysis', 'optimization', 'benchmarking'],
        preferredModels: ['claude-3-opus', 'gpt-4', 'llama-3-70b'],
        isActive: true
      }
    ];

    for (const agent of defaultAgents) {
      this.agents.set(agent.id, agent);
    }
  }

  /**
   * Start the task processor that runs tasks in parallel
   */
  private startTaskProcessor() {
    setInterval(() => {
      this.processTaskQueue();
    }, 100);
  }

  /**
   * Process tasks in the queue
   */
  private async processTaskQueue() {
    if (this.taskQueue.length === 0 || this.runningTasks.size >= this.config.maxConcurrentTasks) {
      return;
    }

    // Find tasks that can be executed (no pending dependencies)
    const executableTasks = this.taskQueue.filter(task => {
      if (!task.dependencies || task.dependencies.length === 0) {
        return true;
      }
      
      // Check if all dependencies are completed
      return task.dependencies.every(depId => {
        const depTask = this.tasks.get(depId);
        return depTask && depTask.status === 'completed';
      });
    });

    // Execute tasks up to the concurrent limit
    for (const task of executableTasks) {
      if (this.runningTasks.size >= this.config.maxConcurrentTasks) {
        break;
      }

      // Remove from queue and mark as running
      this.taskQueue = this.taskQueue.filter(t => t.id !== task.id);
      this.runningTasks.add(task.id);
      
      // Update task status
      task.status = 'in-progress';
      this.tasks.set(task.id, task);
      
      // Emit event
      this.emitEvent('taskStarted', task);
      
      // Execute task
      this.executeTask(task).catch(error => {
        logger.error('Error executing task', { taskId: task.id, error });
      });
    }
  }

  /**
   * Execute a single agent task
   */
  private async executeTask(task: AgentTask) {
    try {
      const agent = this.agents.get(task.agentId);
      if (!agent) {
        throw new Error(`Agent ${task.agentId} not found`);
      }

      logger.info('Executing task', { taskId: task.id, agentId: task.agentId, agentType: agent.type });

      // Select the appropriate model for this agent
      const model = this.selectModelForAgent(agent);
      const provider = this.getProviderForModel(model);

      // Execute the task based on agent type
      let result;
      switch (agent.type) {
        case AgentType.CODE:
          result = await this.executeCodeTask(task, model, provider);
          break;
        case AgentType.DEPLOYMENT:
          result = await this.executeDeploymentTask(task, model, provider);
          break;
        case AgentType.GITHUB:
          result = await this.executeGitHubTask(task, model, provider);
          break;
        case AgentType.TESTING:
          result = await this.executeTestingTask(task, model, provider);
          break;
        case AgentType.DEBUGGING:
          result = await this.executeDebuggingTask(task, model, provider);
          break;
        case AgentType.DOCUMENTATION:
          result = await this.executeDocumentationTask(task, model, provider);
          break;
        case AgentType.ARCHITECTURE:
          result = await this.executeArchitectureTask(task, model, provider);
          break;
        case AgentType.SECURITY:
          result = await this.executeSecurityTask(task, model, provider);
          break;
        case AgentType.PERFORMANCE:
          result = await this.executePerformanceTask(task, model, provider);
          break;
        default:
          throw new Error(`Unsupported agent type: ${agent.type}`);
      }

      // Update task with result
      task.status = 'completed';
      task.result = result;
      task.endTime = new Date();
      this.tasks.set(task.id, task);
      
      // Emit event
      this.emitEvent('taskCompleted', task);
      
      // Check if any workflows are affected
      this.updateWorkflowsForTask(task);
      
    } catch (error) {
      logger.error('Task execution failed', { taskId: task.id, error });
      
      // Update task with error
      task.status = 'failed';
      task.error = error as Error;
      task.endTime = new Date();
      this.tasks.set(task.id, task);
      
      // Emit event
      this.emitEvent('taskFailed', task);
      
      // Check if any workflows are affected
      this.updateWorkflowsForTask(task);
    } finally {
      // Remove from running tasks
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * Execute a code-related task
   */
  private async executeCodeTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Create a proper LLMProvider object
    const llmProvider: LLMProvider = {
      id: provider,
      name: provider,
      type: this.getProviderType(provider),
      models: [this.createLLMModel(model, provider)],
      status: 'connected'
    };
    
    // Determine the specific code task type
    if (prompt.toLowerCase().includes('generate') || prompt.toLowerCase().includes('create')) {
      // Code generation
      return await LLMService.generateCode(prompt, context?.language || 'javascript', llmProvider, model);
    } else if (prompt.toLowerCase().includes('refactor') || prompt.toLowerCase().includes('improve')) {
      // Code refactoring
      return await LLMService.analyzeCode(context?.code || '', context?.language || 'javascript', llmProvider, model);
    } else {
      // General code task
      return await LLMService.chat(prompt, llmProvider, model, context);
    }
  }

  /**
   * Execute a deployment-related task
   */
  private async executeDeploymentTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // First, use LLM to understand deployment requirements
    const deploymentPlan = await LLMService.chat(
      `Create a deployment plan for the following request: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      context
    );
    
    // If this is a Cloudflare deployment and we have the necessary context
    if (prompt.toLowerCase().includes('cloudflare') && context?.projectId) {
      try {
        const deploymentResult = await CloudflareDeploymentService.deployProject(
          context.projectId,
          context.entryPoint || 'src/index.js',
          context.options || {}
        );
        
        return {
          plan: deploymentPlan,
          result: deploymentResult
        };
      } catch (error) {
        logger.error('Cloudflare deployment failed', { error });
        throw error;
      }
    }
    
    // For other deployment targets, return the plan
    return {
      plan: deploymentPlan,
      message: 'Deployment plan created. Manual execution required for this deployment target.'
    };
  }

  /**
   * Execute a GitHub-related task
   */
  private async executeGitHubTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // First, use LLM to understand GitHub requirements
    const githubPlan = await LLMService.chat(
      `Create a GitHub operation plan for the following request: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      context
    );
    
    // If this is a repository creation task and we have the necessary context
    if (prompt.toLowerCase().includes('create repository') && context?.name) {
      try {
        const repo = await GitHubIntegrationService.createRepository({
          name: context.name,
          private: context.isPrivate || false,
          description: context.description || `Repository created by ChyperAI`,
          auto_init: context.autoInit || true
        });
        
        return {
          plan: githubPlan,
          result: repo
        };
      } catch (error) {
        logger.error('GitHub repository creation failed', { error });
        throw error;
      }
    }
    
    // For other GitHub operations, return the plan
    return {
      plan: githubPlan,
      message: 'GitHub operation plan created. Manual execution required for this operation.'
    };
  }

  /**
   * Execute a testing-related task
   */
  private async executeTestingTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Generate tests based on code and requirements
    return await LLMService.chat(
      `Generate tests for the following code based on this request: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a testing specialist. Generate comprehensive tests that cover edge cases and ensure code quality.'
      }
    );
  }

  /**
   * Execute a debugging-related task
   */
  private async executeDebuggingTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Analyze code for bugs and provide fixes
    return await LLMService.chat(
      `Debug the following code and provide fixes: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a debugging specialist. Identify bugs, explain their causes, and provide fixes.'
      }
    );
  }

  /**
   * Execute a documentation-related task
   */
  private async executeDocumentationTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Generate documentation based on code and requirements
    return await LLMService.chat(
      `Generate documentation for the following code: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a documentation specialist. Create clear, comprehensive documentation that follows best practices.'
      }
    );
  }

  /**
   * Execute an architecture-related task
   */
  private async executeArchitectureTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Design system architecture based on requirements
    return await LLMService.chat(
      `Design system architecture for the following requirements: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a system architecture specialist. Design scalable, maintainable architectures that follow best practices.'
      }
    );
  }

  /**
   * Execute a security-related task
   */
  private async executeSecurityTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Analyze code for security vulnerabilities
    return await LLMService.chat(
      `Analyze the following code for security vulnerabilities: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a security specialist. Identify vulnerabilities, assess their severity, and provide secure alternatives.'
      }
    );
  }

  /**
   * Execute a performance-related task
   */
  private async executePerformanceTask(task: AgentTask, model: string, provider: string): Promise<any> {
    const { prompt, context } = task;
    
    // Analyze code for performance issues
    return await LLMService.chat(
      `Analyze the following code for performance issues: ${prompt}`,
      {
        id: provider,
        name: provider,
        type: this.getProviderType(provider),
        models: [this.createLLMModel(model, provider)],
        status: 'connected'
      },
      model,
      {
        ...context,
        systemPrompt: 'You are a performance optimization specialist. Identify bottlenecks and provide optimized alternatives.'
      }
    );
  }

  /**
   * Update workflows when a task is completed or failed
   */
  private updateWorkflowsForTask(task: AgentTask) {
    for (const [workflowId, workflow] of this.workflows.entries()) {
      let workflowUpdated = false;
      
      // Update steps that depend on this task
      for (const step of workflow.steps) {
        if (step.status === 'pending' && step.dependencies?.includes(task.id)) {
          // If a dependency failed, mark this step as failed too
          if (task.status === 'failed') {
            step.status = 'failed';
            step.error = new Error(`Dependency task ${task.id} failed: ${task.error?.message}`);
            workflowUpdated = true;
          } else if (this.canExecuteWorkflowStep(step, workflow)) {
            // All dependencies are completed, mark as ready for execution
            this.executeWorkflowStep(workflow, step);
            workflowUpdated = true;
          }
        }
      }
      
      // Check if workflow is completed or failed
      if (workflow.steps.every(step => step.status === 'completed')) {
        workflow.status = 'completed';
        workflow.completedAt = new Date();
        workflow.updatedAt = new Date();
        workflowUpdated = true;
        
        // Emit event
        this.emitEvent('workflowCompleted', workflow);
      } else if (workflow.steps.some(step => step.status === 'failed')) {
        workflow.status = 'failed';
        workflow.updatedAt = new Date();
        workflowUpdated = true;
        
        // Emit event
        this.emitEvent('workflowFailed', workflow);
      }
      
      if (workflowUpdated) {
        this.workflows.set(workflowId, workflow);
      }
    }
  }

  /**
   * Check if a workflow step can be executed
   */
  private canExecuteWorkflowStep(step: WorkflowStep, workflow: Workflow): boolean {
    if (!step.dependencies || step.dependencies.length === 0) {
      return true;
    }
    
    // Check if all dependencies are completed
    return step.dependencies.every(depId => {
      // Check if it's a task dependency
      const depTask = this.tasks.get(depId);
      if (depTask) {
        return depTask.status === 'completed';
      }
      
      // Check if it's a step dependency
      const depStep = workflow.steps.find(s => s.id === depId);
      if (depStep) {
        return depStep.status === 'completed';
      }
      
      return false;
    });
  }

  /**
   * Execute a workflow step
   */
  private async executeWorkflowStep(workflow: Workflow, step: WorkflowStep) {
    // Update step status
    step.status = 'in-progress';
    workflow.updatedAt = new Date();
    this.workflows.set(workflow.id, workflow);
    
    // Emit event
    this.emitEvent('workflowStepStarted', { workflow, step });
    
    // Create a task for this step
    const task: AgentTask = {
      id: uuidv4(),
      agentId: this.getAgentIdForType(step.agentType),
      prompt: step.prompt,
      context: step.context,
      status: 'pending',
      startTime: new Date()
    };
    
    // Add task to the system
    this.tasks.set(task.id, task);
    this.taskQueue.push(task);
    
    // Set up a listener for task completion
    const taskCompletedListener = (completedTask: AgentTask) => {
      if (completedTask.id === task.id) {
        // Update step with task result
        step.status = completedTask.status === 'completed' ? 'completed' : 'failed';
        step.result = completedTask.result;
        step.error = completedTask.error;
        
        workflow.updatedAt = new Date();
        this.workflows.set(workflow.id, workflow);
        
        // Emit event
        this.emitEvent('workflowStepCompleted', { workflow, step });
        
        // Remove listener
        this.removeEventListener('taskCompleted', taskCompletedListener);
        this.removeEventListener('taskFailed', taskCompletedListener);
      }
    };
    
    this.addEventListener('taskCompleted', taskCompletedListener);
    this.addEventListener('taskFailed', taskCompletedListener);
  }

  /**
   * Get agent ID for a specific agent type
   */
  private getAgentIdForType(type: AgentType): string {
    for (const [id, agent] of this.agents.entries()) {
      if (agent.type === type) {
        return id;
      }
    }
    
    throw new Error(`No agent found for type: ${type}`);
  }

  /**
   * Select the best model for an agent based on preferences and availability
   */
  private selectModelForAgent(agent: Agent): string {
    // If prioritizing open source and agent has open source models
    if (this.config.prioritizeOpenSource) {
      const openSourceModels = agent.preferredModels.filter(model => 
        model.toLowerCase().includes('llama') || 
        model.toLowerCase().includes('mistral') ||
        model.toLowerCase().includes('falcon')
      );
      
      if (openSourceModels.length > 0) {
        return openSourceModels[0];
      }
    }
    
    // Otherwise use the first preferred model
    if (agent.preferredModels.length > 0) {
      return agent.preferredModels[0];
    }
    
    // Fallback to default model
    return this.config.defaultModel;
  }

  /**
   * Get the provider for a specific model
   */
  private getProviderForModel(model: string): string {
    if (model.startsWith('gpt')) {
      return 'openai';
    } else if (model.startsWith('claude')) {
      return 'anthropic';
    } else if (model.startsWith('gemini')) {
      return 'google';
    } else if (model.startsWith('llama') || model.startsWith('mistral') || model.startsWith('falcon')) {
      return 'open-source';
    }
    
    return this.config.defaultProvider;
  }

  /**
   * Process a user message and delegate to appropriate agents
   */
  public async processMessage(message: string, projectId?: string): Promise<{
    response: string;
    tasks: AgentTask[];
    workflow?: Workflow;
  }> {
    try {
      logger.info('Processing message', { message, projectId });
      
      // First, analyze the message to determine intent and required agents
      const analysis = await this.analyzeMessage(message, projectId);
      
      // If this is a simple query that doesn't require specialized agents
      if (analysis.intentType === 'query') {
        const response = await LLMService.chat(
          message,
          {
            id: this.config.defaultProvider,
            name: this.config.defaultProvider,
            type: this.getProviderType(this.config.defaultProvider),
            models: [this.createLLMModel(this.config.defaultModel, this.config.defaultProvider)],
            status: 'connected'
          },
          this.config.defaultModel,
          projectId ? { projectId } : undefined
        );
        
        return {
          response: response.content,
          tasks: []
        };
      }
      
      // For complex tasks, create a workflow
      const workflow = await this.createWorkflowFromAnalysis(analysis, message, projectId);
      
      // Start the workflow
      await this.startWorkflow(workflow);
      
      return {
        response: `I'm working on your request: "${message}". I've created a workflow with ${workflow.steps.length} steps and assigned specialized agents to handle different aspects of your task.`,
        tasks: Array.from(this.tasks.values()).filter(task =>
          workflow.steps.some((step: WorkflowStep) => step.dependencies?.includes(task.id))
        ),
        workflow
      };
    } catch (error) {
      logger.error('Error processing message', { message, error });
      throw error;
    }
  }

  /**
   * Analyze a message to determine intent and required agents
   */
  private async analyzeMessage(message: string, projectId?: string): Promise<{
    intentType: 'query' | 'code' | 'deployment' | 'github' | 'complex';
    requiredAgents: AgentType[];
    subtasks: string[];
  }> {
    try {
      // Use LLM to analyze the message
      const analysisPrompt = `
        Analyze the following user message to determine the intent and required specialized agents:
        
        User Message: ${message}
        
        Classify into one of these categories:
        1. query - Simple question that doesn't require specialized agents
        2. code - Code generation, refactoring, or optimization
        3. deployment - Deploying application to a platform
        4. github - GitHub repository operations
        5. complex - Requires multiple specialized agents
        
        If complex, list the required agent types from: ${Object.values(AgentType).join(', ')}
        
        Also break down the request into subtasks that can be assigned to different agents.
      `;
      
      const analysis = await LLMService.chat(
        analysisPrompt,
        {
          id: this.config.defaultProvider,
          name: this.config.defaultProvider,
          type: this.getProviderType(this.config.defaultProvider),
          models: [this.createLLMModel(this.config.defaultModel, this.config.defaultProvider)],
          status: 'connected'
        },
        this.config.defaultModel,
        projectId ? { projectId } : undefined
      );
      
      // Parse the analysis result
      const intentMatch = analysis.content.match(/intent(?:Type)?:\s*(\w+)/i);
      const intentType = intentMatch ? intentMatch[1].toLowerCase() as 'query' | 'code' | 'deployment' | 'github' | 'complex' : 'query';
      
      const agentMatches = analysis.content.match(/required agents?:\s*([\w\s,]+)/i);
      const agentTypes = agentMatches
        ? agentMatches[1].split(/,\s*/).map(type =>
            type.trim().toUpperCase() as AgentType
          ).filter(type => Object.values(AgentType).includes(type))
        : [];
      
      const subtaskMatches = analysis.content.match(/subtasks?:\s*([\s\S]+?)(?:\n\n|$)/i);
      const subtaskText = subtaskMatches ? subtaskMatches[1] : '';
      const subtasks = subtaskText
        .split(/\n\s*/)
        .map(task => task.trim())
        .filter(task => task.length > 0);
      
      return {
        intentType,
        requiredAgents: agentTypes.length > 0 ? agentTypes : [intentType === 'query' ? AgentType.CODE : AgentType[intentType.toUpperCase() as keyof typeof AgentType]],
        subtasks: subtasks.length > 0 ? subtasks : [message]
      };
    } catch (error) {
      logger.error('Error analyzing message', { message, error });
      return {
        intentType: 'query',
        requiredAgents: [AgentType.CODE],
        subtasks: [message]
      };
    }
  }
  
  /**
   * Create a workflow from message analysis
   */
  private async createWorkflowFromAnalysis(
    analysis: {
      intentType: 'query' | 'code' | 'deployment' | 'github' | 'complex';
      requiredAgents: AgentType[];
      subtasks: string[];
    },
    message: string,
    projectId?: string
  ): Promise<Workflow> {
    const workflowId = uuidv4();
    const steps: WorkflowStep[] = [];
    
    // Create steps for each subtask
    for (let i = 0; i < analysis.subtasks.length; i++) {
      const subtask = analysis.subtasks[i];
      const agentType = i < analysis.requiredAgents.length
        ? analysis.requiredAgents[i]
        : analysis.requiredAgents[analysis.requiredAgents.length - 1];
      
      steps.push({
        id: uuidv4(),
        name: `Step ${i + 1}: ${subtask.substring(0, 30)}${subtask.length > 30 ? '...' : ''}`,
        description: subtask,
        agentType,
        prompt: subtask,
        context: projectId ? { projectId } : undefined,
        status: 'pending',
        dependencies: i > 0 ? [steps[i - 1].id] : []
      });
    }
    
    const workflow: Workflow = {
      id: workflowId,
      name: `Workflow for: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`,
      description: message,
      steps,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.workflows.set(workflowId, workflow);
    return workflow;
  }
  
  /**
   * Start a workflow
   */
  private async startWorkflow(workflow: Workflow): Promise<void> {
    // Update workflow status
    workflow.status = 'in-progress';
    workflow.updatedAt = new Date();
    this.workflows.set(workflow.id, workflow);
    
    // Start all steps that don't have dependencies
    for (const step of workflow.steps) {
      if (!step.dependencies || step.dependencies.length === 0) {
        this.executeWorkflowStep(workflow, step);
      }
    }
  }
  
  /**
   * Get the provider type for a provider ID
   */
  private getProviderType(providerId: string): 'openai' | 'anthropic' | 'google' | 'local' | 'custom' {
    if (providerId === 'openai') {
      return 'openai';
    } else if (providerId === 'anthropic') {
      return 'anthropic';
    } else if (providerId === 'google') {
      return 'google';
    } else if (providerId === 'open-source') {
      return 'local';
    }
    
    return 'custom';
  }
  
  /**
   * Create an LLMModel object
   */
  private createLLMModel(modelId: string, provider: string): LLMModel {
    return {
      id: modelId,
      name: modelId,
      displayName: modelId,
      maxTokens: this.getMaxTokensForModel(modelId),
      inputCost: this.getInputCostForModel(modelId, provider),
      outputCost: this.getOutputCostForModel(modelId, provider),
      capabilities: [
        {
          type: 'code-generation',
          supported: true
        },
        {
          type: 'code-analysis',
          supported: true
        },
        {
          type: 'chat',
          supported: true
        },
        {
          type: 'function-calling',
          supported: modelId.includes('gpt-4') || modelId.includes('claude-3')
        },
        {
          type: 'vision',
          supported: modelId.includes('vision') || modelId.includes('claude-3')
        }
      ]
    };
  }
  
  /**
   * Get max tokens for a model
   */
  private getMaxTokensForModel(modelId: string): number {
    if (modelId.includes('gpt-4')) {
      return 8192;
    } else if (modelId.includes('gpt-3.5')) {
      return 4096;
    } else if (modelId.includes('claude-3-opus')) {
      return 200000;
    } else if (modelId.includes('claude-3-sonnet')) {
      return 100000;
    } else if (modelId.includes('claude-3-haiku')) {
      return 50000;
    } else if (modelId.includes('llama-3-70b')) {
      return 8192;
    } else if (modelId.includes('llama-3')) {
      return 4096;
    }
    
    return 4096; // Default
  }
  
  /**
   * Get input cost for a model
   */
  private getInputCostForModel(modelId: string, provider: string): number {
    if (provider === 'openai') {
      if (modelId.includes('gpt-4')) {
        return 0.03;
      } else if (modelId.includes('gpt-3.5')) {
        return 0.0015;
      }
    } else if (provider === 'anthropic') {
      if (modelId.includes('claude-3-opus')) {
        return 0.015;
      } else if (modelId.includes('claude-3-sonnet')) {
        return 0.003;
      } else if (modelId.includes('claude-3-haiku')) {
        return 0.00025;
      }
    } else if (provider === 'local' || provider === 'open-source') {
      return 0; // Free for local models
    }
    
    return 0.001; // Default
  }
  
  /**
   * Get output cost for a model
   */
  private getOutputCostForModel(modelId: string, provider: string): number {
    if (provider === 'openai') {
      if (modelId.includes('gpt-4')) {
        return 0.06;
      } else if (modelId.includes('gpt-3.5')) {
        return 0.002;
      }
    } else if (provider === 'anthropic') {
      if (modelId.includes('claude-3-opus')) {
        return 0.075;
      } else if (modelId.includes('claude-3-sonnet')) {
        return 0.015;
      } else if (modelId.includes('claude-3-haiku')) {
        return 0.00125;
      }
    } else if (provider === 'local' || provider === 'open-source') {
      return 0; // Free for local models
    }
    
    return 0.002; // Default
  }
}