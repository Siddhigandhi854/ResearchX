import api from "./api.js";

export async function listOpenProblems(page = 1, limit = 12, domain = "") {
  const { data } = await api.get("/api/v1/problems", { params: { page, limit, domain: domain || undefined } });
  return data;
}

export async function listMyProblems(page = 1, limit = 24) {
  const { data } = await api.get("/api/v1/problems/my", { params: { page, limit } });
  return data;
}

export async function createProblem(payload) {
  const { data } = await api.post("/api/v1/problems", payload);
  return data;
}

export async function getProblem(problemId) {
  const { data } = await api.get(`/api/v1/problems/${problemId}`);
  return data;
}

export async function updateProblem(problemId, payload) {
  const { data } = await api.put(`/api/v1/problems/${problemId}`, payload);
  return data;
}

export async function publishProblem(problemId) {
  const { data } = await api.patch(`/api/v1/problems/${problemId}/publish`);
  return data;
}

export async function closeProblem(problemId) {
  const { data } = await api.patch(`/api/v1/problems/${problemId}/close`);
  return data;
}

export async function deleteProblem(problemId) {
  const { data } = await api.delete(`/api/v1/problems/${problemId}`);
  return data;
}
