import { apiClient } from "@/services/apiClient";
import { StandardResponse, EventItem } from "@/types/api";

export const eventService = {
  async getEvents(page: number = 1) {
    const res = await apiClient.get<StandardResponse<EventItem[]>>("/events", {
      params: { page, limit: 10 }
    });
    return res.data;
  },

  async registerForEvent(eventId: string) {
    const res = await apiClient.post<StandardResponse<{ registered: boolean }>>(`/events/${eventId}/register`);
    return res.data;
  }
};
