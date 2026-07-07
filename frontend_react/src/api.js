import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export async function askMindVault(query, apiKey) {
  const response = await axios.post(`${API_BASE_URL}/api/ask`, {
    query,
    api_key: apiKey || null,
  });
  return response.data;
}

export async function checkRisk(situation, apiKey, threshold = 0.4) {
  const response = await axios.post(`${API_BASE_URL}/api/risk-check`, {
    situation,
    api_key: apiKey || null,
    threshold,
  });
  return response.data;
}

export async function getInsights() {
  const response = await axios.get(`${API_BASE_URL}/api/insights`);
  return response.data;
}

export async function checkHealth() {
  const response = await axios.get(`${API_BASE_URL}/api/health`);
  return response.data;
}

export async function uploadDoc(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await axios.post(`${API_BASE_URL}/api/upload-doc`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
  return response.data;
}

export async function notifyExpert(expertName, context) {
  const response = await axios.post(`${API_BASE_URL}/api/notify-expert`, {
    expert_name: expertName,
    context: context || null,
  });
  return response.data;
}

export async function generatePPT(payload) {
  const response = await axios.post(`${API_BASE_URL}/api/generate-ppt`, payload, {
    responseType: "blob",
  });
  return response.data;
}

export async function listDocuments() {
  const response = await axios.get(`${API_BASE_URL}/api/documents`);
  return response.data;
}

export async function deleteDocument(filename) {
  const response = await axios.delete(`${API_BASE_URL}/api/documents/${encodeURIComponent(filename)}`);
  return response.data;
}
