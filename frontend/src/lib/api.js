import axios from "axios";

export const api = axios.create({ baseURL: `${process.env.REACT_APP_BACKEND_URL}/api`, timeout: 40000 });

export function apiError(e, fallback = "Something went wrong. Try again.") {
  return e?.response?.data?.detail || (e?.code === "ECONNABORTED" ? "The lookup timed out. Try again." : fallback);
}
