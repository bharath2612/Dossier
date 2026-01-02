"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.braveSearch = braveSearch;
exports.extractDomain = extractDomain;
exports.prioritizeReputableDomains = prioritizeReputableDomains;
const axios_1 = __importDefault(require("axios"));
async function braveSearch(query, count = 10) {
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
    try {
        const response = await axios_1.default.get('https://api.search.brave.com/res/v1/web/search', {
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
    }
    catch (error) {
        console.error('Brave Search API error:', error);
        // Fallback to empty results
        return [];
    }
}
// Helper to extract domain from URL
function extractDomain(url) {
    try {
        const urlObj = new URL(url);
        return urlObj.hostname.replace('www.', '');
    }
    catch {
        return 'unknown';
    }
}
// Helper to prioritize reputable domains
function prioritizeReputableDomains(results) {
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
        if (aIsReputable && !bIsReputable)
            return -1;
        if (!aIsReputable && bIsReputable)
            return 1;
        return 0;
    });
}
//# sourceMappingURL=brave-search.js.map