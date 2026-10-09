import api from "./api.js";

export async function getMyProfile() {
  const { data } = await api.get("/api/v1/profile/me");
  return data;
}

export async function updateMyProfile(payload) {
  const { data } = await api.put("/api/v1/profile/me", payload);
  return data;
}

export async function getPublicResearcher(userId) {
  const { data } = await api.get(`/api/v1/researchers/${userId}`);
  return data;
}

export async function listResearchers(page = 1, limit = 12, domain = "") {
  const { data } = await api.get("/api/v1/researchers", {
    params: { page, limit, domain: domain || undefined },
  });
  return data;
}
