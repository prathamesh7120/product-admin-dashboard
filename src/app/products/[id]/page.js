"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getProductById, deleteProduct } from "@/lib/productsApi";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function ProductDetailsPage() {
  const { id } = useParams();
  const router = useRouter();

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    setNotFound(false);
    setError(null);

    if (String(id).startsWith("local-")) {
      const pendingAdds = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
      const localProduct = pendingAdds.find((p) => p.id === id);
      if (localProduct) {
        setProduct(localProduct);
      } else {
        setNotFound(true);
      }
      setIsLoading(false);
      return;
    }

    getProductById(id)
      .then((data) => {
        if (!data || data.message) {
          setNotFound(true);
          return;
        }
        const pendingEdits = JSON.parse(sessionStorage.getItem("pendingEdits") || "{}");
        const edit = pendingEdits[id];
        setProduct(edit ? { ...data, ...edit } : data);
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          setNotFound(true);
        } else {
          setError("Failed to load product.");
        }
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  async function handleDelete() {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      if (String(id).startsWith("local-")) {
        const pendingAdds = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
        sessionStorage.setItem(
          "pendingAdds",
          JSON.stringify(pendingAdds.filter((p) => p.id !== id))
        );
      } else {
        await deleteProduct(id);
        const pendingDeletes = JSON.parse(sessionStorage.getItem("pendingDeletes") || "[]");
        pendingDeletes.push(id);
        sessionStorage.setItem("pendingDeletes", JSON.stringify(pendingDeletes));
      }
      router.push("/products");
    } catch {
      setError("Failed to delete product.");
      setIsDeleting(false);
      setShowConfirm(false);
    }
  }

  if (isLoading) return <div className="p-8">Loading...</div>;

  if (notFound) {
    return (
      <div className="p-8">
        <h1 className="mb-2 text-xl font-semibold">Product not found</h1>
        <p className="mb-4 text-gray-500">No product exists with id "{id}".</p>
        <button
          onClick={() => router.push("/products")}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Back to products
        </button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      <button
        onClick={() => router.push("/products")}
        className="mb-4 text-blue-600 hover:underline"
      >
        ← Back to products
      </button>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="flex gap-2 overflow-x-auto">
          {product.images?.length > 0 ? (
            product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${product.title} ${i + 1}`}
                className="h-48 w-48 flex-shrink-0 rounded object-cover"
              />
            ))
          ) : (
            <div className="flex h-48 w-48 items-center justify-center rounded bg-gray-100 text-gray-400">
              No image
            </div>
          )}
        </div>

        <div>
          <h1 className="text-2xl font-semibold">{product.title}</h1>
          <p className="mt-1 text-gray-500">{product.category}</p>
          <p className="mt-3 text-xl font-bold">${product.price}</p>
          <p className="mt-1">★ {product.rating} · Stock: {product.stock}</p>
          <p className="mt-4 text-gray-700">{product.description}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push(`/products/${id}/edit`)}
              className="rounded bg-blue-600 px-4 py-2 text-white"
            >
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded bg-red-600 px-4 py-2 text-white"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Reviews</h2>
          <div className="space-y-3">
            {product.reviews.map((r, i) => (
              <div key={i} className="rounded border p-3">
                <p className="font-medium">{r.reviewerName} — ★{r.rating}</p>
                <p className="text-sm text-gray-600">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showConfirm && (
        <ConfirmDialog
          message={`Delete "${product.title}"? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}