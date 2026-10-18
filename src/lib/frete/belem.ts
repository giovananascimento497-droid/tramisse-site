// Entrega própria em Belém por bairro (rota única aos sábados). Vale no navegador e no servidor.
// O valor sai da faixa do bairro em entrega.belem do data/config.json (editável no painel).
import { r2 } from "../payment/pricing";
import type { Config, OpcaoFrete } from "../types";

const chave = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\(.*?\)/g, "").replace(/[^a-z0-9]+/g, " ").trim();

export const belemAtivo = (cfg: Config) => Boolean(cfg.entrega.belem?.ativo && cfg.entrega.belem.faixas.some((f) => f.bairros.length));

// Todos os bairros atendidos (em ordem alfabética), com o valor de cada um.
export function bairrosBelem(cfg: Config): { bairro: string; valor: number; faixa: string }[] {
  const b = cfg.entrega.belem;
  if (!b) return [];
  return b.faixas
    .flatMap((f) => f.bairros.map((bairro) => ({ bairro, valor: f.valor, faixa: f.nome })))
    .sort((x, y) => x.bairro.localeCompare(y.bairro, "pt-BR"));
}

// Frete do bairro (null = bairro não atendido). Frete grátis vale aqui também (peças acima do mínimo).
export function freteBelem(cfg: Config, bairro: string | undefined, valorPecas: number): OpcaoFrete | null {
  const b = cfg.entrega.belem;
  if (!b?.ativo || !bairro) return null;
  const k = chave(bairro);
  const i = b.faixas.findIndex((f) => f.bairros.some((x) => chave(x) === k));
  if (i < 0) return null;
  const valor = r2(b.faixas[i].valor);
  const min = cfg.entrega.correios.freteGratisAcima;
  const gratis = min > 0 && valorPecas >= min;
  return { servico: 100 + i, nome: b.nome, valor: gratis ? 0 : valor, valorOriginal: valor, prazo: 0, gratis };
}

// Frase curta para a vitrine (página da peça, vantagens): "entrega aos sábados por bairro (R$ 10 a R$ 30)".
export function faixaBelem(cfg: Config) {
  if (!belemAtivo(cfg)) return "";
  const v = cfg.entrega.belem!.faixas.filter((f) => f.bairros.length).map((f) => f.valor);
  const fmt = (x: number) => `R$ ${x.toLocaleString("pt-BR", { minimumFractionDigits: x % 1 ? 2 : 0 })}`;
  return Math.min(...v) === Math.max(...v) ? fmt(v[0]) : `${fmt(Math.min(...v))} a ${fmt(Math.max(...v))}`;
}
