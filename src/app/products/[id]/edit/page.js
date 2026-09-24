"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { getProductById, updateProduct } from "@/lib/productsApi";

export default function EditProductPage() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLocal, setIsLocal] = useState(false);

  useEffect(() => {
    setIsLoading(true);

    if (String(id).startsWith("local-")) {
      setIsLocal(true);
      const pendingAdds = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
      const localProduct = pendingAdds.find((p) => p.id === id);
      setProduct(localProduct || null);
      setIsLoading(false);
      return;
    }

    getProductById(id)
      .then((data) => setProduct(data))
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleEdit(data) {
    if (isLocal) {
      const pendingAdds = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
      const updated = pendingAdds.map((p) => (p.id === id ? { ...p, ...data } : p));
      sessionStorage.setItem("pendingAdds", JSON.stringify(updated));
    } else {
      await updateProduct(id, data);
      const pendingEdits = JSON.parse(sessionStorage.getItem("pendingEdits") || "{}");
      pendingEdits[id] = data;
      sessionStorage.setItem("pendingEdits", JSON.stringify(pendingEdits));
    }
    router.push(`/products/${id}`);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-2xl p-4 md:p-8">
        <p className="text-gray-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Edit Product</h1>
      <ProductForm
        initialData={{
          title: product.title,
          category: product.category,
          price: String(product.price),
          stock: String(product.stock),
          description: product.description,
        }}
        onSubmit={handleEdit}
        onCancel={() => router.push(`/products/${id}`)}
      />
    </div>
  );
}