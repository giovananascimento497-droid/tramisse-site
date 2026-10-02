"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { EVENTO_ABRIR, lerConsentimento, salvarConsentimento } from "@/lib/cookies";

// Aviso de cookies (LGPD): aparece na primeira visita e pode ser reaberto pelo rodapé.
export function CookieBanner() {
  const [aberto, setAberto] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [opcionais, setOpcionais] = useState(false);
  const caminho = usePathname();

  useEffect(() => {
    const c = lerConsentimento();
    if (!c) setAberto(true);
    else setOpcionais(c.opcionais);
    const abrir = () => { setPrefs(true); setAberto(true); };
    addEventListener(EVENTO_ABRIR, abrir);
    return () => removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  if (!aberto || caminho.startsWith("/admin")) return null;
  const decidir = (o: boolean) => { salvarConsentimento(o); setOpcionais(o); setAberto(false); setPrefs(false); };

  return (
    <div className="ck-ban" role="dialog" aria-live="polite" aria-label="Aviso de cookies">
      <div className="ck-txt">
        <b>Cookies e privacidade</b>
        <p>
          Usamos cookies e o armazenamento do navegador para manter a sua sacola, os favoritos e a sua conta funcionando. Saiba mais na nossa{" "}
          <Link href="/pagina/privacidade">política de privacidade</Link>.
        </p>
        {prefs ? (
          <div className="ck-prefs">
            <label>
              <input type="checkbox" checked disabled /> <span><b>Essenciais</b> · sempre ativos. Sacola, favoritos, conta e segurança do site.</span>
            </label>
            <label>
              <input type="checkbox" checked={opcionais} onChange={(e) => setOpcionais(e.target.checked)} />{" "}
              <span><b>Estatísticas e marketing</b> · hoje não usamos; se passarmos a usar, só com a sua permissão.</span>
            </label>
          </div>
        ) : null}
      </div>
      <div className="ck-bts">
        {prefs ? (
          <button className="btn" onClick={() => decidir(opcionais)}>SALVAR PREFERÊNCIAS</button>
        ) : (
          <>
            <button className="btn" onClick={() => decidir(true)}>ACEITAR</button>
            <button className="btn o" onClick={() => decidir(false)}>SÓ ESSENCIAIS</button>
            <button className="ck-lk" onClick={() => setPrefs(true)}>Preferências</button>
          </>
        )}
      </div>
    </div>
  );
}
