import { CFG } from "@/lib/config";

export function TopBar() {
  return (
    <div className="top" id="top">
      {CFG.barraSuperior.map((t) => <span key={t}>{t}</span>)}
    </div>
  );
}
