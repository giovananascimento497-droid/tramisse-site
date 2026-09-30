import dados from "@data/config.json";
import type { Config } from "./types";

// Ponto único de leitura das configurações. Trocar por API/banco quando houver painel.
export const CFG = dados as Config;
