const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const toWsProtocol = (value: string): string => {
  if (value.startsWith('https://')) {
    return value.replace('https://', 'wss://');
  }

  if (value.startsWith('http://')) {
    return value.replace('http://', 'ws://');
  }

  return value;
};

const resolveApiBaseUrl = (): string => {
  const envApiUrl = import.meta.env.VITE_API_URL;

  if (envApiUrl && envApiUrl.trim().length > 0) {
    return trimTrailingSlash(envApiUrl.trim());
  }

  return 'http://localhost:8080/api';
};

const resolveBackendBaseUrl = (apiBaseUrl: string): string => {
  const envBackendUrl = import.meta.env.VITE_BACKEND_URL;

  if (envBackendUrl && envBackendUrl.trim().length > 0) {
    return trimTrailingSlash(envBackendUrl.trim());
  }

  if (apiBaseUrl.endsWith('/api')) {
    return apiBaseUrl.slice(0, -4);
  }

  return apiBaseUrl;
};

const resolveWsBaseUrl = (backendBaseUrl: string): string => {
  const envWsUrl = import.meta.env.VITE_WS_URL;

  if (envWsUrl && envWsUrl.trim().length > 0) {
    return trimTrailingSlash(envWsUrl.trim());
  }

  return toWsProtocol(backendBaseUrl);
};

const API_BASE_URL = resolveApiBaseUrl();
const BACKEND_BASE_URL = resolveBackendBaseUrl(API_BASE_URL);
const WS_BASE_URL = resolveWsBaseUrl(BACKEND_BASE_URL);

const buildUrl = (baseUrl: string, path = ''): string => {
  if (!path) {
    return baseUrl;
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
};

export const appConfig = {
  apiBaseUrl: API_BASE_URL,
  backendBaseUrl: BACKEND_BASE_URL,
  wsBaseUrl: WS_BASE_URL,
  mode: import.meta.env.MODE,
} as const;

export const buildApiUrl = (path = ''): string => buildUrl(appConfig.apiBaseUrl, path);
export const buildBackendUrl = (path = ''): string => buildUrl(appConfig.backendBaseUrl, path);
export const buildWsUrl = (path = ''): string => buildUrl(appConfig.wsBaseUrl, path);
