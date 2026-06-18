"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Ban, Edit, Plus } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { atendimentoSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Cliente, Servico } from "@/lib/types";
import { minutesBetween, money } from "@/lib/utils";
import { paymentMethods, periodRange } from "./data-utils";

type AtendimentoFormInput = z.input<typeof atendimentoSchema>;
type AtendimentoFormOutput = z.output<typeof atendimentoSchema>;

export function AtendimentosClient({ initialClienteId }: { initialClienteId?: string }) {
  const supabase = createClient();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Atendimento | null>(null);
  const [period, setPeriod] = useState("mes-atual");
  const [clienteFilter, setClienteFilter] = useState(initialClienteId ?? "");
  const [servicoFilter, setServicoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<AtendimentoFormInput, unknown, AtendimentoFormOutput>({ resolver: zodResolver(atendimentoSchema), defaultValues: { status: "realizado", cliente_id: initialClienteId ?? "" } });

  const selectedService = watch("servico_id");
  const start = watch("hora_inicio");
  const end = watch("hora_fim");
  const value = watch("valor_cobrado");
  const duration = start && end ? Math.max(0, minutesBetween(start, end)) : 0;

  async function load() {
    const range = periodRange(period);
    const [appointments, clients, services] = await Promise.all([
      supabase.from("atendimentos").select("*, clientes(nome, whatsapp), servicos(nome)").gte("data", range.start).lte("data", range.end).order("data", { ascending: false }),
      supabase.from("clientes").select("*").eq("ativo", true).order("nome"),
      supabase.from("servicos").select("*").eq("ativo", true).order("nome")
    ]);
    if (appointments.error || clients.error || services.error) return toast.error("Erro ao carregar dados");
    setAtendimentos((appointments.data ?? []) as Atendimento[]);
    setClientes((clients.data ?? []) as Cliente[]);
    setServicos((services.data ?? []) as Servico[]);
  }

  useEffect(() => { load(); }, [period]);

  useEffect(() => {
    const servico = servicos.find((item) => item.id === selectedService);
    if (servico && !editing) setValue("valor_cobrado", Number(servico.valor_padrao));
  }, [selectedService, servicos, setValue, editing]);

  const rows = useMemo(() => atendimentos.filter((item) => {
    const byCliente = !clienteFilter || item.cliente_id === clienteFilter;
    const byServico = !servicoFilter || item.servico_id === servicoFilter;
    const byStatus = statusFilter === "todos" || item.status === statusFilter;
    return byCliente && byServico && byStatus;
  }), [atendimentos, clienteFilter, servicoFilter, statusFilter]);

  function openForm(item?: Atendimento) {
    setEditing(item ?? null);
    reset(item ? {
      cliente_id: item.cliente_id,
      servico_id: item.servico_id,
      data: item.data,
      hora_inicio: item.hora_inicio,
      hora_fim: item.hora_fim,
      valor_cobrado: Number(item.valor_cobrado),
      forma_pagamento: item.forma_pagamento,
      observacoes: item.observacoes ?? "",
      status: item.status
    } : {
      cliente_id: initialClienteId ?? "",
      servico_id: "",
      data: format(new Date(), "yyyy-MM-dd"),
      hora_inicio: "",
      hora_fim: "",
      valor_cobrado: 0,
      forma_pagamento: "PIX",
      observacoes: "",
      status: "realizado"
    });
    setOpen(true);
  }

  async function onSubmit(values: AtendimentoFormOutput) {
    const payload = { ...values, duracao_minutos: minutesBetween(values.hora_inicio, values.hora_fim), observacoes: values.observacoes || null };
    const result = editing ? await supabase.from("atendimentos").update(payload).eq("id", editing.id) : await supabase.from("atendimentos").insert(payload);
    if (result.error) return toast.error("Nao foi possivel salvar");
    toast.success(editing ? "Atendimento atualizado com sucesso" : "Atendimento cadastrado com sucesso");
    setOpen(false);
    load();
  }

  async function cancel(item: Atendimento) {
    const { error } = await supabase.from("atendimentos").update({ status: "cancelado" }).eq("id", item.id);
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success("Atendimento cancelado com sucesso");
    load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Atendimentos" description="Registro central de servicos realizados e faturamento." action={<Button onClick={() => openForm()}><Plus size={16} />Novo atendimento</Button>} />
      <Card><CardContent className="grid gap-3 md:grid-cols-5"><Select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="hoje">Hoje</option><option value="semana">Esta semana</option><option value="mes-atual">Este mes</option><option value="mes-anterior">Mes anterior</option></Select><Select value={clienteFilter} onChange={(event) => setClienteFilter(event.target.value)}><option value="">Todas as clientes</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</Select><Select value={servicoFilter} onChange={(event) => setServicoFilter(event.target.value)}><option value="">Todos os servicos</option>{servicos.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}</Select><Select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="todos">Todos status</option><option value="realizado">Realizado</option><option value="cancelado">Cancelado</option></Select></CardContent></Card>
      <div className="grid gap-3">
        {rows.map((item) => (
          <Card key={item.id}><CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><div className="grid gap-1"><div className="flex flex-wrap items-center gap-2"><strong>{item.clientes?.nome}</strong><Badge variant={item.status === "realizado" ? "success" : "danger"}>{item.status}</Badge></div><p className="text-sm text-muted">{item.data} - {item.hora_inicio.slice(0, 5)} ate {item.hora_fim.slice(0, 5)} - {item.servicos?.nome}</p><p className="text-sm"><span className="text-success">{money(item.valor_cobrado)}</span> / {item.forma_pagamento} / {item.duracao_minutos} min</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => openForm(item)}><Edit size={15} />Editar</Button>{item.status !== "cancelado" ? <Button size="sm" variant="danger" onClick={() => cancel(item)}><Ban size={15} />Cancelar</Button> : null}</div></CardContent></Card>
        ))}
      </div>
      {!rows.length ? <EmptyState message="Nenhum atendimento lancado neste periodo" /> : null}
      <Modal title={editing ? "Editar atendimento" : "Novo atendimento"} open={open} onOpenChange={setOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Cliente" error={errors.cliente_id?.message}><Select {...register("cliente_id")}><option value="">Selecione</option>{clientes.map((cliente) => <option key={cliente.id} value={cliente.id}>{cliente.nome}</option>)}</Select></Field><Field label="Servico" error={errors.servico_id?.message}><Select {...register("servico_id")}><option value="">Selecione</option>{servicos.map((servico) => <option key={servico.id} value={servico.id}>{servico.nome}</option>)}</Select></Field></div>
          <div className="grid gap-4 md:grid-cols-3"><Field label="Data" error={errors.data?.message}><Input type="date" {...register("data")} /></Field><Field label="Hora inicio" error={errors.hora_inicio?.message}><Input type="time" {...register("hora_inicio")} /></Field><Field label="Hora fim" error={errors.hora_fim?.message}><Input type="time" {...register("hora_fim")} /></Field></div>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Valor cobrado" error={errors.valor_cobrado?.message}><Input type="number" step="0.01" {...register("valor_cobrado")} /></Field><Field label="Forma de pagamento" error={errors.forma_pagamento?.message}><Select {...register("forma_pagamento")}>{paymentMethods.map((method) => <option key={method}>{method}</option>)}</Select></Field></div>
          <Card><CardContent className="grid gap-2 text-sm md:grid-cols-2"><span className="text-muted">Duracao calculada: <strong className="text-text">{duration} min</strong></span><span className="text-muted">Valor por hora estimado: <strong className="text-gold">{money(duration ? Number(value || 0) / (duration / 60) : 0)}</strong></span></CardContent></Card>
          <Field label="Observacoes" error={errors.observacoes?.message}><Textarea {...register("observacoes")} /></Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
        </form>
      </Modal>
    </div>
  );
}
