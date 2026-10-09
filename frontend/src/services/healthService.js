import api from "./api.js";

export async function getRoot() {
  const { data } = await api.get("/");
  return data;
}

export async function getHealth() {
  try {
    const { data } = await api.get("/health");
    return data;
  } catch (error) {
    if (error.response?.data?.database) {
      return error.response.data;
    }
    throw error;
  }
}
