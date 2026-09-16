import sharp from "sharp";

const DEFAULT_MODEL = "gemini-2.5-flash-image";
const PROMPT = `Remove the background completely. Keep the person unchanged: face, hair, skin, and clothing (including a white shirt if present). Output a PNG of only the person on a fully transparent background. Do not add a new backdrop, color, oval, circle, or shadow. Do not crop off the torso.`;

function geminiKey(): string | undefined {
  const key = process.env.GEMINI_API_KEY?.trim();
  return key || undefined;
}

function sniffMime(buf: Buffer): "image/jpeg" | "image/png" | "image/webp" {
  if (buf[0] === 0x89 && buf[1] === 0x50) return "image/png";
  if (buf[0] === 0x52 && buf[1] === 0x49) return "image/webp";
  return "image/jpeg";
}

type GeminiPart = {
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

function partImageB64(part: GeminiPart): string | undefined {
  return part.inlineData?.data ?? part.inline_data?.data;
}

async function generateContentCutout(jpeg: Buffer, apiKey: string, model: string): Promise<Buffer | null> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [
            { text: PROMPT },
            { inlineData: { mimeType: sniffMime(jpeg), data: jpeg.toString("base64") } },
          ],
        },
      ],
      generationConfig: {
        responseModalities: ["IMAGE", "TEXT"],
      },
    }),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error(`[gemini-cutout] generateContent ${res.status}: ${errText.slice(0, 400)}`);
    return null;
  }
  const json = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  for (const part of parts) {
    const b64 = partImageB64(part);
    if (b64) return Buffer.from(b64, "base64");
  }
  return null;
}

/** Recorte de persona con Gemini (clave gratuita de AI Studio). */
export async function cutoutWithGemini(buffer: Buffer): Promise<Buffer | null> {
  const apiKey = geminiKey();
  if (!apiKey) return null;

  const input = await sharp(buffer)
    .rotate()
    .resize(768, 768, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 88 })
    .toBuffer();

  const model = process.env.GEMINI_IMAGE_MODEL?.trim() || DEFAULT_MODEL;
  try {
    return await generateContentCutout(input, apiKey, model);
  } catch (err) {
    console.error("[gemini-cutout]", err instanceof Error ? err.message : err);
    return null;
  }
}
