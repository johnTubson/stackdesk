import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRouteWithContext,
  useMatches,
} from "@tanstack/react-router";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { RootDevtools } from "../components/root-devtools";
import type { RouterContext } from "../router";
import { fetchSession } from "#/server/auth";

import appCss from "../styles.css?url";

const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('theme');var mode=(stored==='light'||stored==='dark'||stored==='auto')?stored:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');root.classList.add(resolved);if(mode==='auto'){root.removeAttribute('data-theme')}else{root.setAttribute('data-theme',mode)}root.style.colorScheme=resolved;}catch(e){}})();`;

export const Route = createRootRouteWithContext<RouterContext>()({
  beforeLoad: async () => {
    const session = await fetchSession();
    return { session };
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "StackDesk",
      },
      {
        name: "description",
        content:
          "StackDesk — merchant operations, onboarding, and reconciliation console.",
      },
      {
        name: "theme-color",
        content: "#328f97",
      },
      {
        name: "application-name",
        content: "StackDesk",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      {
        rel: "icon",
        href: "/favicon.ico",
        sizes: "32x32",
      },
      {
        rel: "icon",
        href: "/icon.svg",
        type: "image/svg+xml",
      },
      {
        rel: "apple-touch-icon",
        href: "/apple-touch-icon.png",
      },
      {
        rel: "manifest",
        href: "/manifest.json",
      },
    ],
  }),
  notFoundComponent: NotFoundPage,
  shellComponent: RootDocument,
});

function NotFoundPage() {
  const matches = useMatches();
  const isAdminShell = matches.some((match) =>
    match.routeId.startsWith("/_admin")
  );

  if (isAdminShell) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-[var(--admin-bg)] p-6">
        <div className="w-full max-w-md rounded-xl border border-[var(--admin-border)] bg-[var(--admin-surface)] p-8 text-center shadow-sm">
          <p className="text-sm font-semibold tracking-wide text-[var(--admin-primary)] uppercase">
            404
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--admin-foreground)]">
            Page not found
          </h1>
          <p className="mt-2 text-sm text-[var(--admin-foreground-muted)]">
            This route does not exist or is not available yet.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              to="/dashboard"
              className="rounded-lg bg-[var(--admin-primary)] px-4 py-2 text-sm font-semibold text-white no-underline hover:bg-[var(--admin-primary-hover)]"
            >
              Dashboard
            </Link>
            <Link
              to="/merchants"
              search={{ status: "all", page: 1 }}
              className="rounded-lg border border-[var(--admin-border)] px-4 py-2 text-sm font-semibold text-[var(--admin-foreground)] no-underline hover:bg-[var(--admin-muted-bg)]"
            >
              Merchants
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="page-wrap px-4 py-24">
      <section className="island-shell mx-auto max-w-lg rounded-2xl p-8 text-center">
        <p className="island-kicker mb-2">404</p>
        <h1 className="display-title mb-3 text-3xl font-bold text-[var(--sea-ink)]">
          Page not found
        </h1>
        <p className="mb-6 text-[var(--sea-ink-soft)]">
          The page you requested does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center rounded-full border border-[var(--chip-line)] bg-[var(--chip-bg)] px-4 py-2 text-sm font-semibold text-[var(--sea-ink)] no-underline shadow-[0_8px_24px_rgba(30,90,72,0.08)] hover:bg-[var(--link-bg-hover)]"
        >
          Back to home
        </Link>
      </section>
    </main>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  const matches = useMatches();
  const isAdminShell = matches.some((match) =>
    match.routeId.startsWith("/_admin")
  );
  const isLoginPage = matches.some((match) => match.routeId === "/login");

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={isAdminShell || isLoginPage ? "admin-root" : undefined}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body
        className={
          isAdminShell || isLoginPage
            ? "font-sans antialiased"
            : "font-sans antialiased [overflow-wrap:anywhere] selection:bg-[rgba(79,184,178,0.24)]"
        }
      >
        {!isAdminShell && !isLoginPage ? <Header /> : null}
        {children ?? <Outlet />}
        {!isAdminShell && !isLoginPage ? <Footer /> : null}
        <RootDevtools />
        <Scripts />
      </body>
    </html>
  );
}
