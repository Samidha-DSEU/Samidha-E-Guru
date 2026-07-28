import { apiClient } from "@/services/apiClient";
import { StandardResponse, ResourceItem } from "@/types/api";

export interface ResourceQueryParams {
  chapter_id?: string;
  resource_type_id?: string;
  resource_source_id?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const resourceService = {
  async getResources(params: ResourceQueryParams) {
    const res = await apiClient.get<StandardResponse<ResourceItem[]>>("/resources", { params });
    return res.data;
  },

  async getResourceById(id: string) {
    const res = await apiClient.get<StandardResponse<ResourceItem>>(`/resources/${id}`);
    return res.data;
  },

  async bookmarkResource(id: string) {
    const res = await apiClient.post<StandardResponse<{ bookmarked: boolean }>>(`/resources/${id}/bookmark`);
    return res.data;
  },

  async updateProgress(id: string, isCompleted: boolean) {
    const res = await apiClient.post<StandardResponse<{ progress: number }>>(`/resources/${id}/progress`, {
      is_completed: isCompleted
    });
    return res.data;
  }
};
