"use client";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { addProduct } from "@/lib/productsApi";

export default function NewProductPage() {
  const router = useRouter();

  async function handleAdd(data) {
    await addProduct(data);
    const pending = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
    pending.unshift({ ...data, id: `local-${Date.now()}`, thumbnail: "", images: [], rating: 0 });
    sessionStorage.setItem("pendingAdds", JSON.stringify(pending));
    router.push("/products");
  }

  return (
    <div className="mx-auto max-w-2xl p-4 md:p-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Add Product</h1>
      <ProductForm onSubmit={handleAdd} onCancel={() => router.push("/products")} />
    </div>
  );
}