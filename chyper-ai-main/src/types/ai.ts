// AI Development Assistant Types
export interface AIMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    codeBlocks?: CodeBlock[];
    suggestions?: CodeSuggestion[];
    files?: string[];
  };
}

export interface CodeBlock {
  id: string;
  language: string;
  code: string;
  explanation?: string;
  filePath?: string;
}

export interface CodeSuggestion {
  id: string;
  type: 'completion' | 'refactor' | 'optimization' | 'security' | 'bug-fix';
  title: string;
  description: string;
  code: string;
  language: string;
  filePath?: string;
  lineNumber?: number;
  confidence: number;
}

export interface ProjectContext {
  id: string;
  name: string;
  framework: string;
  structure: FileNode[];
  dependencies: string[];
  environment: Record<string, string>;
  gitBranch?: string;

export interface CodeAnalysisOptions {
  includePerformance?: boolean;
  includeSecurity?: boolean;
  includeQuality?: boolean;
  includeMaintainability?: boolean;
}

export interface CodeAnalysisResult {
  score: number;
  issues: Array<{
    severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
    type: 'security' | 'performance' | 'quality' | 'maintainability';
    message: string;
    line?: number;
    column?: number;
    file?: string;
    code?: string;
    suggestion?: string;
  }>;
  metrics: {
    complexity: number;
    maintainability: number;
    security: number;
    performance: number;
  };
}
  lastCommit?: string;
}

export interface FileNode {
  path: string;
  type: 'file' | 'directory';
  children?: FileNode[];
  content?: string;
  language?: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  type: 'openai' | 'anthropic' | 'google' | 'local' | 'custom';
  models: LLMModel[];
  apiKey?: string;
  endpoint?: string;
  status: 'connected' | 'disconnected' | 'error';
}

export interface LLMModel {
  id: string;
  name: string;
  displayName: string;
  maxTokens: number;
  inputCost: number;
  outputCost: number;
  capabilities: LLMCapability[];
}

export interface LLMCapability {
  type: 'code-generation' | 'code-analysis' | 'chat' | 'function-calling' | 'vision';
  supported: boolean;
}

export interface AISession {
  id: string;
  projectId: string;
  name: string;
  messages: AIMessage[];
  context: ProjectContext;
  provider: string;
  model: string;
  createdAt: Date;
  updatedAt: Date;
  tokenUsage: {
    input: number;
    output: number;
    total: number;
  };
}

export interface AICommand {
  id: string;
  name: string;
  description: string;
  category: 'generation' | 'analysis' | 'refactor' | 'debug' | 'deploy';
  prompt: string;
  shortcut?: string;
  icon?: string;
}

export interface SecurityScanResult {
  id: string;
  type: 'vulnerability' | 'best-practice' | 'performance' | 'maintainability';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  filePath: string;
  lineNumber: number;
  solution?: string;
  references?: string[];
}

export interface PerformanceAnalysis {
  id: string;
  type: 'bundle-size' | 'runtime' | 'memory' | 'network';
  metric: string;
  value: number;
  threshold: number;
  recommendation: string;
  impact: 'low' | 'medium' | 'high';
}

export interface DeploymentTemplate {
  id: string;
  name: string;
  description: string;
  platform: string;
  template: string;
  variables: Record<string, string>;
  instructions: string[];
}
export interface RepositoryInfo {
  id: string;
  name: string;
  description?: string;
  url?: string;
  branch: string;
  lastCommit?: {
    id: string;
    message: string;
    author: string;
    date: string;
  };
  status: {
    added: string[];
    modified: string[];
    deleted: string[];
  };
}

export interface DeploymentDetails {
  id: string;
  projectId: string;
  status: 'pending' | 'building' | 'deploying' | 'success' | 'failed';
  provider: string;
  environment: string;
  url?: string;
  deployedAt?: Date;
  logs: string[];
  error?: string;
}

export interface CodeAnalysisMetrics {
  overall: number;
  complexity: number;
  maintainability: number;
  security: number;
  performance: number;
}

export interface CodeIssue {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  type: 'security' | 'performance' | 'quality' | 'maintainability';
  message: string;
  file: string;
  line?: number;
  column?: number;
  code?: string;
  suggestion?: string;
}