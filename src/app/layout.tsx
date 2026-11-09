import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Revelação de Fotos",
  description: "Envie suas fotos pelo celular e receba impressas.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full bg-white text-neutral-900">
        <div className="mx-auto w-full max-w-xl px-4 py-6">{children}</div>
      </body>
    </html>
  );
}
