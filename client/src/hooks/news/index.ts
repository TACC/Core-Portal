export interface UserNewsResponse {
    id: number;
    author: string;
    title: string;
    subtitle: string;
    webtitle: string;
    content: string;
    posted: string;
    postedUTC: string;
    downtime: boolean;
    categoryId: number | null;
    categories: {
      id: number;
      name: string;
      description: string;
      type: string;
    }[];
    updates: {
      id: number;
      content: string;
      posted: string;
      postedUTC: string;
    }[];
}
