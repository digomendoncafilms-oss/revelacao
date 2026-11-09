/**
 * TABELA DE PREÇOS — edite aqui.
 *
 * Cada tamanho tem faixas por quantidade de fotos do pedido.
 * - `ate`: quantidade máxima da faixa (use `null` na última faixa = "acima de").
 * - `preco`: preço por foto, em reais.
 *
 * As faixas devem estar em ordem crescente.
 */

export const TAMANHOS = ["10x15", "15x21"] as const;
export type Tamanho = (typeof TAMANHOS)[number];

export type Faixa = {
  ate: number | null;
  preco: number;
};

export const TABELA_PRECOS: Record<Tamanho, Faixa[]> = {
  "10x15": [
    { ate: 10, preco: 3.5 }, // 1 a 10 fotos
    { ate: 20, preco: 3.0 }, // 11 a 20 fotos
    { ate: null, preco: 2.5 }, // acima de 20 fotos
  ],
  "15x21": [
    { ate: 10, preco: 6.0 },
    { ate: 20, preco: 5.0 },
    { ate: null, preco: 4.5 },
  ],
};

/** Limites do envio */
export const LIMITES = {
  maxFotos: 300,
  maxBytesPorFoto: 50 * 1024 * 1024, // 50 MB
};
