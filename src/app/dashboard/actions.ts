"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createLinkSchema, randomCode } from "@/lib/validation";
export async function createLink(formData: FormData) {
  const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); if (!user) redirect("/login");
  const parsed = createLinkSchema.safeParse({ url: formData.get("url"), customCode: formData.get("customCode"), title: formData.get("title"), expiresAt: formData.get("expiresAt") });
  if (!parsed.success) redirect("/dashboard?error=" + encodeURIComponent(parsed.error.issues[0]?.message || "بيانات غير صحيحة"));
  const v=parsed.data; const code=v.customCode || randomCode();
  const { error } = await supabase.from("links").insert({ user_id:user.id, code, destination_url:v.url, title:v.title || null, expires_at:v.expiresAt ? new Date(v.expiresAt).toISOString() : null });
  if(error) redirect("/dashboard?error="+encodeURIComponent(error.code === "23505" ? "هذا الرمز مستخدم، اختر رمزًا آخر" : "تعذر إنشاء الرابط، تحقق من البيانات"));
  revalidatePath("/dashboard"); redirect("/dashboard?created="+encodeURIComponent(code));
}
export async function deleteLink(formData: FormData) { const id=String(formData.get("id")||""); const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login"); await supabase.from("links").delete().eq("id",id).eq("user_id",user.id); revalidatePath("/dashboard"); }
export async function toggleLink(formData: FormData) { const id=String(formData.get("id")||""); const active=String(formData.get("active")||"")==="true"; const supabase=await createClient(); const {data:{user}}=await supabase.auth.getUser(); if(!user)redirect("/login"); await supabase.from("links").update({is_active:!active}).eq("id",id).eq("user_id",user.id); revalidatePath("/dashboard"); }
