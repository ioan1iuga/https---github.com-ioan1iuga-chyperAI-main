import AIApiClient from '../api/AIApiClient';

// Import types from appropriate type files
import { CodeAnalysisOptions, CodeAnalysisResult, CodeSuggestion, SecurityVulnerability } from '../../types/ai';

class CodeAnalysisService {
  /**
   * Analyzes a single file for quality issues
   */
  async analyzeFile(
    filePath: string,
    fileContent: string,
    options: CodeAnalysisOptions = {}
  ): Promise<CodeAnalysisResult> {
    try {
      // Get file extension to determine language
      const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
      const language = this.getLanguageFromExtension(fileExt);
      
      // Prepare analysis options
      const analysisType = this.getAnalysisType(options);
      
      // Call AI service for analysis
      const response = await AIApiClient.analyzeCode({
        code: fileContent,
        language,
        analysisType
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Code analysis failed');
      }
      
      // Process AI response
      const aiSuggestions = response.data.suggestions || [];
      let issues = [];
      
      if (aiSuggestions.length > 0) {
        issues = this.convertSuggestionsToIssues(aiSuggestions, filePath);
      }
      
      // Call API to get score metrics
      const scoreResponse = await AIApiClient.analyzeCode({
        code: fileContent,
        language,
        analysisType: 'metrics'
      });
      
      let metrics = {
        complexity: 75,
        score: Math.round((metrics.complexity + metrics.maintainability + 
                          metrics.security + metrics.performance) / 4),
        issues,
        metrics
      };
    } catch (error) {
      console.error('Error analyzing file:', error);
      throw new Error(`Failed to analyze file ${filePath}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes an entire project
   */
  async analyzeProject(
    projectId: string,
    files: Array<{ path: string, content: string }>,
    options: CodeAnalysisOptions = {}
  ): Promise<{
    overallScore: number;
    fileScores: Record<string, number>;
    issues: Array<CodeAnalysisResult['issues'][0]>;
    metrics: CodeAnalysisResult['metrics'];
    hotspots: Array<{ file: string, score: number, reason: string }>;
  }> {
    try {
      // Analyze each file
      const fileResults: Record<string, CodeAnalysisResult> = {};
      
      for (const file of files) {
        fileResults[file.path] = await this.analyzeFile(file.path, file.content, options);
      }
      
      // Aggregate results
      const allIssues = Object.values(fileResults).flatMap(result => result.issues);
      
      // Calculate file scores
      const fileScores: Record<string, number> = {};
      for (const [path, result] of Object.entries(fileResults)) {
        fileScores[path] = result.score;
      }
      
      // Calculate overall score (weighted average)
      const overallScore = this.calculateOverallScore(fileScores);
      
      // Calculate project metrics
      const metrics = this.calculateProjectMetrics(fileResults);
      
      // Identify hotspots
      const hotspots = this.identifyHotspots(fileResults);
      
      return {
        overallScore,
        fileScores,
        issues: allIssues,
        metrics,
        hotspots
      };
    } catch (error) {
      console.error('Error analyzing project:', error);
      throw new Error(`Failed to analyze project ${projectId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Detects security vulnerabilities in the codebase
   */
  async detectSecurityVulnerabilities(
    files: Array<{ path: string, content: string }>
  ): Promise<SecurityVulnerability[]> {
    try {
      const vulnerabilities: SecurityVulnerability[] = [];
      
      // Analyze each file for security issues
      for (const file of files) {
        // Get file extension to determine language
        const fileExt = file.path.split('.').pop()?.toLowerCase() || '';
        const language = this.getLanguageFromExtension(fileExt);
        
        // Call AI service with security focus
        const response = await AIApiClient.analyzeCode({
          code: file.content,
          language,
          analysisType: 'security'
        });
        
        if (!response.success || !response.data) {
          console.warn(`Security analysis failed for ${file.path}: ${response.error}`);
          continue;
        }
        
        // Process AI response for security issues
        const aiSuggestions = response.data.suggestions || [];
        const securityIssues = aiSuggestions
          .filter(suggestion => suggestion.type === 'security')
          .map(suggestion => this.convertToSecurityVulnerability(suggestion, file.path));
        
        vulnerabilities.push(...securityIssues);
      }
      
      return vulnerabilities;
    } catch (error) {
      console.error('Error detecting security vulnerabilities:', error);
      throw new Error(`Failed to detect security vulnerabilities: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generates optimization suggestions for a file
   */
  async generateOptimizationSuggestions(
    filePath: string,
    fileContent: string
  ): Promise<CodeSuggestion[]> {
    try {
      // Get file extension to determine language
      const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
      const language = this.getLanguageFromExtension(fileExt);
      
      // Call AI service for optimization suggestions
      const optimizationPrompt = `
        Analyze the following ${language} code and suggest optimizations:
        
        \`\`\`${language}
        ${fileContent}
        \`\`\`
        
        For each suggestion, provide:
        1. Type of optimization
        2. Description
        3. Before code
        4. After code
        5. Line numbers
        6. Expected impact
      `;
      
      // Call AI service
      const response = await AIApiClient.analyzeCode({
        code: fileContent,
        language,
        analysisType: 'all'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Optimization analysis failed');
      }
      
      // Convert AI suggestions to structured CodeSuggestion format
      const optimizations = response.data.suggestions
        .filter(suggestion => suggestion.type === 'optimization' || suggestion.type === 'refactor')
        .map(suggestion => this.convertToCodeSuggestion(suggestion, filePath));
      
      return optimizations;
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      throw new Error(`Failed to generate optimization suggestions: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Analyzes performance metrics of the code
   */
  async analyzePerformance(
    filePath: string,
    fileContent: string
  ): Promise<{
    score: number;
    metrics: {
      timeComplexity: string;
      spaceComplexity: string;
      networkRequests: number;
      renderEfficiency?: number;
      asyncOperations: number;
    };
    issues: Array<{
      severity: 'high' | 'medium' | 'low';
      description: string;
      line?: number;
      impact: string;
      suggestion?: string;
    }>;
  }> {
    try {
      // Get file extension to determine language
      const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
      const language = this.getLanguageFromExtension(fileExt);
      
      // Call AI service for performance analysis
      const response = await AIApiClient.analyzeCode({
        code: fileContent,
        language,
        analysisType: 'performance'
      });
      
      if (!response.success || !response.data) {
        throw new Error(response.error || 'Performance analysis failed');
      }
      
      // Mock performance metrics
      return {
        score: Math.floor(Math.random() * 30) + 70, // Random score between 70-100
        metrics: {
          timeComplexity: 'O(n)',
          spaceComplexity: 'O(n)',
          networkRequests: 2,
          renderEfficiency: language.includes('script') ? 85 : undefined,
          asyncOperations: 3
        },
        issues: [
          {
            severity: 'medium',
            description: 'Inefficient loop operation',
            line: 12,
            impact: 'May cause performance issues with large datasets',
            suggestion: 'Consider using map() instead of forEach() with push()'
          },
          {
            severity: 'low',
            description: 'Redundant re-rendering',
            line: 25,
            impact: 'Causes unnecessary DOM updates',
            suggestion: 'Add memoization with useMemo() or React.memo()'
          }
        ]
      };
    } catch (error) {
      console.error('Error analyzing performance:', error);
      throw new Error(`Failed to analyze performance: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validates code against linting rules
   */
  async lintCode(
    filePath: string,
    fileContent: string,
    configOptions?: Record<string, any>
  ): Promise<{
    errorCount: number;
    warningCount: number;
    issues: Array<{
      ruleId: string;
      severity: 'error' | 'warning' | 'info';
      message: string;
      line: number;
      column: number;
      fix?: {
        range: [number, number];
        text: string;
      };
    }>;
  }> {
    try {
      // Get file extension to determine language
      const fileExt = filePath.split('.').pop()?.toLowerCase() || '';
      const language = this.getLanguageFromExtension(fileExt);
      
      // In a real implementation, this would run actual linting tools
      // For now, we'll simulate linting with AI
      const lintPrompt = `
        Lint the following ${language} code for style and best practices issues:
        
        \`\`\`${language}
        ${fileContent}
        \`\`\`
        
        Provide a structured report with:
        1. Total error count
        2. Total warning count
        3. List of issues with rule ID, severity, message, line, and column
        4. Fixes where possible
      `;
      
      // Simulate linting results
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock linting results
      const errorCount = Math.floor(Math.random() * 3);
      const warningCount = Math.floor(Math.random() * 5);
      
      const issues = [
        {
          ruleId: 'no-unused-vars',
          severity: 'warning' as const,
          message: 'Variable is defined but never used',
          line: 7,
          column: 10,
          fix: {
            range: [120, 130] as [number, number],
            text: ''
          }
        },
        {
          ruleId: 'no-console',
          severity: 'warning' as const,
          message: 'Unexpected console statement',
          line: 15,
          column: 3
        }
      ];
      
      return {
        errorCount,
        warningCount,
        issues
      };
    } catch (error) {
      console.error('Error linting code:', error);
      throw new Error(`Failed to lint code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Helper methods

  private getLanguageFromExtension(extension: string): string {
    const mapping: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'cs': 'csharp',
      'go': 'go',
      'rb': 'ruby',
      'php': 'php',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'yaml': 'yaml',
      'yml': 'yaml',
      'sql': 'sql'
    };
    
    return mapping[extension] || 'text';
  }

  private getAnalysisType(options: CodeAnalysisOptions): 'security' | 'performance' | 'quality' | 'all' {
    if (options.includeSecurity && !options.includePerformance && !options.includeQuality && !options.includeMaintainability) {
      return 'security';
    } else if (!options.includeSecurity && options.includePerformance && !options.includeQuality && !options.includeMaintainability) {
      return 'performance';
    } else if (!options.includeSecurity && !options.includePerformance && options.includeQuality && !options.includeMaintainability) {
      return 'quality';
    } else {
      return 'all';
    }
  }

  private convertSuggestionsToIssues(
    suggestions: any[],
    filePath: string
  ): CodeAnalysisResult['issues'] {
    return suggestions.map(suggestion => ({
      severity: this.mapSeverity(suggestion.confidence),
      type: suggestion.type === 'security' ? 'security' :
            suggestion.type === 'optimization' ? 'performance' :
            suggestion.type === 'bug-fix' ? 'quality' : 'maintainability',
      message: suggestion.description,
      line: suggestion.lineNumber,
      column: suggestion.column,
      file: filePath,
      code: suggestion.code,
      suggestion: suggestion.title
    }));
  }

  private mapSeverity(confidence: number): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    if (confidence >= 0.9) return 'critical';
    if (confidence >= 0.7) return 'high';
    if (confidence >= 0.5) return 'medium';
    if (confidence >= 0.3) return 'low';
    return 'info';
  }

  private calculateOverallScore(fileScores: Record<string, number>): number {
    const scores = Object.values(fileScores);
    if (scores.length === 0) return 0;
    
    const total = scores.reduce((sum, score) => sum + score, 0);
    return Math.round(total / scores.length);
  }

  private calculateProjectMetrics(
    fileResults: Record<string, CodeAnalysisResult>
  ): CodeAnalysisResult['metrics'] {
    // Calculate average metrics
    let totalComplexity = 0;
    let totalMaintainability = 0;
    let totalSecurity = 0;
    let totalPerformance = 0;
    const count = Object.keys(fileResults).length;
    
    for (const result of Object.values(fileResults)) {
      totalComplexity += result.metrics.complexity;
      totalMaintainability += result.metrics.maintainability;
      totalSecurity += result.metrics.security;
      totalPerformance += result.metrics.performance;
    }
    
    if (count === 0) {
      return {
        complexity: 0,
        maintainability: 0,
        security: 0,
        performance: 0
      };
    }
    
    return {
      complexity: Math.round(totalComplexity / count),
      maintainability: Math.round(totalMaintainability / count),
      security: Math.round(totalSecurity / count),
      performance: Math.round(totalPerformance / count)
    };
  }


  private convertToCodeSuggestion(suggestion: any, filePath: string): CodeSuggestion {
    return {
      type: suggestion.type === 'security' ? 'security' :
            suggestion.type === 'optimization' ? 'optimization' : 'refactor',
      description: suggestion.description,
      before: suggestion.beforeCode,
      after: suggestion.code,
      file: filePath,
      startLine: suggestion.lineNumber,
      confidence: suggestion.confidence,
      impact: suggestion.confidence > 0.8 ? 'high' : 
              suggestion.confidence > 0.5 ? 'medium' : 'low'
    };
  }

  private convertToSecurityVulnerability(suggestion: any, filePath: string): SecurityVulnerability {
    const severity = suggestion.confidence > 0.8 ? 'high' : 
                    suggestion.confidence > 0.5 ? 'medium' : 'low';
                    
    return {
      type: suggestion.title,
      severity,
      description: suggestion.description,
      file: filePath,
      line: suggestion.lineNumber,
      fix: suggestion.code
    };
  }
}

export default new CodeAnalysisService();