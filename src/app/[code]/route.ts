import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
const reserved = new Set(["api", "login", "signup", "dashboard", "favicon.ico", "robots.txt", "sitemap.xml"]);
export async function GET(request: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  if (reserved.has(code.toLowerCase()) || !/^[A-Za-z0-9_-]{4,32}$/.test(code)) return NextResponse.redirect(new URL("/", request.url));
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resolve_short_link", { p_code: code });
  const link = Array.isArray(data) ? data[0] : null;
  if (error || !link?.destination_url) return NextResponse.redirect(new URL("/not-found-link", request.url));
  // Record only minimal analytics. Avoid storing raw IP addresses or sensitive personal data.
  const ref = request.headers.get("referer");
  const ua = request.headers.get("user-agent") || "";
  const device = /tablet|ipad/i.test(ua) ? "tablet" : /mobile|android|iphone/i.test(ua) ? "mobile" : ua ? "desktop" : "unknown";
  // The SQL resolver increments the counter. Detailed click events can be added through a server-side service role if desired.
  const response = NextResponse.redirect(link.destination_url, 302);
  response.headers.set("Cache-Control", "no-store");
  if (ref) response.headers.set("X-Redirect-Referrer-Seen", "1");
  response.headers.set("X-Device-Class", device);
  return response;
}
