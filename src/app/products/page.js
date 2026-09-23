"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  getProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
} from "@/lib/productsApi";

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

const SORT_OPTIONS = [
  { value: "", label: "Default" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating-asc", label: "Rating: Low to High" },
  { value: "rating-desc", label: "Rating: High to Low" },
  { value: "title-asc", label: "Title: A to Z" },
  { value: "title-desc", label: "Title: Z to A" },
];

export default function ProductsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawPage = searchParams.get("page");
  const pageSize = parsePageSize(searchParams.get("limit"));
  const urlQuery = searchParams.get("q") || "";
  const category = searchParams.get("category") || "";
  const sortValue = searchParams.get("sort") || "";

  const [sortBy, order] = sortValue ? sortValue.split("-") : [undefined, undefined];

  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [categories, setCategories] = useState([]);

  const [searchInput, setSearchInput] = useState(urlQuery);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = parsePage(rawPage, total ? totalPages : undefined);

  const updateParams = useCallback(
    (updates) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
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
    getCategories()
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchInput !== urlQuery) {
        updateParams({ q: searchInput || null, page: 1 });
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setSearchInput(urlQuery);
  }, [urlQuery]);

  const requestIdRef = useRef(0);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const skip = (page - 1) * pageSize;
    const thisRequestId = ++requestIdRef.current;

    let fetchPromise;
    if (category) {
      fetchPromise = getProductsByCategory({ category, limit: pageSize, skip, sortBy, order });
    } else if (urlQuery) {
      fetchPromise = searchProducts({ query: urlQuery, limit: pageSize, skip, sortBy, order });
    } else {
      fetchPromise = getProducts({ limit: pageSize, skip, sortBy, order });
    }

    fetchPromise
      .then((data) => {
        if (thisRequestId !== requestIdRef.current) return;

        let list = data.products;
        let listTotal = data.total;

        const pendingEdits = JSON.parse(sessionStorage.getItem("pendingEdits") || "{}");
        list = list.map((p) => (pendingEdits[p.id] ? { ...p, ...pendingEdits[p.id] } : p));

        const pendingDeletes = JSON.parse(sessionStorage.getItem("pendingDeletes") || "[]");
        if (pendingDeletes.length > 0) {
          list = list.filter((p) => !pendingDeletes.includes(String(p.id)));
          listTotal -= pendingDeletes.length;
        }

        if (page === 1 && !urlQuery && !category) {
          const pendingAdds = JSON.parse(sessionStorage.getItem("pendingAdds") || "[]");
          list = [...pendingAdds, ...list];
          listTotal += pendingAdds.length;
        }

        setProducts(list);
        setTotal(listTotal);
      })
      .catch(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setError("Failed to load products.");
      })
      .finally(() => {
        if (thisRequestId !== requestIdRef.current) return;
        setIsLoading(false);
      });
  }, [page, pageSize, urlQuery, category, sortBy, order, refreshKey]);

  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  return (
    <div className="p-4 md:p-8">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded border p-2"
        />

        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value || null, page: 1 })}
          className="rounded border p-2"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          value={sortValue}
          onChange={(e) => updateParams({ sort: e.target.value || null, page: 1 })}
          className="rounded border p-2"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => router.push("/products/new")}
          className="ml-auto rounded bg-green-600 px-4 py-2 text-white"
        >
          + Add Product
        </button>
      </div>

      {category && urlQuery && (
        <p className="mb-3 text-sm text-amber-600">
          Showing results for category "{category}". Search text is saved but
          not applied while a category is selected, since the API can't combine both.
        </p>
      )}

      {isLoading && <div>Loading...</div>}

      {!isLoading && error && (
        <div>
          <p className="mb-2 text-red-600">{error}</p>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded bg-blue-600 px-4 py-2 text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div>No products found.</div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
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
                <tr
                  key={p.id}
                  onClick={() => router.push(`/products/${p.id}`)}
                  className="cursor-pointer border-b hover:bg-gray-50"
                >
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
              <div
                key={p.id}
                onClick={() => router.push(`/products/${p.id}`)}
                className="flex cursor-pointer gap-3 rounded border p-3 hover:bg-gray-50"
              >
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
        </>
      )}
    </div>
  );
}