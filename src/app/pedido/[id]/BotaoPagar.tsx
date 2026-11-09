"use client";

import { useState } from "react";

/** Etapa 2: este botão será ligado ao Asaas. */
export function BotaoPagar() {
  const [clicado, setClicado] = useState(false);
  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setClicado(true)}
        className="w-full rounded-xl bg-green-600 px-4 py-4 text-base font-semibold text-white active:bg-green-700"
      >
        Pagar
      </button>
      {clicado && (
        <p className="text-center text-sm text-neutral-600">
          O pagamento online estará disponível em breve.
        </p>
      )}
    </div>
  );
}
