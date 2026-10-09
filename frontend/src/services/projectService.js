import api from "./api.js";

export async function createProject(payload) {
  const { data } = await api.post("/api/v1/projects", payload);
  return data;
}

export async function getMyProjects(page = 1, limit = 10) {
  const { data } = await api.get("/api/v1/projects/my", { params: { page, limit } });
  return data;
}

export async function getProject(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}`);
  return data;
}

export async function updateProject(projectId, payload) {
  const { data } = await api.put(`/api/v1/projects/${projectId}`, payload);
  return data;
}

export async function deleteProject(projectId) {
  const { data } = await api.delete(`/api/v1/projects/${projectId}`);
  return data;
}

export async function publishProject(projectId) {
  const { data } = await api.patch(`/api/v1/projects/${projectId}/publish`);
  return data;
}

export async function archiveProject(projectId) {
  const { data } = await api.patch(`/api/v1/projects/${projectId}/archive`);
  return data;
}

export async function uploadPaper(projectId, file) {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post(`/api/v1/projects/${projectId}/paper`, form, { timeout: 120000 });
  return data;
}

export async function getPaper(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/paper`);
  return data;
}

export async function deletePaper(projectId) {
  const { data } = await api.delete(`/api/v1/projects/${projectId}/paper`);
  return data;
}

export async function downloadPaper(projectId, filename = "research-paper.pdf") {
  const response = await api.get(`/api/v1/projects/${projectId}/paper/download`, {
    responseType: "blob",
    timeout: 120000,
  });
  const url = window.URL.createObjectURL(response.data);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export async function analyzeProject(projectId) {
  const { data } = await api.post(`/api/v1/projects/${projectId}/analyze`, {}, { timeout: 180000 });
  return data;
}

export async function getAnalysis(projectId) {
  const { data } = await api.get(`/api/v1/projects/${projectId}/analysis`);
  return data;
}
