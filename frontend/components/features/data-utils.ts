"use client";

import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subMonths } from "date-fns";
import type { Atendimento, Cliente, Despesa } from "@/lib/types";

export const paymentMethods = ["PIX", "Dinheiro", "Cartao de credito", "Cartao de debito", "Outro"];

export function periodRange(period: string, customStart?: string, customEnd?: string) {
  const today = new Date();
  if (period === "hoje") return { start: format(today, "yyyy-MM-dd"), end: format(today, "yyyy-MM-dd") };
  if (period === "semana") return { start: format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd"), end: format(endOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd") };
  if (period === "mes-anterior") {
    const previous = subMonths(today, 1);
    return { start: format(startOfMonth(previous), "yyyy-MM-dd"), end: format(endOfMonth(previous), "yyyy-MM-dd") };
  }
  if (period === "personalizado" && customStart && customEnd) return { start: customStart, end: customEnd };
  return { start: format(startOfMonth(today), "yyyy-MM-dd"), end: format(endOfMonth(today), "yyyy-MM-dd") };
}

export function activeRevenue(atendimentos: Atendimento[]) {
  return atendimentos.filter((item) => item.status === "realizado").reduce((sum, item) => sum + Number(item.valor_cobrado), 0);
}

export function activeExpense(despesas: Despesa[]) {
  return despesas.filter((item) => item.status === "ativa").reduce((sum, item) => sum + Number(item.valor), 0);
}

export function totalMinutes(atendimentos: Atendimento[]) {
  return atendimentos.filter((item) => item.status === "realizado").reduce((sum, item) => sum + Number(item.duracao_minutos), 0);
}

export function clientStats(clientes: Cliente[], atendimentos: Atendimento[]) {
  return clientes.map((cliente) => {
    const done = atendimentos.filter((item) => item.cliente_id === cliente.id && item.status === "realizado");
    const total = done.reduce((sum, item) => sum + Number(item.valor_cobrado), 0);
    const last = done.map((item) => item.data).sort().at(-1) ?? null;
    return { ...cliente, total_gasto: total, total_atendimentos: done.length, ultimo_atendimento: last };
  });
}
