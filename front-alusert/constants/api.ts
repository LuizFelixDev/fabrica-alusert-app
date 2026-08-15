import { Platform } from "react-native";

// Change this IP to your computer's local IP address if you are running on a physical device.
const LOCAL_IP = "192.168.0.27"; 

export const API_BASE_URL = Platform.select({
  ios: `http://${LOCAL_IP}:3000/api`,
  android: `http://${LOCAL_IP}:3000/api`,
  default: "http://localhost:3000/api",
});

export const ENDPOINTS = {
  produtos: `${API_BASE_URL}/produtos`,
  clientes: `${API_BASE_URL}/clientes`,
  materiasPrimas: `${API_BASE_URL}/materias-primas`,
  vendas: `${API_BASE_URL}/vendas`,
  usuarios: `${API_BASE_URL}/usuarios`,
};
