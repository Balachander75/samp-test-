import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
import { setupMockApiInterceptor } from "./mock/mockApiInterceptor";

// Activate client-side mock backend interceptor
setupMockApiInterceptor();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
