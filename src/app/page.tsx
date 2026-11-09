import { BannerPrecos } from "@/components/BannerPrecos";
import { FormularioPedido } from "@/components/FormularioPedido";

export default function Home() {
  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Revelação de Fotos</h1>
        <p className="mt-1 text-neutral-600">
          Escolha as fotos no seu celular, confirme o pedido e pronto.
        </p>
      </header>

      <BannerPrecos />
      <FormularioPedido />
    </main>
  );
}
