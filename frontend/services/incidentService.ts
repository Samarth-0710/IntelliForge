import api from "@/lib/api";

export async function getIncidents() {
  const response = await api.get("/incidents");
  return response.data;
}

export async function createIncident(data: any) {
  const response = await api.post("/incidents", data);
  return response.data;
}
