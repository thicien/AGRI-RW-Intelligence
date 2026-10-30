const API_BASE_URL = (
  import.meta.env.VITE_API_URL ||
  'http://localhost:3000/api/v1'
).replace(/\/+$/, '');

export function apiUrl(path: string): string {
  const normalizedPath = path.replace(/^\/+/, '');
  return `${API_BASE_URL}/${normalizedPath}`;
}

export default API_BASE_URL;
