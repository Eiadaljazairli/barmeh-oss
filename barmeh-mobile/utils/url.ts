import Constants from 'expo-constants';

const API_BASE = (Constants.expoConfig?.extra?.apiUrl as string | undefined)?.replace('/v1', '') ?? 'http://localhost:3000';

export const ensureAbsoluteUrl = (url?: string | null) => {
  if (!url) return null;

  const isEmoji = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/.test(url);
  if (isEmoji) return url;

  let finalUrl = url;

  if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('api.example.com')) {
    const parts = url.split('/uploads/');
    const path = parts[1];
    finalUrl = path ? `${API_BASE}/uploads/${path}` : url;
  }
  else if (url.startsWith('/uploads/')) {
    finalUrl = `${API_BASE}${url}`;
  }
  else if (!url.startsWith('http')) {
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    finalUrl = `${API_BASE}${cleanPath}`;
  }

  console.log('--- URL RESOLUTION ---');
  console.log('Input:', url);
  console.log('Output:', finalUrl);
  return finalUrl;
};
