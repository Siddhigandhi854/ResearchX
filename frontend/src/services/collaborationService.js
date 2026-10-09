import api from "./api.js";

export async function sendCollaborationRequest(payload) {
  const { data } = await api.post("/api/v1/collaboration/requests", payload);
  return data;
}

export async function getReceivedRequests() {
  const { data } = await api.get("/api/v1/collaboration/requests/received");
  return data;
}

export async function getSentRequests() {
  const { data } = await api.get("/api/v1/collaboration/requests/sent");
  return data;
}

export async function acceptRequest(requestId) {
  const { data } = await api.patch(`/api/v1/collaboration/requests/${requestId}/accept`);
  return data;
}

export async function rejectRequest(requestId) {
  const { data } = await api.patch(`/api/v1/collaboration/requests/${requestId}/reject`);
  return data;
}

export async function cancelRequest(requestId) {
  const { data } = await api.patch(`/api/v1/collaboration/requests/${requestId}/cancel`);
  return data;
}
