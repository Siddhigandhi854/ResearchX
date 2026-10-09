import api from "./api.js";

export async function getProjectRecommendations(projectId, limit = 5) {
  const { data } = await api.get(`/api/v1/recommendations/projects/${projectId}`, { params: { limit } });
  return data;
}

export async function getResearcherRecommendations(projectId, limit = 5) {
  const { data } = await api.get(`/api/v1/recommendations/researchers/${projectId}`, { params: { limit } });
  return data;
}
