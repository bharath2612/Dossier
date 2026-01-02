interface BraveSearchResult {
    title: string;
    url: string;
    description: string;
}
export declare function braveSearch(query: string, count?: number): Promise<BraveSearchResult[]>;
export declare function extractDomain(url: string): string;
export declare function prioritizeReputableDomains(results: BraveSearchResult[]): BraveSearchResult[];
export {};
//# sourceMappingURL=brave-search.d.ts.map