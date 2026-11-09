type Props = { valor: number; rotulo: string };

/** valor de 0 a 1 */
export function BarraProgresso({ valor, rotulo }: Props) {
  const pct = Math.round(Math.min(Math.max(valor, 0), 1) * 100);
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span>{rotulo}</span>
        <span className="font-semibold">{pct}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={rotulo}
        className="h-3 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-[width] duration-200"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
