import Link from "next/link";
import { CFG } from "@/lib/config";

export function Footer() {
  const L = (t: string, h: string) => <Link key={t} href={h}>{t}</Link>;
  return (
    <footer>
      <div className="w">
        <div className="fc">
          <div>
            <Link className="logo" href="/" style={{ color: "var(--ink)" }}>TRAMISSE</Link>
            <p style={{ color: "var(--mut)" }}>{CFG.assinatura}</p>
          </div>
          <div><h3>TRAMISSE</h3>{L("Sobre nós", "/sobre")}{L("Nossa história", "/sobre")}{L("Contato", "/pagina/contato")}</div>
          <div>
            <h3>SHOP</h3>
            {L("New In", "/categoria/new-in")}{L("Coming Soon", "/categoria/coming-soon")}{L("Curadoria Especial", "/categoria/curadoria")}{L("Roupas", "/categoria/roupas")}
            {L("Acessórios", "/categoria/acessorios")}{L("Sale", "/categoria/sale")}
          </div>
          <div>
            <h3>ATENDIMENTO</h3>
            {L("Trocas e devoluções", "/pagina/trocas")}{L("Entrega", "/pagina/trocas")}{L("Formas de pagamento", "/pagina/faq")}
            {L("FAQ", "/pagina/faq")}{L("Guia de tamanhos", "/pagina/faq")}{L("Privacidade", "/pagina/privacidade")}{L("Termos de uso", "/pagina/termos")}
          </div>
          <div>
            <h3>SIGA A TRAMISSE</h3>
            {CFG.redes.map((s) =>
              s.url ? <a key={s.nome} href={s.url} target="_blank" rel="noopener">{s.nome}</a> : <Link key={s.nome} href="/">{s.nome}</Link>,
            )}
          </div>
        </div>
        <div className="ft-pag lj-only">
          <span>PAGAMENTO</span>
          <em>Pix ({Math.round(CFG.pagamento.descontoPix * 100)}% off)</em>
          <em>Crédito em até {CFG.pagamento.maxParcelas}x sem juros</em>
          <em>Débito</em>
          <em>Mercado Pago</em>
        </div>
        <p style={{ color: "var(--mut)", fontSize: 13, marginTop: 24 }}>© 2026 Tramisse. Todos os direitos reservados.
          <br />
          {CFG.empresa.razaoSocial} · CNPJ {CFG.empresa.cnpj} · {CFG.empresa.cidade}
        </p>
      </div>
    </footer>
  );
}
