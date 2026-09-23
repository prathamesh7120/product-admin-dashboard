"use client";
import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";
import { addProduct } from "@/lib/productsApi";

export default function NewProductPage() {
  const router = useRouter();

  async function handleAdd(data) {
    await addProduct(data); // DummyJSON accepts this but doesn't persist it
    // We store the "pretend it worked" product in sessionStorage so the
    // product list page can pick it up and show it immediately.
    const pending = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
    pending.unshift({ ...data, id: `local-${Date.now()}`, thumbnail: "", images: [], rating: 0 });
    sessionStorage.setItem("pendingAdds", JSON.stringify(pending));
    router.push("/products");
  }

  return (
    <div className="p-4 md:p-8">
      <h1 className="mb-4 text-xl font-semibold">Add Product</h1>
      <ProductForm onSubmit={handleAdd} onCancel={() => router.push("/products")} />
    </div>
  );
}