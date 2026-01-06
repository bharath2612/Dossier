import axios from 'axios';

interface BraveSearchResult {
  title: string;
  url: string;
  description: string;
}

interface BraveSearchResponse {
  web?: {
    results: BraveSearchResult[];
  };
}

export async function braveSearch(query: string, count: number = 10, retries: number = 2): Promise<BraveSearchResult[]> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY;

  if (!apiKey) {
    console.warn('BRAVE_SEARCH_API_KEY not set, using mock data');
    // Return mock data for development
    return [
      {
        title: `${query} - Research Article`,
        url: 'https://example.com/research',
        description: `Comprehensive research on ${query} with data-driven insights and analysis.`,
      },
      {
        title: `Latest Trends in ${query}`,
        url: 'https://example.com/trends',
        description: `Current trends and statistics about ${query} from industry experts.`,
      },
    ];
  }

  let lastError: any = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await axios.get<BraveSearchResponse>('https://api.search.brave.com/res/v1/web/search', {
        headers: {
          'Accept': 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        params: {
          q: query,
          count: count,
          search_lang: 'en',
          country: 'us',
          safesearch: 'moderate',
          freshness: 'py', // Past year
        },
        timeout: 10000,
      });

      return response.data.web?.results || [];
    } catch (error: any) {
      lastError = error;
      
      // Check if it's a rate limit error (429)
      if (error.response?.status === 429) {
        const retryAfter = error.response.headers['retry-after'] 
          ? parseInt(error.response.headers['retry-after'], 10) 
          : Math.pow(2, attempt) * 2; // Exponential backoff: 2s, 4s, 8s
        
        if (attempt < retries) {
          console.warn(`Brave Search API rate limited (429). Retrying after ${retryAfter}s (attempt ${attempt + 1}/${retries + 1})...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        } else {
          console.error('Brave Search API rate limit exceeded. All retries exhausted.');
          // Return empty results - will fall back to Claude's base knowledge
          return [];
        }
      }
      
      // For other errors, log and return empty results
      if (attempt === 0) {
        console.error('Brave Search API error:', error.response?.status || error.message);
      }
      
      // Don't retry on non-rate-limit errors
      return [];
    }
  }

  // If we exhausted retries for rate limit, return empty
  return [];
}

// Helper to extract domain from URL
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Helper to prioritize reputable domains
export function prioritizeReputableDomains(results: BraveSearchResult[]): BraveSearchResult[] {
  const reputableDomains = [
    '.edu', '.gov', '.org',
    'nature.com', 'science.org', 'nih.gov',
    'harvard.edu', 'mit.edu', 'stanford.edu',
    'forbes.com', 'wsj.com', 'bloomberg.com',
    'mckinsey.com', 'bcg.com', 'deloitte.com',
  ];

  return results.sort((a, b) => {
    const aIsReputable = reputableDomains.some((domain) => a.url.includes(domain));
    const bIsReputable = reputableDomains.some((domain) => b.url.includes(domain));

    if (aIsReputable && !bIsReputable) return -1;
    if (!aIsReputable && bIsReputable) return 1;
    return 0;
  });
}

