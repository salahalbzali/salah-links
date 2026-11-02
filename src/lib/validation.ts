import { z } from "zod";
export const createLinkSchema = z.object({
  url: z.string().trim().min(1, "أدخل الرابط أولاً").max(2048).url("أدخل رابطًا صحيحًا يتضمن https:// أو http://").refine(v => ["http:", "https:"].includes(new URL(v).protocol), "يُسمح بروابط HTTP وHTTPS فقط"),
  customCode: z.string().trim().optional().transform(v => v || undefined).refine(v => !v || /^[A-Za-z0-9_-]{4,32}$/.test(v), "الرمز المخصص يجب أن يكون من 4 إلى 32 حرفًا أو رقمًا أو - أو _"),
  title: z.string().trim().max(100).optional().transform(v => v || undefined),
  expiresAt: z.string().optional().transform(v => v || undefined)
});
export function randomCode(length = 7) {
  const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, b => alphabet[b % alphabet.length]).join("");
}
