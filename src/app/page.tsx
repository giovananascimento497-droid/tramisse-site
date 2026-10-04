import Link from "next/link";
import { Beneficios } from "@/components/Beneficios";
import { CarouselButtons } from "@/components/Carousel";
import { HeroShop } from "@/components/HeroShop";
import { Newsletter } from "@/components/Newsletter";
import { ProductCard } from "@/components/ProductCard";
import { Reels } from "@/components/Reels";
import { Tile } from "@/components/Tile";
import { PRODS, porId, slug, TEM_ACESSORIOS, temEstoque } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import type { Produto } from "@/lib/types";

const Carrossel = ({ l, id }: { l: Produto[]; id: string }) => (
  <div className="car" id={id}>{l.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);

// "Compre por categoria": no visual loja vem logo após as vantagens; no editorial, mais abaixo.
function CompreCategoria({ className, style, TP }: { className: string; style?: React.CSSProperties; TP: typeof CFG.fotosHome }) {
  return (
    <section className={className} style={style}>
      <div className="w">
        <div className="sh"><h2>Compre por categoria</h2></div>
        <div className="tiles six">
          {["Blusas", "Calças", "Vestidos", "Conjuntos", "Saias", "Macacões"].map((t) => (
            <Tile key={t} t={t.toUpperCase()} href={`/categoria/roupas/${slug(t)}`} foto={TP[t.toUpperCase()]} />
          ))}
        </div>
      </div>
    </section>
  );
}

// Peças do banner: as escolhidas no painel (na ordem) ou, sem escolha, todas com foto e estoque.
// Peça esgotada ou sem foto sai sozinha.
function pecasBanner() {
  if (CFG.hero.semPecas) return [];
  const ok = (p?: Produto): p is Produto => !!p && !p.emBreve && p.imagens.length > 0 && temEstoque(p);
  const escolhidas = (CFG.hero.pecas ?? []).map(porId).filter(ok);
  return escolhidas.length ? escolhidas : PRODS.filter(ok);
}

export default function Home() {
  const novos = PRODS.filter((p) => p.flags.novo && !p.emBreve);
  const desejadas = PRODS.filter((p) => p.flags.maisVendida && !p.emBreve);
  const emBreve = PRODS.filter((p) => p.emBreve);
  const TP = CFG.fotosHome;
  return (
    <>
      <HeroShop fotos={pecasBanner().map(({ slug, nome, imagens, preco }) => ({ slug, nome, preco, imagens: imagens.slice(0, 1) }))} banner={CFG.hero} />

      <Beneficios />

      <CompreCategoria className="sec lj-only" TP={TP} />

      {/* Visual editorial: 4 atalhos logo depois do banner */}
      <section className="sec ed-only">
        <div className="w">
          <div className="tiles">
            {[["NEW IN", "/categoria/new-in"], ["CURADORIA ESPECIAL", "/categoria/curadoria"], ["ROUPAS", "/categoria/roupas"], TEM_ACESSORIOS ? ["ACESSÓRIOS", "/categoria/acessorios"] : ["JEANS", "/categoria/jeans"]].map(
              ([t, h]) => <Tile key={t} t={t} href={h} foto={TP[t]} />,
            )}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="sh">
            <div><h2>NEW IN</h2><p>Novidades que chegam para fazer parte da sua história.</p></div>
            <CarouselButtons id="c1" />
          </div>
          <Carrossel l={novos} id="c1" />
          <p style={{ textAlign: "center", marginTop: 40 }}><Link className="btn o" href="/categoria/new-in">VER TODAS</Link></p>
        </div>
      </section>

      <section className="cur">
        <h2>Curadoria Especial</h2>
        <p>Uma seleção especial de peças escolhidas para traduzir a essência da Tramisse.</p>
        <Link className="btn" href="/categoria/curadoria">EXPLORAR CURADORIA</Link>
      </section>

      <section className="sec">
        <div className="w">
          <div className="sh">
            <div><h2>Em movimento</h2><p>Os looks da Tramisse ganhando vida.</p></div>
            <CarouselButtons id="c3" />
          </div>
          <Reels id="c3" />
        </div>
      </section>



      <CompreCategoria className="sec ed-only" style={{ paddingTop: 0 }} TP={TP} />

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="sh"><h2>Compre por estilo</h2></div>
          <div className="tiles st">
            {["Casual", "Office", "Night", "Weekend"].map((t) => (
              <Tile key={t} t={t.toUpperCase()} href={`/categoria/estilo/${slug(t)}`} foto={TP[t.toUpperCase()]} />
            ))}
          </div>
        </div>
      </section>

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="sh"><h2>As mais desejadas</h2><CarouselButtons id="c2" /></div>
          <Carrossel l={desejadas} id="c2" />
          <p style={{ textAlign: "center", marginTop: 40 }}><Link className="btn o" href="/categoria/todos">VER TODOS</Link></p>
        </div>
      </section>

      {emBreve.length ? (
        <section className="sec" style={{ paddingTop: 0 }}>
          <div className="w">
            <div className="sh">
              <div><h2>Coming Soon</h2><p>Peças que chegam em breve. Peça para ser avisada.</p></div>
              <CarouselButtons id="c4" />
            </div>
            <Carrossel l={emBreve} id="c4" />
            <p style={{ textAlign: "center", marginTop: 40 }}><Link className="btn o" href="/categoria/coming-soon">VER TODAS</Link></p>
          </div>
        </section>
      ) : null}

      <Newsletter />
    </>
  );
}
