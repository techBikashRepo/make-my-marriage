import Link from "next/link";

type IconName =
  | "calendar"
  | "check"
  | "expenses"
  | "gallery"
  | "guests"
  | "heart"
  | "lock"
  | "sparkle"
  | "tasks"
  | "users"
  | "vendors"
  | "website";

const iconPaths: Readonly<Record<IconName, string>> = {
  calendar:
    "M7 3v3m10-3v3M4.5 9.5h15M6 5h12a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z",
  check: "m5 12 4 4L19 6",
  expenses:
    "M7 7h10M7 11h10m-6 4H7m10 4H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2Z",
  gallery:
    "M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm-2 12 5-5 4 4 3-3 6 6M16.5 8.5h.01",
  guests:
    "M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-6.7a4 4 0 0 1 0 7.4M21 21v-2a4 4 0 0 0-3-3.87",
  heart:
    "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
  lock: "M6 10h12a2 2 0 0 1 2 2v8H4v-8a2 2 0 0 1 2-2Zm3 0V7a3 3 0 0 1 6 0v3m-3 4v2",
  sparkle:
    "m12 3 1.25 3.75L17 8l-3.75 1.25L12 13l-1.25-3.75L7 8l3.75-1.25L12 3Zm6 10 .75 2.25L21 16l-2.25.75L18 19l-.75-2.25L15 16l2.25-.75L18 13Z",
  tasks: "M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01",
  users:
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7-7.7a4 4 0 0 1 0 7.4M22 21v-2a4 4 0 0 0-3-3.87",
  vendors: "M3 9h18M5 9V5h14v4m-13 0v11h12V9M9 20v-6h6v6",
  website:
    "M4 5h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Zm-2 4h20M6 7h.01M9 7h.01",
};

const features = [
  [
    "calendar",
    "Events",
    "Bring every ceremony, celebration, venue, and schedule into one clear timeline.",
    "bg-[#f8e8ec] text-[#8c304c]",
  ],
  [
    "tasks",
    "Tasks",
    "Assign work, set priorities, add due dates, and see what needs attention next.",
    "bg-[#f6eddb] text-[#8b672b]",
  ],
  [
    "guests",
    "Guests & RSVP",
    "Manage households, invitations, meal choices, and responses without guest accounts.",
    "bg-[#e8f0e8] text-[#52705a]",
  ],
  [
    "expenses",
    "Expenses",
    "Record spending in INR and organize costs by event, category, and vendor.",
    "bg-[#eee7f1] text-[#684e72]",
  ],
  [
    "vendors",
    "Vendors",
    "Keep contacts and agreements close, and save vendors for your wedding location.",
    "bg-[#e6eef2] text-[#4b6977]",
  ],
  [
    "gallery",
    "Memories",
    "Collect photos and videos in private albums shared by link or QR code.",
    "bg-[#faeae1] text-[#98543e]",
  ],
] as const satisfies ReadonlyArray<readonly [IconName, string, string, string]>;

const steps = [
  [
    "01",
    "Create your space",
    "Start an account and create one shared wedding workspace.",
  ],
  [
    "02",
    "Bring in your people",
    "Invite your partner and family, then choose who can manage each part.",
  ],
  [
    "03",
    "Plan it together",
    "Organize events, tasks, guests, expenses, and vendors as plans take shape.",
  ],
  [
    "04",
    "Share the celebration",
    "Send RSVP links, publish your wedding website, and collect memories.",
  ],
] as const;

