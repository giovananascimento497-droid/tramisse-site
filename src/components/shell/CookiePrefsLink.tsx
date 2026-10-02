"use client";

import { abrirPreferencias } from "@/lib/cookies";

// Link do rodapé para rever a escolha de cookies.
export function CookiePrefsLink() {
  return <button className="ft-ck" onClick={abrirPreferencias}>Preferências de cookies</button>;
}
