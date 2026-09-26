import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <main className="min-h-screen bg-[#fff8f8] px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-5xl">
        <Link
          className="inline-flex items-center"
          href="/"
          aria-label="Make My Marriage home"
        >
          <Image
            alt="Make My Marriage"
            src="/brand/make-my-marriage-logo.png"
            width={256}
            height={128}
            className="h-12 w-auto object-contain"
            priority
          />
        </Link>
        <div className="mt-10 grid overflow-hidden rounded-3xl border border-[#eedde1] bg-white shadow-[0_24px_80px_rgba(116,36,61,0.08)] lg:grid-cols-[0.85fr_1fr]">
          <div className="hidden bg-[#74243d] p-12 text-white lg:flex lg:flex-col lg:justify-between">
            <span className="text-xs font-bold tracking-[0.22em] text-[#f6d7e0] uppercase">
              A shared space for your celebration
            </span>
            <div>
              <h1 className="font-serif text-4xl leading-tight">
                Make room for the moments that matter.
              </h1>
              <p className="mt-6 max-w-sm text-sm leading-7 text-[#f3dfe5]">
                Bring your plans, people, and memories together in one
                thoughtful place.
              </p>
            </div>
            <span className="text-xs text-[#e7bfcb]">Make My Marriage</span>
          </div>
          <div className="px-6 py-10 sm:px-12 sm:py-14">{children}</div>
        </div>
      </div>
    </main>
  );
}
