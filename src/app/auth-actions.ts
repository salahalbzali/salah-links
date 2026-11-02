"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") || "").trim(); const password = String(formData.get("password") || "");
  if (!email || !password) redirect("/login?error=أدخل البريد وكلمة المرور");
  const supabase = await createClient(); const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/login?error=تعذر تسجيل الدخول، تحقق من البيانات"); redirect("/dashboard");
}
export async function signUp(formData: FormData) {
  const email = String(formData.get("email") || "").trim(); const password = String(formData.get("password") || ""); const name = String(formData.get("name") || "").trim();
  if (!email || password.length < 8) redirect("/signup?error=أدخل بريدًا صحيحًا وكلمة مرور من 8 أحرف على الأقل");
  const supabase = await createClient(); const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name } } });
  if (error) redirect("/signup?error=تعذر إنشاء الحساب، قد يكون البريد مستخدمًا");
  if (data.session) redirect("/dashboard"); redirect("/login?message=تم إنشاء الحساب، تحقق من بريدك إذا طُلب منك ذلك");
}
export async function signOut() { const supabase = await createClient(); await supabase.auth.signOut(); redirect("/"); }
