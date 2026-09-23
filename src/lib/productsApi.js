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
  return res.data;
}

export async function getProductById(id) {
  const res = await api.get(`/products/${id}`);
  return res.data;
}

export async function addProduct(productData) {
  const res = await api.post("/products/add", productData);
  return res.data;
}

export async function updateProduct(id, productData) {
  const res = await api.put(`/products/${id}`, productData);
  return res.data;
}

export async function deleteProduct(id) {
  const res = await api.delete(`/products/${id}`);
  return res.data;
}