"use client";

import { useEffect, useState } from "react";
import { brl } from "@/lib/payment/pricing";
import { api } from "./util";

type Faixa = { nome: string; valor: number; bairros: string[] };
type Belem = { ativo: boolean; nome: string; aviso: string; faixas: Faixa[] };
// Na tela, os bairros ficam como texto (um por linha) para editar fácil.
type FaixaEd = { nome: string; valor: string; bairros: string };

const paraTela = (b: Belem) => b.faixas.map((f) => ({ nome: f.nome, valor: String(f.valor), bairros: f.bairros.join("\n") }));
const daTela = (fs: FaixaEd[]): Faixa[] =>
  fs.map((f) => ({ nome: f.nome.trim(), valor: Number(f.valor.replace(",", ".")), bairros: f.bairros.split(/\n|,|;/).map((x) => x.trim()).filter(Boolean) }));

// Aba ENTREGA do painel: entrega própria em Belém por bairro (rota única aos sábados).
export function EntregaView({ onSair }: { onSair: () => void }) {
  const [orig, setOrig] = useState<Belem | null>(null);
  const [ativo, setAtivo] = useState(true);
  const [aviso, setAviso] = useState("");
  const [faixas, setFaixas] = useState<FaixaEd[]>([]);
  const [erro, setErro] = useState("");
  const [ok, setOk] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    api("/api/admin/entrega")
      .then((d) => {
        const b: Belem = d.belem ?? { ativo: false, nome: "Entrega em Belém (sábado)", aviso: "", faixas: [] };
        setOrig(b);
        setAtivo(b.ativo);
        setAviso(b.aviso);
        setFaixas(paraTela(b));
      })
      .catch((e) => ((e as { status?: number }).status === 401 ? onSair() : setErro((e as Error).message)));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!orig) return erro ? <p className="er">{erro}</p> : <p>Carregando…</p>;
  const mudar = (i: number, m: Partial<FaixaEd>) => { setOk(""); setFaixas((l) => l.map((f, k) => (k === i ? { ...f, ...m } : f))); };

  const publicar = async () => {
    setErro("");
    setOk("");
    setOcupado(true);
    try {
      const d = await api("/api/admin/entrega", { method: "POST", body: JSON.stringify({ belem: { ativo, nome: orig.nome, aviso, faixas: daTela(faixas) } }) });
      setOrig(d.belem);
      setFaixas(paraTela(d.belem));
      setOk("Publicado! O site atualiza em uns 3 minutos.");
    } catch (e) {
      setErro((e as Error).message);
    } finally {
      setOcupado(false);
    }
  };

  return (
    <div className="ent">
      <h3 style={{ marginTop: 8 }}>Entrega em Belém por bairro</h3>
      <p className="adm-dica">
        No checkout, a cliente escolhe o bairro e o frete entra no pedido (pago junto, no Pix ou no cartão). Bairro fora da lista não aparece:
        ela escolhe Correios ou fala no WhatsApp. Frete grátis acima do valor mínimo vale aqui também.
      </p>
      <label className="ent-ck"><input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} /> Mostrar a entrega em Belém no checkout</label>
      <label className="ent-campo">
        Aviso para a cliente
        <textarea rows={2} value={aviso} onChange={(e) => setAviso(e.target.value)} />
      </label>

      <div className="ent-faixas">
        {faixas.map((f, i) => {
          const n = f.bairros.split(/\n|,|;/).filter((x) => x.trim()).length;
          return (
            <section key={i} className="ent-faixa">
              <div className="ent-top">
                <input value={f.nome} onChange={(e) => mudar(i, { nome: e.target.value })} aria-label="Nome da faixa" />
                <span className="ent-rs">R$<input inputMode="decimal" value={f.valor} onChange={(e) => mudar(i, { valor: e.target.value })} aria-label="Valor" /></span>
                <button className="adm-x" onClick={() => confirm(`Tirar a faixa "${f.nome}"?`) && setFaixas((l) => l.filter((_, k) => k !== i))} aria-label="Tirar faixa">×</button>
              </div>
              <textarea rows={8} value={f.bairros} onChange={(e) => mudar(i, { bairros: e.target.value })} aria-label={`Bairros da faixa ${f.nome}`} />
              <small>{n} {n === 1 ? "bairro" : "bairros"} · {Number(f.valor.replace(",", ".")) >= 0 ? brl(Number(f.valor.replace(",", "."))) : "valor inválido"} · um bairro por linha</small>
            </section>
          );
        })}
      </div>
      <p><button className="btn o" onClick={() => setFaixas((l) => [...l, { nome: "Nova faixa", valor: "25", bairros: "" }])}>+ FAIXA</button></p>

      {erro ? <p className="er">{erro}</p> : null}
      <p style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button className="btn" onClick={publicar} disabled={ocupado}>{ocupado ? "PUBLICANDO…" : "PUBLICAR"}</button>
        {ok ? <span style={{ color: "var(--car)" }}>{ok}</span> : null}
      </p>
      <p className="adm-dica">Dica: na aba PEDIDOS, o filtro &quot;Rota de sábado&quot; mostra os pedidos de Belém para entregar, por bairro.</p>
    </div>
  );
}
