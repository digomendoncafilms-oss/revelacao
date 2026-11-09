"use client";

import { useRef } from "react";

export type FotoSelecionada = {
  id: string;
  arquivo: File;
  preview: string;
};

type Props = {
  fotos: FotoSelecionada[];
  aoAdicionar: (arquivos: File[]) => void;
  aoRemover: (id: string) => void;
  bloqueado?: boolean;
};

export function SeletorFotos({ fotos, aoAdicionar, aoRemover, bloqueado }: Props) {
  const input = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(e) => {
          const arquivos = Array.from(e.target.files ?? []);
          if (arquivos.length) aoAdicionar(arquivos);
          e.target.value = ""; // permite escolher as mesmas fotos de novo
        }}
      />

      <button
        type="button"
        disabled={bloqueado}
        onClick={() => input.current?.click()}
        className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white active:bg-blue-700 disabled:opacity-50"
      >
        {fotos.length === 0 ? "Enviar minhas fotos" : "Adicionar mais fotos"}
      </button>

      {fotos.length > 0 && (
        <ul className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {fotos.map((foto) => (
            <li
              key={foto.id}
              className="relative aspect-square overflow-hidden rounded-lg bg-neutral-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- prévia local (blob:) */}
              <img
                src={foto.preview}
                alt={foto.arquivo.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
              />
              {!bloqueado && (
                <button
                  type="button"
                  onClick={() => aoRemover(foto.id)}
                  aria-label={`Remover ${foto.arquivo.name}`}
                  className="absolute right-1 top-1 flex h-8 w-8 items-center justify-center rounded-full bg-black/70 text-lg leading-none text-white"
                >
                  ×
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
