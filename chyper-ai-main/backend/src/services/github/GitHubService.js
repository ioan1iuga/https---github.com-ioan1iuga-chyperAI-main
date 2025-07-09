class GitHubService {
  constructor() {
    this.token = process.env.GITHUB_TOKEN;
    this.baseUrl = 'https://api.github.com';
  }

  async getRepositories() {
    try {
      const response = await fetch(`${this.baseUrl}/user/repos`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error);
      return [];
    }
  }

  async triggerDeployment(owner, repo, deploymentData) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/deployments`, {
        method: 'POST',
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ref: deploymentData.ref || 'main',
          environment: deploymentData.environment || 'production',
          description: deploymentData.description || 'Automated deployment from CodeCraft'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to trigger deployment: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error triggering GitHub deployment:', error);
      throw error;
    }
  }

  async getWorkflowRuns(owner, repo) {
    try {
      const response = await fetch(`${this.baseUrl}/repos/${owner}/${repo}/actions/runs`, {
        headers: {
          'Authorization': `token ${this.token}`,
          'Accept': 'application/vnd.github.v3+json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching workflow runs:', error);
      return { workflow_runs: [] };
    }
  }
}

export default new GitHubService();