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

function StarRating({ rating }) {
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <span className="text-amber-500">★</span>
      <span className="font-medium text-gray-700">{rating}</span>
    </span>
  );
}

function StockBadge({ stock }) {
  const color =
    stock === 0
      ? "bg-red-50 text-red-600"
      : stock < 10
      ? "bg-amber-50 text-amber-600"
      : "bg-emerald-50 text-emerald-600";
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${color}`}>
      {stock} in stock
    </span>
  );
}

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
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          placeholder="Search products..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          className="w-full max-w-md rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
        />

        <select
          value={category}
          onChange={(e) => updateParams({ category: e.target.value || null, page: 1 })}
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-700 outline-none focus:border-indigo-400"
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
          className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-gray-700 outline-none focus:border-indigo-400"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        <button
          onClick={() => router.push("/products/new")}
          className="ml-auto rounded-lg bg-indigo-600 px-4 py-2.5 font-medium text-white shadow-sm transition hover:bg-indigo-700"
        >
          + Add Product
        </button>
      </div>

      {category && urlQuery && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
          Showing results for category <strong>"{category}"</strong>. Search text is saved but
          not applied while a category is selected, since the API can't combine both.
        </p>
      )}

      {isLoading && (
        <div className="flex items-center justify-center py-24 text-gray-400">Loading…</div>
      )}

      {!isLoading && error && (
        <div className="rounded-xl border border-red-100 bg-red-50 p-6 text-center">
          <p className="mb-3 text-red-600">{error}</p>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="rounded-lg bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && products.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-200 py-16 text-center text-gray-400">
          No products found.
        </div>
      )}

      {!isLoading && !error && products.length > 0 && (
        <>
          <div className="hidden overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm md:block">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <th className="p-4">Image</th>
                  <th className="p-4">Title</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Rating</th>
                  <th className="p-4">Stock</th>
                </tr>
              </thead>
              <tbody>
                {products.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => router.push(`/products/${p.id}`)}
                    className="cursor-pointer border-b border-gray-50 transition last:border-0 hover:bg-indigo-50/40"
                  >
                    <td className="p-4">
                      {p.thumbnail ? (
                        <img
                          src={p.thumbnail}
                          alt={p.title}
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                          N/A
                        </div>
                      )}
                    </td>
                    <td className="p-4 font-medium text-gray-900">{p.title}</td>
                    <td className="p-4 text-gray-500">{p.category}</td>
                    <td className="p-4 font-semibold text-gray-900">${p.price}</td>
                    <td className="p-4"><StarRating rating={p.rating} /></td>
                    <td className="p-4"><StockBadge stock={p.stock} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {products.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push(`/products/${p.id}`)}
                className="flex cursor-pointer gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm transition active:scale-[0.99]"
              >
                {p.thumbnail ? (
                  <img
                    src={p.thumbnail}
                    alt={p.title}
                    className="h-16 w-16 flex-shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
                    N/A
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-900">{p.title}</p>
                  <p className="text-sm text-gray-500">{p.category}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="font-semibold text-gray-900">${p.price}</span>
                    <StarRating rating={p.rating} />
                  </div>
                  <div className="mt-1"><StockBadge stock={p.stock} /></div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{startItem}–{endItem}</span> of{" "}
              <span className="font-medium text-gray-700">{total}</span>
            </p>

            <select
              value={pageSize}
              onChange={(e) => updateParams({ limit: e.target.value, page: 1 })}
              className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-sm text-gray-700 outline-none focus:border-indigo-400"
            >
              <option value={10}>10 / page</option>
              <option value={20}>20 / page</option>
              <option value={50}>50 / page</option>
            </select>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => updateParams({ page: page - 1 })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-gray-500">
                Page <span className="font-medium text-gray-700">{page}</span> of {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => updateParams({ page: page + 1 })}
                className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-40"
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