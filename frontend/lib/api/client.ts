// API client for backend communication

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface ApiError {
  error: string;
  message?: string;
  suggestions?: string[];
}

export interface PreprocessResponse {
  enhanced_prompt: string;
  validation: {
    is_valid: boolean;
    warnings: string[];
  };
}

export interface GenerateOutlineResponse {
  draft_id: string;
  title: string;
  outline: {
    title: string;
    slides: Array<{
      index: number;
      title: string;
      bullets: string[];
      type: 'intro' | 'content' | 'data' | 'quote' | 'conclusion';
    }>;
  };
  research: {
    topic: string;
    findings: Array<{
      stat: string;
      context: string;
      source: {
        title: string;
        url: string;
        domain: string;
        date?: string;
      };
    }>;
    frameworks: Array<{
      name: string;
      description: string;
      source: {
        title: string;
        url: string;
        domain: string;
      };
    }>;
  };
  token_usage: {
    preprocessor: number;
    research: number;
    outline: number;
    total: number;
  };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    // Remove trailing slash to prevent double slashes
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const error = data as ApiError;
        throw new Error(error.message || error.error || 'API request failed');
      }

      return data as T;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // Preprocess prompt
  async preprocessPrompt(prompt: string): Promise<PreprocessResponse> {
    return this.request<PreprocessResponse>('/api/preprocess', {
      method: 'POST',
      body: JSON.stringify({ prompt }),
    });
  }

  // Generate outline (full pipeline)
  async generateOutline(
    enhanced_prompt: string,
    onProgress?: (progress: number) => void
  ): Promise<GenerateOutlineResponse> {
    // For now, we'll simulate progress since we're not using SSE yet
    // In Phase 2.6 (streaming), we'll implement real SSE progress updates

    if (onProgress) onProgress(10); // Starting

    const result = await this.request<GenerateOutlineResponse>(
      '/api/generate-outline',
      {
        method: 'POST',
        body: JSON.stringify({ enhanced_prompt }),
      }
    );

    if (onProgress) onProgress(100); // Complete

    return result;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
