import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000/api';

export const getDocuments = async () => {
  const response = await axios.get(`${API_BASE_URL}/s3/documents`);
  return response.data;
};

export const deleteDocument = async (id: string) => {
  const response = await axios.delete(`${API_BASE_URL}/s3/documents/${id}`);
  return response.data;
};

export const reprocessDocument = async (id: string) => {
  const response = await axios.post(`${API_BASE_URL}/s3/documents/${id}/reprocess`);
  return response.data;
};

export const getLogs = async () => {
  const response = await axios.get(`${API_BASE_URL}/logs`);
  return response.data;
};

export const refreshIndex = async () => {
  const response = await axios.post(`${API_BASE_URL}/opensearch/refresh`);
  return response.data;
}; 