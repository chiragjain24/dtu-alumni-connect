export interface Tweet {
    id: string;
    content: string;
    parentTweetId?: string | null;
    isRetweet: boolean;
    originalTweetId?: string | null;
    likesCount: number;
    retweetsCount: number;
    repliesCount: number;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    authorName: string | null;
    authorUsername: string | null;
    authorImage: string | null;
    isLikedByUser?: boolean;
    isRetweetedByUser?: boolean;
    replies?: Tweet[]; // For nested thread structure
}
