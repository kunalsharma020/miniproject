export const API_URL = 'http://localhost:3000';
export const API_KEY = 'kunal_secure_key_2026'; // For dev purposes

const headers = {
  'Content-Type': 'application/json',
  'x-api-key': API_KEY
};

export const fetchLatestConfig = async () => {
  const res = await fetch(`${API_URL}/config/latest`, { headers });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to fetch config');
  }
  return res.json();
};

export const uploadConfig = async (schemaVersion, configData) => {
  const res = await fetch(`${API_URL}/config`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ schemaVersion, config: configData })
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData.error || `Upload failed`);
  }
  return res.json();
};

export const rollbackConfig = async () => {
  const res = await fetch(`${API_URL}/config/rollback`, {
    method: 'POST',
    headers
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Rollback failed');
  }
  return res.json();
};

export const fetchSchemas = async () => {
  const res = await fetch(`${API_URL}/schema`, { headers });
  if (!res.ok) {
    throw new Error('Failed to fetch schemas');
  }
  const data = await res.json();
  // Backend returns { schemas: [...] }
  return Array.isArray(data) ? data : (data.schemas || []);
};

export const uploadSchema = async (version, jsonSchema, previousVersion, migrationKey) => {
  const res = await fetch(`${API_URL}/schema`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ version, jsonSchema, previousVersion, migrationKey })
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || 'Failed to upload schema');
  }
  return res.json();
};
