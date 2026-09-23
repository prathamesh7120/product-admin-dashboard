"use client";
import { useState } from "react";

const initialForm = {
  title: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

export default function ProductForm({ initialData, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialData || initialForm);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  function validate() {
    const newErrors = {};
    if (!form.title?.trim()) newErrors.title = "Title is required.";
    if (!form.category?.trim()) newErrors.category = "Category is required.";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0) {
      newErrors.price = "Price must be a positive number.";
    }
    if (form.stock === "" || isNaN(form.stock) || Number(form.stock) < 0) {
      newErrors.stock = "Stock must be zero or a positive number.";
    }
    return newErrors;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (isSubmitting) return; // guard against double-click on Save

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...form,
        price: Number(form.price),
        stock: Number(form.stock),
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">Title</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className="w-full rounded border p-2"
        />
        {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Category</label>
        <input
          type="text"
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className="w-full rounded border p-2"
        />
        {errors.category && <p className="mt-1 text-sm text-red-600">{errors.category}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Price</label>
        <input
          type="number"
          step="0.01"
          value={form.price}
          onChange={(e) => handleChange("price", e.target.value)}
          className="w-full rounded border p-2"
        />
        {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Stock</label>
        <input
          type="number"
          value={form.stock}
          onChange={(e) => handleChange("stock", e.target.value)}
          className="w-full rounded border p-2"
        />
        {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className="w-full rounded border p-2"
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded border px-4 py-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}