import type { Tamanho } from "@/config/precos";

export const STATUS = {
  enviando_fotos: "Enviando fotos",
  aguardando_pagamento: "Aguardando pagamento",
} as const;
export type StatusPedido = keyof typeof STATUS;

/** Dados enviados pelo navegador para criar o pedido */
export type NovoPedidoInput = {
  nome: string;
  whatsapp: string;
  email: string;
  tamanho: Tamanho;
  arquivos: { nome: string; tipo: string; bytes: number }[];
};

/** Resposta da criação do pedido */
export type NovoPedidoResposta = {
  id: string;
  numero: number;
  uploads: { caminho: string; url: string }[];
};

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
