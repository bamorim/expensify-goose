"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface Category {
  id: string;
  name: string;
  description: string | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CategoriesManagementProps {
  organizationId: string;
  userRole: "ADMIN" | "MEMBER";
}

export default function CategoriesManagement({
  organizationId,
  userRole,
}: CategoriesManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(
    null,
  );

  const {
    data: categories,
    isLoading,
    refetch,
  } = api.category.getCategories.useQuery(
    { organizationId },
    { enabled: !!organizationId },
  );

  const createCategory = api.category.create.useMutation({
    onSuccess: () => {
      setShowCreateForm(false);
      void refetch();
    },
  });

  const updateCategory = api.category.update.useMutation({
    onSuccess: () => {
      setEditingCategory(null);
      void refetch();
    },
  });

  const deleteCategory = api.category.delete.useMutation({
    onSuccess: () => {
      setDeletingCategory(null);
      void refetch();
    },
  });

  const handleCreateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    createCategory.mutate({
      organizationId,
      name,
      description: description || undefined,
    });
  };

  const handleUpdateCategory = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingCategory) return;

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    updateCategory.mutate({
      categoryId: editingCategory.id,
      organizationId,
      name,
      description: description || undefined,
    });
  };

  const handleDeleteCategory = () => {
    if (!deletingCategory) return;

    deleteCategory.mutate({
      categoryId: deletingCategory.id,
      organizationId,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading categories...</div>
      </div>
    );
  }

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Expense Categories
        </h2>
        {userRole === "ADMIN" && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Add Category
          </button>
        )}
      </div>

      {/* Create Category Form */}
      {showCreateForm && userRole === "ADMIN" && (
        <div className="mb-6 rounded-lg bg-gray-50 p-4">
          <h3 className="text-md mb-3 font-medium text-gray-900">
            Create New Category
          </h3>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <div>
              <label
                htmlFor="create-name"
                className="block text-sm font-medium text-gray-700"
              >
                Category Name
              </label>
              <input
                type="text"
                id="create-name"
                name="name"
                required
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="create-description"
                className="block text-sm font-medium text-gray-700"
              >
                Description (optional)
              </label>
              <textarea
                id="create-description"
                name="description"
                rows={3}
                maxLength={500}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={createCategory.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {createCategory.isPending ? "Creating..." : "Create Category"}
              </button>
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
          {createCategory.error && (
            <div className="mt-3 text-sm text-red-600">
              Error: {createCategory.error.message}
            </div>
          )}
        </div>
      )}

      {/* Edit Category Form */}
      {editingCategory && userRole === "ADMIN" && (
        <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="text-md mb-3 font-medium text-gray-900">
            Edit Category
          </h3>
          <form onSubmit={handleUpdateCategory} className="space-y-4">
            <div>
              <label
                htmlFor="edit-name"
                className="block text-sm font-medium text-gray-700"
              >
                Category Name
              </label>
              <input
                type="text"
                id="edit-name"
                name="name"
                defaultValue={editingCategory.name}
                required
                maxLength={100}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="edit-description"
                className="block text-sm font-medium text-gray-700"
              >
                Description (optional)
              </label>
              <textarea
                id="edit-description"
                name="description"
                defaultValue={editingCategory.description ?? ""}
                rows={3}
                maxLength={500}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={updateCategory.isPending}
                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {updateCategory.isPending ? "Updating..." : "Update Category"}
              </button>
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>
          {updateCategory.error && (
            <div className="mt-3 text-sm text-red-600">
              Error: {updateCategory.error.message}
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingCategory && userRole === "ADMIN" && (
        <div className="bg-opacity-75 fixed inset-0 z-50 flex items-center justify-center bg-gray-500">
          <div className="mx-4 w-full max-w-md rounded-lg bg-white p-6">
            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Delete Category
            </h3>
            <p className="mb-6 text-gray-600">
              Are you sure you want to delete the category &quot;{deletingCategory.name}&quot;? This action cannot be undone.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDeleteCategory}
                disabled={deleteCategory.isPending}
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:opacity-50"
              >
                {deleteCategory.isPending ? "Deleting..." : "Delete Category"}
              </button>
              <button
                onClick={() => setDeletingCategory(null)}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
            </div>
            {deleteCategory.error && (
              <div className="mt-3 text-sm text-red-600">
                Error: {deleteCategory.error.message}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Categories List */}
      {categories && categories.length > 0 ? (
        <div className="space-y-3">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-4 transition-colors hover:bg-gray-100"
            >
              <div className="flex-1">
                <h4 className="font-medium text-gray-900">{category.name}</h4>
                {category.description && (
                  <p className="mt-1 text-sm text-gray-600">
                    {category.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-500">
                  Created {new Date(category.createdAt).toLocaleDateString()}
                </p>
              </div>
              {userRole === "ADMIN" && (
                <div className="ml-4 flex items-center gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="py-8 text-center">
          <div className="mb-2 text-gray-500">No categories yet</div>
          {userRole === "ADMIN" && (
            <p className="text-sm text-gray-400">
              Create your first category to organize expenses better.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
