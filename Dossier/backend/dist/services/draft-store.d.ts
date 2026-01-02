import { Draft, Outline } from '../types/draft';
declare class DraftStore {
    private drafts;
    save(draft: Draft): Promise<Draft>;
    get(id: string): Promise<Draft | null>;
    delete(id: string): Promise<boolean>;
    updateOutline(id: string, outline: Outline): Promise<Draft | null>;
    getAll(): Promise<Draft[]>;
    clear(): Promise<void>;
}
export declare const draftStore: DraftStore;
export {};
//# sourceMappingURL=draft-store.d.ts.map