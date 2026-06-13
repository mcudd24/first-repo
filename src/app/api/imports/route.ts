import { NextRequest, NextResponse } from "next/server";
import { createImport, listImports } from "@/server/services/importService";

export async function GET() {
  return NextResponse.json(await listImports());
}

const ACCEPTED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
]);
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Accepts multipart/form-data: optional `text`, `source`, and file fields.
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const text = (form.get("text") as string | null) ?? undefined;
  const source = (form.get("source") as string | null) ?? "TEXT";

  const files: { mediaType: string; dataBase64: string }[] = [];
  let fileName: string | undefined;

  for (const entry of form.getAll("files")) {
    if (!(entry instanceof File)) continue;
    if (!ACCEPTED_TYPES.has(entry.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${entry.type || "unknown"}` },
        { status: 400 }
      );
    }
    if (entry.size > MAX_FILE_BYTES) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }
    const buffer = Buffer.from(await entry.arrayBuffer());
    files.push({ mediaType: entry.type, dataBase64: buffer.toString("base64") });
    fileName = fileName ?? entry.name;
  }

  if (!text && files.length === 0) {
    return NextResponse.json({ error: "Provide text or at least one file" }, { status: 400 });
  }

  const job = await createImport({ source, fileName, text, files });
  return NextResponse.json(job, { status: 201 });
}
