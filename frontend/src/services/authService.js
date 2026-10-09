import api from "./api.js";

export async function registerAccount(payload) {
  const { data } = await api.post("/api/v1/auth/register", payload);
  return data;
}

export async function loginAccount(payload) {
  const { data } = await api.post("/api/v1/auth/login", payload);
  return data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/api/v1/auth/me");
  return data;
}

export async function getResearcherProfile() {
  const { data } = await api.get("/api/v1/researchers/me");
  return data;
}

export async function updateResearcherProfile(payload) {
  const { data } = await api.put("/api/v1/researchers/me", payload);
  return data;
}

export async function getCompanyProfile() {
  const { data } = await api.get("/api/v1/companies/me");
  return data;
}

export async function updateCompanyProfile(payload) {
  const { data } = await api.put("/api/v1/companies/me", payload);
  return data;
}

export async function listAdminUsers() {
  const { data } = await api.get("/api/v1/admin/users");
  return data;
}

export async function verifyAdminUser(userId) {
  const { data } = await api.patch(`/api/v1/admin/users/${userId}/verify`);
  return data;
}

export async function activateAdminUser(userId) {
  const { data } = await api.patch(`/api/v1/admin/users/${userId}/activate`);
  return data;
}

export async function deactivateAdminUser(userId) {
  const { data } = await api.patch(`/api/v1/admin/users/${userId}/deactivate`);
  return data;
}
