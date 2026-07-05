import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

const client = axios.create({ baseURL: API, timeout: 20000 });

export const catalogApi = {
  getSongs: (params = {}) => client.get("/catalog/songs", { params }).then((r) => r.data),
  getSong: (id) => client.get(`/catalog/songs/${id}`).then((r) => r.data),
  getGenres: () => client.get("/catalog/genres").then((r) => r.data),
  getArtists: () => client.get("/catalog/artists").then((r) => r.data),
  getArtist: (id) => client.get(`/catalog/artists/${id}`).then((r) => r.data),
  getLyrics: (id) => client.get(`/catalog/lyrics/${id}`).then((r) => r.data),
};

export const profileApi = {
  get: (profileId) => client.get(`/profile/${profileId}`).then((r) => r.data),
  save: (profile) => client.post("/profile", profile).then((r) => r.data),
};

export const favoritesApi = {
  list: (profileId) => client.get(`/favorites/${profileId}`).then((r) => r.data),
  toggle: (profileId, songId) =>
    client.post("/favorites/toggle", { profileId, songId }).then((r) => r.data),
};

export const playlistsApi = {
  list: (profileId) => client.get(`/playlists/${profileId}`).then((r) => r.data),
  detail: (playlistId) => client.get(`/playlists/detail/${playlistId}`).then((r) => r.data),
  create: (profileId, name, songIds = []) =>
    client.post("/playlists", { profileId, name, songIds }).then((r) => r.data),
  update: (playlistId, payload) =>
    client.patch(`/playlists/${playlistId}`, payload).then((r) => r.data),
  remove: (playlistId) => client.delete(`/playlists/${playlistId}`).then((r) => r.data),
};

export default client;
