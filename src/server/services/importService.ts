import { db } from "@/server/db";
import { getAI, ExtractedContact, extractedContactSchema } from "@/server/ai";
import { parseJson, toJson } from "@/lib/json";
import { createContact } from "./contactService";

const SOURCE_LABELS: Record<string, string> = {
  SCAN: "scanned form",
  PDF: "PDF",
  PHOTO: "photo",
  SCREENSHOT: "screenshot",
  EMAIL: "forwarded email",
  TEXT: "pasted text",
};

/**
 * Runs AI extraction on the submitted material and stages the result as an
 * ImportJob for human review. No Contact rows are created here.
 */
export async function createImport(params: {
  source: string;
  fileName?: string;
  text?: string;
  files?: { mediaType: string; dataBase64: string }[];
}) {
  try {
    const contacts = await getAI().extractContacts({
      text: params.text,
      files: params.files,
    });
    return await db.importJob.create({
      data: {
        source: params.source,
        fileName: params.fileName,
        rawText: params.text,
        extractedJson: toJson(contacts),
      },
    });
  } catch (err) {
    return await db.importJob.create({
      data: {
        source: params.source,
        fileName: params.fileName,
        rawText: params.text,
        status: "REJECTED",
        error: err instanceof Error ? err.message : "Extraction failed",
      },
    });
  }
}

export async function listImports() {
  const jobs = await db.importJob.findMany({ orderBy: { createdAt: "desc" } });
  return jobs.map((j) => ({
    ...j,
    extracted: parseJson<ExtractedContact[]>(j.extractedJson, []),
  }));
}

/**
 * Approves an import. The caller passes the (possibly user-edited) contact
 * rows from the review screen — what the user saw is exactly what is saved.
 */
export async function approveImport(id: string, editedContacts: unknown[]) {
  const job = await db.importJob.findUnique({ where: { id } });
  if (!job) throw new Error("Import not found");
  if (job.status !== "PENDING_REVIEW") throw new Error("Import already resolved");

  const contacts = editedContacts.map((c) => extractedContactSchema.parse(c));
  const created = [];
  for (const c of contacts) {
    created.push(
      await createContact({
        ...c,
        source: `Imported from ${SOURCE_LABELS[job.source] ?? job.source.toLowerCase()}`,
      })
    );
  }

  await db.importJob.update({
    where: { id },
    data: { status: "APPROVED", resolvedAt: new Date(), extractedJson: toJson(contacts) },
  });

  return created;
}

export async function rejectImport(id: string) {
  return db.importJob.update({
    where: { id },
    data: { status: "REJECTED", resolvedAt: new Date() },
  });
}
