import { logger } from '../../utils/errorHandling';

interface RepoCreateOptions {
  name: string;
  description?: string;
  homepage?: string;
  private?: boolean;
  has_issues?: boolean;
  has_projects?: boolean;
  has_wiki?: boolean;
  auto_init?: boolean;
  gitignore_template?: string;
  license_template?: string;
}

interface RepoBranchOptions {
  name: string;
  source_branch?: string;
}

interface FileCreateOptions {
  message: string;
  content: string;
  branch?: string;
}

interface CommitOptions {
  message: string;
  files: Array<{ path: string; content: string }>;
  branch?: string;
}

interface PullRequestOptions {
  title: string;
  body?: string;
  head: string;
  base: string;
}

interface WebhookOptions {
  name: string;
  events: string[];
  active?: boolean;
  config: {
    url: string;
    content_type: string;
    secret?: string;
    insecure_ssl?: string;
  };
}

class GitHubIntegrationService {
  private token: string | null;
  private apiUrl: string;
  private username: string | null;
  private currentRepo: string | null;
  
  constructor() {
    this.token = localStorage.getItem('github_token') || null;
    this.apiUrl = 'https://api.github.com';
    this.username = localStorage.getItem('github_username') || null;
    this.currentRepo = null;
    
    // Try to load from environment variables if available
    this.token = this.token || import.meta.env.VITE_GITHUB_ACCESS_TOKEN;
    
    if (this.token) {
      logger.info('GitHub integration service initialized with token');
    } else {
      logger.warn('GitHub integration service initialized without token');
    }
  }
  
