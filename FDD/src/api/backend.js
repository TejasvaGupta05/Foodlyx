const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem('foodlyx_user') || 'null');
  } catch (error) {
    return null;
  }
};

const buildHeaders = (extra = {}) => {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const currentUser = getCurrentUser();
  if (currentUser?.uid) {
    headers['x-firebase-uid'] = currentUser.uid;
  }
  return headers;
};

const send = async (path, options = {}) => {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const error = data?.message || response.statusText || 'Request failed';
    throw new Error(error);
  }
  return data;
};

const backend = {
  get: (path) => send(path, { method: 'GET' }),
  post: (path, body) => send(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: (path, body) => send(path, { method: 'PATCH', body: JSON.stringify(body) }),
  put: (path, body) => send(path, { method: 'PUT', body: JSON.stringify(body) }),
};

export default backend;
