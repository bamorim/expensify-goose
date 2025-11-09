"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export default function OrganizationsPage() {
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  const { data: organizations, isLoading, refetch } = api.organization.getUserOrganizations.useQuery();
  const createOrganization = api.organization.create.useMutation({
    onSuccess: () => {
      setShowCreateForm(false);
      void refetch();
    },
  });

  const handleCreateOrganization = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    
    createOrganization.mutate({
      name,
      description: description || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-lg">Loading organizations...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Your Organizations</h1>
          <p className="mt-2 text-gray-600">
            Manage your organizations and team members
          </p>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
          >
            Create New Organization
          </button>
        </div>

        {showCreateForm && (
          <div className="mb-8 rounded-lg bg-white p-6 shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Organization</h2>
            <form onSubmit={handleCreateOrganization} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description (optional)
                </label>
                <textarea
                  name="description"
                  id="description"
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-3 py-2 border"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={createOrganization.isPending}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                >
                  {createOrganization.isPending ? "Creating..." : "Create Organization"}
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
            {createOrganization.error && (
              <div className="mt-4 text-red-600 text-sm">
                Error: {createOrganization.error.message}
              </div>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {organizations?.map((org) => (
            <div key={org.id} className="rounded-lg bg-white p-6 shadow hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold text-gray-900">{org.name}</h3>
              {org.description && (
                <p className="mt-2 text-gray-600 text-sm">{org.description}</p>
              )}
              <div className="mt-4">
                <a
                  href={`/organizations/${org.id}`}
                  className="text-indigo-600 hover:text-indigo-500 text-sm font-medium"
                >
                  View Organization →
                </a>
              </div>
            </div>
          ))}
        </div>

        {organizations?.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">No organizations yet</h3>
            <p className="text-gray-600">Create your first organization to get started.</p>
          </div>
        )}
      </div>
    </div>
  );
}
