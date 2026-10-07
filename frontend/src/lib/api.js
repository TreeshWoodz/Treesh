import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export const judgeFlip = (body) => axios.post(`${API}/flip/judge`, body, { timeout: 45000 }).then((r) => r.data);
export const aiQuestions = (avoid) => axios.post(`${API}/ai/questions`, { count: 8, avoid }, { timeout: 60000 }).then((r) => r.data.questions);
export const submitScore = (body) => axios.post(`${API}/leaderboard`, body).then((r) => r.data);
export const getLeaderboard = (mode) => axios.get(`${API}/leaderboard`, { params: { mode } }).then((r) => r.data);
