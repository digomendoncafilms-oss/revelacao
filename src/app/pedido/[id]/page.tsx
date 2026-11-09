import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { formatarMoeda } from "@/lib/formato";
import { STATUS, type StatusPedido } from "@/lib/pedido";
import { supabaseAdmin } from "@/lib/supabase-server";
import { BotaoPagar } from "./BotaoPagar";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PaginaPedido(props: PageProps<"/pedido/[id]">) {
  return (
    <main className="space-y-6">
      <Suspense fallback={<p className="text-neutral-600">Carregando pedido...</p>}>
        <DetalhesPedido params={props.params} />
      </Suspense>
    </main>
  );
}

async function DetalhesPedido({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const { data: pedido } = await supabaseAdmin()
    .from("pedidos")
    .select("numero, nome, tamanho, quantidade, preco_unitario, total, status")
    .eq("id", id)
    .single();

  if (!pedido) notFound();

  const primeiroNome = String(pedido.nome).split(" ")[0];
  const status = pedido.status as StatusPedido;

  return (
    <>
      <header className="space-y-2 text-center">
        <p className="text-5xl" aria-hidden>
          ✓
        </p>
        <h1 className="text-2xl font-bold">Pedido recebido!</h1>
        <p className="text-neutral-600">
          Obrigado, {primeiroNome}. Suas fotos foram enviadas.
        </p>
      </header>

      <div className="rounded-2xl bg-neutral-100 p-4 text-center">
        <p className="text-sm text-neutral-600">Número do pedido</p>
        <p className="text-4xl font-bold tracking-wide">#{pedido.numero}</p>
        <p className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-sm text-amber-900">
          {STATUS[status] ?? status}
        </p>
      </div>

      <dl className="space-y-1 rounded-2xl border border-neutral-200 p-4 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Fotos ({pedido.tamanho})</dt>
          <dd className="font-medium">{pedido.quantidade}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Preço por foto</dt>
          <dd className="font-medium">
            {formatarMoeda(Number(pedido.preco_unitario))}
          </dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-bold">{formatarMoeda(Number(pedido.total))}</dd>
        </div>
      </dl>

      {status === "aguardando_pagamento" && <BotaoPagar />}

      <p className="text-center text-sm text-neutral-600">
        Guarde o número do seu pedido.{" "}
        <Link href="/" className="underline">
          Fazer novo pedido
        </Link>
      </p>
    </>
  );
}
