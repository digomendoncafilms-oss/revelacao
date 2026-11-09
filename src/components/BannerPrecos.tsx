import { TABELA_PRECOS, TAMANHOS } from "@/config/precos";
import { formatarMoeda } from "@/lib/formato";
import { rotuloFaixa } from "@/lib/precos";

/** Banner com a tabela de preços por faixa (dados de src/config/precos.ts) */
export function BannerPrecos() {
  const faixasReferencia = TABELA_PRECOS[TAMANHOS[0]];

  return (
    <section
      aria-labelledby="titulo-precos"
      className="rounded-2xl bg-neutral-900 p-4 text-white"
    >
      <h2 id="titulo-precos" className="text-lg font-semibold">
        Tabela de preços
      </h2>
      <p className="mt-1 text-sm text-neutral-300">
        Quanto mais fotos, menor o preço de cada uma.
      </p>

      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-neutral-400">
            <th className="py-1 font-normal">Fotos</th>
            {TAMANHOS.map((t) => (
              <th key={t} className="py-1 text-right font-normal">
                {t}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {faixasReferencia.map((_, i) => (
            <tr key={i} className="border-t border-neutral-700">
              <td className="py-2">{rotuloFaixa(faixasReferencia, i)}</td>
              {TAMANHOS.map((t) => (
                <td key={t} className="py-2 text-right font-semibold">
                  {formatarMoeda(TABELA_PRECOS[t][i].preco)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-xs text-neutral-400">Valores por foto.</p>
    </section>
  );
}
