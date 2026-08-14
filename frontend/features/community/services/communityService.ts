import { apiClient } from "@/services/apiClient";
import { StandardResponse, CommunityPostItem } from "@/types/api";

export interface CreatePostPayload {
  title: string;
  content: string;
  post_type?: string;
}

export const communityService = {
  async getPosts(page: number = 1, postType?: string) {
    const res = await apiClient.get<StandardResponse<CommunityPostItem[]>>("/community/posts", {
      params: { page, limit: 10, post_type: postType }
    });
    return res.data;
  },

  async createPost(payload: CreatePostPayload) {
    const res = await apiClient.post<StandardResponse<CommunityPostItem>>("/community/posts", payload);
    return res.data;
  },

  async likePost(postId: string) {
    const res = await apiClient.post<StandardResponse<{ liked: boolean; likes_count: number }>>(`/community/posts/${postId}/like`);
    return res.data;
  },

  async getComments(postId: string) {
    const res = await apiClient.get<StandardResponse<any[]>>(`/community/posts/${postId}/comments`);
    return res.data;
  },

  async createComment(postId: string, content: string) {
    const res = await apiClient.post<StandardResponse<any>>(`/community/posts/${postId}/comments`, { content });
    return res.data;
  }
};
