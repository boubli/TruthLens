export interface Quest {
    id: string; // Unique ID (generated or derived from timestamp)
    title: string; // Short, punchy title
    description: string; // The challenge description
    difficulty: 'easy' | 'medium' | 'hard';
    type: 'social' | 'physical' | 'mindfulness' | 'creative';
    completed: boolean;
    createdAt: Date;
    completedAt?: Date;
    skipped?: boolean;
}

export interface QuestHistoryItem {
    questId: string;
    title: string;
    timestamp: Date;
    action: 'completed' | 'skipped' | 'ignored';
}
