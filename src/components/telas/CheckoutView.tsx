"use client";

import { registrar } from "@/lib/estatisticas";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CL, porId } from "@/lib/catalog";
import { avisarPedido, registrarPedido } from "@/lib/avisoPedido";
import { montarPedido } from "@/lib/payment/pedido";
import { ATENDENTE, CFG } from "@/lib/config";
import { bairrosBelem, belemAtivo, freteBelem, gratisBelem } from "@/lib/frete/belem";
import { cepValido, faltaFreteGratis, textoPrazo } from "@/lib/frete/regras";
import { codigoPix } from "@/lib/payment/pix";
import { acharCupom, brl, calcularTotais, parcelasPedido } from "@/lib/payment/pricing";
import { provedorWhatsApp, resumoPedido } from "@/lib/payment/whatsapp";
import type { DadosCliente, FormaEntrega, FormaPagamento, OpcaoFrete, Pedido } from "@/lib/types";
import { useLoja } from "@/store/Store";
import { linhasSacola } from "../shell/BagDrawer";
import { Ph } from "../Ph";
import { PixView, type PixAberto } from "./PixView";

const ETAPAS = ["ENTREGA", "PAGAMENTO", "FINALIZAR"];
const OBRIG_ID = ["e", "n", "sn", "tel"];
const OBRIG_END = ["cep", "end", "num", "bai", "cid", "uf", "dest"];
const PAGAMENTOS: [FormaPagamento, string, string][] = [
  ["pix", "Pix", `${Math.round(CFG.pagamento.descontoPix * 100)}% de desconto nas peças (exceto as em promoção).`],
  ["credito", "Cartão de crédito", ""], // texto calculado com as parcelas liberadas para a sacola
  ["debito", "Cartão de débito", "À vista."],
];
const PIX_ATIVO = Boolean(CFG.pagamento.pix.chave);
const GRATIS_ACIMA = CFG.entrega.correios.freteGratisAcima;
// Belém: entrega própria por bairro aos sábados (quando ligada); senão, a entrega por aplicativo de antes.
const BELEM = belemAtivo(CFG);
const BAIRROS = bairrosBelem(CFG);
const valoresBelem = BAIRROS.map((b) => b.valor);
const ENTREGAS: [FormaEntrega, string, string][] = [
  ["correios", "Correios (PAC ou SEDEX)",
    `Para todo o Brasil. Frete calculado pelo CEP${GRATIS_ACIMA ? `; grátis acima de ${brl(GRATIS_ACIMA)} em peças` : ""}.`],
  BELEM
    ? ["belem", CFG.entrega.belem!.nome, `Por bairro, de ${brl(Math.min(...valoresBelem))} a ${brl(Math.max(...valoresBelem))}${gratisBelem(CFG) ? `; grátis acima de ${brl(gratisBelem(CFG))} em peças` : ""}. ${CFG.entrega.belem!.aviso}`]
    : ["aplicativo", "Entrega por aplicativo (Belém)", "Valor informado no momento da compra, por conta da cliente."],
  ["retirada", "Retirada", "O endereço é enviado após a confirmação da compra."],
];
// Compra não concluída: id da sacola guardada (para o lembrete com cupom), por navegador.
const CHAVE_CARRINHO = "tcar";
const idCarrinho = () => {
  try {
    let id = localStorage.getItem(CHAVE_CARRINHO);
    if (!id || !/^c[a-z0-9]{16,40}$/.test(id)) {
      id = "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      localStorage.setItem(CHAVE_CARRINHO, id);
    }
    return id;
  } catch {
    return "";
  }
};
const postCarrinho = (corpo: object) =>
  fetch("/api/carrinho", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corpo), keepalive: true }).catch(() => {});
