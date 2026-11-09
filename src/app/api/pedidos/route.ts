import { LIMITES, TAMANHOS, type Tamanho } from "@/config/precos";
import { somenteDigitos } from "@/lib/formato";
import {
  EMAIL_REGEX,
  type NovoPedidoInput,
  type NovoPedidoResposta,
} from "@/lib/pedido";
import { calcularPedido } from "@/lib/precos";
import { bucketFotos, supabaseAdmin } from "@/lib/supabase-server";

function erro(mensagem: string, status = 400) {
  return Response.json({ erro: mensagem }, { status });
}

/** Deixa o nome do arquivo seguro para usar como caminho no Storage */
function nomeSeguro(nome: string, indice: number): string {
  const ponto = nome.lastIndexOf(".");
  const ext =
    ponto > 0
      ? nome
          .slice(ponto + 1)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, "")
          .slice(0, 5)
      : "";
  const base = (ponto > 0 ? nome.slice(0, ponto) : nome)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const numero = String(indice + 1).padStart(3, "0");
  return `${numero}${base ? `-${base}` : ""}${ext ? `.${ext}` : ""}`;
}

/**
 * Cria o pedido (status "enviando_fotos") e devolve um link de envio
 * assinado para cada foto. As fotos vão direto do navegador para o
 * Supabase Storage, sem passar por este servidor.
 */
export async function POST(request: Request) {
  let dados: NovoPedidoInput;
  try {
    dados = await request.json();
  } catch {
    return erro("Dados inválidos.");
  }

  const nome = String(dados?.nome ?? "").trim();
  const whatsapp = somenteDigitos(String(dados?.whatsapp ?? ""));
  const email = String(dados?.email ?? "").trim().toLowerCase();
  const tamanho = dados?.tamanho as Tamanho;
  const arquivos = Array.isArray(dados?.arquivos) ? dados.arquivos : [];

  if (nome.length < 2 || nome.length > 120) return erro("Informe seu nome.");
  if (whatsapp.length < 10 || whatsapp.length > 13)
    return erro("Informe um WhatsApp válido com DDD.");
  if (!EMAIL_REGEX.test(email) || email.length > 200)
    return erro("Informe um e-mail válido.");
  if (!TAMANHOS.includes(tamanho)) return erro("Escolha o tamanho das fotos.");
  if (arquivos.length === 0) return erro("Selecione pelo menos uma foto.");
  if (arquivos.length > LIMITES.maxFotos)
    return erro(`Envie no máximo ${LIMITES.maxFotos} fotos por pedido.`);
  for (const a of arquivos) {
    if (typeof a?.nome !== "string" || typeof a?.bytes !== "number")
      return erro("Arquivo inválido.");
    if (a.tipo && !String(a.tipo).startsWith("image/"))
      return erro(`"${a.nome}" não é uma imagem.`);
    if (a.bytes <= 0 || a.bytes > LIMITES.maxBytesPorFoto)
      return erro(`"${a.nome}" é grande demais.`);
  }

  // O preço é sempre recalculado aqui, nunca confiamos no valor do navegador
  const calculo = calcularPedido(tamanho, arquivos.length);

  const supabase = supabaseAdmin();
  const { data: pedido, error } = await supabase
    .from("pedidos")
    .insert({
      nome,
      whatsapp,
      email,
      tamanho,
      quantidade: calculo.quantidade,
      preco_unitario: calculo.precoUnitario,
      total: calculo.total,
      status: "enviando_fotos",
    })
    .select("id, numero")
    .single();

  if (error || !pedido) {
    console.error("Erro ao criar pedido", error);
    return erro("Não foi possível criar o pedido. Tente novamente.", 500);
  }

  const pasta = `pedido-${pedido.numero}/${tamanho}`;
  const caminhos = arquivos.map((a, i) => `${pasta}/${nomeSeguro(a.nome, i)}`);

  const storage = supabase.storage.from(bucketFotos());
  const assinados = await Promise.all(
    caminhos.map((c) => storage.createSignedUploadUrl(c, { upsert: true })),
  );
  const falha = assinados.find((r) => r.error);
  if (falha) {
    console.error("Erro ao gerar links de envio", falha.error);
    await supabase.from("pedidos").delete().eq("id", pedido.id);
    return erro("Não foi possível preparar o envio. Tente novamente.", 500);
  }

  await supabase
    .from("pedidos")
    .update({ pasta, fotos: caminhos })
    .eq("id", pedido.id);

  const resposta: NovoPedidoResposta = {
    id: pedido.id,
    numero: pedido.numero,
    uploads: assinados.map((r, i) => ({
      caminho: caminhos[i],
      url: r.data!.signedUrl,
    })),
  };
  return Response.json(resposta, { status: 201 });
}
