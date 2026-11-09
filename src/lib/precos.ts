import { TABELA_PRECOS, type Faixa, type Tamanho } from "@/config/precos";

export type Calculo = {
  quantidade: number;
  precoUnitario: number;
  total: number;
  /** Dica para a próxima faixa mais barata, se houver */
  proximaFaixa: { faltam: number; precoUnitario: number } | null;
};

/** Limite inferior (inclusivo) de cada faixa */
export function rotuloFaixa(faixas: Faixa[], i: number): string {
  const inicio = i === 0 ? 1 : (faixas[i - 1].ate ?? 0) + 1;
  const fim = faixas[i].ate;
  if (fim === null) return `acima de ${inicio - 1}`;
  return `${inicio} a ${fim}`;
}

function indiceFaixa(faixas: Faixa[], quantidade: number): number {
  const i = faixas.findIndex((f) => f.ate === null || quantidade <= f.ate);
  return i === -1 ? faixas.length - 1 : i;
}

/** Arredonda para centavos evitando erros de ponto flutuante */
function centavos(valor: number): number {
  return Math.round(valor * 100) / 100;
}

export function calcularPedido(tamanho: Tamanho, quantidade: number): Calculo {
  const faixas = TABELA_PRECOS[tamanho];
  const i = indiceFaixa(faixas, Math.max(quantidade, 1));
  const precoUnitario = faixas[i].preco;

  let proximaFaixa: Calculo["proximaFaixa"] = null;
  const atual = faixas[i];
  if (quantidade > 0 && atual.ate !== null && i + 1 < faixas.length) {
    proximaFaixa = {
      faltam: atual.ate + 1 - quantidade,
      precoUnitario: faixas[i + 1].preco,
    };
  }

  return {
    quantidade,
    precoUnitario,
    total: centavos(precoUnitario * quantidade),
    proximaFaixa,
  };
}
