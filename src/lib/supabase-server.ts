import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let cliente: SupabaseClient | null = null;

/**
 * Cliente Supabase com a chave service_role.
 * Só pode ser usado no servidor (rotas de API e Server Components).
 */
export function supabaseAdmin(): SupabaseClient {
  if (cliente) return cliente;
  const url = process.env.SUPABASE_URL;
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !chave) {
    throw new Error(
      "Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no arquivo .env.local",
    );
  }
  cliente = createClient(url, chave, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return cliente;
}

export function bucketFotos(): string {
  return process.env.SUPABASE_BUCKET || "fotos";
}
