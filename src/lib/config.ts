import dados from "@data/config.json";
import type { Config } from "./types";

// Ponto único de leitura das configurações. Trocar por API/banco quando houver painel.
export const CFG = dados as Config;

// Atendente que recebe os pedidos (resumo pelo WhatsApp quando o pagamento online não estiver disponível).
export const ATENDENTE = CFG.atendentes.find((a) => a.nome === CFG.atendentePedidos) ?? CFG.atendentes[0];
