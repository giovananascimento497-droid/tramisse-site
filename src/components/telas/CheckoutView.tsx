"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CL, porId } from "@/lib/catalog";
import { avisarPedido } from "@/lib/avisoPedido";
import { montarPedido } from "@/lib/payment/pedido";
import { CFG } from "@/lib/config";
import { cepValido, faltaFreteGratis, textoPrazo } from "@/lib/frete/regras";
import { codigoPix } from "@/lib/payment/pix";
import { brl, calcularTotais } from "@/lib/payment/pricing";
import { provedorWhatsApp, resumoPedido } from "@/lib/payment/whatsapp";
import type { DadosCliente, FormaEntrega, FormaPagamento, OpcaoFrete } from "@/lib/types";
import { useLoja } from "@/store/Store";
import { linhasSacola } from "../shell/BagDrawer";
import { Ph } from "../Ph";
import { PixView } from "./PixView";

const ETAPAS = ["SACOLA", "IDENTIFICAÇÃO", "ENTREGA", "PAGAMENTO"];
const OBRIG_ID = ["e", "n", "sn", "tel"];
const OBRIG_END = ["cep", "end", "num", "bai", "cid", "uf", "dest"];
const PAGAMENTOS: [FormaPagamento, string, string][] = [
  ["pix", "Pix", `${Math.round(CFG.pagamento.descontoPix * 100)}% de desconto nas peças.`],
  ["credito", "Cartão de crédito", `Em até ${CFG.pagamento.maxParcelas}x sem juros.`],
  ["debito", "Cartão de débito", "À vista."],
];
const PIX_ATIVO = Boolean(CFG.pagamento.pix.chave);
const GRATIS_ACIMA = CFG.entrega.correios.freteGratisAcima;
const ENTREGAS: [FormaEntrega, string, string][] = [
  ["correios", "Correios (PAC ou SEDEX)",
    `Para todo o Brasil. Frete calculado pelo CEP${GRATIS_ACIMA ? `; grátis acima de ${brl(GRATIS_ACIMA)} em peças` : ""}.`],
  ["aplicativo", "Entrega por aplicativo (Belém)", "Valor informado no momento da compra, por conta da cliente."],
  ["retirada", "Retirada", "O endereço é enviado após a confirmação da compra."],
];
const novoId = () => `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Checkout por etapas. Cartão: Mercado Pago (quando configurado). Pix: QR Code na chave da loja
// (quando configurada). Sempre é possível enviar o pedido pelo WhatsApp. Nenhum dado de cartão é coletado.
// Correios: frete calculado pelo CEP (Melhor Envio), quando configurado.
export function CheckoutView({ mercadoPago, correios }: { mercadoPago: boolean; correios: boolean }) {
  const { bag, setBag, cupom, setCupom, pronto } = useLoja();
  const [step, setStep] = useState(0);
  const [ck, setCk] = useState<DadosCliente>({});
  const [ship, setShip] = useState<FormaEntrega>(correios ? "correios" : "aplicativo");
  const [fretes, setFretes] = useState<OpcaoFrete[] | null>(null);
  const [frete, setFrete] = useState<OpcaoFrete | null>(null);
  const [cotando, setCotando] = useState(false);
  const [pay, setPay] = useState<FormaPagamento>("pix");
  const [erro, setErro] = useState("");
  const [faltando, setFaltando] = useState<string[]>([]);
  const [enviado, setEnviado] = useState<{ at: string; wa: string } | null>(null);
  const [pix, setPix] = useState<{ at: string; wa: string; codigo: string; total: number; id: string } | null>(null);
  const [gerando, setGerando] = useState(false);

  const t = calcularTotais(CFG, linhasSacola(bag), step >= 3 ? pay : null, cupom);
  const valorFrete = ship === "correios" && frete ? frete.valor : 0;
  const total = t.total + valorFrete;
  const falta = faltaFreteGratis(CFG, t.subtotal - t.desconto);

  // Sacola ou cupom mudaram: o frete precisa ser calculado de novo.
  useEffect(() => { setFretes(null); setFrete(null); }, [bag, cupom]);

  if (pix) return <PixView codigo={pix.codigo} total={pix.total} at={pix.at} wa={pix.wa} pedidoId={pix.id} />;
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

  const pedidoAtual = () => montarPedido({ bag, cupom, pagamento: pay, entrega: ship, cliente: ck, frete });

  // Cota PAC e SEDEX no servidor (Melhor Envio) para o CEP digitado.
  const cotar = async (cep: string) => {
    setFretes(null);
    setFrete(null);
    if (!cepValido(cep)) return setErro("Digite um CEP válido.");
    setErro("");
    setCotando(true);
    try {
      const r = await fetch("/api/frete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, cupom, itens: bag.map((l) => ({ id: l.id, q: l.q })) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.erro || "Não foi possível calcular o frete.");
      setFretes(d.opcoes);
      setFrete(d.opcoes[0] ?? null);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Não foi possível calcular o frete.");
    } finally {
      setCotando(false);
    }
  };

  const enviar = async (at: string) => {
    const atendente = CFG.atendentes.find((a) => a.nome === at) ?? CFG.atendentes[0];
    const pedido = pedidoAtual();
    if (!pedido) return setErro("Não foi possível montar o pedido. Confira a sacola.");
    const r = await provedorWhatsApp(atendente).finalizar(pedido);
    if (r.tipo !== "redirecionar") return;
    avisarPedido(pedido, { id: novoId(), canal: "WhatsApp", situacao: "Enviado pelo WhatsApp (pagamento a combinar)", atendente: atendente.nome });
    setEnviado({ at: atendente.nome, wa: r.url });
    setBag(() => []);
    setCupom(null);
    window.open(r.url, "_blank");
  };

  // Pix na chave da loja: gera o QR Code/copia e cola com o valor já com desconto.
  const pagarPix = (at: string) => {
    const atendente = CFG.atendentes.find((a) => a.nome === at) ?? CFG.atendentes[0];
    const pedido = pedidoAtual();
    if (!pedido) return setErro("Não foi possível montar o pedido. Confira a sacola.");
    const id = novoId();
    const codigo = codigoPix({ ...CFG.pagamento.pix, valor: pedido.total, txid: id });
    const texto = resumoPedido({ ...pedido, pagamentoOnline: { provedor: "Pix", id, status: "aguardando comprovante" } });
    avisarPedido(pedido, { id, canal: "Site (Pix)", situacao: "Aguardando Pix (conferir comprovante)", atendente: atendente.nome });
    setPix({ at: atendente.nome, wa: `https://wa.me/${atendente.whatsapp}?text=${encodeURIComponent(texto)}`, codigo, total: pedido.total, id });
    setBag(() => []);
    setCupom(null);
    scrollTo(0, 0);
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
        body: JSON.stringify({ bag, cupom, pagamento: pay, entrega: ship, cliente: ck, frete: frete && { servico: frete.servico } }),
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
      <summary style={{ fontSize: 15 }}>RESUMO DO PEDIDO · {brl(total)}</summary>
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
      {t.desconto ? <div className="tt"><span>Desconto ({t.cupom?.codigo})</span><span>-{brl(t.desconto)}</span></div> : null}
      {t.descontoPix ? <div className="tt"><span>Desconto Pix ({Math.round(CFG.pagamento.descontoPix * 100)}%)</span><span>-{brl(t.descontoPix)}</span></div> : null}
      <div className="tt">
        <span>{ship === "correios" ? `Frete${frete ? ` Correios ${frete.nome}` : ""}` : "Entrega"}</span>
        <span>{ship === "retirada" ? "Retirada" : ship === "aplicativo" ? "Por aplicativo" : frete ? (frete.gratis ? "Grátis" : brl(frete.valor)) : "Calcule pelo CEP"}</span>
      </div>
      <div className="tt big"><span>Total</span><span>{brl(total)}</span></div>
      {ship === "aplicativo" ? <small style={{ color: "var(--mut)" }}>O valor da entrega por aplicativo é informado no atendimento.</small> : null}
      {ship === "correios" && falta ? <small style={{ color: "var(--mut)" }}>Faltam {brl(falta)} em peças para o frete grátis (acima de {brl(GRATIS_ACIMA)}).</small> : null}
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
          onSubmit={(e) => {
            e.preventDefault();
            const d = ler(e.currentTarget);
            if (ship !== "retirada" && !validar(d, OBRIG_END)) return;
            if (ship === "correios" && !frete) return setErro(cotando ? "Aguarde o cálculo do frete." : "Calcule o frete e escolha PAC ou SEDEX.");
            ir(3);
          }}
        >
          <div className="s">
            {ENTREGAS.filter(([v]) => v !== "correios" || correios).map(([v, tt, sub]) => (
              <label className="opc" key={v}>
                <input type="radio" name="sh" value={v} checked={ship === v} onChange={(e) => { ler(e.currentTarget.form!); setShip(v); }} />
                <span>{tt}<br /><small>{sub}</small></span>
              </label>
            ))}
          </div>
          {ship === "retirada" ? null : (
            <>
              {ship === "correios" ? (
                <>
                  <label className="s">
                    CEP
                    <span style={{ display: "flex", gap: 8, minWidth: 0 }}>
                      <input
                        name="cep"
                        inputMode="numeric"
                        placeholder="00000-000"
                        defaultValue={ck.cep || ""}
                        autoComplete="postal-code"
                        className={faltando.includes("cep") ? "bad" : undefined}
                        style={{ flex: 1, minWidth: 0 }}
                        onChange={() => { setFretes(null); setFrete(null); }}
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cotar(e.currentTarget.value); } }}
                      />
                      <button
                        type="button"
                        className="btn o"
                        style={{ padding: "0 16px", whiteSpace: "nowrap" }}
                        disabled={cotando}
                        onClick={(e) => cotar(String(new FormData(e.currentTarget.form!).get("cep") || ""))}
                      >
                        {cotando ? "CALCULANDO…" : "CALCULAR FRETE"}
                      </button>
                    </span>
                  </label>
                  <div className="s">
                    {fretes?.map((o) => (
                      <label className="opc" key={o.servico}>
                        <input type="radio" name="fr" checked={frete?.servico === o.servico} onChange={() => setFrete(o)} />
                        <span>
                          Correios {o.nome} · {o.gratis ? <>Grátis <s style={{ color: "var(--mut)" }}>{brl(o.valorOriginal)}</s></> : brl(o.valor)}
                          <br /><small>Entrega em {textoPrazo(o.prazo)} após a confirmação do pagamento.</small>
                        </span>
                      </label>
                    ))}
                  </div>
                </>
              ) : fld("cep", "CEP", "00000-000")}
              {fld("end", "Endereço")}{fld("num", "Número")}{fld("cmp", "Complemento")}
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
            if (via === "mp") pagarMercadoPago(at); else if (via === "pix") pagarPix(at); else enviar(at);
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
          <p className="s" style={{ color: "var(--mut)", fontSize: 14 }}>
            {pay === "pix"
              ? PIX_ATIVO
                ? "Você paga pelo QR Code ou pelo Pix copia e cola e envia o comprovante pelo WhatsApp."
                : "Você envia o pedido pelo WhatsApp e a atendente passa a chave Pix com o valor já com desconto."
              : mercadoPago
                ? "Você paga no ambiente seguro do Mercado Pago, ou envia o pedido pelo WhatsApp para combinar com o atendimento."
                : "Você envia o pedido pelo WhatsApp e o atendimento combina o pagamento no cartão."}{" "}
            {ship === "aplicativo" ? "O valor da entrega por aplicativo é combinado no atendimento. " : ""}Nenhum dado de cartão é coletado neste site.
          </p>
          <div className="er s">{erro}</div>
          {pay === "pix" && PIX_ATIVO ? (
            <button className="btn s" name="via" value="pix">PAGAR COM PIX · {brl(total)}</button>
          ) : pay !== "pix" && mercadoPago ? (
            <>
              <button className="btn s" name="via" value="mp" disabled={gerando}>{gerando ? "GERANDO PAGAMENTO…" : `PAGAR COM MERCADO PAGO · ${brl(total)}`}</button>
              <button className="btn o s" name="via" value="wa" disabled={gerando}>ENVIAR PEDIDO PELO WHATSAPP</button>
            </>
          ) : (
            <button className="btn s" name="via" value="wa">ENVIAR PEDIDO PELO WHATSAPP</button>
          )}
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
