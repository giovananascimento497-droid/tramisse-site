// Estrelas da nota (1 a 5). Com onNota, vira escolha (página de avaliação).
export function Estrelas({ nota, onNota, tam = 14 }: { nota: number; onNota?: (n: number) => void; tam?: number }) {
  return (
    <span className="estr" role={onNota ? "radiogroup" : "img"} aria-label={onNota ? "Nota" : `${nota.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} de 5 estrelas`} style={{ fontSize: tam }}>
      {[1, 2, 3, 4, 5].map((n) =>
        onNota ? (
          <button key={n} type="button" role="radio" aria-checked={nota === n} aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`} className={n <= nota ? "on" : ""} onClick={() => onNota(n)}>★</button>
        ) : (
          <i key={n} className={n <= Math.round(nota) ? "on" : ""} aria-hidden="true">★</i>
        ),
      )}
    </span>
  );
}