  /**
   * Set GitHub authentication token
   */
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('github_token', token);
    logger.info('GitHub token set');
  }
  
  /**
   * Clear GitHub authentication token
   */
  clearToken(): void {
    this.token = null;
    localStorage.removeItem('github_token');
    logger.info('GitHub token cleared');
  }
  
  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.token;
  }
  
  /**
   * Set current repository
   */
  setCurrentRepository(repoName: string): void {
    this.currentRepo = repoName;
  }
  
  /**
   * Make authenticated request to GitHub API
   */
  private async request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.token) {
      throw new Error('GitHub token not set. Please authenticate first.');
    }
    
    const url = `${this.apiUrl}${endpoint}`;
    
    const headers: HeadersInit = {
      'Accept': 'application/vnd.github.v3+json',
      'Authorization': `token ${this.token}`,
      ...options.headers
    };
    
    if (options.method === 'POST' || options.method === 'PUT' || options.method === 'PATCH') {
      headers['Content-Type'] = 'application/json';
    }
    
    try {
      logger.debug('Making GitHub API request', { endpoint, method: options.method || 'GET' });
      
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(`GitHub API error (${response.status}): ${errorData.message}`);
      }
      
      // Check if there is response content
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json() as T;
      }
      
      return {} as T;
    } catch (error) {
      logger.error('GitHub API request failed', { 
        endpoint, 
        error: error instanceof Error ? error.message : String(error) 
      });
      throw error;
    }
  }
  
  /**
   * Get authenticated user info
   */
  async getCurrentUser(): Promise<any> {
    return this.request('/user');
  }
  
  /**
   * Get user repositories
   */
  async getRepositories(username?: string): Promise<any[]> {
    const endpoint = username ? `/users/${username}/repos` : '/user/repos';
    return this.request(endpoint);
  }
  
  /**
   * Create a new repository
   */
  async createRepository(options: RepoCreateOptions): Promise<any> {
    const response = await this.request('/user/repos', {
      method: 'POST',
      body: JSON.stringify(options)
    });
    
    // Set current repository
    this.currentRepo = options.name;
    
    return response;
  }
  
  /**
   * Delete a repository
   */
  async deleteRepository(owner: string, repo: string): Promise<void> {
    await this.request(`/repos/${owner}/${repo}`, {
      method: 'DELETE'
    });
    
    if (this.currentRepo === repo) {
      this.currentRepo = null;
    }
  }
  
  /**
   * Create a file in a repository
   */
  async createFile(owner: string, repo: string, path: string, options: FileCreateOptions): Promise<any> {
    const encodedContent = btoa(options.content);
    
    return this.request(`/repos/${owner}/${repo}/contents/${path}`, {
      method: 'PUT',
      body: JSON.stringify({
        message: options.message,
        content: encodedContent,
        branch: options.branch
      })
    });
  }
  
  /**
   * Create multiple files in a commit
   */
  async createCommit(owner: string, repo: string, options: CommitOptions): Promise<any> {
    // First, get the latest commit SHA for the branch
    const branchResponse = await this.request(`/repos/${owner}/${repo}/branches/${options.branch || 'main'}`);
    const baseTreeSha = branchResponse.commit.commit.tree.sha;
    
    // Create a tree with all the files
    const treeItems = await Promise.all(options.files.map(async (file) => {
      const blob = await this.request(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: file.content,
          encoding: 'utf-8'
        })
      });
      
      return {
        path: file.path,
        mode: '100644', // Regular file
        type: 'blob',
        sha: blob.sha
      };
    }));
    
    // Create the tree
    const tree = await this.request(`/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });
    
    // Create the commit
    const commit = await this.request(`/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      body: JSON.stringify({
        message: options.message,
        tree: tree.sha,
        parents: [branchResponse.commit.sha]
      })
    });
    
    // Update the branch reference
    return this.request(`/repos/${owner}/${repo}/git/refs/heads/${options.branch || 'main'}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: commit.sha
      })
    });
  }
  
  /**
   * Get repository contents
   */
  async getContents(owner: string, repo: string, path: string = '', ref?: string): Promise<any> {
    const endpoint = `/repos/${owner}/${repo}/contents/${path}`;
    const query = ref ? `?ref=${ref}` : '';
    
    return this.request(`${endpoint}${query}`);
  }
  
  /**
   * Create a branch
   */
  async createBranch(owner: string, repo: string, options: RepoBranchOptions): Promise<any> {
    // Get the SHA of the source branch
    const sourceBranch = options.source_branch || 'main';
    const branchResponse = await this.request(`/repos/${owner}/${repo}/branches/${sourceBranch}`);
    const sha = branchResponse.commit.sha;
    
    // Create the new branch
    return this.request(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${options.name}`,
        sha
      })
    });
  }
  
  /**
   * Create a pull request
   */
  async createPullRequest(owner: string, repo: string, options: PullRequestOptions): Promise<any> {
    return this.request(`/repos/${owner}/${repo}/pulls`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }
  
  /**
   * Create a webhook
   */
  async createWebhook(owner: string, repo: string, options: WebhookOptions): Promise<any> {
    return this.request(`/repos/${owner}/${repo}/hooks`, {
      method: 'POST',
      body: JSON.stringify(options)
    });
  }
  
  /**
   * Create a GitHub Pages site
   */
  async enablePages(owner: string, repo: string, branch: string = 'main'): Promise<any> {
    return this.request(`/repos/${owner}/${repo}/pages`, {
      method: 'POST',
      body: JSON.stringify({
        source: {
          branch,
          path: '/'
        }
      })
    });
  }
  
  /**
   * Create a complete repository with all files
   */
  async createCompleteRepository(
    repoOptions: RepoCreateOptions,
    files: Array<{ path: string; content: string }>
  ): Promise<{ repoUrl: string; cloneUrl: string }> {
    try {
      // Create repository
      const repo = await this.createRepository(repoOptions);
      
      // Get user info if not available
      if (!this.username) {
        const user = await this.getCurrentUser();
        this.username = user.login;
        localStorage.setItem('github_username', user.login);
      }
      
      // Create files
      await this.createCommit(
        this.username!,
        repoOptions.name,
        {
          message: 'Initial commit',
          files,
          branch: 'main'
        }
      );
      
      return {
        repoUrl: repo.html_url,
        cloneUrl: repo.clone_url
      };
    } catch (error) {
      logger.error('Failed to create complete repository', error);
      throw error;
    }
  }
  
  /**
   * Initialize repository with template
   */
  async initializeRepositoryFromTemplate(
    repoOptions: RepoCreateOptions,
    templateType: 'react' | 'vue' | 'angular' | 'next.js' | 'static'
  ): Promise<{ repoUrl: string; cloneUrl: string }> {
    // Collection of template files
    const templateFiles: Record<string, Array<{ path: string; content: string }>> = {
      react: [
        {
          path: 'package.json',
          content: JSON.stringify({
            name: repoOptions.name,
            version: '0.1.0',
            private: true,
            dependencies: {
              'react': '^18.2.0',
              'react-dom': '^18.2.0'
            },
            devDependencies: {
              'vite': '^5.0.0',
              '@vitejs/plugin-react': '^4.0.0',
              'typescript': '^5.0.0'
            },
            scripts: {
              'dev': 'vite',
              'build': 'vite build',
              'preview': 'vite preview'
            }
          }, null, 2)
        },
        {
          path: 'index.html',
          content: `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${repoOptions.name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`
        },
        {
          path: 'src/main.tsx',
          content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`
        },
        {
          path: 'src/App.tsx',
          content: `import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="App">
      <header className="App-header">
        <h1>${repoOptions.name}</h1>
        <p>
          <button onClick={() => setCount((count) => count + 1)}>
            count is {count}
          </button>
        </p>
      </header>
    </div>
  )
}

export default App`
        },
        {
          path: 'src/index.css',
          content: `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

button {
  font-size: 1em;
  padding: 1em 2em;
  border: none;
  background: #61dafb;
  color: #282c34;
  cursor: pointer;
  border-radius: 4px;
  margin: 1em;
}`
        },
        {
          path: 'README.md',
          content: `# ${repoOptions.name}

${repoOptions.description || 'A React application created with GitHub Integration Service.'}

## Getting Started

1. Clone the repository
\`\`\`bash
git clone ${repoOptions.name}.git
cd ${repoOptions.name}
\`\`\`

2. Install dependencies
\`\`\`bash
npm install
\`\`\`

3. Start the development server
\`\`\`bash
npm run dev
\`\`\`

## Build for Production

\`\`\`bash
npm run build
\`\`\`

## Deployment

Built files are in the \`dist\` directory and can be deployed to any static hosting service.`
        }
      ],
      // Other templates (vue, angular, etc.) would be defined here
      vue: [
        // Vue template files
      ],
      'next.js': [
        // Next.js template files
      ],
      angular: [
        // Angular template files
      ],
      static: [
        // Static site template files
      ]
    };
    
    // Use the appropriate template or default to React
    const files = templateFiles[templateType] || templateFiles.react;
    
    // Create repository with files
    return this.createCompleteRepository(repoOptions, files);
  }
}

export default new GitHubIntegrationService();