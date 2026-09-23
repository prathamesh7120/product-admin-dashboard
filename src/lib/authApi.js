import api from "./axios";

export async function login(username, password) {
  const res = await api.post("/auth/login", {
    username,
    password,
    expiresInMins: 60,
  });
  return res.data;
}