"use client";

import { CFG } from "@/lib/config";
import { useLoja } from "@/store/Store";

const MEDIDAS = CFG.medidas.tabela;

// Fundo escuro das gavetas, guia de tamanhos e aviso rápido (toast).
export function Overlays() {
  const { abrir, guia, setGuia, mensagem } = useLoja();
  return (
    <>
      <div className="ov" onClick={() => abrir(null)}></div>
      <div className={`mod${guia ? " on" : ""}`} role="dialog" aria-modal="true">
        <div>
          <h3>Guia de tamanhos</h3>
          <table>
            <tbody>
              <tr><th>Tam.</th><th>Busto</th><th>Cintura</th><th>Quadril</th></tr>
              {MEDIDAS.map((r) => <tr key={r[0]}>{r.map((x, i) => <td key={i}>{x}</td>)}</tr>)}
            </tbody>
          </table>
          <small>Medidas em centímetros. Ficou em dúvida entre dois tamanhos? Fale com a gente no WhatsApp.</small><br /><br />
          <button className="btn o" onClick={() => setGuia(false)}>FECHAR</button>
        </div>
      </div>
      <div id="toast" role="status" className={mensagem ? "on" : ""}>{mensagem}</div>
    </>
  );
}
