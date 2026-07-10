import React from "react";
import { createRoot } from "react-dom/client";

import "./styles.css";
import "./app/styles/globals.css";

import App from "@/app/App";
import { AppProviders } from "@/app/providers/AppProviders";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <App />
    </AppProviders>
  </React.StrictMode>,
);