// Pedido feito: a compra não é mais "abandonada".
export function carrinhoConcluido() {
  try {
    const id = localStorage.getItem(CHAVE_CARRINHO);
    if (id) postCarrinho({ id, acao: "concluido" });
    localStorage.removeItem(CHAVE_CARRINHO);
  } catch {}
}
// Pix automático em aberto (para a tela voltar se a página recarregar enquanto a cliente paga no banco).
const CHAVE_PIX = "tpix";
type PixGuardado = PixAberto & { pedido: Pedido };
const lerPix = (): PixGuardado | null => {
  try {
    const x = JSON.parse(localStorage.getItem(CHAVE_PIX) || "null") as PixGuardado | null;
    // Guardado por até 1 dia depois de vencer (a tela mostra que venceu e deixa gerar outro).
    return x?.mpId && x.expira && x.expira > Date.now() - 86400000 ? x : null;
  } catch {
    return null;
  }
};
const esquecerPix = () => { try { localStorage.removeItem(CHAVE_PIX); } catch {} };
// Endereço pelo CEP (ViaCEP): preenche rua, bairro, cidade e estado.
async function enderecoDoCep(cep: string) {
  try {
    const r = await fetch(`https://viacep.com.br/ws/${cep.replace(/\D/g, "")}/json/`);
    const d = await r.json();
    return d.erro ? null : { end: d.logradouro || "", bai: d.bairro || "", cid: d.localidade || "", uf: d.uf || "" };
  } catch {
    return null;
  }
}
const novoId = () => `T${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

// Checkout por etapas. Cartão: Mercado Pago (quando configurado). Pix: QR Code na chave da loja
// (quando configurada). Sempre é possível enviar o pedido pelo WhatsApp. Nenhum dado de cartão é coletado.
// Correios: frete calculado pelo CEP (Melhor Envio), quando configurado.
export function CheckoutView({ mercadoPago, correios }: { mercadoPago: boolean; correios: boolean }) {
  const { bag, setBag, cupom, setCupom, pronto, toast } = useLoja();
  const [semLembrete, setSemLembrete] = useState(false);
  // Link do lembrete (?carrinho=…): refaz a sacola e já aplica o cupom.
  useEffect(() => {
    if (!pronto) return;
    const id = new URLSearchParams(location.search).get("carrinho");
    if (!id || !/^c[a-z0-9]{16,40}$/.test(id)) return;
    fetch(`/api/carrinho?id=${encodeURIComponent(id)}`)
      .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
      .then(({ ok, d }) => {
        if (!ok) return toast(d.erro || "Link inválido.");
        try { localStorage.setItem(CHAVE_CARRINHO, id); } catch {}
        setBag(() => d.bag);
        if (CFG.recuperacao?.cupom) setCupom(CFG.recuperacao.cupom);
        toast(`Sua sacola voltou${CFG.recuperacao?.cupom ? ` com o cupom ${CFG.recuperacao.cupom}` : ""}.`);
        history.replaceState(null, "", "/checkout");
      })
      .catch(() => {});
  }, [pronto]); // eslint-disable-line react-hooks/exhaustive-deps
  const [step, setStep] = useState(0);
  const [ck, setCk] = useState<DadosCliente>({});
  const [ship, setShip] = useState<FormaEntrega>(correios ? "correios" : BELEM ? "belem" : "aplicativo");
  const [fretes, setFretes] = useState<OpcaoFrete[] | null>(null);
  const [frete, setFrete] = useState<OpcaoFrete | null>(null);
  const [cotando, setCotando] = useState(false);
  const [pay, setPay] = useState<FormaPagamento>("pix");
  const [erro, setErro] = useState("");
  const [faltando, setFaltando] = useState<string[]>([]);
  const [enviado, setEnviado] = useState<{ at: string; wa: string } | null>(null);
  const [pix, setPix] = useState<(PixAberto & { wa?: string; pedido?: Pedido }) | null>(null);
  // Pix automático em aberto: volta para a tela do QR Code.
  useEffect(() => { if (pronto) { const x = lerPix(); if (x) setPix(x); } }, [pronto]);
  // Estatísticas: começou o checkout (uma vez por aba), só com peça na sacola.
  useEffect(() => { if (pronto && bag.length) registrar("checkout"); }, [pronto, bag.length]);
  const [gerando, setGerando] = useState(false);

  const t = calcularTotais(CFG, linhasSacola(bag), step >= 1 ? pay : null, cupom);
  // Frete em uso: Correios (cotado pelo CEP) ou Belém (tabela de bairros).
  const freteEf = ship === "correios" ? frete : ship === "belem" ? freteBelem(CFG, ck.bai, t.subtotal - t.desconto) : null;
  const valorFrete = freteEf ? freteEf.valor : 0;
  const total = t.total + valorFrete;
  // Parcelas sem juros liberadas para esta sacola (parcela mínima e taxa coberta pelo pedido).
  const tCartao = calcularTotais(CFG, linhasSacola(bag), "credito", cupom);
  const baseSacola = bag.reduce((s, l) => s + (porId(l.id)?.precoBase ?? 0) * l.q, 0);
  const parcelas = parcelasPedido(CFG, tCartao.total + valorFrete, baseSacola + valorFrete);
  const minGratis = ship === "belem" ? gratisBelem(CFG) : ship === "correios" ? GRATIS_ACIMA : 0;
  const falta = faltaFreteGratis(CFG, t.subtotal - t.desconto, minGratis);

  // Sacola ou cupom mudaram: o frete precisa ser calculado de novo.
  useEffect(() => { setFretes(null); setFrete(null); }, [bag, cupom]);

  if (pix)
    return (
      <PixView
        pix={pix}
        wa={pix.wa}
        onPago={() => {
          // Pix automático pago: pedido confirmado (o painel já marcou como Pago pelo aviso do Mercado Pago).
          if (pix.pedido)
            avisarPedido({ ...pix.pedido, pagamentoOnline: { provedor: "Pix (Mercado Pago)", id: pix.mpId!, status: "aprovado" } }, {
              id: pix.pedidoId, canal: "Site (Pix automático)", situacao: `Pix pago (Mercado Pago nº ${pix.mpId})`, atendente: ATENDENTE.nome,
            });
          registrar("pedido");
          carrinhoConcluido();
          esquecerPix();
          setBag(() => []);
          setCupom(null);
        }}
        onNovo={() => { esquecerPix(); setPix(null); setStep(2); }}
      />
    );
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

  const pedidoAtual = (cli: DadosCliente) => montarPedido({ bag, cupom, pagamento: pay, entrega: ship, cliente: cli, frete: freteEf });

  // Endereço pelo CEP: guarda rua, bairro, cidade e estado para a etapa final (a cliente confere e completa lá).
  const preencherCep = async (cep: string) => {
    if (!cepValido(cep)) return;
    setCk((c) => ({ ...c, cep }));
    const e = await enderecoDoCep(cep);
    if (!e) return;
    setCk((c) => ({ ...c, cep, end: e.end || c.end, bai: e.bai || c.bai, cid: e.cid || c.cid, uf: e.uf || c.uf }));
  };

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

  // Sem pagamento online disponível: o resumo vai para a atendente pelo WhatsApp.
  const enviar = async (cli: DadosCliente) => {
    const pedido = pedidoAtual(cli);
    if (!pedido) return setErro("Não foi possível montar o pedido. Confira a sacola.");
    const r = await provedorWhatsApp(ATENDENTE).finalizar(pedido);
    if (r.tipo !== "redirecionar") return;
    const id = novoId();
    avisarPedido(pedido, { id, canal: "WhatsApp", situacao: "Enviado pelo WhatsApp (pagamento a combinar)", atendente: ATENDENTE.nome });
    registrar("pedido");
    carrinhoConcluido();
    registrarPedido({ id, canal: "whatsapp", atendente: ATENDENTE.nome, bag, cupom, pagamento: pay, entrega: ship, cliente: cli, frete: freteEf });
    setEnviado({ at: ATENDENTE.nome, wa: r.url });
    setBag(() => []);
    setCupom(null);
    window.open(r.url, "_blank");
  };

  // Pix: automático pelo Mercado Pago (confirma sozinho). Se não der, Pix na chave da loja com comprovante.
  const pagarPix = async (cli: DadosCliente) => {
    setErro("");
    if (mercadoPago) {
      setGerando(true);
      try {
        const r = await fetch("/api/pagamento/pix", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bag, cupom, pagamento: "pix", entrega: ship, cliente: cli, frete: frete && { servico: frete.servico } }),
        });
        const d = await r.json();
        if (r.ok && d.codigo) {
          const novo: PixGuardado = { codigo: d.codigo, qr: d.qr, total: d.pedido.total, pedidoId: d.referencia, mpId: d.id, expira: d.expira, pedido: d.pedido };
          try { localStorage.setItem(CHAVE_PIX, JSON.stringify(novo)); } catch {}
          setPix(novo);
          scrollTo(0, 0);
          return;
        }
        // Erro do pedido (peça acabou, cupom...): mostra. Pix automático fora do ar: usa a chave da loja.
        if (r.status === 400) return setErro(d.erro || "Confira o pedido.");
      } catch {
      } finally {
        setGerando(false);
      }
    }
    if (!PIX_ATIVO) return enviar(cli);
    const pedido = pedidoAtual(cli);
    if (!pedido) return setErro("Não foi possível montar o pedido. Confira a sacola.");
    const id = novoId();
    const codigo = codigoPix({ ...CFG.pagamento.pix, valor: pedido.total, txid: id });
    const texto = resumoPedido({ ...pedido, pagamentoOnline: { provedor: "Pix", id, status: "aguardando comprovante" } });
    avisarPedido(pedido, { id, canal: "Site (Pix)", situacao: "Aguardando Pix (conferir comprovante)", atendente: ATENDENTE.nome });
    registrar("pedido");
    carrinhoConcluido();
    registrarPedido({ id, canal: "pix", atendente: ATENDENTE.nome, bag, cupom, pagamento: pay, entrega: ship, cliente: cli, frete: freteEf });
    setPix({ wa: `https://wa.me/${ATENDENTE.whatsapp}?text=${encodeURIComponent(texto)}`, codigo, total: pedido.total, pedidoId: id });
    setBag(() => []);
    setCupom(null);
    scrollTo(0, 0);
  };

  // Gera o link do Mercado Pago no servidor e leva a cliente para pagar lá.
  // O pedido fica guardado no navegador para a página de retorno (/checkout/retorno).
  const pagarMercadoPago = async (cli: DadosCliente) => {
    setErro("");
    setGerando(true);
    try {
      const r = await fetch("/api/pagamento/mercadopago", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bag, cupom, pagamento: pay, entrega: ship, cliente: cli, frete: frete && { servico: frete.servico } }),
      });
      const d = await r.json();
      if (!r.ok || !d.url) throw new Error(d.erro || "Não foi possível gerar o pagamento.");
      try { localStorage.setItem("tp", JSON.stringify({ referencia: d.referencia, pedido: d.pedido, atendente: ATENDENTE.nome })); } catch {}
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
        <span>{ship === "correios" ? `Frete${frete ? ` Correios ${frete.nome}` : ""}` : ship === "belem" ? "Entrega em Belém (sábado)" : "Entrega"}</span>
        <span>
          {ship === "retirada" ? "Retirada" : ship === "aplicativo" ? "Por aplicativo" : freteEf ? (freteEf.gratis ? "Grátis" : brl(freteEf.valor)) : ship === "belem" ? "Escolha o bairro" : "Calcule pelo CEP"}
        </span>
      </div>
      <div className="tt big"><span>Total</span><span>{brl(total)}</span></div>
      {ship === "aplicativo" ? <small style={{ color: "var(--mut)" }}>O valor da entrega por aplicativo é informado no atendimento.</small> : null}
      {(ship === "correios" || ship === "belem") && falta ? <small style={{ color: "var(--mut)" }}>Faltam {brl(falta)} em peças para o frete grátis (acima de {brl(minGratis)}).</small> : null}
    </details>
  );

  // Guarda a sacola para o lembrete de compra não concluída (quando já há e-mail ou WhatsApp).
  const guardarCarrinho = (d: DadosCliente) => {
    if (semLembrete || !CFG.recuperacao?.ativo || !(d.e || d.tel)) return;
    const id = idCarrinho();
    if (id) postCarrinho({ id, cliente: { n: d.n, sn: d.sn, e: d.e, tel: d.tel }, bag });
  };
  // Cupom de recompra (ex.: VOLTEI10): só para quem já comprou no site com este e-mail/telefone.
  const cupomRecompraOk = async (d: DadosCliente) => {
    const cp = acharCupom(CFG, cupom);
    if (!cp?.somenteClientes) return true;
    try {
      const r = await fetch("/api/cupom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ codigo: cp.codigo, e: d.e, tel: d.tel }) });
      if (r.ok) return true;
      const x = await r.json().catch(() => ({}));
      setCupom(null);
      setErro(`${x.erro || "Cupom não aplicado."} O total foi atualizado: confira e finalize de novo.`);
      return false;
    } catch {
      return true; // sem conexão com a conferência: o servidor confere de novo no pagamento
    }
  };
  const pagar = (cli: DadosCliente) => (pay === "pix" ? pagarPix(cli) : mercadoPago ? pagarMercadoPago(cli) : enviar(cli));
  const textoBotao = gerando
    ? "GERANDO PAGAMENTO…"
    : pay === "pix"
      ? `PAGAR COM PIX · ${brl(total)}`
      : mercadoPago
        ? `PAGAR COM CARTÃO · ${brl(total)}`
        : "ENVIAR PEDIDO PELO WHATSAPP";

  let f: React.ReactNode = null;
  // 1. Entrega: forma de entrega e frete (só o CEP ou o bairro; o resto do endereço vem no fim).
  if (step === 0)
    f = (
      <>
        <h2>Entrega</h2>
        <form
          className="fg"
          style={{ marginTop: 16 }}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            ler(e.currentTarget);
            if (ship === "correios" && !frete) {
              setFaltando(["cep"]);
              return setErro(cotando ? "Aguarde o cálculo do frete." : "Digite o CEP e escolha PAC ou SEDEX.");
            }
            if (ship === "belem" && !freteBelem(CFG, ck.bai, t.subtotal - t.desconto)) {
              setFaltando(["bai"]);
              return setErro("Escolha o seu bairro. Se ele não estiver na lista, escolha Correios ou fale com a gente no WhatsApp.");
            }
            ir(1);
          }}
        >
          <div className="s">
            {ENTREGAS.filter(([v]) => v !== "correios" || correios).map(([v, tt, sub]) => (
              <label className="opc" key={v}>
                <input type="radio" name="sh" value={v} checked={ship === v} onChange={(e) => { ler(e.currentTarget.form!); setShip(v); setErro(""); }} />
                <span>{tt}<br /><small>{sub}</small></span>
              </label>
            ))}
          </div>
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
                    onChange={(e) => {
                      setFretes(null);
                      setFrete(null);
                      // CEP completo: já calcula o frete e guarda o endereço do CEP para o fim.
                      const v = e.currentTarget.value;
                      if (cepValido(v)) { preencherCep(v); cotar(v); }
                    }}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); cotar(e.currentTarget.value); } }}
                  />
                  <button
                    type="button"
                    className="btn o"
                    style={{ padding: "0 16px", whiteSpace: "nowrap" }}
                    disabled={cotando}
                    onClick={(e) => { const v = String(new FormData(e.currentTarget.form!).get("cep") || ""); preencherCep(v); cotar(v); }}
                  >
                    {cotando ? "CALCULANDO…" : "CALCULAR"}
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
          ) : null}
          {ship === "belem" ? (
            <>
              <label className="s">
                Bairro
                <select
                  name="bai"
                  value={ck.bai || ""}
                  onChange={(e) => setCk((c) => ({ ...c, bai: e.target.value, cid: "Belém", uf: "PA" }))}
                  className={faltando.includes("bai") ? "bad" : undefined}
                >
                  <option value="">Escolha o bairro…</option>
                  {BAIRROS.map((b) => (
                    <option key={b.bairro} value={b.bairro}>{b.bairro} · {brl(b.valor)}</option>
                  ))}
                </select>
              </label>
              <p className="s" style={{ margin: 0, fontSize: 13, color: "var(--mut)" }}>
                {CFG.entrega.belem!.aviso} Seu bairro não está na lista? Escolha Correios ou fale com a gente no WhatsApp.
              </p>
            </>
          ) : null}
          <div className="er s">{erro}</div>
          <button className="btn s">CONTINUAR</button>
        </form>
      </>
    );
  // 2. Pagamento: só a escolha da forma (o botão de pagar fica no fim, com os dados).
  if (step === 1)
    f = (
      <>
        <h2>Pagamento</h2>
        <form className="fg" style={{ marginTop: 16 }} onSubmit={(e) => { e.preventDefault(); ir(2); }}>
          <div className="s">
            {PAGAMENTOS.map(([v, tt, sub]) => (
              <label className="opc" key={v}>
                <input type="radio" name="pay" value={v} checked={pay === v} onChange={() => setPay(v)} />
                <span>{tt}<br /><small>{v === "credito" ? (parcelas > 1 ? `Em até ${parcelas}x sem juros.` : `À vista (parcelamento a partir de ${brl(CFG.pagamento.parcelaMinima * 2)}).`) : sub}</small></span>
              </label>
            ))}
          </div>
          <p className="s" style={{ color: "var(--mut)", fontSize: 14 }}>
            {pay === "pix"
              ? mercadoPago
                ? "O QR Code e o Pix copia e cola aparecem depois dos seus dados. O pagamento é confirmado na hora, sem precisar mandar comprovante."
                : PIX_ATIVO
                  ? "Você paga pelo QR Code ou pelo Pix copia e cola e envia o comprovante pelo WhatsApp."
                  : "Você envia o pedido pelo WhatsApp e recebe a chave Pix com o valor já com desconto."
              : mercadoPago
                ? "Você paga no ambiente seguro do Mercado Pago e volta para o site com o pedido confirmado."
                : "Você envia o pedido pelo WhatsApp e o atendimento combina o pagamento no cartão."}{" "}
            Nenhum dado de cartão é coletado neste site.
          </p>
          <button className="btn s">CONTINUAR</button>
        </form>
      </>
    );
  // 3. Finalizar: dados de quem compra e endereço, e o botão de pagar.
  if (step === 2) {
    const obrig = [...OBRIG_ID, ...(ship === "retirada" ? [] : ship === "correios" ? OBRIG_END : ["end", "num", "dest"])];
    f = (
      <>
        <h2>Seus dados</h2>
        <form
          className="fg"
          style={{ marginTop: 16 }}
          noValidate
          onBlur={(e) => { if (e.target instanceof HTMLInputElement && ["e", "tel"].includes(e.target.name)) guardarCarrinho(ler(e.currentTarget)); }}
          onSubmit={async (e) => {
            e.preventDefault();
            const d = ler(e.currentTarget);
            if (!validar(d, obrig)) return;
            if (!/^\S+@\S+\.\S+$/.test(d.e || "")) { setFaltando(["e"]); return setErro("Confira o e-mail."); }
            if (ship === "correios" && (d.cpf || "").replace(/\D/g, "").length !== 11) {
              setFaltando(["cpf"]);
              return setErro("Informe o CPF (11 números): os Correios pedem para a etiqueta.");
            }
            guardarCarrinho(d);
            if (!(await cupomRecompraOk(d))) return;
            pagar(d);
          }}
        >
          {fld("n", "Nome")}{fld("sn", "Sobrenome")}
          {fld("e", "E-mail", "", "", "email")}{fld("tel", "WhatsApp", "(91) 90000-0000")}
          {ship === "retirada" ? (
            <p className="s" style={{ margin: 0, fontSize: 14, color: "var(--mut)" }}>Retirada: o endereço é enviado depois da confirmação da compra.</p>
          ) : (
            <>
              {ship === "correios" ? (
                <p className="s" style={{ margin: 0, fontSize: 14 }}>
                  CEP {ck.cep} · <a href="#" onClick={(e) => { e.preventDefault(); ir(0); }} style={{ textDecoration: "underline" }}>alterar</a>
                  <input type="hidden" name="cep" value={ck.cep || ""} />
                </p>
              ) : null}
              {fld("end", "Endereço", "", "s")}{fld("num", "Número")}{fld("cmp", "Complemento")}
              {ship === "belem" ? (
                <p className="s" style={{ margin: 0, fontSize: 14 }}>
                  Bairro: {ck.bai} (Belém/PA) · <a href="#" onClick={(e) => { e.preventDefault(); ir(0); }} style={{ textDecoration: "underline" }}>alterar</a>
                </p>
              ) : (
                <>{fld("bai", "Bairro")}{fld("cid", "Cidade")}{fld("uf", "Estado")}</>
              )}
              {fld("dest", "Quem vai receber", "", "s")}
              {ship === "correios" ? fld("cpf", "CPF (os Correios pedem para a etiqueta)", "000.000.000-00", "s") : null}
            </>
          )}
          {CFG.recuperacao?.ativo ? (
            <p className="s ck-lemb">
              Se você não finalizar agora, podemos te mandar um lembrete com um cupom.{" "}
              <label><input type="checkbox" checked={semLembrete} onChange={(e) => setSemLembrete(e.target.checked)} /> Não quero receber</label>
            </p>
          ) : null}
          <div className="er s">{erro}</div>
          <button className="btn s" disabled={gerando}>{textoBotao}</button>
          {mercadoPago ? <p className="s seg">Pagamento seguro pelo Mercado Pago · Trocas em até {CFG.trocas.prazoDias} dias</p> : null}
        </form>
      </>
    );
  }

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
