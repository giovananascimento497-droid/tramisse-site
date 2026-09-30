import type { Metadata } from "next";
import { Tile } from "@/components/Tile";

export const metadata: Metadata = { title: "Sobre" };

export default function Sobre() {
  return (
    <>
      <div className="about"><h1>TRAMISSE</h1><h2>Threads of Identity</h2></div>
      <div className="w" style={{ paddingBottom: 40 }}>
        <div className="tiles" style={{ gridTemplateColumns: "1fr 1fr", margin: "80px 0" }}>
          <Tile t="" href="/" foto="brand" />
          <Tile t="" href="/" foto="cover" />
        </div>
        <div className="pg">
          <p style={{ font: "italic 26px/1.4 var(--serif)" }}>
            A Tramisse nasceu em Belém para vestir mulheres que sabem quem são. Fios de identidade, tecidos em peças essenciais e atemporais.
          </p>
          <p>Texto institucional de exemplo: substitua pela história real da marca.</p>
        </div>
      </div>
    </>
  );
}
