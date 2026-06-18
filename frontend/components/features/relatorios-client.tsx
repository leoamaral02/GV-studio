"use client";

import { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Cliente, Despesa } from "@/lib/types";
import { csvDownload, money } from "@/lib/utils";
import { activeExpense, activeRevenue, clientStats, periodRange, totalMinutes } from "./data-utils";

const colors = ["#C9A96E", "#52D68A", "#6EB0D6", "#A78BFA", "#F07070"];

export function RelatoriosClient() {
  const supabase = useMemo(() => createClient(), []);
  const [period, setPeriod] = useState("mes-atual");
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const range = periodRange(period);

  useEffect(() => {
    async function load() {
      const [appointments, expenses, clients] = await Promise.all([
        supabase.from("atendimentos").select("*, clientes(nome, whatsapp), servicos(nome)").gte("data", range.start).lte("data", range.end),
        supabase.from("despesas").select("*, categorias_despesas(nome)").gte("data", range.start).lte("data", range.end),
        supabase.from("clientes").select("*")
      ]);
      if (appointments.error || expenses.error || clients.error) return toast.error("Erro ao carregar dados");
      setAtendimentos((appointments.data ?? []) as Atendimento[]);
      setDespesas((expenses.data ?? []) as Despesa[]);
      setClientes((clients.data ?? []) as Cliente[]);
    }
    load();
  }, [range.start, range.end, supabase]);

  const revenue = activeRevenue(atendimentos);
  const expense = activeExpense(despesas);
  const minutes = totalMinutes(atendimentos);
  const done = atendimentos.filter((item) => item.status === "realizado");
  const activeExpenses = despesas.filter((item) => item.status === "ativa");

  const byPayment = group(done, (item) => item.forma_pagamento, (item) => Number(item.valor_cobrado));
  const byService = group(done, (item) => item.servicos?.nome ?? "Servico", (item) => Number(item.valor_cobrado));
  const byCategory = group(activeExpenses, (item) => item.categorias_despesas?.nome ?? "Categoria", (item) => Number(item.valor));
  const clientsReport = useMemo(() => clientStats(clientes, done).sort((a, b) => b.total_gasto - a.total_gasto), [clientes, done]);

  return (
    <div className="grid gap-6">
      <PageHeader title="Relatorios" description="Analises financeiras, atendimentos e clientes." action={<Button variant="secondary" onClick={() => csvDownload("gv-studio-relatorio.csv", done.map((item) => ({ data: item.data, cliente: item.clientes?.nome, servico: item.servicos?.nome, valor: item.valor_cobrado, pagamento: item.forma_pagamento })))}><Download size={16} />Exportar CSV</Button>} />
      <Card><CardContent className="max-w-xs"><Select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="hoje">Hoje</option><option value="semana">Semana</option><option value="mes-atual">Mes</option><option value="mes-anterior">Mes anterior</option></Select></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-4"><StatCard label="Receitas" value={money(revenue)} tone="green" /><StatCard label="Despesas" value={money(expense)} tone="red" /><StatCard label="Lucro estimado" value={money(revenue - expense)} /><StatCard label="Ticket medio" value={money(done.length ? revenue / done.length : 0)} tone="blue" /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ReportChart title="Faturamento por forma de pagamento" data={byPayment} />
        <ReportChart title="Faturamento por servico" data={byService} />
        <ReportChart title="Despesas por categoria" data={byCategory} />
        <Card><CardHeader><CardTitle>Relatorio de atendimentos</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm"><Line label="Quantidade" value={String(done.length)} /><Line label="Tempo total em atendimento" value={`${(minutes / 60).toFixed(1)}h`} /><Line label="Faturamento por hora" value={money(minutes ? revenue / (minutes / 60) : 0)} /></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Clientes que mais gastaram</CardTitle></CardHeader>
        <CardContent className="grid gap-2">
          {clientsReport.slice(0, 10).map((cliente) => <Line key={cliente.id} label={`${cliente.nome} - ${cliente.total_atendimentos} atend.`} value={money(cliente.total_gasto)} />)}
        </CardContent>
      </Card>
    </div>
  );
}

function group<T>(items: T[], label: (item: T) => string, value: (item: T) => number) {
  const grouped = items.reduce<Record<string, number>>((acc, item) => {
    const key = label(item);
    acc[key] = (acc[key] ?? 0) + value(item);
    return acc;
  }, {});
  return Object.entries(grouped).map(([name, total]) => ({ name, total }));
}

function ReportChart({ title, data }: { title: string; data: { name: string; total: number }[] }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#242424" />
            <XAxis dataKey="name" stroke="#777777" />
            <YAxis stroke="#777777" />
            <Tooltip contentStyle={{ background: "#141414", border: "1px solid #242424", color: "#EDEAE4" }} />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>{data.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background p-3 text-sm"><span className="text-muted">{label}</span><strong>{value}</strong></div>;
}
