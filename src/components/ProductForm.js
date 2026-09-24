"use client";
import { useState } from "react";

const initialForm = {
  title: "",
  category: "",
  price: "",
  stock: "",
  description: "",
};

function Field({ label, error, children }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-gray-200 px-3 py-2.5 text-gray-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100";

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
    if (isSubmitting) return;

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
    <form
      onSubmit={handleSubmit}
      className="max-w-lg space-y-5 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm md:p-8"
    >
      <Field label="Title" error={errors.title}>
        <input
          type="text"
          value={form.title}
          onChange={(e) => handleChange("title", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label="Category" error={errors.category}>
        <input
          type="text"
          value={form.category}
          onChange={(e) => handleChange("category", e.target.value)}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Price" error={errors.price}>
          <input
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => handleChange("price", e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Stock" error={errors.stock}>
          <input
            type="number"
            value={form.stock}
            onChange={(e) => handleChange("stock", e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Description">
        <textarea
          value={form.description}
          onChange={(e) => handleChange("description", e.target.value)}
          className={inputClass}
          rows={4}
        />
      </Field>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-200 px-5 py-2.5 font-medium text-gray-600 transition hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}