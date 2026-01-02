import { Presentation } from '../types/presentation';
declare class PresentationStore {
    private presentations;
    create(presentation: Presentation): Promise<Presentation>;
    get(id: string, userId?: string): Promise<Presentation | null>;
    getAllForUser(userId: string): Promise<Presentation[]>;
    update(id: string, updates: Partial<Presentation>, userId?: string): Promise<Presentation | null>;
    delete(id: string, userId?: string): Promise<boolean>;
    duplicate(id: string, userId: string): Promise<Presentation | null>;
    search(userId: string, query: string): Promise<Presentation[]>;
}
export declare const presentationStore: PresentationStore;
export {};
//# sourceMappingURL=presentation-store.d.ts.map