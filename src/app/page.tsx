import Link from "next/link";

import { auth } from "~/server/auth";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    void api.organization.getUserOrganizations.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <h1 className="text-5xl font-extrabold tracking-tight text-center sm:text-[5rem]">
            Expense <span className="text-[hsl(280,100%,70%)]">Management</span>
          </h1>
          <p className="text-xl text-center max-w-2xl">
            Streamlined expense reimbursement system with policy enforcement and approval workflows
          </p>
          
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/organizations"
            >
              <h3 className="text-2xl font-bold">Organizations →</h3>
              <div className="text-lg">
                Manage your organizations, invite members, and configure settings.
              </div>
            </Link>
            <Link
              className="flex max-w-xs flex-col gap-4 rounded-xl bg-white/10 p-4 hover:bg-white/20"
              href="/expenses"
            >
              <h3 className="text-2xl font-bold">Expenses →</h3>
              <div className="text-lg">
                Submit expenses and track their approval status.
              </div>
            </Link>
          </div>

          <div className="flex flex-col items-center gap-2">
            <div className="flex flex-col items-center justify-center gap-4">
              <p className="text-center text-2xl text-white">
                {session && <span>Logged in as {session.user?.name}</span>}
              </p>
              <Link
                href={session ? "/api/auth/signout" : "/api/auth/signin"}
                className="rounded-full bg-white/10 px-10 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                {session ? "Sign out" : "Sign in"}
              </Link>
            </div>
          </div>

          {session?.user && (
            <div className="mt-8 text-center">
              <Link
                href="/organizations/create"
                className="rounded-full bg-[hsl(280,100%,70%)] px-10 py-3 font-semibold no-underline transition hover:bg-[hsl(280,100%,60%)] text-black"
              >
                Create New Organization
              </Link>
            </div>
          )}
        </div>
      </main>
    </HydrateClient>
  );
}
