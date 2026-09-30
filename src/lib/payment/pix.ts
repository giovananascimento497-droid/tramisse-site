// Pix "copia e cola" / QR Code estático (padrão BR Code do Banco Central, EMV).
// Gerado no próprio site com a chave da loja e o valor do pedido; não depende de banco nem de API.

const campo = (id: string, valor: string) => id + String(valor.length).padStart(2, "0") + valor;

// CRC16-CCITT (polinômio 0x1021, valor inicial 0xFFFF), exigido no fim do código.
export function crc16(s: string) {
  let crc = 0xffff;
  for (const b of new TextEncoder().encode(s)) {
    crc ^= b << 8;
    for (let i = 0; i < 8; i++) crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

// Nome e cidade sem acento e em maiúsculas, como os bancos esperam.
const limpa = (s: string, max: number) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9 ]/g, "").toUpperCase().trim().slice(0, max);

export function codigoPix(o: { chave: string; nome: string; cidade: string; valor: number; txid: string }) {
  const chave = /^[\d./-]+$/.test(o.chave) ? o.chave.replace(/\D/g, "") : o.chave.trim(); // CNPJ: só números
  const txid = o.txid.replace(/[^A-Za-z0-9]/g, "").slice(0, 25) || "***";
  const semCrc =
    campo("00", "01") +
    campo("26", campo("00", "br.gov.bcb.pix") + campo("01", chave)) +
    campo("52", "0000") +
    campo("53", "986") +
    campo("54", o.valor.toFixed(2)) +
    campo("58", "BR") +
    campo("59", limpa(o.nome, 25) || "TRAMISSE") +
    campo("60", limpa(o.cidade, 15) || "BELEM") +
    campo("62", campo("05", txid)) +
    "6304";
  return semCrc + crc16(semCrc);
}

// "12345678000190" -> "12.345.678/0001-90"
export const formataCnpj = (c: string) => {
  const d = c.replace(/\D/g, "");
  return d.length === 14 ? d.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5") : c;
};
