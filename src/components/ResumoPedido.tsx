import type { Tamanho } from "@/config/precos";
import { formatarMoeda } from "@/lib/formato";
import type { Calculo } from "@/lib/precos";

type Props = { tamanho: Tamanho; calculo: Calculo };

export function ResumoPedido({ tamanho, calculo }: Props) {
  const { quantidade, precoUnitario, total, proximaFaixa } = calculo;

  return (
    <div className="rounded-2xl border border-neutral-200 p-4">
      <dl className="space-y-1 text-sm">
        <div className="flex justify-between">
          <dt className="text-neutral-600">Fotos ({tamanho})</dt>
          <dd className="font-medium">{quantidade}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-neutral-600">Preço por foto</dt>
          <dd className="font-medium">
            {quantidade > 0 ? formatarMoeda(precoUnitario) : "—"}
          </dd>
        </div>
        <div className="flex justify-between border-t border-neutral-200 pt-2 text-base">
          <dt className="font-semibold">Total</dt>
          <dd className="font-bold">{formatarMoeda(total)}</dd>
        </div>
      </dl>

      {proximaFaixa && (
        <p
          aria-live="polite"
          className="mt-3 rounded-lg bg-amber-100 px-3 py-2 text-sm text-amber-900"
        >
          Adicione mais <strong>{proximaFaixa.faltam}</strong>{" "}
          {proximaFaixa.faltam === 1 ? "foto" : "fotos"} e pague{" "}
          <strong>{formatarMoeda(proximaFaixa.precoUnitario)}</strong> por
          unidade.
        </p>
      )}
    </div>
  );
}
