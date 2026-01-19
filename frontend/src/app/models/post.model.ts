export interface Post {
    id: number;
    title: string;
    content: string;
    mediaUrl: string;
    createdAt: string;
    author: {
        username: string;
    };
}