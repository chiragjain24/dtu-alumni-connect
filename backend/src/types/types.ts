export interface MediaItem {
    url: string;
    type: 'image' | 'document';
    name: string;
    size: number;
    mimeType: string;
}

export interface Tweet {
    id: string;
    content: string;
    parentTweetId?: string | null;
    isRetweet: boolean;
    originalTweetId?: string | null;
    mediaItems: MediaItem[] | null;
    likesCount: number;
    retweetsCount: number;
    repliesCount: number;
    createdAt: Date;
    updatedAt: Date;
    authorId: string;
    authorName: string | null;
    authorUsername: string | null;
    authorImage: string | null;
    isLikedByUser?: boolean;
    isRetweetedByUser?: boolean;
    replies?: Tweet[]; // For nested thread structure
}
