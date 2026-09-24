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

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-gray-400">
        Loading…
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center">
        <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
          <p className="mb-1 text-5xl">🔍</p>
          <h1 className="mb-2 text-xl font-bold text-gray-900">Product not found</h1>
          <p className="mb-6 text-gray-500">No product exists with id "{id}".</p>
          <button
            onClick={() => router.push("/products")}
            className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
          >
            Back to products
          </button>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-2xl p-8">
        <p className="rounded-lg bg-red-50 p-4 text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <button
        onClick={() => router.push("/products")}
        className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
      >
        ← Back to products
      </button>

      <div className="grid gap-8 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:grid-cols-2 md:p-8">
        <div className="flex gap-3 overflow-x-auto">
          {product.images?.length > 0 ? (
            product.images.map((img, i) => (
              <img
                key={i}
                src={img}
                alt={`${product.title} ${i + 1}`}
                className="h-52 w-52 flex-shrink-0 rounded-xl border border-gray-100 object-cover"
              />
            ))
          ) : (
            <div className="flex h-52 w-52 items-center justify-center rounded-xl bg-gray-100 text-gray-400">
              No image
            </div>
          )}
        </div>

        <div>
          <span className="inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-600">
            {product.category}
          </span>
          <h1 className="mt-3 text-2xl font-bold text-gray-900">{product.title}</h1>
          <p className="mt-2 text-3xl font-bold text-gray-900">${product.price}</p>
          <div className="mt-2 flex items-center gap-3 text-sm text-gray-500">
            <span className="text-amber-500">★ {product.rating}</span>
            <span>·</span>
            <span>Stock: {product.stock}</span>
          </div>
          <p className="mt-4 leading-relaxed text-gray-600">{product.description}</p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => router.push(`/products/${id}/edit`)}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white transition hover:bg-indigo-700"
            >
              Edit
            </button>
            <button
              onClick={() => setShowConfirm(true)}
              className="rounded-lg border border-red-200 bg-red-50 px-5 py-2.5 font-medium text-red-600 transition hover:bg-red-100"
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {product.reviews?.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-lg font-bold text-gray-900">Reviews</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {product.reviews.map((r, i) => (
              <div key={i} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900">{r.reviewerName}</p>
                  <span className="text-sm text-amber-500">★ {r.rating}</span>
                </div>
                <p className="mt-1 text-sm text-gray-500">{r.comment}</p>
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