export default function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-white px-5 py-8 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-semibold text-neutral-950">Thendy Hair Garage</p>
          <p className="mt-1 text-xs text-neutral-400">
            Ngobrolin gaya rambut tanpa buru-buru.
          </p>
        </div>
        <a
          href="https://www.instagram.com/thendyhose_/"
          target="_blank"
          rel="noreferrer"
          aria-label="Instagram @thendyhose_"
          className="inline-flex items-center gap-2 font-medium text-neutral-600 underline decoration-neutral-300 underline-offset-4 transition hover:text-neutral-950"
        >
          <svg
            aria-hidden="true"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <rect width="17" height="17" x="3.5" y="3.5" rx="4.5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          <span>@thendyhose_</span>
        </a>
      </div>
    </footer>
  );
}
