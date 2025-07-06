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
    createdAt: string;
    updatedAt: string;
    authorId: string;
    authorName: string | null;
    authorUsername: string | null;
    authorImage: string | null;
    isLikedByUser?: boolean;
    isRetweetedByUser?: boolean;
    isBookmarkedByUser?: boolean;
    replies?: Tweet[]; // For nested thread structure
}

interface NotificationMetadata {
    tweetContent?: string;
    tweetAuthor?: string;
    [key: string]: any;
}

export interface Notification {
    id: string;
    userId: string;
    type: string;
    actorId: string;
    targetId: string | null;
    targetType: string | null;
    targetTweet?: Tweet | null;
    metadata: NotificationMetadata | null;
    isRead: boolean;
    createdAt: string;
    // Populated from relations
    actorName?: string | null;
    actorUsername?: string | null;
    actorImage?: string | null;
}
