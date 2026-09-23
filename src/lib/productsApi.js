import api from "./axios";

export async function getProducts({ limit, skip, sortBy, order }) {
  const res = await api.get("/products", {
    params: { limit, skip, sortBy, order },
  });
  return res.data;
}

export async function searchProducts({ query, limit, skip, sortBy, order }) {
  const res = await api.get("/products/search", {
    params: { q: query, limit, skip, sortBy, order },
  });
  return res.data;
}

export async function getProductsByCategory({ category, limit, skip, sortBy, order }) {
  const res = await api.get(`/products/category/${category}`, {
    params: { limit, skip, sortBy, order },
  });
  return res.data;
}

export async function getCategories() {
  const res = await api.get("/products/categories");
  return res.data; // array of { slug, name, url }
}

export async function getProductById(id) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}