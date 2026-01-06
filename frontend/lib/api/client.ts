// API client for backend communication
// Always uses local Next.js API routes

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
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    // Always use local Next.js API routes
    const url = endpoint;

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

  // Generate presentation (background generation)
  async generatePresentation(data: {
    draft_id: string;
    outline: any;
    citation_style: string;
    theme: string;
    user_id: string;
  }): Promise<{ presentation_id: string; status: string }> {
    return this.request<{ presentation_id: string; status: string }>(
      '/api/generate-presentation',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Ensure user exists in database
  async ensureUser(data: {
    user_id: string;
    email?: string;
    name?: string;
    avatar_url?: string;
  }): Promise<{ success: boolean; user_id: string; created: boolean }> {
    return this.request<{ success: boolean; user_id: string; created: boolean }>(
      '/api/users/ensure',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  // Get presentation by ID
  async getPresentation(id: string, userId?: string): Promise<{ presentation: any }> {
    const url = userId 
      ? `/api/presentations/${id}?user_id=${userId}`
      : `/api/presentations/${id}`;
    return this.request<{ presentation: any }>(url);
  }

  // Get all presentations for a user
  async getPresentations(userId: string, searchQuery?: string): Promise<{ presentations: any[] }> {
    const url = searchQuery
      ? `/api/presentations?user_id=${userId}&q=${encodeURIComponent(searchQuery)}`
      : `/api/presentations?user_id=${userId}`;
    return this.request<{ presentations: any[] }>(url);
  }

  // Update presentation
  async updatePresentation(
    id: string,
    updates: any,
    userId?: string
  ): Promise<{ presentation: any; message: string }> {
    const url = userId
      ? `/api/presentations/${id}?user_id=${userId}`
      : `/api/presentations/${id}`;
    return this.request<{ presentation: any; message: string }>(url, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Delete presentation
  async deletePresentation(id: string, userId?: string): Promise<{ message: string }> {
    const url = userId
      ? `/api/presentations/${id}?user_id=${userId}`
      : `/api/presentations/${id}`;
    return this.request<{ message: string }>(url, {
      method: 'DELETE',
    });
  }

  // Duplicate presentation
  async duplicatePresentation(id: string, userId: string): Promise<{ presentation_id: string; message: string }> {
    return this.request<{ presentation_id: string; message: string }>(
      `/api/presentations/${id}/duplicate`,
      {
        method: 'POST',
        body: JSON.stringify({ user_id: userId }),
      }
    );
  }

  // Get draft by ID
  async getDraft(id: string): Promise<{ draft: any }> {
    return this.request<{ draft: any }>(`/api/drafts/${id}`);
  }

  // Create draft
  async createDraft(data: {
    title: string;
    prompt: string;
    enhanced_prompt?: string;
    outline: any;
  }): Promise<{ draft: any; message: string }> {
    return this.request<{ draft: any; message: string }>('/api/drafts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Update draft
  async updateDraft(id: string, updates: { outline?: any; title?: string }): Promise<{ draft: any; message: string }> {
    return this.request<{ draft: any; message: string }>(`/api/drafts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  // Delete draft
  async deleteDraft(id: string): Promise<{ message: string; id: string }> {
    return this.request<{ message: string; id: string }>(`/api/drafts/${id}`, {
      method: 'DELETE',
    });
  }

  // Get SSE stream URL for presentation status
  getPresentationStreamUrl(id: string, userId?: string): string {
    return userId
      ? `/api/presentations/${id}/stream?user_id=${userId}`
      : `/api/presentations/${id}/stream`;
  }

  // Generate presentation with streaming (optional enhancement)
  async generatePresentationStream(
    data: {
      presentation_id: string;
      draft_id: string;
      outline: any;
      citation_style: string;
      theme: string;
      user_id: string;
    },
    onProgress?: (chunk: string) => void
  ): Promise<void> {
    const url = '/api/generate-presentation/stream';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || error.error || 'Streaming failed');
    }

    // Handle streaming response
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('No response body');
    }

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      if (onProgress) {
        onProgress(chunk);
      }
    }
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/health');
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
