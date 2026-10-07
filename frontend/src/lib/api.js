import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const submitScore = (payload) => axios.post(`${API}/scores`, payload).then((r) => r.data);

export const fetchLeaderboard = (mode, date) =>
  axios.get(`${API}/leaderboard`, { params: { mode, date } }).then((r) => r.data);
