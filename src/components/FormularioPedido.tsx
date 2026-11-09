"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { LIMITES, TAMANHOS, type Tamanho } from "@/config/precos";
import { formatarBytes, mascaraWhatsapp, somenteDigitos } from "@/lib/formato";
import {
  EMAIL_REGEX,
  type NovoPedidoInput,
  type NovoPedidoResposta,
} from "@/lib/pedido";
import { calcularPedido } from "@/lib/precos";
import { enviarTodos } from "@/lib/upload";
import { BarraProgresso } from "./BarraProgresso";
import { ResumoPedido } from "./ResumoPedido";
import { SeletorFotos, type FotoSelecionada } from "./SeletorFotos";

type Fase = "editando" | "enviando" | "finalizando" | "falhou";

let contador = 0;
const novoId = () => `${Date.now()}-${contador++}`;

export function FormularioPedido() {
  const router = useRouter();

  const [fotos, setFotos] = useState<FotoSelecionada[]>([]);
  const [tamanho, setTamanho] = useState<Tamanho>(TAMANHOS[0]);
  const [nome, setNome] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");

  const [fase, setFase] = useState<Fase>("editando");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [progresso, setProgresso] = useState({ enviados: 0, total: 0 });

  // Pedido já criado no servidor (permite tentar de novo só o que falhou)
  const pedidoRef = useRef<NovoPedidoResposta | null>(null);
  const pendentesRef = useRef<number[]>([]);

  const calculo = useMemo(
    () => calcularPedido(tamanho, fotos.length),
    [tamanho, fotos.length],
  );

  const bloqueado = fase !== "editando";

  // Avisa antes de fechar a página no meio do envio
  useEffect(() => {
    if (fase !== "enviando" && fase !== "finalizando") return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [fase]);

  function adicionar(arquivos: File[]) {
    setAviso(null);
    const ignoradas: string[] = [];
    const novas: FotoSelecionada[] = [];
    const vagas = LIMITES.maxFotos - fotos.length;

    for (const arquivo of arquivos) {
      if (arquivo.type && !arquivo.type.startsWith("image/")) {
        ignoradas.push(`${arquivo.name} (não é imagem)`);
      } else if (arquivo.size > LIMITES.maxBytesPorFoto) {
        ignoradas.push(
          `${arquivo.name} (maior que ${formatarBytes(LIMITES.maxBytesPorFoto)})`,
        );
      } else if (novas.length >= vagas) {
        ignoradas.push(`${arquivo.name} (limite de ${LIMITES.maxFotos} fotos)`);
      } else {
        novas.push({
          id: novoId(),
          arquivo,
          preview: URL.createObjectURL(arquivo),
        });
      }
    }

    if (ignoradas.length) {
      setAviso(`Algumas fotos não foram adicionadas: ${ignoradas.join(", ")}.`);
    }
    setFotos((atual) => [...atual, ...novas]);
    setErro(null);
  }

  function remover(id: string) {
    setFotos((atual) => {
      const foto = atual.find((f) => f.id === id);
      if (foto) URL.revokeObjectURL(foto.preview);
      return atual.filter((f) => f.id !== id);
    });
  }

  function validar(): string | null {
    if (fotos.length === 0) return "Selecione pelo menos uma foto.";
    if (nome.trim().length < 2) return "Informe seu nome.";
    const digitos = somenteDigitos(whatsapp);
    if (digitos.length < 10) return "Informe seu WhatsApp com DDD.";
    if (!EMAIL_REGEX.test(email.trim())) return "Informe um e-mail válido.";
    return null;
  }

  async function enviarFotos(indices: number[]) {
    const pedido = pedidoRef.current!;
    setFase("enviando");
    setErro(null);

    const falhas = await enviarTodos(
      indices.map((i) => ({ url: pedido.uploads[i].url, arquivo: fotos[i].arquivo })),
      (enviados, total) => setProgresso({ enviados, total }),
    );

    if (falhas.length > 0) {
      pendentesRef.current = falhas.map((f) => indices[f]);
      setFase("falhou");
      setErro(
        `${falhas.length} foto(s) não foram enviadas. Verifique sua internet e toque em "Tentar novamente".`,
      );
      return;
    }

    pendentesRef.current = [];
    setFase("finalizando");
    const resp = await fetch(`/api/pedidos/${pedido.id}/finalizar`, {
      method: "POST",
    }).catch(() => null);

    if (!resp || !resp.ok) {
      const corpo = await resp?.json().catch(() => null);
      setFase("falhou");
      setErro(corpo?.erro ?? "Não foi possível concluir o pedido. Tente novamente.");
      return;
    }

    // O Next preserva a página anterior escondida (Activity); limpamos o
    // formulário para que "Fazer novo pedido" comece do zero.
    limpar();
    router.push(`/pedido/${pedido.id}`);
  }

  function limpar() {
    fotos.forEach((f) => URL.revokeObjectURL(f.preview));
    setFotos([]);
    setTamanho(TAMANHOS[0]);
    setNome("");
    setWhatsapp("");
    setEmail("");
    setErro(null);
    setAviso(null);
    setProgresso({ enviados: 0, total: 0 });
    pedidoRef.current = null;
    pendentesRef.current = [];
    setFase("editando");
  }

  async function confirmar(e: React.FormEvent) {
    e.preventDefault();
    if (bloqueado) return;

    const problema = validar();
    if (problema) {
      setErro(problema);
      return;
    }

    setErro(null);
    setFase("enviando");
    setProgresso({ enviados: 0, total: 0 });

    const corpo: NovoPedidoInput = {
      nome: nome.trim(),
      whatsapp: somenteDigitos(whatsapp),
      email: email.trim(),
      tamanho,
      arquivos: fotos.map((f) => ({
        nome: f.arquivo.name,
        tipo: f.arquivo.type,
        bytes: f.arquivo.size,
      })),
    };

    const resp = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(corpo),
    }).catch(() => null);

    const dados = await resp?.json().catch(() => null);
    if (!resp || !resp.ok || !dados) {
      setFase("editando");
      setErro(dados?.erro ?? "Não foi possível criar o pedido. Verifique sua internet.");
      return;
    }

    pedidoRef.current = dados as NovoPedidoResposta;
    await enviarFotos(fotos.map((_, i) => i));
  }

  async function tentarNovamente() {
    const pendentes = pendentesRef.current;
    await enviarFotos(pendentes.length ? pendentes : []);
  }

  const valorProgresso =
    progresso.total > 0 ? progresso.enviados / progresso.total : 0;

  return (
    <form onSubmit={confirmar} noValidate className="space-y-6">
      {/* 1. Fotos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. Suas fotos</h2>
        <SeletorFotos
          fotos={fotos}
          aoAdicionar={adicionar}
          aoRemover={remover}
          bloqueado={bloqueado}
        />
        {fotos.length > 0 && (
          <p className="text-sm text-neutral-600">
            {fotos.length} {fotos.length === 1 ? "foto selecionada" : "fotos selecionadas"}
          </p>
        )}
        {aviso && (
          <p className="rounded-lg bg-neutral-100 px-3 py-2 text-sm text-neutral-700">
            {aviso}
          </p>
        )}
      </section>

      {/* 2. Tamanho */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">2. Tamanho (para todas as fotos)</h2>
        <div role="radiogroup" className="grid grid-cols-2 gap-3">
          {TAMANHOS.map((t) => {
            const ativo = tamanho === t;
            return (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={ativo}
                disabled={bloqueado}
                onClick={() => setTamanho(t)}
                className={`rounded-xl border-2 px-4 py-4 text-base font-semibold disabled:opacity-60 ${
                  ativo
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-neutral-200"
                }`}
              >
                {t} cm
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Resumo */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">3. Resumo</h2>
        <ResumoPedido tamanho={tamanho} calculo={calculo} />
      </section>

      {/* 4. Dados */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">4. Seus dados</h2>
        <label className="block">
          <span className="text-sm text-neutral-700">Nome</span>
          <input
            type="text"
            autoComplete="name"
            value={nome}
            onChange={(e) => { setNome(e.target.value); setErro(null); }}
            disabled={bloqueado}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm text-neutral-700">WhatsApp</span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder="(11) 91234-5678"
            value={whatsapp}
            onChange={(e) => { setWhatsapp(mascaraWhatsapp(e.target.value)); setErro(null); }}
            disabled={bloqueado}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
          />
        </label>
        <label className="block">
          <span className="text-sm text-neutral-700">E-mail</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setErro(null); }}
            disabled={bloqueado}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-3 text-base"
          />
        </label>
      </section>

      {/* Envio */}
      <section className="space-y-3">
        {(fase === "enviando" || fase === "finalizando" || fase === "falhou") &&
          progresso.total > 0 && (
            <BarraProgresso
              valor={valorProgresso}
              rotulo={
                fase === "finalizando"
                  ? "Concluindo pedido..."
                  : `Enviando fotos (${formatarBytes(progresso.enviados)} de ${formatarBytes(progresso.total)})`
              }
            />
          )}

        {erro && (
          <p role="alert" className="rounded-lg bg-red-100 px-3 py-2 text-sm text-red-800">
            {erro}
          </p>
        )}

        {fase === "falhou" ? (
          <button
            type="button"
            onClick={tentarNovamente}
            className="w-full rounded-xl bg-blue-600 px-4 py-4 text-base font-semibold text-white"
          >
            Tentar novamente
          </button>
        ) : (
          <button
            type="submit"
            disabled={bloqueado || fotos.length === 0}
            className="w-full rounded-xl bg-green-600 px-4 py-4 text-base font-semibold text-white active:bg-green-700 disabled:opacity-50"
          >
            {fase === "editando" ? "Confirmar pedido" : "Enviando... não feche esta página"}
          </button>
        )}
      </section>
    </form>
  );
}
