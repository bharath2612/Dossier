import { callClaude } from '@/lib/utils/anthropic';
import { braveSearch, extractDomain, prioritizeReputableDomains } from '@/lib/utils/brave-search';
import type { AgentResponse, ResearchData, ResearchFinding, Framework } from '@/lib/types/agents';

const SYSTEM_PROMPT = `You are a research analyst for an AI presentation generator.

Your role is to extract structured, presentation-ready insights from web search results.

Guidelines:
- Focus on data points, statistics, frameworks, and actionable insights
- Each finding should be: specific stat + one-line context
- Prioritize recent data (2023-2025)
- Include only credible, well-cited information
- Format findings as concise bullet points (1 sentence each)

Output format (JSON only, no markdown):
{
  "topic": "clear topic name",
  "findings": [
    {
      "stat": "Specific data point or key insight",
      "context": "One-line explanation of what this means"
    }
  ],
  "frameworks": [
    {
      "name": "Framework name",
      "description": "Brief description of the framework"
    }
  ]
}

Important:
- Return ONLY valid JSON, no markdown code blocks
- Include 5-10 findings minimum
- Include 2-4 frameworks if applicable
- All findings must be specific and actionable`;

const FEW_SHOT_EXAMPLES = `Example 1:
Topic: "B2B SaaS sales strategies"
Search results: [Various articles about sales tactics, conversion rates, and pipeline management]

Output:
{
  "topic": "B2B SaaS Sales Strategies",
  "findings": [
    {
      "stat": "Companies using value-based selling see 40% higher win rates than feature-focused competitors",
      "context": "Customers care more about ROI than technical specifications"
    },
    {
      "stat": "Average B2B SaaS sales cycle is 84 days for deals over $50K",
      "context": "Complex enterprise sales require sustained engagement and multi-stakeholder buy-in"
    }
  ],
  "frameworks": [
    {
      "name": "MEDDIC",
      "description": "Metrics, Economic Buyer, Decision Criteria, Decision Process, Identify Pain, Champion"
    }
  ]
}

Example 2:
Topic: "Remote team leadership"
Search results: [Articles about remote work, team management, productivity]

Output:
{
  "topic": "Remote Team Leadership",
  "findings": [
    {
      "stat": "Remote teams report 22% higher productivity when using asynchronous communication tools",
      "context": "Async communication reduces meeting fatigue and allows deep focus work"
    }
  ],
  "frameworks": [
    {
      "name": "The 4 C's of Remote Leadership",
      "description": "Communication, Collaboration, Culture, and Connectivity"
    }
  ]
}`;

async function generateSearchQueries(enhancedPrompt: string): Promise<string[]> {
  // Analyze complexity to determine number of queries (1 for simple, 3 for complex)
  const wordCount = enhancedPrompt.split(' ').length;
  const isComplex = wordCount > 20 || enhancedPrompt.includes(',');

  if (!isComplex) {
    // Simple topic: 1 query
    return [enhancedPrompt];
  }

  // Complex topic: generate 3 diverse queries using Claude
  const userPrompt = `Generate 3 diverse search queries for this topic that will return complementary information:
"${enhancedPrompt}"

Return as JSON array of strings (no markdown):
["query 1", "query 2", "query 3"]`;

  try {
    const { content } = await callClaude(
      'You are a search query optimizer. Generate diverse, specific search queries.',
      userPrompt,
      {
        maxTokens: 200,
        temperature: 0.5,
      }
    );

    const queries = JSON.parse(content.replace(/```json\n?|\n?```/g, ''));
    return Array.isArray(queries) ? queries : [enhancedPrompt];
  } catch {
    // Fallback to single query if generation fails
    return [enhancedPrompt];
  }
}

export async function conductResearch(enhancedPrompt: string): Promise<AgentResponse<ResearchData>> {
  try {
    // Step 1: Generate search queries
    const queries = await generateSearchQueries(enhancedPrompt);
    console.log(`Conducting ${queries.length} search(es):`, queries);

    // Step 2: Execute searches and collect results
    // Add delay between queries to avoid rate limits
    let allResults: any[] = [];
    let searchErrors = 0;
    let rateLimitHit = false;

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      
      // Add delay between queries (except first one) to avoid rate limits
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 1000)); // 1 second delay
      }
      
      try {
        const results = await braveSearch(query, 5);
        
        if (results.length === 0 && i === 0) {
          // If first query returns empty and we have multiple queries, might be rate limited
          rateLimitHit = true;
        }
        
        allResults = allResults.concat(results);
      } catch (error) {
        console.error(`Search failed for query "${query}":`, error);
        searchErrors++;
        
        // Check if it's a rate limit error
        if ((error as any)?.response?.status === 429) {
          rateLimitHit = true;
        }
      }
    }

    if (allResults.length === 0) {
      if (rateLimitHit) {
        return {
          success: false,
          error: 'Brave Search API rate limit exceeded. Please wait a moment and try again, or the system will use AI knowledge without web search.',
        };
      }
      return {
        success: false,
        error: 'No search results found. Please try a different prompt.',
      };
    }

    // Step 3: Prioritize reputable sources
    const prioritizedResults = prioritizeReputableDomains(allResults);

    // Step 4: Format search results for Claude
    const searchResultsText = prioritizedResults
      .slice(0, 15) // Take top 15 results
      .map(
        (result, idx) =>
          `[${idx + 1}] ${result.title}
Source: ${result.url}
${result.description}`
      )
      .join('\n\n');

    // Step 5: Extract structured research using Claude
    const userPrompt = `${FEW_SHOT_EXAMPLES}

Now analyze these search results and extract structured research:

Topic: "${enhancedPrompt}"

Search Results:
${searchResultsText}

Extract key findings and frameworks. Return ONLY valid JSON (no markdown):`;

    const { content, tokens } = await callClaude(SYSTEM_PROMPT, userPrompt, {
      maxTokens: 2000,
      temperature: 0.5,
      retries: 1,
    });

    // Parse Claude's response
    const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
    const researchData: ResearchData = JSON.parse(cleanContent);

    // Add source URLs to findings (from search results)
    if (researchData.findings) {
      researchData.findings = researchData.findings.map((finding: ResearchFinding, idx: number) => {
        const result = prioritizedResults[idx] || prioritizedResults[0];
        return {
          ...finding,
          source: {
            title: result?.title || 'Web Research',
            url: result?.url || '',
            domain: extractDomain(result?.url || ''),
            date: new Date().toISOString().split('T')[0],
          },
        };
      });
    }

    // Add sources to frameworks
    if (researchData.frameworks) {
      researchData.frameworks = researchData.frameworks.map((framework: Framework, idx: number) => {
        const result = prioritizedResults[idx] || prioritizedResults[0];
        return {
          ...framework,
          source: {
            title: result?.title || 'Web Research',
            url: result?.url || '',
            domain: extractDomain(result?.url || ''),
          },
        };
      });
    }

    if (searchErrors > 0) {
      if (rateLimitHit) {
        console.warn(`${searchErrors} search(es) failed due to rate limits. Using partial results with Claude's base knowledge.`);
      } else {
        console.warn(`${searchErrors} search(es) failed, showing partial results`);
      }
    }

    return {
      success: true,
      data: researchData,
      token_usage: tokens,
    };
  } catch (error) {
    console.error('Research error:', error);
    return {
      success: false,
      error: `Research failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

