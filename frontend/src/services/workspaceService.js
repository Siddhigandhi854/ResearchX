import api from "./api.js";

export async function listWorkspaces() {
  const { data } = await api.get("/api/v1/workspaces");
  return data;
}

export async function getWorkspace(workspaceId) {
  const { data } = await api.get(`/api/v1/workspaces/${workspaceId}`);
  return data;
}

export async function updateWorkspaceStatus(workspaceId, status) {
  const { data } = await api.patch(`/api/v1/workspaces/${workspaceId}/status`, { status });
  return data;
}

export async function listNotes(workspaceId) {
  const { data } = await api.get(`/api/v1/workspaces/${workspaceId}/notes`);
  return data;
}

export async function createNote(workspaceId, content) {
  const { data } = await api.post(`/api/v1/workspaces/${workspaceId}/notes`, { content });
  return data;
}

export async function updateNote(workspaceId, noteId, content) {
  const { data } = await api.put(`/api/v1/workspaces/${workspaceId}/notes/${noteId}`, { content });
  return data;
}

export async function deleteNote(workspaceId, noteId) {
  const { data } = await api.delete(`/api/v1/workspaces/${workspaceId}/notes/${noteId}`);
  return data;
}

export async function listResources(workspaceId) {
  const { data } = await api.get(`/api/v1/workspaces/${workspaceId}/resources`);
  return data;
}

export async function createResource(workspaceId, payload) {
  const { data } = await api.post(`/api/v1/workspaces/${workspaceId}/resources`, payload);
  return data;
}

export async function deleteResource(workspaceId, resourceId) {
  const { data } = await api.delete(`/api/v1/workspaces/${workspaceId}/resources/${resourceId}`);
  return data;
}

export async function listTasks(workspaceId) {
  const { data } = await api.get(`/api/v1/workspaces/${workspaceId}/tasks`);
  return data;
}

export async function createTask(workspaceId, payload) {
  const { data } = await api.post(`/api/v1/workspaces/${workspaceId}/tasks`, payload);
  return data;
}

export async function updateTask(workspaceId, taskId, payload) {
  const { data } = await api.put(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`, payload);
  return data;
}

export async function deleteTask(workspaceId, taskId) {
  const { data } = await api.delete(`/api/v1/workspaces/${workspaceId}/tasks/${taskId}`);
  return data;
}

export async function listActivity(workspaceId) {
  const { data } = await api.get(`/api/v1/workspaces/${workspaceId}/activity`);
  return data;
}
