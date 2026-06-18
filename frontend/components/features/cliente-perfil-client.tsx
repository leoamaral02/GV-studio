"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { ArrowLeft, MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { AtendimentosClient } from "@/components/features/atendimentos-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Cliente } from "@/lib/types";
import { money, whatsappUrl } from "@/lib/utils";

export function ClientePerfilClient({ clienteId }: { clienteId: string }) {
  const supabase = useMemo(() => createClient(), []);
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);

  useEffect(() => {
    async function load() {
      const [client, appointments] = await Promise.all([
        supabase.from("clientes").select("*").eq("id", clienteId).single(),
        supabase.from("atendimentos").select("*, servicos(nome)").eq("cliente_id", clienteId).order("data", { ascending: false })
      ]);
      if (client.error || appointments.error) return toast.error("Erro ao carregar dados");
      setCliente(client.data as Cliente);
      setAtendimentos((appointments.data ?? []) as Atendimento[]);
    }
    load();
  }, [clienteId, supabase]);

  const stats = useMemo(() => {
    const done = atendimentos.filter((item) => item.status === "realizado");
    const total = done.reduce((sum, item) => sum + Number(item.valor_cobrado), 0);
    const dates = done.map((item) => parseISO(item.data)).sort((a, b) => a.getTime() - b.getTime());
    const intervals = dates.slice(1).map((date, index) => (date.getTime() - dates[index].getTime()) / 86400000);
    const average = intervals.length ? intervals.reduce((sum, item) => sum + item, 0) / intervals.length : 0;
    const services = done.reduce<Record<string, number>>((acc, item) => {
      const name = item.servicos?.nome ?? "Servico";
      acc[name] = (acc[name] ?? 0) + 1;
      return acc;
    }, {});
    return { total, last: dates.at(-1), average, topService: Object.entries(services).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-" };
  }, [atendimentos]);

  if (!cliente) return <EmptyState message="Erro ao carregar dados" />;

  return (
    <div className="grid gap-6">
      <PageHeader
        title={cliente.nome}
        description="Perfil, preferencias, cuidados e historico da cliente."
        action={<div className="flex gap-2"><Button asChild variant="secondary"><Link href="/clientes"><ArrowLeft size={16} />Voltar</Link></Button><Button asChild><a href={whatsappUrl(cliente.whatsapp, "Ola, tudo bem? Passando para saber se voce gostaria de agendar um horario.")} target="_blank"><MessageCircle size={16} />WhatsApp</a></Button></div>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Dados da cliente</CardTitle></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="WhatsApp" value={cliente.whatsapp} />
            <Info label="Nascimento" value={cliente.data_nascimento ?? "-"} />
            <Info label="Status" value={cliente.ativo ? "Ativa" : "Inativa"} />
            <Info label="Preferencias" value={cliente.preferencias ?? "-"} />
            <Info label="Alergias/cuidados" value={cliente.alergias ?? "-"} />
            <Info label="Observacoes" value={cliente.observacoes ?? "-"} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Resumo</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <Info label="Total gasto" value={money(stats.total)} />
            <Info label="Ultima visita" value={stats.last ? format(stats.last, "dd/MM/yyyy") : "-"} />
            <Info label="Media entre atendimentos" value={stats.average ? `${stats.average.toFixed(0)} dias` : "-"} />
            <div><span className="text-muted">Servico mais realizado</span><div className="mt-1"><Badge>{stats.topService}</Badge></div></div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Historico de atendimentos</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {atendimentos.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 rounded-lg border border-border bg-background p-3 text-sm md:flex-row md:items-center md:justify-between">
              <div><strong>{item.servicos?.nome}</strong><p className="text-muted">{item.data} - {item.hora_inicio.slice(0, 5)} ate {item.hora_fim.slice(0, 5)}</p></div>
              <div className="flex items-center gap-2"><span className="text-success">{money(item.valor_cobrado)}</span><Badge variant={item.status === "realizado" ? "success" : "danger"}>{item.status}</Badge></div>
            </div>
          ))}
          {!atendimentos.length ? <EmptyState message="Nenhum atendimento lancado neste periodo" /> : null}
        </CardContent>
      </Card>
      <div className="rounded-lg border border-border p-4">
        <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Plus size={16} />Novo atendimento para esta cliente</div>
        <AtendimentosClient initialClienteId={cliente.id} />
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><span className="text-sm text-muted">{label}</span><p className="mt-1 font-medium text-text">{value}</p></div>;
}
