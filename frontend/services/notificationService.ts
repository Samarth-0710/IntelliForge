import api from "@/lib/api";

export async function getNotifications() {
  const response = await api.get("/notifications");
  return response.data;
}