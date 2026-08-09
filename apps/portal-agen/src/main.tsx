import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { installAuthenticatedFetch } from "@repo/auth";

installAuthenticatedFetch("portal-agen");

window.addEventListener("vite:preloadError", (event) => {
  event.preventDefault();
  const reloadCount = parseInt(
    sessionStorage.getItem("vite-reload") || "0",
    10,
  );
  if (reloadCount >= 2) return;
  sessionStorage.setItem("vite-reload", (reloadCount + 1).toString());
  const url = new URL(window.location.href);
  url.searchParams.set("reload", Date.now().toString());
  window.location.replace(url.toString());
});

window.setTimeout(() => {
  sessionStorage.removeItem("vite-reload");
}, 5000);

if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    window.setTimeout(() => {
      void navigator.serviceWorker
        .register("/service-worker.js", { updateViaCache: "none" })
        .catch(() => undefined);
    }, 0);
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
