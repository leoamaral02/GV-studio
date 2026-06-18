import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { BarChart3, CalendarCheck, CircleDollarSign, LayoutDashboard, Paintbrush, Settings, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/servicos", label: "Servicos", icon: Paintbrush },
  { href: "/atendimentos", label: "Atendimentos", icon: CalendarCheck },
  { href: "/despesas", label: "Despesas", icon: CircleDollarSign },
  { href: "/relatorios", label: "Relatorios", icon: BarChart3 },
  { href: "/configuracoes", label: "Configuracoes", icon: Settings }
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("nome_profissional, nome_salao, logo_url")
    .eq("id", data.user.id)
    .single();

  return (
    <div className="min-h-screen bg-background text-text">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-border bg-surface p-4 lg:block">
        <Link href="/dashboard" className="mb-8 flex items-center gap-3">
          <BrandMark logoUrl={profile?.logo_url} size="lg" />
          <span>
            <strong className="block">{profile?.nome_salao || "GV Studio"}</strong>
            <small className="text-muted">{profile?.nome_profissional || "Controle interno"}</small>
          </span>
        </Link>
        <nav className="grid gap-1">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-text">
              <item.icon size={18} />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="absolute bottom-4 left-4 right-4">
          <SignOutButton />
        </div>
      </aside>
      <main className="pb-24 lg:ml-64 lg:pb-0">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-surface/95 px-4 py-3 backdrop-blur lg:hidden">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-gold">
            <BrandMark logoUrl={profile?.logo_url} size="sm" />
            {profile?.nome_salao || "GV Studio"}
          </Link>
          <div className="flex gap-3 text-xs text-muted">
            <Link href="/relatorios">Relatorios</Link>
            <Link href="/configuracoes">Configuracoes</Link>
          </div>
        </div>
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-border bg-surface/95 px-2 py-2 backdrop-blur lg:hidden">
        {nav.slice(0, 5).map((item) => (
          <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted">
            <item.icon size={18} />
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}

function BrandMark({ logoUrl, size }: { logoUrl?: string | null; size: "sm" | "lg" }) {
  const classes = size === "lg" ? "h-11 w-11 rounded-xl" : "h-8 w-8 rounded-lg";
  const imageSize = size === "lg" ? 44 : 32;

  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt="Logo"
        width={imageSize}
        height={imageSize}
        unoptimized
        className={`${classes} border border-gold-mid object-cover`}
      />
    );
  }

  return (
    <span className={`flex ${classes} items-center justify-center border border-gold-mid bg-gold-soft font-bold text-gold`}>
      GV
    </span>
  );
}
