// Consentimento de cookies (LGPD). Guardado no navegador em "tc".
// Hoje o site só usa armazenamento essencial (sacola, favoritos, conta). Se um dia entrar
// ferramenta de estatística ou publicidade, ela só deve ser carregada quando opcionais === true.
export type Consentimento = { v: 1; em: string; opcionais: boolean };
const CHAVE = "tc";
export const EVENTO_ABRIR = "tramisse:cookies";

export function lerConsentimento(): Consentimento | null {
  try {
    const c = JSON.parse(localStorage.getItem(CHAVE) || "null");
    return c && c.v === 1 ? c : null;
  } catch {
    return null;
  }
}

export function salvarConsentimento(opcionais: boolean) {
  const c: Consentimento = { v: 1, em: new Date().toISOString(), opcionais };
  try { localStorage.setItem(CHAVE, JSON.stringify(c)); } catch {}
  return c;
}

export const abrirPreferencias = () => dispatchEvent(new Event(EVENTO_ABRIR));
