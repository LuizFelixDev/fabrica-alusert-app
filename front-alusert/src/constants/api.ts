export const API_BASE_URL = import.meta.env.PROD 
  ? "https://fabrica-alusert.vercel.app/api"
  : "http://localhost:3000/api";

export const ENDPOINTS = {
  produtos: `${API_BASE_URL}/produtos`,
  clientes: `${API_BASE_URL}/clientes`,
  materiasPrimas: `${API_BASE_URL}/materias-primas`,
  vendas: `${API_BASE_URL}/vendas`,
  usuarios: `${API_BASE_URL}/usuarios`,
};
