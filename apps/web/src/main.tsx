import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { initTelegram, subscribeToTelegramTheme } from "./lib/telegram";
import "./styles.css";

initTelegram();
const unsubscribe = subscribeToTelegramTheme(() => undefined);

window.addEventListener("beforeunload", () => {
  unsubscribe();
});

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
