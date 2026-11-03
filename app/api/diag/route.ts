import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT = 24_000;

export async function POST(request: Request) {
  const text = await request.text();
  if (text.length > LIMIT) {
    return new Response("too large", { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  if (!payload || typeof payload !== "object") {
    return new Response("bad payload", { status: 400 });
  }

  const dir = path.join(process.cwd(), ".qa", "stage93");
  await mkdir(dir, { recursive: true });
  await appendFile(
    path.join(dir, "device-diag.log"),
    `${JSON.stringify({ receivedAt: new Date().toISOString(), payload })}\n`,
  );

  return new Response("ok");
}