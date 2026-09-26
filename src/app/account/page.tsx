import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentAccount, SESSION_COOKIE } from "@/modules/auth/service";
import { LogoutButton } from "./logout-button";

export default async function AccountPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const account = await getCurrentAccount(token);
  if (!account) redirect("/login");

  return (
    <main className="min-h-screen bg-[#fff8f8] px-5 py-10">
      <div className="mx-auto max-w-3xl">
        <Link className="text-sm font-semibold text-[#74243d]" href="/">
          ← Make My Marriage
        </Link>
        <div className="mt-12 rounded-3xl border border-[#eedde1] bg-white p-8 shadow-sm sm:p-12">
          <p className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
            Your account
          </p>
          <h1 className="mt-3 font-serif text-4xl text-[#33272c]">
            Welcome, {account.user.name}
          </h1>
          <p className="mt-4 text-sm text-[#6f5a62]">{account.user.email}</p>
          {account.membership ? (
            <p className="mt-8 text-sm text-[#6f5a62]">
              You’re part of a wedding workspace as{" "}
              {account.membership.role.toLowerCase()}.
            </p>
          ) : (
            <div className="mt-8 rounded-2xl bg-[#f9eff1] p-6">
              <h2 className="font-serif text-xl text-[#74243d]">
                Your wedding space starts here
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6f5a62]">
                Your account is ready. You’ll be able to create a wedding or
                join one with an invitation when wedding setup becomes
                available.
              </p>
            </div>
          )}
          <div className="mt-8">
            <LogoutButton />
          </div>
        </div>
      </div>
    </main>
  );
}
