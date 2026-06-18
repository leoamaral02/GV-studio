import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (data.user) redirect("/dashboard");

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-mid bg-gold-soft text-xl font-bold text-gold">GV</div>
          <h1 className="text-3xl font-bold">GV Studio</h1>
          <p className="mt-2 text-sm text-muted">Controle interno para manicure e nail designer</p>
        </div>
        {children}
      </div>
    </main>
  );
}
