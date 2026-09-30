import Link from "next/link";

export default function NotFound() {
  return (
    <div className="w">
      <h1>Página não encontrada</h1>
      <p><Link href="/">Voltar para a página inicial</Link></p>
    </div>
  );
}
