import api from "./axios";

export async function getProducts({ limit, skip }) {
  const res = await api.get("/products", { params: { limit, skip } });
  return res.data;
}

export async function searchProducts({ query, limit, skip }) {
  const res = await api.get("/products/search", {
    params: { q: query, limit, skip },
  });
  return res.data;
}