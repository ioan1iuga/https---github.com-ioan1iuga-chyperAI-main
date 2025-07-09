/// <reference types="@cloudflare/workers-types" />

/**
 * Worker Environment Interface
 * 
 * This interface defines the environment available to Workers.
 */
export default interface WorkerEnvironment {
  // Environment Variables
  ENVIRONMENT: string;
  NODE_ENV: string;
  API_BASE_URL: string;
  FRONTEND_URL: string;
  
  // Authentication
  JWT_SECRET: string;
  AUTH_DOMAIN: string;
  
  // Database
  DATABASE_URL: string;
  REDIS_URL: string;
  
  // External APIs
  OPENAI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  GITHUB_TOKEN: string;
  
  // Cloudflare Services
  CLOUDFLARE_API_TOKEN: string;
  CLOUDFLARE_ACCOUNT_ID: string;
  CLOUDFLARE_ZONE_ID: string;
  
  // KV Namespaces
  CACHE: KVNamespace;
  SESSIONS: KVNamespace;
  USER_DATA: KVNamespace;
  
  // Durable Objects
  COLLABORATION: DurableObjectNamespace;
  TERMINAL_SESSIONS: DurableObjectNamespace;
  LIVE_PREVIEW: DurableObjectNamespace;
  
  // D1 Database
  DB: D1Database;
  
  // R2 Storage
  STORAGE: R2Bucket;
  FILE_UPLOADS: R2Bucket;
  
  // Analytics Engine
  ANALYTICS: AnalyticsEngineDataset;
  
  // Queues
  BUILD_QUEUE: Queue;
  DEPLOYMENT_QUEUE: Queue;
  NOTIFICATION_QUEUE: Queue;
  
  // Service Bindings
  AUTH_SERVICE: Fetcher;
  FILE_SERVICE: Fetcher;
  AI_SERVICE: Fetcher;
  
  // WebAssembly Modules
  WASM_MODULE: WebAssembly.Module;
  
  // Text/Data Blobs
  TEMPLATES: string;
  ASSETS: ArrayBuffer;
}

/**
 * Worker Request type
 * Safe structural extension using type intersection
 */
export type WorkerRequest = Request & {
  cf?: IncomingRequestCfProperties;
};

/**
 * Worker Response type with additional metadata
 */
export type WorkerResponse = Response & {
  cf?: {
    cacheStatus?: string;
    cacheEverything?: boolean;
    cacheTtl?: number;
  };
};

/**
 * Execution Context for Workers
 */
export interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

/**
 * Handler Types
 */
export type WorkerHandler = (
  request: WorkerRequest,
  env: WorkerEnvironment,
  ctx: ExecutionContext
) => Promise<WorkerResponse> | WorkerResponse;

export type ScheduledHandler = (
  event: ScheduledEvent,
  env: WorkerEnvironment,
  ctx: ExecutionContext
) => Promise<void> | void;

export type QueueHandler = (
  batch: MessageBatch,
  env: WorkerEnvironment,
  ctx: ExecutionContext
) => Promise<void> | void;

/**
 * Durable Object Types
 */
export interface DurableObjectState {
  id: DurableObjectId;
  storage: DurableObjectStorage;
  waitUntil(promise: Promise<any>): void;
  blockConcurrencyWhile<T>(fn: () => Promise<T>): Promise<T>;
}

export interface CollaborationRoom {
  fetch(request: Request): Promise<Response>;
  alarm?(): Promise<void>;
}

export interface TerminalSession {
  fetch(request: Request): Promise<Response>;
  alarm?(): Promise<void>;
}

export interface LivePreviewSession {
  fetch(request: Request): Promise<Response>;
  alarm?(): Promise<void>;
}

/**
 * KV Data Structures
 */
export interface CacheData<T = unknown> {
  value: T;
  timestamp: number;
  ttl?: number;
  tags?: string[];
}

export interface SessionData {
  userId: string;
  projectId: string;
  permissions: string[];
  createdAt: number;
  expiresAt: number;
  metadata?: Record<string, any>;
}

export interface UserData {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  preferences: UserPreferences;
  projects: string[];
  lastActivity: number;
}

export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  notifications: NotificationSettings;
  editor: EditorSettings;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  desktop: boolean;
  types: string[];
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
}

/**
 * Queue Message Types
 */
export interface BuildQueueMessage {
  type: 'build' | 'deploy' | 'test';
  projectId: string;
  userId: string;
  config: BuildConfig;
  timestamp: number;
}

export interface DeploymentQueueMessage {
  type: 'deploy' | 'rollback' | 'preview';
  projectId: string;
  userId: string;
  environment: 'development' | 'staging' | 'production';
  config: DeploymentConfig;
  timestamp: number;
}

export interface NotificationQueueMessage {
  type: 'email' | 'push' | 'webhook';
  userId: string;
  template: string;
  data: Record<string, any>;
  timestamp: number;
}

/**
 * Configuration Types
 */
export interface BuildConfig {
  framework: string;
  buildCommand: string;
  outputDir: string;
  environment: Record<string, string>;
  dependencies: string[];
}

export interface DeploymentConfig {
  target: 'cloudflare' | 'vercel' | 'netlify';
  domain?: string;
  environment: Record<string, string>;
  headers?: Record<string, string>;
  redirects?: RedirectRule[];
}

export interface RedirectRule {
  source: string;
  destination: string;
  permanent: boolean;
}

/**
 * API Response Types
 */
export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    requestId?: string;
  };
}

export interface PaginatedResponse<T> extends APIResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Cloudflare API Types
 */
export interface CloudflareAPIError {
  code: number;
  message: string;
  error_chain?: CloudflareAPIError[];
}

export interface CloudflareAPIResponse<T> {
  result: T;
  success: boolean;
  errors: CloudflareAPIError[];
  messages: string[];
  result_info?: {
    page: number;
    per_page: number;
    count: number;
    total_count: number;
  };
}

/**
 * Worker Analytics
 */
export interface AnalyticsDataPoint {
  timestamp: number;
  event: string;
  userId?: string;
  projectId?: string;
  metadata?: Record<string, any>;
}

/**
 * Security Types
 */
export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  keyGenerator?: (request: WorkerRequest) => string;
  skipSuccessfulRequests?: boolean;
}

export interface CORSConfig {
  origin: string | string[] | boolean;
  methods: string[];
  allowedHeaders: string[];
  exposedHeaders?: string[];
  credentials: boolean;
  maxAge?: number;
}

/**
 * Logging Types
 */
export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: number;
  requestId?: string;
  userId?: string;
  metadata?: Record<string, any>;
}