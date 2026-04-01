import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BASE_URL = "http://10.0.2.2:5001"; // For Android emulator
//const BASE_URL = "http://192.168.8.175:5001"; // For local development

// Creates a reusable Axios client for all API requests
export const api = axios.create({
  baseURL: `${BASE_URL}/api`,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor to add authorization header to all requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getMyNotifications = async () => {
  const response = await api.get("/notifications/me");
  return response.data;
};

export const markNotificationAsRead = async (notificationId: string) => {
  const response = await api.patch(`/notifications/${notificationId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch("/notifications/read-all");
  return response.data;
};

export const deleteNotification = async (notificationId: string) => {
  const response = await api.delete(`/notifications/${notificationId}`);
  return response.data;
};