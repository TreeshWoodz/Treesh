import axios from "axios";

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const progressOf = ({ saveCode, ...rest }) => rest;

export const api = {
  submitScore: (body) => axios.post(`${API}/scores`, body),
  leaderboard: (mode) => axios.get(`${API}/leaderboard/${mode}`).then((r) => r.data),
  cloudSave: (p) =>
    axios
      .post(`${API}/cloud/save`, { player_id: p.playerId, name: p.name, save_code: p.saveCode, progress: progressOf(p) })
      .then((r) => r.data),
  cloudLoad: (name, code) => axios.post(`${API}/cloud/load`, { name, save_code: code }).then((r) => r.data),
};

export const errMsg = (e) => e?.response?.data?.detail || "Something went wrong";
