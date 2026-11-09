import { bucketFotos, supabaseAdmin } from "@/lib/supabase-server";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Chamado depois que o navegador terminou de enviar as fotos.
 * Confere no Storage se todas chegaram e muda o status para
 * "aguardando_pagamento".
 */
export async function POST(
  _request: Request,
  ctx: RouteContext<"/api/pedidos/[id]/finalizar">,
) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) {
    return Response.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }

  const supabase = supabaseAdmin();
  const { data: pedido } = await supabase
    .from("pedidos")
    .select("id, numero, status, pasta, fotos")
    .eq("id", id)
    .single();

  if (!pedido) {
    return Response.json({ erro: "Pedido não encontrado." }, { status: 404 });
  }
  if (pedido.status !== "enviando_fotos") {
    return Response.json({ id: pedido.id, numero: pedido.numero });
  }

  const { data: arquivos, error } = await supabase.storage
    .from(bucketFotos())
    .list(pedido.pasta, { limit: 1000 });

  if (error) {
    console.error("Erro ao conferir fotos", error);
    return Response.json(
      { erro: "Não foi possível conferir as fotos." },
      { status: 500 },
    );
  }

  const enviados = new Set(
    (arquivos ?? []).map((a) => `${pedido.pasta}/${a.name}`),
  );
  const faltando = (pedido.fotos as string[]).filter((c) => !enviados.has(c));
  if (faltando.length > 0) {
    return Response.json(
      { erro: `Faltam ${faltando.length} foto(s) para concluir o envio.` },
      { status: 409 },
    );
  }

  const { error: erroUpdate } = await supabase
    .from("pedidos")
    .update({ status: "aguardando_pagamento" })
    .eq("id", id);

  if (erroUpdate) {
    console.error("Erro ao atualizar pedido", erroUpdate);
    return Response.json(
      { erro: "Não foi possível concluir o pedido." },
      { status: 500 },
    );
  }

  return Response.json({ id: pedido.id, numero: pedido.numero });
}
