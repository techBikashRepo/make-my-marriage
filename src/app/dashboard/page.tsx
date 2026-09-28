import Image from "next/image";
import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getCurrentAccount, SESSION_COOKIE } from "@/modules/auth/service";
import { LogoutButton } from "./logout-button";

export default async function DashboardPage() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const account = await getCurrentAccount(token);
  if (!account) redirect("/login");

  return (
    <main className="min-h-screen bg-[#fff8f8]">
      <header className="border-b border-[#eedde1] bg-white/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link href="/" aria-label="Make My Marriage home">
            <Image
              alt="Make My Marriage"
              src="/brand/make-my-marriage-logo.png"
              width={256}
              height={128}
              className="h-11 w-auto object-contain"
              priority
            />
          </Link>
          <div className="flex items-center gap-5">
            <span className="hidden text-sm text-[#6f5a62] sm:inline">
              {account.user.email}
            </span>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="text-xs font-bold tracking-[0.18em] text-[#a44d68] uppercase">
          Dashboard
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-[#33272c] sm:text-5xl">
          Welcome, {account.user.name}
        </h1>
        {account.membership ? (
          <section className="mt-10 rounded-3xl border border-[#eedde1] bg-white p-8 shadow-sm sm:p-10">
            <p className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
              Your wedding workspace
            </p>
            <h2 className="mt-3 font-serif text-2xl text-[#33272c]">
              Planning together starts here
            </h2>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-[#6f5a62]">
              You’re a {account.membership.role.toLowerCase()} in your wedding
              space. As you add events, tasks, guests, expenses, and vendors,
              your planning overview will come together here.
            </p>
          </section>
        ) : (
          <section className="mt-10" aria-labelledby="getting-started-title">
            <div className="rounded-3xl bg-[#74243d] px-7 py-9 text-white sm:px-10">
              <p className="text-xs font-bold tracking-[0.16em] text-[#f1c9d5] uppercase">
                Your next step
              </p>
              <h2
                id="getting-started-title"
                className="mt-3 font-serif text-3xl sm:text-4xl"
              >
                Start your wedding space
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-[#f3dfe5]">
                Create a space for your celebration or join a wedding with an
                invitation from someone you know.
              </p>
            </div>
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <div className="rounded-2xl border border-[#eedde1] bg-white p-7 shadow-sm">
                <span className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
                  01 · Create
                </span>
                <h3 className="mt-4 font-serif text-2xl text-[#33272c]">
                  Create Wedding
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6f5a62]">
                  Set up a shared planning space and invite your partner and
                  family to help.
                </p>
                <p className="mt-6 text-xs font-semibold text-[#a44d68]">
                  Wedding setup is coming next
                </p>
              </div>
              <div className="rounded-2xl border border-[#eedde1] bg-white p-7 shadow-sm">
                <span className="text-xs font-bold tracking-[0.16em] text-[#a44d68] uppercase">
                  02 · Join
                </span>
                <h3 className="mt-4 font-serif text-2xl text-[#33272c]">
                  Join Wedding
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#6f5a62]">
                  Join an existing wedding space through a personal member
                  invitation.
                </p>
                <p className="mt-6 text-xs font-semibold text-[#a44d68]">
                  Invitation joining is coming next
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
