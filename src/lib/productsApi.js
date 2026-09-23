import api from "./axios";

export async function getProducts({ limit, skip }) {
  const res = await api.get("/products", { params: { limit, skip } });
  return res.data; // { products, total, skip, limit }
}
