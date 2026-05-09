export interface Comment {
    id: number;
    text: string;
    createdAt: string;
    author: {
        username: string,
        profilePictureUrl?: string;
    };
}

export class Post {
    id: number;
    text: string;
    mediaUrl?: string;
    mediaType?: string;
    hidden: boolean;
    author: {
        username: string,
        profilePictureUrl?: string;
    };
    createdAt: string;
    likes: { username: string }[];
    comments: Comment[];
    commentsCount: number;

    constructor(data: any) {
        this.id = data.id;
        this.text = data.text;
        this.mediaUrl = data.mediaUrl;
        this.mediaType = data.mediaType;
        this.hidden = Boolean(data.hidden);
        this.author = data.author;
        this.createdAt = data.createdAt;
        this.likes = data.likes || [];
        this.comments = data.comments || [];
        this.commentsCount = data.commentsCount ?? this.comments.length ?? 0;
    }

    isLikedBy(username: string): boolean {
        return this.likes.some(user => user.username === username);
    }

    toggleLocalLike(username: string) {
        if (this.isLikedBy(username)) {
            this.likes = this.likes.filter(user => user.username !== username);
        } else {
            this.likes.push({ username });
        }
    }

    addLocalComment(comment: Comment) {
        this.comments.push(comment);
        this.commentsCount++;
    }
}
