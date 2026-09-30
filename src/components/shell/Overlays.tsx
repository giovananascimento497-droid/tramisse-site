"use client";

import { useLoja } from "@/store/Store";

const MEDIDAS = [["PP", 84, 66, 90], ["P", 88, 70, 94], ["M", 92, 74, 98], ["G", 98, 80, 104], ["GG", 104, 86, 110]];

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
              {MEDIDAS.map((r) => <tr key={r[0]}>{r.map((x) => <td key={x}>{x}</td>)}</tr>)}
            </tbody>
          </table>
          <small>Medidas de exemplo em cm.</small><br /><br />
          <button className="btn o" onClick={() => setGuia(false)}>FECHAR</button>
        </div>
      </div>
      <div id="toast" role="status" className={mensagem ? "on" : ""}>{mensagem}</div>
    </>
  );
}
