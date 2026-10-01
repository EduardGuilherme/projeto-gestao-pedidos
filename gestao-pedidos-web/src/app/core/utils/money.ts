
export function parseBrlToCents(input: string | null | undefined): number | null {
  if (input == null) return null;
  let text = String(input).trim().replace(/^R\$\s*/i, '');
  if (!text) return null;

  if (text.includes(',')) {
    text = text.replace(/\./g, '').replace(',', '.'); 
  }
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;

  return Math.round(parseFloat(text) * 100);
}

export function centsToInput(cents: number): string {
  return (cents / 100).toFixed(2).replace('.', ',');
}

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

export function formatBrl(cents: number): string {
  return brl.format(cents / 100);
}
