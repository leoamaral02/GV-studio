"use client";

import { useEffect, useMemo, useState } from "react";
import { format, parseISO } from "date-fns";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Despesa } from "@/lib/types";
import { money } from "@/lib/utils";
import { activeExpense, activeRevenue, periodRange, totalMinutes } from "./data-utils";

export function DashboardClient() {
  const supabase = useMemo(() => createClient(), []);
  const [period, setPeriod] = useState("mes-atual");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [despesas, setDespesas] = useState<Despesa[]>([]);

  const range = useMemo(() => periodRange(period, customStart, customEnd), [period, customStart, customEnd]);

  useEffect(() => {
    async function load() {
      const [appointments, expenses] = await Promise.all([
        supabase.from("atendimentos").select("*, clientes(nome, whatsapp), servicos(nome)").gte("data", range.start).lte("data", range.end).order("data", { ascending: false }),
        supabase.from("despesas").select("*, categorias_despesas(nome)").gte("data", range.start).lte("data", range.end).order("data", { ascending: false })
      ]);
      if (appointments.error || expenses.error) {
        toast.error("Erro ao carregar dados");
        return;
      }
      setAtendimentos((appointments.data ?? []) as Atendimento[]);
      setDespesas((expenses.data ?? []) as Despesa[]);
    }
    load();
  }, [range.start, range.end, supabase]);

  const revenue = activeRevenue(atendimentos);
  const expense = activeExpense(despesas);
  const minutes = totalMinutes(atendimentos);
  const realized = atendimentos.filter((item) => item.status === "realizado");
  const chart = realized.reduce<Record<string, { dia: string; faturamento: number }>>((acc, item) => {
    const label = format(parseISO(item.data), "dd/MM");
    acc[label] ??= { dia: label, faturamento: 0 };
    acc[label].faturamento += Number(item.valor_cobrado);
    return acc;
  }, {});

  const serviceRevenue = realized.reduce<Record<string, number>>((acc, item) => {
    const name = item.servicos?.nome ?? "Servico";
    acc[name] = (acc[name] ?? 0) + Number(item.valor_cobrado);
    return acc;
  }, {});
  const topService = Object.entries(serviceRevenue).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "-";

  return (
    <div className="grid gap-6">
      <PageHeader title="Dashboard" description="Resumo financeiro e operacional do periodo." />
      <Card>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Select value={period} onChange={(event) => setPeriod(event.target.value)}>
            <option value="hoje">Hoje</option>
            <option value="semana">Semana</option>
            <option value="mes-atual">Mes atual</option>
            <option value="mes-anterior">Mes anterior</option>
            <option value="personalizado">Periodo personalizado</option>
          </Select>
          {period === "personalizado" ? (
            <>
              <Input type="date" value={customStart} onChange={(event) => setCustomStart(event.target.value)} />
              <Input type="date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)} />
            </>
          ) : null}
        </CardContent>
      </Card>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Faturamento" value={money(revenue)} tone="green" />
        <StatCard label="Despesas" value={money(expense)} tone="red" />
        <StatCard label="Lucro estimado" value={money(revenue - expense)} tone="gold" />
        <StatCard label="Atendimentos" value={String(realized.length)} tone="blue" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Faturamento por dia</CardTitle></CardHeader>
          <CardContent className="h-72">
            {Object.values(chart).length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={Object.values(chart)}>
                  <CartesianGrid stroke="#242424" />
                  <XAxis dataKey="dia" stroke="#777777" />
                  <YAxis stroke="#777777" />
                  <Tooltip cursor={{ fill: "#C9A96E18" }} contentStyle={{ background: "#141414", border: "1px solid #242424", color: "#EDEAE4" }} />
                  <Bar dataKey="faturamento" fill="#C9A96E" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <EmptyState message="Nenhum atendimento lancado neste periodo" />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Indicadores</CardTitle></CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <IndicatorRow label="Horas em atendimento" value={`${(minutes / 60).toFixed(1)}h`} />
            <IndicatorRow label="Faturamento por hora" value={money(minutes ? revenue / (minutes / 60) : 0)} />
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(96px,auto)] items-start gap-4">
              <span className="min-w-0 text-muted">Servico que mais faturou</span>
              <Badge className="max-w-32 justify-center text-center leading-tight">{topService}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Atendimentos recentes</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {atendimentos.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                <div><strong>{item.clientes?.nome}</strong><p className="text-muted">{item.servicos?.nome} - {format(parseISO(item.data), "dd/MM/yyyy")}</p></div>
                <span className="text-success">{money(item.valor_cobrado)}</span>
              </div>
            ))}
            {!atendimentos.length ? <EmptyState message="Nenhum atendimento lancado neste periodo" /> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Despesas recentes</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {despesas.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border bg-background p-3 text-sm">
                <div><strong>{item.descricao}</strong><p className="text-muted">{item.categorias_despesas?.nome} - {format(parseISO(item.data), "dd/MM/yyyy")}</p></div>
                <span className="text-danger">{money(item.valor)}</span>
              </div>
            ))}
            {!despesas.length ? <EmptyState message="Nenhuma despesa cadastrada" /> : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function IndicatorRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
      <span className="min-w-0 text-muted">{label}</span>
      <strong className="whitespace-nowrap text-right">{value}</strong>
    </div>
  );
}
