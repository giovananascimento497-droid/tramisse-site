"use client";

import Link from "next/link";
import { useState } from "react";
import { CL, porId } from "@/lib/catalog";
import { montarPedido } from "@/lib/payment/pedido";
import { CFG } from "@/lib/config";
import { brl, calcularTotais } from "@/lib/payment/pricing";
import { provedorWhatsApp } from "@/lib/payment/whatsapp";
import type { DadosCliente, FormaEntrega, FormaPagamento } from "@/lib/types";
import { useLoja } from "@/store/Store";
import { subtotalSacola } from "../shell/BagDrawer";
import { Ph } from "../Ph";

const ETAPAS = ["SACOLA", "IDENTIFICAÇÃO", "ENTREGA", "PAGAMENTO"];
const OBRIG_ID = ["e", "n", "sn", "tel"];
const OBRIG_END = ["cep", "end", "num", "bai", "cid", "uf", "dest"];
const PAGAMENTOS: [FormaPagamento, string, string][] = [
  ["pix", "Pix", "Sem acréscimo."],
  ["debito", "Cartão de débito", "Acréscimo de 5%."],
  ["credito", "Cartão de crédito", "Até 2x, com acréscimo de 5%."],
];

// Checkout por etapas. Não cobra: monta o pedido e abre o WhatsApp da atendente
// (provedor em src/lib/payment). Nenhum dado de cartão é coletado.
export function CheckoutView({ mercadoPago }: { mercadoPago: boolean }) {
  const { bag, setBag, cupom, setCupom, pronto } = useLoja();
  const [step, setStep] = useState(0);
  const [ck, setCk] = useState<DadosCliente>({});
  const [ship, setShip] = useState<FormaEntrega>("aplicativo");
  const [pay, setPay] = useState<FormaPagamento>("pix");
  const [erro, setErro] = useState("");
  const [faltando, setFaltando] = useState<string[]>([]);
  const [enviado, setEnviado] = useState<{ at: string; wa: string } | null>(null);
  const [gerando, setGerando] = useState(false);

  const t = calcularTotais(CFG, subtotalSacola(bag), step >= 3 ? pay : null, cupom);

  if (enviado)
    return (
      <div className="pg">
        <h1>Pedido enviado</h1>
        <p>
          Abrimos o WhatsApp da {enviado.at} com o resumo do seu pedido. Confirme o envio por lá: o atendimento combina pagamento e entrega ou retirada com você.
        </p>
        <p>
          <a className="btn" href={enviado.wa} target="_blank" rel="noopener">ABRIR WHATSAPP</a>{" "}
          <Link className="btn o" href="/">VOLTAR À HOME</Link>
        </p>
      </div>
    );
  if (!pronto) return null;
  if (!bag.length)
    return (
      <div className="pg">
        <h1>Sacola vazia</h1>
        <Link className="btn" href="/categoria/new-in">VER NEW IN</Link>
      </div>
    );

  const fld = (n: keyof DadosCliente, l: string, ph = "", cl = "", type = "text") => (
    <label className={cl}>
      {l}
      <input
        name={n}
        type={type}
        placeholder={ph}
        defaultValue={ck[n] || ""}
        autoComplete="on"
        className={faltando.includes(n) ? "bad" : undefined}
      />
    </label>
  );
  const ler = (f: HTMLFormElement) => {
    const fd = Object.fromEntries(new FormData(f)) as Record<string, string>;
    const novo = { ...ck, ...fd };
    setCk(novo);
    return novo;
  };
  const validar = (dados: Record<string, string | undefined>, campos: string[]) => {
    const m = campos.filter((x) => !(dados[x] || "").trim());
    setFaltando(m);
    setErro(m.length ? "Preencha os campos obrigatórios." : "");
    return !m.length;
  };
  const ir = (s: number) => { setErro(""); setFaltando([]); setStep(s); };

  const pedidoAtual = () => montarPedido({ bag, cupom, pagamento: pay, entrega: ship, cliente: ck });

  const enviar = async (at: string) => {
    const atendente = CFG.atendentes.find((a) => a.nome === at) ?? CFG.atendentes[0];
    const pedido = pedidoAtual();
    if (!pedido) return setErro("Não foi possível montar o pedido. Confira a sacola.");
    const r = await provedorWhatsApp(atendente).finalizar(pedido);
    if (r.tipo !== "redirecionar") return;
    setEnviado({ at: atendente.nome, wa: r.url });
    setBag(() => []);
    setCupom(null);
    window.open(r.url, "_blank");
  };

  // Gera o link do Mercado Pago no servidor e leva a cliente para pagar lá.
  // O pedido fica guardado no navegador para a página de retorno (/checkout/retorno).
  const pagarMercadoPago = async (at: string) => {
    setErro("");
    setGerando(true);
    try {
      const r = await fetch("/api/pagamento/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bag, cupom, pagamento: pay, entrega: ship, cliente: ck }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.erro || "Não foi possível gerar o pagamento.");
      try { localStorage.setItem("tp", JSON.stringify({ referencia: d.referencia, pedido: d.pedido, atendente: at })); } catch {}
      location.href = d.url;
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível gerar o pagamento.");
      setGerando(false);
    }
  };

  const resumo = (
    <details open className="sm">
      <summary style={{ fontSize: 15 }}>RESUMO DO PEDIDO · {brl(t.total)}</summary>
      {bag.map((l) => {
        const p = porId(l.id);
        if (!p) return null;
        return (
          <div className="ln" key={`${l.id}-${l.cor}-${l.tam}`}>
            <div className="im"><Ph p={p} i={0} /></div>
            <div>{p.nome}<br /><small>{CL[l.cor]?.nome} · {l.tam} · {l.q}x</small><br />{brl(p.preco * l.q)}</div>
          </div>
        );
      })}
      <div className="tt"><span>Subtotal</span><span>{brl(t.subtotal)}</span></div>
      <div className="tt"><span>Entrega</span><span>{ship === "retirada" ? "Retirada" : "Por aplicativo"}</span></div>
      {t.desconto ? <div className="tt"><span>Desconto</span><span>-{brl(t.desconto)}</span></div> : null}
      {t.acrescimo ? <div className="tt"><span>Acréscimo do cartão (5%)</span><span>{brl(t.acrescimo)}</span></div> : null}
      <div className="tt big"><span>Total</span><span>{brl(t.total)}</span></div>
      <small style={{ color: "var(--mut)" }}>O valor da entrega por aplicativo é informado no atendimento.</small>
    </details>
  );

  let f: React.ReactNode = null;
  if (step === 0)
    f = (
      <>
        <h2>Sacola</h2>
        <div style={{ margin: "16px 0" }}>
          {bag.map((l, i) => <div key={i}>{porId(l.id)?.nome} · {l.q}x</div>)}
        </div>
        <button className="btn" onClick={() => ir(1)}>CONTINUAR</button>
      </>
    );
  if (step === 1)
    f = (
      <>
        <h2>Identificação</h2>
        <form className="fg" style={{ marginTop: 16 }} noValidate onSubmit={(e) => { e.preventDefault(); if (validar(ler(e.currentTarget), OBRIG_ID)) ir(2); }}>
          {fld("e", "E-mail", "", "s", "email")}{fld("n", "Nome")}{fld("sn", "Sobrenome")}
          {fld("tel", "Telefone", "(91) 90000-0000")}{fld("cpf", "CPF (opcional)", "000.000.000-00")}
          <div className="er s">{erro}</div>
          <button className="btn s">IR PARA A ENTREGA</button>
        </form>
      </>
    );
  if (step === 2)
    f = (
      <>
        <h2>Entrega</h2>
        <form
          className="fg"
          style={{ marginTop: 16 }}
          noValidate
          onSubmit={(e) => { e.preventDefault(); const d = ler(e.currentTarget); if (ship === "retirada" || validar(d, OBRIG_END)) ir(3); }}
        >
          <div className="s">
            {([["aplicativo", "Entrega por aplicativo", "Valor informado no momento da compra, por conta da cliente."], ["retirada", "Retirada", "O endereço é enviado após a confirmação da compra."]] as const).map(([v, tt, sub]) => (
              <label className="opc" key={v}>
                <input type="radio" name="sh" value={v} checked={ship === v} onChange={(e) => { ler(e.currentTarget.form!); setShip(v); }} />
                <span>{tt}<br /><small>{sub}</small></span>
              </label>
            ))}
          </div>
          {ship === "retirada" ? null : (
            <>
              {fld("cep", "CEP", "00000-000")}{fld("end", "Endereço")}{fld("num", "Número")}{fld("cmp", "Complemento")}
              {fld("bai", "Bairro")}{fld("cid", "Cidade")}{fld("uf", "Estado")}{fld("dest", "Destinatário", "", "s")}
            </>
          )}
          <div className="er s">{erro}</div>
          <button className="btn s">IR PARA O PAGAMENTO</button>
        </form>
      </>
    );
  if (step === 3)
    f = (
      <>
        <h2>Pagamento</h2>
        <form className="fg" style={{ marginTop: 16 }} onSubmit={(e) => {
            e.preventDefault();
            const at = String(new FormData(e.currentTarget).get("at"));
            const via = (e.nativeEvent as SubmitEvent).submitter?.getAttribute("value");
            if (via === "mp") pagarMercadoPago(at); else enviar(at);
          }}>
          <div className="s">
            {PAGAMENTOS.map(([v, tt, sub]) => (
              <label className="opc" key={v}>
                <input type="radio" name="pay" value={v} checked={pay === v} onChange={() => setPay(v)} />
                <span>{tt}<br /><small>{sub}</small></span>
              </label>
            ))}
          </div>
          <label className="s">
            Quem vai te atender
            <select name="at">{CFG.atendentes.map((a) => <option key={a.nome}>{a.nome}</option>)}</select>
          </label>
          {mercadoPago ? (
            <p className="s" style={{ color: "var(--mut)", fontSize: 14 }}>
              Pague agora pelo Mercado Pago (Pix ou cartão, conforme a opção escolhida) ou envie o pedido pelo WhatsApp para combinar com o atendimento. O valor da entrega por aplicativo é combinado no atendimento. Nenhum dado de cartão é coletado neste site.
            </p>
          ) : (
            <p className="s" style={{ color: "var(--mut)", fontSize: 14 }}>
              Você envia o pedido pelo WhatsApp e o atendimento confirma o pagamento e a entrega. Nenhum dado de cartão é coletado neste site.
            </p>
          )}
          <div className="er s">{erro}</div>
          {mercadoPago ? (
            <button className="btn s" name="via" value="mp" disabled={gerando}>{gerando ? "GERANDO PAGAMENTO…" : "PAGAR COM MERCADO PAGO"}</button>
          ) : null}
          <button className={mercadoPago ? "btn o s" : "btn s"} name="via" value="wa" disabled={gerando}>ENVIAR PEDIDO PELO WHATSAPP</button>
        </form>
      </>
    );

  return (
    <div className="w">
      <div style={{ paddingTop: 32, display: "grid", justifyItems: "center" }}>
        <Link className="logo" href="/" aria-label="Tramisse">TRAMISSE</Link>
      </div>
      <div className="steps" style={{ marginTop: 24 }}>
        {ETAPAS.map((n, i) => <span key={n} className={i <= step ? "on" : ""}>{n}</span>)}
      </div>
      <div className="ck">
        <div>
          {f}
          {step > 0 ? (
            <p><a href="#" onClick={(e) => { e.preventDefault(); ir(step - 1); }} style={{ textDecoration: "underline", fontSize: 14 }}>← Voltar</a></p>
          ) : null}
        </div>
        <div>{resumo}</div>
      </div>
    </div>
  );
}
