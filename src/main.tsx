import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "katex/dist/katex.min.css";
import { registerAcademyOfflineSupport } from "./lib/academy/offline";
import "./styles/tokens.css";
import "./styles/global.css";
import "./styles/product.css";
import "./styles/academy.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

registerAcademyOfflineSupport();
