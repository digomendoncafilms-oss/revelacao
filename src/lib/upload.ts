/**
 * Envia um arquivo para um link assinado do Supabase Storage,
 * informando o progresso (XMLHttpRequest permite acompanhar o upload,
 * o fetch não). O arquivo vai exatamente como está: qualidade original.
 */
export function enviarArquivo(
  url: string,
  arquivo: File,
  aoProgredir: (bytesEnviados: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader(
      "content-type",
      arquivo.type || "application/octet-stream",
    );
    xhr.setRequestHeader("cache-control", "max-age=3600");
    xhr.setRequestHeader("x-upsert", "true");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) aoProgredir(e.loaded);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        aoProgredir(arquivo.size);
        resolve();
      } else {
        reject(new Error(`Falha no envio (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Erro de conexão"));
    xhr.send(arquivo);
  });
}

type Tarefa = { url: string; arquivo: File };

/**
 * Envia vários arquivos, alguns ao mesmo tempo, tentando de novo
 * automaticamente se algum falhar. Retorna os índices que falharam.
 */
export async function enviarTodos(
  tarefas: Tarefa[],
  aoProgredir: (bytesEnviados: number, bytesTotais: number) => void,
  { simultaneos = 3, tentativas = 3 } = {},
): Promise<number[]> {
  const total = tarefas.reduce((s, t) => s + t.arquivo.size, 0);
  const enviados = new Array<number>(tarefas.length).fill(0);
  const falhas: number[] = [];
  let proximo = 0;

  const atualizar = () =>
    aoProgredir(
      enviados.reduce((s, b) => s + b, 0),
      total,
    );

  async function trabalhador() {
    while (proximo < tarefas.length) {
      const i = proximo++;
      const { url, arquivo } = tarefas[i];
      let ok = false;
      for (let t = 1; t <= tentativas && !ok; t++) {
        try {
          await enviarArquivo(url, arquivo, (b) => {
            enviados[i] = b;
            atualizar();
          });
          ok = true;
        } catch {
          enviados[i] = 0;
          atualizar();
          if (t < tentativas) await new Promise((r) => setTimeout(r, 1000 * t));
        }
      }
      if (!ok) falhas.push(i);
    }
  }

  atualizar();
  await Promise.all(
    Array.from({ length: Math.min(simultaneos, tarefas.length) }, trabalhador),
  );
  return falhas.sort((a, b) => a - b);
}