function Icon({
  name,
  size = 20,
}: Readonly<{ name: IconName; size?: number }>) {
  return (
    <svg
      aria-hidden="true"
      fill="none"
      height={size}
      viewBox="0 0 24 24"
      width={size}
    >
      <path
        d={iconPaths[name]}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function Brand({ light = false }: Readonly<{ light?: boolean }>) {
  return (
    <Link
      className={`flex items-center gap-2.5 text-[15px] font-medium tracking-[-0.02em] ${light ? "text-white" : "text-[#3f222b]"}`}
      href="/"
      aria-label="Make My Marriage home"
    >
      <span
        className={`grid size-9 place-items-center rounded-full border ${light ? "border-white/30 bg-white/10" : "border-[#decbd1] bg-white"}`}
      >
        <Icon name="heart" size={17} />
      </span>
      <span>
        Make My <strong className="font-semibold">Marriage</strong>
      </span>
    </Link>
  );
}

function Eyebrow({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.19em] text-[#8a4056] uppercase">
      <span className="h-px w-7 bg-[#b87689]" aria-hidden="true" />
      {children}
    </p>
  );
}

function DashboardPreview() {
  return (
    <div className="relative mx-auto w-full max-w-[650px] lg:mx-0">
      <div className="absolute -top-7 -right-1 z-20 hidden items-center gap-2 rounded-xl border border-[#eadde1] bg-white px-3 py-2 text-[10px] shadow-[0_14px_35px_rgba(75,30,43,0.13)] sm:flex lg:-right-6">
        <span className="grid size-6 place-items-center rounded-full bg-[#e8f1e9] text-[#4b7358]">
          <Icon name="check" size={13} />
        </span>
        <span>
          <strong className="block text-[#422a32]">RSVP received</strong>
          <small className="text-[#8b747b]">Sharma family · 4 guests</small>
        </span>
      </div>
      <div className="overflow-hidden rounded-2xl border border-[#ddcbd1] bg-white shadow-[0_28px_80px_rgba(91,41,57,0.17)]">
        <div className="flex h-9 items-center gap-3 border-b border-[#eee5e8] bg-[#faf7f8] px-3">
          <span className="flex gap-1" aria-hidden="true">
            <i className="size-1.5 rounded-full bg-[#d6aeb9]" />
            <i className="size-1.5 rounded-full bg-[#dec7ad]" />
            <i className="size-1.5 rounded-full bg-[#b9cfbd]" />
          </span>
          <span className="mx-auto rounded bg-white px-12 py-1 text-[7px] text-[#9a858c] shadow-sm">
            makemymarriage.in/dashboard
          </span>
          <span className="grid size-5 place-items-center rounded-full bg-[#74243d] text-[6px] text-white">
            AP
          </span>
        </div>
        <div className="flex min-h-[350px] sm:min-h-[390px]">
          <aside className="hidden w-[105px] shrink-0 border-r border-[#eee5e8] bg-[#fcfafb] p-3 sm:block">
            <span className="mb-5 grid size-7 place-items-center rounded-lg bg-[#74243d] text-white">
              <Icon name="heart" size={12} />
            </span>
            {["Overview", "Events", "Tasks", "Guests", "Expenses"].map(
              (item, index) => (
                <span
                  className={`mb-1 block rounded px-2 py-2 text-[8px] ${index === 0 ? "bg-[#f4e5ea] font-bold text-[#74243d]" : "text-[#8a767d]"}`}
                  key={item}
                >
                  {item}
                </span>
              ),
            )}
          </aside>
          <div className="min-w-0 flex-1 bg-[#fffdfc] p-4 sm:p-5">
            <header className="mb-4 flex items-start justify-between gap-4">
              <div>
                <small className="text-[8px] text-[#957e85]">
                  Good morning, Akshay
                </small>
                <h2 className="font-serif text-lg font-semibold text-[#3b252d] sm:text-xl">
                  Akshay & Princi
                </h2>
                <p className="mt-1 text-[8px] text-[#8e787f]">
                  The Leela Palace · Udaipur
                </p>
              </div>
              <div className="rounded-xl bg-[#74243d] px-3 py-2 text-center text-white">
                <strong className="block font-serif text-lg leading-none">
                  42
                </strong>
                <span className="text-[6px] uppercase">days to go</span>
              </div>
            </header>
            <div className="grid grid-cols-3 gap-2">
              {[
                ["calendar", "7", "Events", "bg-[#f7e7eb] text-[#8a304b]"],
                ["tasks", "38/52", "Tasks done", "bg-[#f5eddc] text-[#8b682c]"],
                ["guests", "214", "RSVPs", "bg-[#e8f0e8] text-[#51705a]"],
              ].map(([icon, value, label, color]) => (
                <div
                  className="rounded-xl border border-[#eee3e6] bg-white p-2.5"
                  key={label}
                >
                  <span
                    className={`mb-2 grid size-6 place-items-center rounded-md ${color}`}
                  >
                    <Icon name={icon as IconName} size={13} />
                  </span>
                  <strong className="block text-[12px] text-[#412a32]">
                    {value}
                  </strong>
                  <small className="text-[7px] text-[#927d84]">{label}</small>
                </div>
              ))}
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div className="rounded-xl border border-[#eee3e6] bg-white p-3">
                <div className="mb-2 flex justify-between text-[8px]">
                  <strong>Upcoming events</strong>
                  <span className="text-[#8c3e56]">View all</span>
                </div>
                {[
                  ["18", "NOV", "Mehendi", "4:00 PM"],
                  ["19", "NOV", "Sangeet", "7:30 PM"],
                  ["20", "NOV", "Wedding", "6:00 PM"],
                ].map(([day, month, name, time]) => (
                  <div
                    className="flex items-center gap-2 border-t border-[#f1e9eb] py-2"
                    key={name}
                  >
                    <span className="w-7 text-center">
                      <strong className="block font-serif text-[11px]">
                        {day}
                      </strong>
                      <small className="block text-[5px] text-[#9c858c]">
                        {month}
                      </small>
                    </span>
                    <p className="text-[7px]">
                      <strong className="block">{name}</strong>
                      <small className="text-[#927d84]">{time}</small>
                    </p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl border border-[#eee3e6] bg-white p-3">
                <div className="mb-2 flex justify-between text-[8px]">
                  <strong>Tasks</strong>
                  <span className="text-[#8c3e56]">73%</span>
                </div>
                {[
                  "Finalize guest list",
                  "Confirm florist",
                  "Review invitation",
                ].map((task, index) => (
                  <div
                    className="flex items-center gap-2 border-t border-[#f1e9eb] py-2"
                    key={task}
                  >
                    <span
                      className={`grid size-3 place-items-center rounded-full border ${index === 0 ? "border-[#6e8b73] bg-[#6e8b73] text-white" : "border-[#d9c9ce]"}`}
                    >
                      {index === 0 ? <Icon name="check" size={8} /> : null}
                    </span>
                    <p className="min-w-0 flex-1 text-[7px]">
                      <strong className="block truncate">{task}</strong>
                      <small className="text-[#927d84]">
                        {index === 0 ? "Due today" : "This week"}
                      </small>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="overflow-hidden bg-[#fffaf7] text-[#2d1f24]">
      <a
        className="fixed top-3 left-3 z-[100] -translate-y-20 rounded-md bg-[#74243d] px-4 py-2 text-sm text-white focus:translate-y-0"
        href="#main-content"
      >
        Skip to content
      </a>
      <header className="relative z-50 border-b border-[#eadde1]/80 bg-[#fffaf7]/95 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav
            className="hidden items-center gap-7 text-[13px] font-medium text-[#604b53] lg:flex"
            aria-label="Primary navigation"
          >
            <a
              className="transition-colors hover:text-[#74243d]"
              href="#features"
            >
              Features
            </a>
            <a
              className="transition-colors hover:text-[#74243d]"
              href="#collaboration"
            >
              For families
            </a>
            <a
              className="transition-colors hover:text-[#74243d]"
              href="#how-it-works"
            >
              How it works
            </a>
            <a
              className="transition-colors hover:text-[#74243d]"
              href="#website"
            >
              Wedding website
            </a>
          </nav>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              className="px-1 py-2 text-[13px] font-semibold whitespace-nowrap text-[#5a4049]"
              href="#how-it-works"
            >
              How it works
            </Link>
            <Link
              className="rounded-lg bg-[#74243d] px-3.5 py-2.5 text-xs font-semibold whitespace-nowrap text-white shadow-sm transition-colors hover:bg-[#5f1d32] sm:px-5 sm:text-[13px]"
              href="#product-preview"
            >
              Preview workspace
            </Link>
          </div>
        </div>
      </header>

      <div id="main-content">
        <section className="relative border-b border-[#ecdee2] px-5 pt-16 sm:px-8 sm:pt-20 lg:pt-24">
          <div
            className="absolute top-0 right-[-12%] size-[520px] rounded-full bg-[#f6e5e9]/60 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-16 lg:grid-cols-[0.84fr_1.16fr] lg:gap-14">
            <div className="max-w-[570px]">
              <Eyebrow>One shared place for your wedding</Eyebrow>
              <h1 className="mt-5 font-serif text-[clamp(3rem,6vw,5.5rem)] leading-[0.98] font-medium tracking-[-0.045em] text-[#342129]">
                Plan your wedding.
                <em className="mt-1 block font-normal text-[#8d4058]">
                  Together.
                </em>
              </h1>
              <p className="mt-7 max-w-[520px] text-base leading-7 text-[#705a62] sm:text-lg sm:leading-8">
                Events, guests, tasks, expenses, vendors, and memories—organized
                in one calm workspace for you and your family.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="inline-flex min-h-12 items-center justify-center gap-4 rounded-lg bg-[#74243d] px-6 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(116,36,61,0.18)] transition-transform hover:-translate-y-0.5"
                  href="#product-preview"
                >
                  Preview workspace <span aria-hidden="true">→</span>
                </Link>
                <a
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#d8c5cb] bg-white px-6 text-sm font-semibold text-[#533943] transition-colors hover:border-[#a66f80]"
                  href="#how-it-works"
                >
                  See how it works
                </a>
              </div>
            </div>
            <div id="product-preview">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
          <div className="mx-auto max-w-[1120px]">
            <div className="mx-auto max-w-[720px] text-center">
              <div className="flex justify-center">
                <Eyebrow>Less chaos, more celebration</Eyebrow>
              </div>
              <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                Your wedding deserves more than scattered plans.
              </h2>
              <p className="mx-auto mt-5 max-w-[610px] leading-7 text-[#79636b]">
                Replace the endless search through chats and sheets with one
                place everyone can understand.
              </p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-2">
              <article className="rounded-2xl border border-[#eadde1] bg-[#fff9f8] p-6 sm:p-8">
                <span className="text-[10px] font-bold tracking-[0.15em] text-[#9b6575] uppercase">
                  Planning everywhere
                </span>
                <h3 className="mt-3 font-serif text-2xl">
                  The details keep getting lost.
                </h3>
                <div className="relative mt-7 h-[190px] overflow-hidden rounded-xl border border-[#ebdfe2] bg-[#f8f1f2] p-5">
                  <div className="w-[78%] rounded-xl bg-white p-3 text-[10px] shadow-sm">
                    <strong className="block text-[#4f343e]">
                      Family group
                    </strong>
                    <span className="text-[#8a747c]">
                      Which caterer did we shortlist?
                    </span>
                  </div>
                  <div className="absolute right-5 bottom-5 grid w-[62%] grid-cols-3 gap-px overflow-hidden rounded-lg border border-[#e1d2d6] bg-[#dfd0d4] shadow-sm">
                    {Array.from({ length: 9 }).map((_, index) => (
                      <span className="h-6 bg-white" key={index} />
                    ))}
                  </div>
                  <span className="absolute top-[82px] left-10 -rotate-3 bg-[#f4e0a8] px-3 py-2 font-serif text-xs shadow">
                    Call decorator again!
                  </span>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-[#6f5961]">
                  {[
                    "Decisions buried in chat threads",
                    "Different versions of the guest list",
                    "Vendor details saved on one person’s phone",
                  ].map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="text-[#b5657d]">×</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="rounded-2xl border border-[#d7ded5] bg-[#f7faf7] p-6 sm:p-8">
                <span className="text-[10px] font-bold tracking-[0.15em] text-[#607866] uppercase">
                  One shared workspace
                </span>
                <h3 className="mt-3 font-serif text-2xl">
                  Everyone knows what comes next.
                </h3>
                <div className="mt-7 h-[190px] rounded-xl border border-[#dbe4da] bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between text-xs">
                    <strong>Wedding overview</strong>
                    <span className="rounded-full bg-[#f3e4e8] px-2 py-1 text-[8px] text-[#7c334a]">
                      42 days to go
                    </span>
                  </div>
                  <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#ede5e7]">
                    <span className="block h-full w-[72%] rounded-full bg-[#7a3a4e]" />
                  </div>
                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {[
                      ["calendar", "7 events"],
                      ["tasks", "14 tasks"],
                      ["guests", "214 RSVPs"],
                    ].map(([icon, label]) => (
                      <span
                        className="flex flex-col items-center gap-2 rounded-lg bg-[#faf7f8] p-3 text-[9px] text-[#6f5961]"
                        key={label}
                      >
                        <Icon name={icon as IconName} size={17} />
                        {label}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="mt-6 space-y-3 text-sm text-[#5e6e61]">
                  {[
                    "One trusted view of wedding plans",
                    "Clear ownership for every family task",
                    "Guest, expense, and vendor details together",
                  ].map((item) => (
                    <li className="flex gap-3" key={item}>
                      <span className="text-[#66806c]">
                        <Icon name="check" size={15} />
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
            </div>
          </div>
        </section>

        <section
          className="bg-[#fbf5f3] px-5 py-20 sm:px-8 sm:py-28"
          id="features"
        >
          <div className="mx-auto max-w-[1120px]">
            <div className="grid items-end gap-6 lg:grid-cols-[1fr_0.55fr]">
              <div>
                <Eyebrow>Everything in its place</Eyebrow>
                <h2 className="mt-5 max-w-[650px] font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                  The planning tools your wedding actually needs.
                </h2>
              </div>
              <p className="max-w-[460px] leading-7 text-[#79636b] lg:justify-self-end">
                Each part works together, so every new decision has a clear
                place in the plan.
              </p>
            </div>
            <div className="mt-14 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map(([icon, title, description, color]) => (
                <article
                  className="group rounded-2xl border border-[#e8dadd] bg-white p-6 transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(85,43,55,0.09)] sm:p-7"
                  key={title}
                >
                  <span
                    className={`grid size-11 place-items-center rounded-xl ${color}`}
                  >
                    <Icon name={icon} size={22} />
                  </span>
                  <h3 className="mt-6 font-serif text-2xl">{title}</h3>
                  <p className="mt-3 min-h-[72px] text-sm leading-6 text-[#79636b]">
                    {description}
                  </p>
                  <a
                    className="mt-5 inline-flex gap-2 text-xs font-bold text-[#7e354c]"
                    href="#how-it-works"
                  >
                    See how it works <span aria-hidden="true">→</span>
                  </a>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section
          className="bg-white px-5 py-20 sm:px-8 sm:py-28"
          id="collaboration"
        >
          <div className="mx-auto grid max-w-[1120px] items-center gap-14 lg:grid-cols-2 lg:gap-24">
            <div className="rounded-2xl border border-[#e3d7da] bg-[#fbf7f7] p-5 shadow-[0_20px_60px_rgba(76,39,50,0.09)] sm:p-7">
              <div className="flex justify-between border-b border-[#e8dcdf] pb-4 text-xs">
                <strong>
                  <span className="mr-2 inline-block size-2 rounded-full bg-[#6e9678]" />
                  Your planning team
                </strong>
                <span className="text-[#8b747c]">6 members</span>
              </div>
              <div className="grid grid-cols-2 gap-3 py-5">
                {[
                  ["AP", "Akshay", "Admin", "bg-[#74243d]"],
                  ["PS", "Princi", "Admin", "bg-[#a4566d]"],
                  ["RM", "Ritu", "Manager", "bg-[#8d7252]"],
                  ["SK", "Sanjay", "Manager", "bg-[#637b69]"],
                ].map(([initials, name, role, color]) => (
                  <div
                    className="flex items-center gap-3 rounded-xl bg-white p-3"
                    key={name}
                  >
                    <span
                      className={`grid size-9 place-items-center rounded-full text-[9px] font-bold text-white ${color}`}
                    >
                      {initials}
                    </span>
                    <p className="text-xs">
                      <strong className="block">{name}</strong>
                      <small className="text-[#8d777e]">{role}</small>
                    </p>
                  </div>
                ))}
              </div>
              {[
                "Shortlist mehendi artists",
                "Confirm photographer contract",
              ].map((task, index) => (
                <div
                  className="mt-2 flex items-center justify-between gap-4 rounded-xl border border-[#e8dcdf] bg-white p-4"
                  key={task}
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-7 place-items-center rounded-full bg-[#edf3ed] text-[#52705a]">
                      <Icon name="check" size={13} />
                    </span>
                    <p className="text-xs">
                      <strong className="block">{task}</strong>
                      <small className="text-[#8d777e]">
                        Assigned to {index === 0 ? "Ritu" : "Sanjay"}
                      </small>
                    </p>
                  </div>
                  <span className="hidden rounded-full bg-[#f4e7eb] px-2 py-1 text-[8px] text-[#803a50] sm:block">
                    In progress
                  </span>
                </div>
              ))}
            </div>
            <div>
              <Eyebrow>Made for families</Eyebrow>
              <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                Plan as one team, with clear roles.
              </h2>
              <p className="mt-6 leading-7 text-[#79636b]">
                Give trusted family members the right level of access, assign
                work, and keep every responsibility visible without losing
                control of the wedding workspace.
              </p>
              <div className="mt-8 space-y-5">
                {[
                  [
                    "users",
                    "Admin and manager roles",
                    "Share responsibility while keeping permissions clear.",
                  ],
                  [
                    "tasks",
                    "Visible ownership",
                    "Know who is handling each task and what is still open.",
                  ],
                  [
                    "sparkle",
                    "One shared view",
                    "Keep the family aligned as wedding plans evolve.",
                  ],
                ].map(([icon, title, text]) => (
                  <div className="flex gap-4" key={title}>
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5e7eb] text-[#7d354b]">
                      <Icon name={icon as IconName} size={19} />
                    </span>
                    <p>
                      <strong className="block text-sm">{title}</strong>
                      <small className="mt-1 block text-sm leading-6 text-[#806a72]">
                        {text}
                      </small>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section
          className="bg-[#f8f0ed] px-5 py-20 sm:px-8 sm:py-28"
          id="website"
        >
          <div className="mx-auto max-w-[1120px]">
            <div className="mx-auto max-w-[720px] text-center">
              <div className="flex justify-center">
                <Eyebrow>From planning to celebrating</Eyebrow>
              </div>
              <h2 className="mt-5 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
                A beautiful home for your wedding story.
              </h2>
              <p className="mt-5 leading-7 text-[#79636b]">
                Share the details guests need, then collect the moments everyone
                wants to remember.
              </p>
            </div>
            <div className="mt-14 grid gap-5 lg:grid-cols-2">
              <article className="overflow-hidden rounded-2xl border border-[#e2d2d7] bg-white">
                <div className="m-4 overflow-hidden rounded-xl border border-[#e4d5d8] bg-[#f8ede9] sm:m-6">
                  <div className="flex items-center justify-between bg-white/80 px-4 py-3 text-[8px]">
                    <span className="font-serif font-bold">A & P</span>
                    <span>Our story &nbsp; Events &nbsp; RSVP</span>
                  </div>
                  <div className="flex min-h-[260px] flex-col items-center justify-center bg-[radial-gradient(circle_at_20%_20%,#f5d9d6,transparent_38%),linear-gradient(145deg,#faf1e8,#e9c9c5)] px-6 text-center">
                    <span className="text-[9px] tracking-[0.2em] text-[#855268]">
                      20 · 11 · 2026
                    </span>
                    <h3 className="mt-4 font-serif text-4xl text-[#5a2d3d] italic">
                      Akshay & Princi
                    </h3>
                    <p className="mt-2 text-[10px] text-[#805f68]">
                      Udaipur, Rajasthan
                    </p>
                    <span className="mt-5 rounded-full bg-[#74243d] px-4 py-2 text-[8px] text-white">
                      View events
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 px-6 pb-7">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4e4e8] text-[#7a334a]">
                    <Icon name="website" size={20} />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">Your wedding website</h3>
                    <p className="mt-2 text-sm leading-6 text-[#79636b]">
                      Publish your story, schedule, venues, and a YouTube video
                      in one guest-friendly place.
                    </p>
                  </div>
                </div>
              </article>
              <article className="overflow-hidden rounded-2xl border border-[#e2d2d7] bg-white">
                <div className="m-4 rounded-xl border border-[#e4d5d8] bg-[#fffaf7] p-4 sm:m-6">
                  <div className="mb-4 flex justify-between text-[9px]">
                    <p>
                      <strong className="block font-serif text-sm">
                        Our memories
                      </strong>
                      <span className="text-[#8b747c]">Akshay & Princi</span>
                    </p>
                    <span className="h-fit rounded-full border border-[#dfccd2] px-3 py-1">
                      Share
                    </span>
                  </div>
                  <div className="grid h-[218px] grid-cols-2 grid-rows-2 gap-2">
                    <span className="row-span-2 rounded-lg bg-[linear-gradient(160deg,#8b4f5d,#d6a294)]" />
                    <span className="rounded-lg bg-[linear-gradient(145deg,#d5b97d,#8d7452)]" />
                    <span className="grid place-items-center rounded-lg bg-[linear-gradient(145deg,#99707b,#e1b0a1)] font-serif text-xl text-white">
                      +42
                    </span>
                  </div>
                </div>
                <div className="flex gap-4 px-6 pb-7">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f4e4e8] text-[#7a334a]">
                    <Icon name="gallery" size={20} />
                  </span>
                  <div>
                    <h3 className="font-serif text-xl">
                      A private wedding gallery
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#79636b]">
                      Organize albums by event and invite guests to contribute
                      through a private link or QR code.
                    </p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className="bg-white px-5 py-20 sm:px-8 sm:py-28"
          id="how-it-works"
        >
          <div className="mx-auto max-w-[1120px]">
            <div className="text-center">
              <div className="flex justify-center">
                <Eyebrow>How it works</Eyebrow>
              </div>
              <h2 className="mt-5 font-serif text-4xl tracking-[-0.03em] sm:text-5xl">
                From first list to final celebration.
              </h2>
            </div>
            <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {steps.map(([number, title, text], index) => (
                <li className="relative" key={number}>
                  <div className="flex items-center">
                    <span className="grid size-12 shrink-0 place-items-center rounded-full border border-[#d8bcc5] bg-[#fff9fa] font-serif text-sm text-[#7b344b]">
                      {number}
                    </span>
                    {index < steps.length - 1 ? (
                      <span className="ml-4 hidden h-px flex-1 bg-[#e1d3d7] lg:block" />
                    ) : null}
                  </div>
                  <h3 className="mt-5 font-serif text-xl">{title}</h3>
                  <p className="mt-3 text-sm leading-6 text-[#79636b]">
                    {text}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-white px-5 pb-20 sm:px-8 sm:pb-28" id="privacy">
          <div className="mx-auto grid max-w-[1120px] items-center gap-8 rounded-3xl border border-[#ded7cf] bg-[#f5f4ed] p-7 sm:p-10 lg:grid-cols-[auto_1fr_0.8fr] lg:p-12">
            <span className="grid size-16 place-items-center rounded-2xl bg-[#687c6b] text-white">
              <Icon name="lock" size={29} />
            </span>
            <div>
              <Eyebrow>Your wedding stays yours</Eyebrow>
              <h2 className="mt-4 font-serif text-3xl tracking-[-0.025em] sm:text-4xl">
                Private by design, simple for guests.
              </h2>
              <p className="mt-4 max-w-[580px] text-sm leading-6 text-[#6f6861]">
                Your wedding is its own protected workspace. Guests can respond
                and share memories through secure links without creating an
                account.
              </p>
            </div>
            <ul className="space-y-3 text-sm text-[#57645a]">
              {[
                "Wedding-scoped access",
                "Secure RSVP links",
                "Private gallery sharing",
              ].map((item) => (
                <li className="flex items-center gap-3" key={item}>
                  <span className="grid size-6 place-items-center rounded-full bg-white text-[#5c735f]">
                    <Icon name="check" size={13} />
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section
          className="relative overflow-hidden bg-[#74243d] px-5 py-20 text-white sm:px-8 sm:py-24"
          id="get-started"
        >
          <div
            className="absolute inset-0 [background-image:radial-gradient(circle_at_15%_20%,white_0,transparent_1px)] [background-size:32px_32px] opacity-20"
            aria-hidden="true"
          />
          <div className="relative mx-auto max-w-[760px] text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full border border-white/30 bg-white/10">
              <Icon name="heart" size={22} />
            </span>
            <h2 className="mt-6 font-serif text-4xl leading-tight tracking-[-0.03em] sm:text-5xl">
              Ready to bring your wedding plan together?
            </h2>
            <p className="mx-auto mt-5 max-w-[620px] leading-7 text-[#ead7dd]">
              Create your shared space and give every celebration, person, and
              detail a place to belong.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                className="inline-flex min-h-12 items-center justify-center gap-4 rounded-lg bg-white px-6 text-sm font-bold text-[#74243d]"
                href="#product-preview"
              >
                Preview workspace <span aria-hidden="true">→</span>
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/40 px-6 text-sm font-semibold text-white"
                href="#how-it-works"
              >
                See how it works
              </a>
            </div>
          </div>
        </section>
      </div>

      <footer className="bg-[#2f2025] px-5 py-12 text-[#d8c7cc] sm:px-8">
        <div className="mx-auto max-w-[1120px]">
          <div className="grid gap-10 border-b border-white/10 pb-10 md:grid-cols-[1fr_1.2fr]">
            <div>
              <Brand light />
              <p className="mt-5 max-w-[340px] text-sm leading-6 text-[#a99299]">
                A calmer way for Indian families to plan a wedding together.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-5 text-xs">
              <div className="space-y-3">
                <strong className="block text-white">Product</strong>
                <a className="block" href="#features">
                  Features
                </a>
                <a className="block" href="#collaboration">
                  Families
                </a>
                <a className="block" href="#website">
                  Website
                </a>
              </div>
              <div className="space-y-3">
                <strong className="block text-white">Explore</strong>
                <a className="block" href="#product-preview">
                  Dashboard
                </a>
                <a className="block" href="#how-it-works">
                  How it works
                </a>
                <a className="block" href="#privacy">
                  Privacy
                </a>
              </div>
              <div className="space-y-3">
                <strong className="block text-white">Preview</strong>
                <Link className="block" href="#how-it-works">
                  How it works
                </Link>
                <Link className="block" href="#product-preview">
                  Preview workspace
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-2 pt-6 text-[10px] text-[#9c858c] sm:flex-row sm:justify-between">
            <span>© 2026 Make My Marriage</span>
            <span>Made with care for every kind of celebration.</span>
          </div>
        </div>
      </footer>
    </main>
  );
}
