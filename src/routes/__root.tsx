import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFound() {
  return (
    <div className="container">
      <div className="card" style={{ textAlign: "center" }}>
        <h1 className="serif" style={{ fontSize: "3rem", color: "var(--gold)" }}>
          404
        </h1>
        <p style={{ color: "var(--text2)" }}>That page doesn't exist.</p>
        <Link to="/" className="btn btn-gold" style={{ marginTop: "1rem" }}>
          Go home
        </Link>
      </div>
    </div>
  );
}

function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="container">
      <div className="card">
        <h1 className="serif" style={{ color: "var(--gold)" }}>
          Something went wrong
        </h1>
        <p style={{ color: "var(--text2)", marginTop: ".5rem" }}>{error.message}</p>
        <button
          className="btn btn-primary"
          style={{ marginTop: "1rem" }}
          onClick={() => {
            router.invalidate();
            reset();
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "VinoAI — Wine Quality Prediction" },
      {
        name: "description",
        content:
          "Predict red wine quality from 11 physicochemical features using a trained Random Forest model. Interactive dashboard, history, and API.",
      },
      { property: "og:title", content: "VinoAI — Wine Quality Prediction" },
      {
        property: "og:description",
        content: "Trained Random Forest wine-quality predictor with interactive dashboard.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=DM+Sans:wght@300;400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFound,
  errorComponent: ErrorView,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <nav className="navbar">
        <Link to="/" className="nav-brand">
          <div className="logo-icon">🍷</div>
          <span className="brand-name">VinoAI</span>
        </Link>
        <div className="nav-links">
          <Link to="/" activeOptions={{ exact: true }} activeProps={{ className: "active" }}>
            Home
          </Link>
          <Link to="/predict" activeProps={{ className: "active" }}>
            Predict
          </Link>
          <Link to="/dashboard" activeProps={{ className: "active" }}>
            Dashboard
          </Link>
          <Link to="/history" activeProps={{ className: "active" }}>
            History
          </Link>
          <Link to="/api" activeProps={{ className: "active" }}>
            API
          </Link>
        </div>
      </nav>
      <Outlet />
    </QueryClientProvider>
  );
}
