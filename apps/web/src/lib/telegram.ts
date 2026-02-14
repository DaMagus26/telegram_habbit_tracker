/* eslint-disable @typescript-eslint/no-explicit-any */

interface TelegramWebApp {
  ready: () => void;
  expand: () => void;
  close: () => void;
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
    };
  };
  MainButton: {
    setText: (text: string) => TelegramWebApp["MainButton"];
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  BackButton: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  CloudStorage: {
    getItem: (key: string, cb: (err: any, val?: string) => void) => void;
    setItem: (key: string, val: string, cb?: (err: any) => void) => void;
    getItems: (keys: string[], cb: (err: any, vals?: Record<string, string>) => void) => void;
  };
  onEvent: (event: string, cb: () => void) => void;
  offEvent: (event: string, cb: () => void) => void;
  themeParams: Record<string, string>;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export function getWebApp(): TelegramWebApp | null {
  return window.Telegram?.WebApp ?? null;
}

export function initTelegram(): void {
  const webApp = getWebApp();
  if (!webApp) return;
  webApp.ready();
  webApp.expand();
}

export function subscribeToTelegramTheme(onThemeChange: () => void): () => void {
  const webApp = getWebApp();
  if (!webApp) return () => {};
  webApp.onEvent("themeChanged", onThemeChange);
  return () => webApp.offEvent("themeChanged", onThemeChange);
}

export function getCurrentUserLabel(): string | null {
  const user = getWebApp()?.initDataUnsafe?.user;
  if (!user) return null;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ");
  return user.username ? `${name} (@${user.username})` : name;
}
