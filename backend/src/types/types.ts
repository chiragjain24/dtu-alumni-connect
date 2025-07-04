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
    isBookmarkedByUser?: boolean;
    replies?: Tweet[]; // For nested thread structure
}

// Extended Tweet type for internal processing during tree traversal
export interface TweetWithTreeMetadata extends Tweet {
    nodeType: 'target' | 'parent' | 'reply' | 'unknown';
    treeLevel: number;
    replyId?: string; // Used in user profile replies to group replies with their parents 
}