"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "~/trpc/react";
import CategoriesManagement from "~/components/categories/CategoriesManagement";

export default function OrganizationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const organizationId = params.organizationId as string;

  const [showInviteForm, setShowInviteForm] = useState(false);

  const { data: organization, isLoading: orgLoading } =
    api.organization.getOrganization.useQuery(
      { organizationId },
      { enabled: !!organizationId },
    );

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = api.organization.getMembers.useQuery(
    { organizationId },
    { enabled: !!organizationId },
  );

  const inviteUser = api.organization.inviteUser.useMutation({
    onSuccess: () => {
      setShowInviteForm(false);
      void refetchMembers();
    },
  });

  const handleInviteUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;

    inviteUser.mutate({
      organizationId,
      email,
    });
  };

  if (orgLoading || membersLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-lg">Loading organization details...</div>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="mb-4 text-2xl font-bold text-gray-900">
            Organization not found
          </h2>
          <button
            onClick={() => router.push("/organizations")}
            className="text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Organizations
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/organizations")}
            className="mb-4 text-indigo-600 hover:text-indigo-500"
          >
            ← Back to Organizations
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            {organization.name}
          </h1>
          {organization.description && (
            <p className="mt-2 text-gray-600">{organization.description}</p>
          )}
          <div className="mt-4 flex items-center gap-4">
            <span className="text-sm text-gray-500">
              Role:{" "}
              <span className="font-medium text-gray-900">
                {organization.role}
              </span>
            </span>
            <span className="text-sm text-gray-500">
              Members:{" "}
              <span className="font-medium text-gray-900">
                {members?.length ?? 0}
              </span>
            </span>
          </div>
        </div>

        {/* Invite Users Section - Only for admins */}
        {organization.role === "ADMIN" && (
          <div className="mb-8">
            <div className="rounded-lg bg-white p-6 shadow">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Team Members
                </h2>
                <button
                  onClick={() => setShowInviteForm(!showInviteForm)}
                  className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Invite User
                </button>
              </div>

              {showInviteForm && (
                <div className="mb-6 rounded-lg bg-gray-50 p-4">
                  <h3 className="text-md mb-3 font-medium text-gray-900">
                    Invite New Member
                  </h3>
                  <form onSubmit={handleInviteUser} className="flex gap-3">
                    <div className="flex-1">
                      <input
                        type="email"
                        name="email"
                        placeholder="Enter email address"
                        required
                        className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={inviteUser.isPending}
                        className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                      >
                        {inviteUser.isPending ? "Inviting..." : "Send Invite"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowInviteForm(false)}
                        className="rounded-md bg-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-500"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                  {inviteUser.error && (
                    <div className="mt-3 text-sm text-red-600">
                      Error: {inviteUser.error.message}
                    </div>
                  )}
                  {inviteUser.data && (
                    <div className="mt-3 text-sm text-green-600">
                      ✓ Invitation sent successfully to{" "}
                      {inviteUser.data.user.email}
                    </div>
                  )}
                </div>
              )}

              {/* Members List */}
              <div className="space-y-3">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <span className="font-medium text-indigo-600">
                          {member.name
                            ? member.name.charAt(0).toUpperCase()
                            : member.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.name ?? member.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          member.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Non-admin view of members */}
        {organization.role === "MEMBER" && (
          <div className="mb-8">
            <div className="rounded-lg bg-white p-6 shadow">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Team Members
              </h2>
              <div className="space-y-3">
                {members?.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100">
                        <span className="font-medium text-indigo-600">
                          {member.name
                            ? member.name.charAt(0).toUpperCase()
                            : member.email?.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">
                          {member.name ?? member.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                          member.role === "ADMIN"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {member.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Categories Management */}
        <div className="mb-8">
          <CategoriesManagement 
            organizationId={organizationId} 
            userRole={organization.role as "ADMIN" | "MEMBER"} 
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">Total Members</h3>
            <div className="mt-2 text-3xl font-bold text-gray-900">
              {members?.length ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Active Members
            </h3>
            <div className="mt-2 text-3xl font-bold text-green-600">
              {members?.length ?? 0}
            </div>
          </div>
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="text-sm font-medium text-gray-500">
              Pending Invitations
            </h3>
            <div className="mt-2 text-3xl font-bold text-yellow-600">0</div>
          </div>
        </div>
      </div>
    </div>
  );
}
