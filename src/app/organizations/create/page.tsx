"use client";

import { useRouter } from "next/navigation";
import { api } from "~/trpc/react";

export default function CreateOrganizationPage() {
  const router = useRouter();
  const createOrganization = api.organization.create.useMutation({
    onSuccess: (org) => {
      router.push(`/organizations/${org.id}`);
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            Create New Organization
          </h1>
          <p className="mt-2 text-gray-600">
            Set up a new organization to manage expenses and team members.
          </p>
        </div>

        <div className="rounded-lg bg-white p-6 shadow">
          <form onSubmit={handleCreateOrganization} className="space-y-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Organization Name *
              </label>
              <input
                type="text"
                name="name"
                id="name"
                required
                placeholder="e.g., Acme Corp"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be the name your team members see when they join.
              </p>
            </div>

            <div>
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700"
              >
                Description
              </label>
              <textarea
                name="description"
                id="description"
                rows={4}
                placeholder="Describe your organization and its purpose..."
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
              <p className="mt-1 text-sm text-gray-500">
                Optional: Help your team members understand what this
                organization is for.
              </p>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-2 text-sm font-medium text-gray-900">
                What happens next?
              </h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• You&apos;ll be added as an admin of this organization</li>
                <li>• You can invite team members via their email</li>
                <li>• You can set up expense categories and policies</li>
                <li>• Team members can start submitting expenses</li>
              </ul>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={createOrganization.isPending}
                className="flex-1 rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
              >
                {createOrganization.isPending
                  ? "Creating..."
                  : "Create Organization"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/organizations")}
                className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
              >
                Cancel
              </button>
            </div>
          </form>

          {createOrganization.error && (
            <div className="mt-4 rounded-md border border-red-200 bg-red-50 p-3">
              <div className="text-sm text-red-600">
                Error: {createOrganization.error.message}
              </div>
            </div>
          )}

          {createOrganization.isSuccess && (
            <div className="mt-4 rounded-md border border-green-200 bg-green-50 p-3">
              <div className="text-sm text-green-600">
                Organization created successfully! Redirecting...
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
