import api from "@/lib/api";

export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}

export async function markNotificationAsRead(id: number) {
  const response = await api.post(`/notifications/${id}/read`);
  return response.data;
}

export async function deleteNotification(id: number) {
  const response = await api.delete(`/notifications/${id}`);
  return response.data;
}