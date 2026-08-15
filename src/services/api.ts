import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Expo supports EXPO_PUBLIC_ prefix for environment variables out of the box.
const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:8000/api';

// eslint-disable-next-line import/no-named-as-default-member
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Automatically inject Bearer Token on every request
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
