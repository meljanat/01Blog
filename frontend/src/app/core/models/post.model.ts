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
    author: {
        username: string,
        profilePictureUrl?: string;
    };
    createdAt: string;
    likes: { username: string }[];
    comments: Comment[];

    constructor(data: any) {
        this.id = data.id;
        this.text = data.text;
        this.mediaUrl = data.mediaUrl;
        this.author = data.author;
        this.createdAt = data.createdAt;
        this.likes = data.likes || [];
        this.comments = data.comments || [];
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
    }
}