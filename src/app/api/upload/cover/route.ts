import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireOwner } from "@/lib/auth/session";

const BUCKET       = "barbershop-assets";
const MAX_BYTES    = 5 * 1024 * 1024; // 5 MB (covers pueden ser más grandes)
const ALLOWED_EXT  = ["jpg", "jpeg", "png", "webp", "gif"] as const;
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export async function POST(request: NextRequest) {
  const session = await requireOwner();
  if (!session) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  if (!formData) return NextResponse.json({ error: "FormData inválido" }, { status: 400 });

  const file = formData.get("file") as File | null;
  if (!file)  return NextResponse.json({ error: "No se recibió ningún archivo" }, { status: 400 });

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!(ALLOWED_EXT as readonly string[]).includes(ext))
    return NextResponse.json({ error: "Formato no permitido. Usa JPG, PNG, WebP o GIF." }, { status: 400 });
  if (!(ALLOWED_MIME as readonly string[]).includes(file.type as typeof ALLOWED_MIME[number]))
    return NextResponse.json({ error: "Tipo de archivo no permitido." }, { status: 400 });
  if (file.size > MAX_BYTES)
    return NextResponse.json({ error: "El archivo supera los 5 MB" }, { status: 400 });
  const path  = `covers/${session.barbershop.id}.${ext}`;
  const bytes = await file.arrayBuffer();

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await supabase.storage.createBucket(BUCKET, { public: true }).catch(() => {});

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Agregar cache-buster para que el browser no use la versión anterior
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  const url = `${data.publicUrl}?t=${Date.now()}`;

  return NextResponse.json({ url });
}
