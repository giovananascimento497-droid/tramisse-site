import Link from "next/link";
import { CarouselButtons } from "@/components/Carousel";
import { HeroShop } from "@/components/HeroShop";
import { Newsletter } from "@/components/Newsletter";
import { ProductCard } from "@/components/ProductCard";
import { Reels } from "@/components/Reels";
import { Tile } from "@/components/Tile";
import { PRODS, slug } from "@/lib/catalog";
import { CFG } from "@/lib/config";
import type { Produto } from "@/lib/types";

const Carrossel = ({ l, id }: { l: Produto[]; id: string }) => (
  <div className="car" id={id}>{l.map((p) => <ProductCard key={p.id} p={p} />)}</div>
);

export default function Home() {
  const novos = PRODS.filter((p) => p.flags.novo && !p.emBreve);
  const desejadas = PRODS.filter((p) => p.flags.maisVendida && !p.emBreve);
  const emBreve = PRODS.filter((p) => p.emBreve);
  const TP = CFG.fotosHome;
  return (
    <>
      <HeroShop fotos={PRODS.filter((p) => p.imagens.length && !p.emBreve).map(({ slug, nome, imagens }) => ({ slug, nome, imagens: imagens.slice(0, 1) }))} banner={CFG.hero} />

      <section className="sec">
        <div className="w">
          <div className="tiles">
            {[["NEW IN", "/categoria/new-in"], ["CURADORIA ESPECIAL", "/categoria/curadoria"], ["ROUPAS", "/categoria/roupas"], ["ACESSÓRIOS", "/categoria/acessorios"]].map(
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

      <section className="sec" style={{ paddingTop: 0 }}>
        <div className="w">
          <div className="sh"><h2>Compre por categoria</h2></div>
          <div className="tiles six">
            {["Blusas", "Calças", "Vestidos", "Conjuntos", "Saias", "Macacões"].map((t) => (
              <Tile key={t} t={t.toUpperCase()} href={`/categoria/roupas/${slug(t)}`} foto={TP[t.toUpperCase()]} />
            ))}
          </div>
        </div>
      </section>

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
