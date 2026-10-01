import { CFG } from "@/lib/config";

// Faixa de vantagens logo abaixo do banner (números vindos da configuração da loja).
const P = CFG.pagamento;
const ITENS: [string, string, React.ReactNode][] = [
  [CFG.entrega.correios.freteGratisAcima ? `FRETE GRÁTIS ACIMA DE R$ ${CFG.entrega.correios.freteGratisAcima}` : "ENVIO PARA TODO O BRASIL",
    "Pelos Correios. Em Belém, também por aplicativo",
    <path key="e" d="M3 7h11v9H3zM14 10h4l3 3v3h-7M7 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM17 19a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" />],
  [`ATÉ ${P.maxParcelas}X SEM JUROS`, "No cartão de crédito",
    <path key="c" d="M3 6h18v12H3zM3 10h18M7 15h4" />],
  [`${Math.round(P.descontoPix * 100)}% OFF NO PIX`, "Desconto direto no pedido",
    <path key="p" d="M12 3l9 9-9 9-9-9zM8.5 12h7M12 8.5v7" />],
  [`TROCAS EM ${CFG.trocas.prazoDias} DIAS`, "Com a etiqueta fixada na peça",
    <path key="t" d="M4 9a8 8 0 0114-3l2 2M20 15a8 8 0 01-14 3l-2-2M18 3v5h-5M6 21v-5h5" />],
];

export function Beneficios() {
  return (
    <section className="bnf lj-only" aria-label="Vantagens">
      <div className="w bnf-g">
        {ITENS.map(([t, s, icone]) => (
          <div key={t} className="bnf-i">
            <svg viewBox="0 0 24 24" aria-hidden="true">{icone}</svg>
            <div><b>{t}</b><small>{s}</small></div>
          </div>
        ))}
      </div>
    </section>
  );
}
