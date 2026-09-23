"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getProducts } from "@/lib/productsApi";

function parsePage(value, totalPages) {
  const n = parseInt(value, 10);
  if (isNaN(n) || n < 1) return 1;
  if (totalPages && n > totalPages) return totalPages;
  return n;
}

function parsePageSize(value) {
  const allowed = [10, 20, 50];
  const n = parseInt(value, 10);
  return allowed.includes(n) ? n : 10;
}

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPage = searchParams.get("page");
  const pageSize = parsePageSize(searchParams.get("limit"));

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = parsePage(rawPage, total ? totalPages : undefined);

  const updateParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      });
      router.push(`/products?${params.toString()}`);
    },
    [searchParams, router]
  );

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const skip = (page - 1) * pageSize;

    getProducts({ limit: pageSize, skip })
      .then((data) => {
        setProducts(data.products);
        setTotal(data.total);
      })
      .catch(() => setError("Failed to load products."))
      .finally(() => setIsLoading(false));
  }, [page, pageSize, refreshKey]);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  if (isLoading) return <div className="p-8">Loading...</div>;

  if (error) {
    return (
      <div className="p-8">
        <p className="mb-2 text-red-600">{error}</p>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return <div className="p-8">No products found.</div>;
  }

  return (
    <div className="p-4 md:p-8">
      <table className="hidden w-full border-collapse md:table">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Image</th>
            <th className="p-2">Title</th>
            <th className="p-2">Category</th>
            <th className="p-2">Price</th>
            <th className="p-2">Rating</th>
            <th className="p-2">Stock</th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="p-2">
                <img src={p.thumbnail} alt={p.title} className="h-12 w-12 object-cover" />
              </td>
              <td className="p-2">{p.title}</td>
              <td className="p-2">{p.category}</td>
              <td className="p-2">${p.price}</td>
              <td className="p-2">{p.rating}</td>
              <td className="p-2">{p.stock}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="space-y-3 md:hidden">
        {products.map((p) => (
          <div key={p.id} className="flex gap-3 rounded border p-3">
            <img src={p.thumbnail} alt={p.title} className="h-16 w-16 object-cover" />
            <div>
              <p className="font-medium">{p.title}</p>
              <p className="text-sm text-gray-500">{p.category}</p>
              <p className="text-sm">${p.price} · ★{p.rating} · Stock: {p.stock}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          Showing {startItem}–{endItem} of {total}
        </p>

        <select
          value={pageSize}
          onChange={(e) => updateParams({ limit: e.target.value, page: 1 })}
          className="rounded border p-1"
        >
          <option value={10}>10 / page</option>
          <option value={20}>20 / page</option>
          <option value={50}>50 / page</option>
        </select>

        <div className="flex items-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => updateParams({ page: page - 1 })}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => updateParams({ page: page + 1 })}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}