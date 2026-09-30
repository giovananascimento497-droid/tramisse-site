"use client";

// Botões ‹ › que rolam o carrossel com o id indicado.
export function CarouselButtons({ id }: { id: string }) {
  const mover = (d: number) => {
    const c = document.getElementById(id);
    c?.scrollBy({ left: c.clientWidth * 0.8 * d, behavior: "smooth" });
  };
  return (
    <div className="cb">
      <button onClick={() => mover(-1)} aria-label="Anterior">‹</button>
      <button onClick={() => mover(1)} aria-label="Próximo">›</button>
    </div>
  );
}
