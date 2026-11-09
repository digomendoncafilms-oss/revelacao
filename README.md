# App de Revelação de Fotos — Etapa 1

O cliente escolhe as fotos no celular, define o tamanho (10x15 ou 15x21), vê o preço por faixa em tempo real, informa os dados de contato e envia. As fotos vão em **qualidade original** para o Supabase Storage, e o pedido fica salvo com status **aguardando pagamento**.

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS 4 + Supabase.

## Estrutura

```
src/
├─ config/
│  └─ precos.ts                 ← TABELA DE PREÇOS (edite aqui) e limites de envio
├─ app/
│  ├─ layout.tsx                ← layout base (mobile-first, largura máx. ~576px)
│  ├─ page.tsx                  ← tela inicial: banner de preços + formulário
│  ├─ globals.css
│  ├─ api/pedidos/
│  │  ├─ route.ts               ← POST: valida, recalcula o preço, cria o pedido e gera os links de envio
│  │  └─ [id]/finalizar/route.ts← POST: confere as fotos no Storage → "aguardando_pagamento"
│  └─ pedido/[id]/
│     ├─ page.tsx               ← confirmação com o número do pedido
│     └─ BotaoPagar.tsx         ← botão "Pagar" (será ligado ao Asaas na Etapa 2)
├─ components/
│  ├─ BannerPrecos.tsx          ← tabela de preços por faixa
│  ├─ FormularioPedido.tsx      ← fluxo completo (fotos, tamanho, resumo, dados, envio)
│  ├─ SeletorFotos.tsx          ← botão da galeria + miniaturas com remover
│  ├─ ResumoPedido.tsx          ← quantidade, preço unitário, total e dica de faixa
│  └─ BarraProgresso.tsx
└─ lib/
   ├─ precos.ts                 ← cálculo de faixa/total (usado no navegador e no servidor)
   ├─ upload.ts                 ← envio com progresso, 3 em paralelo, 3 tentativas
   ├─ supabase-server.ts        ← cliente Supabase (somente servidor)
   ├─ pedido.ts                 ← tipos e status
   └─ formato.ts                ← moeda, máscara de WhatsApp, bytes
supabase/
└─ schema.sql                   ← tabela "pedidos" + bucket "fotos"
```

## Como funciona o envio

1. **`POST /api/pedidos`** valida os dados e recalcula o preço no servidor, sem confiar no valor vindo do navegador. Cria o pedido com status `enviando_fotos` e um número sequencial (começa em 1001). Devolve um **link de envio assinado** para cada foto.
2. O navegador envia cada arquivo **direto para o Supabase Storage**, sem compressão e sem passar pelo servidor do app. Assim não esbarra no limite de tamanho de requisição de hospedagens como a Vercel. Os arquivos ficam em:
   ```
   fotos/pedido-1001/15x21/001-nome-original.jpg
   fotos/pedido-1001/15x21/002-...
   ```
3. **`POST /api/pedidos/{id}/finalizar`** confere no Storage se todas as fotos chegaram e muda o status para `aguardando_pagamento`.
4. O cliente vai para `/pedido/{id}`, que mostra o número do pedido e o botão "Pagar".

Se alguma foto falhar (internet caiu, por exemplo), o app tenta de novo automaticamente. Se ainda assim falhar, mostra o botão "Tentar novamente", que reenvia só as fotos que faltaram.

## Editar preços

Abra `src/config/precos.ts`:

```ts
export const TABELA_PRECOS = {
  "10x15": [
    { ate: 10, preco: 3.5 },   // 1 a 10 fotos
    { ate: 20, preco: 3.0 },   // 11 a 20 fotos
    { ate: null, preco: 2.5 }, // acima de 20
  ],
  "15x21": [ ... ],
};
```

O banner, o resumo, a dica "adicione mais X fotos" e o cálculo no servidor leem todos deste arquivo.

## Configurar o Supabase

1. Crie um projeto em <https://supabase.com> (o plano gratuito serve).
2. Em **SQL Editor → New query**, cole o conteúdo de `supabase/schema.sql` e clique em **Run**. Isso cria:
   - a tabela `pedidos`, com RLS ligado e sem políticas públicas: só o servidor do app acessa;
   - o bucket **privado** `fotos` (máx. 50 MB por arquivo, só imagens).
3. Em **Project Settings → API**, copie:
   - **Project URL** → `SUPABASE_URL`
   - a chave **service_role** (secret) → `SUPABASE_SERVICE_ROLE_KEY`

   A chave `service_role` dá acesso total ao projeto. Ela só é usada no servidor e **nunca** deve ir para o navegador nem para o Git.

Para ver os pedidos: **Table Editor → pedidos**. Para ver as fotos: **Storage → fotos**.

> No plano gratuito, o limite global de upload do Supabase é 50 MB por arquivo, o que basta para fotos de celular. Para mudar, ajuste `LIMITES.maxBytesPorFoto` em `src/config/precos.ts` e o `file_size_limit` do bucket.

## Rodar localmente

Requisitos: Node.js 20.9+ (recomendado 22).

```bash
npm install
```

```bash
cp .env.example .env.local
```

Preencha o `.env.local` com os dados do Supabase e rode:

```bash
npm run dev
```

Acesse <http://localhost:3000>.

**Testar no celular:** com o celular na mesma rede Wi-Fi do computador, acesse `http://IP-DO-COMPUTADOR:3000`. O endereço aparece como "Network" no terminal quando o `npm run dev` inicia.

Outros comandos:

```bash
npm run build
```

```bash
npm run lint
```

## Próximas etapas

- **Etapa 2:** ligar o botão "Pagar" ao Asaas (`src/app/pedido/[id]/BotaoPagar.tsx`) e adicionar os novos status (ex.: `pago`) na restrição `check` da coluna `status` em `supabase/schema.sql`.
- Identidade visual: cores e fontes em `src/app/globals.css` / `layout.tsx`.
