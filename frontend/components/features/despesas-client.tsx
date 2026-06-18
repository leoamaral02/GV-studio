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
import { despesaSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import type { CategoriaDespesa, Despesa } from "@/lib/types";
import { money } from "@/lib/utils";
import { periodRange } from "./data-utils";

type DespesaFormInput = z.input<typeof despesaSchema>;
type DespesaFormOutput = z.output<typeof despesaSchema>;

export function DespesasClient() {
  const supabase = createClient();
  const [despesas, setDespesas] = useState<Despesa[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDespesa[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Despesa | null>(null);
  const [period, setPeriod] = useState("mes-atual");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("todas");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<DespesaFormInput, unknown, DespesaFormOutput>({ resolver: zodResolver(despesaSchema), defaultValues: { status: "ativa" } });

  async function load() {
    const range = periodRange(period);
    const [expenses, categories] = await Promise.all([
      supabase.from("despesas").select("*, categorias_despesas(nome)").gte("data", range.start).lte("data", range.end).order("data", { ascending: false }),
      supabase.from("categorias_despesas").select("*").eq("ativo", true).order("nome")
    ]);
    if (expenses.error || categories.error) return toast.error("Erro ao carregar dados");
    setDespesas((expenses.data ?? []) as Despesa[]);
    setCategorias((categories.data ?? []) as CategoriaDespesa[]);
  }

  useEffect(() => { load(); }, [period]);

  const rows = useMemo(() => despesas.filter((item) => (!category || item.categoria_id === category) && (status === "todas" || item.status === status)), [despesas, category, status]);

  function openForm(item?: Despesa) {
    setEditing(item ?? null);
    reset(item ? { ...item, valor: Number(item.valor), observacao: item.observacao ?? "" } : { categoria_id: "", descricao: "", valor: 0, data: format(new Date(), "yyyy-MM-dd"), observacao: "", status: "ativa" });
    setOpen(true);
  }

  async function onSubmit(values: DespesaFormOutput) {
    const payload = { ...values, observacao: values.observacao || null };
    const result = editing ? await supabase.from("despesas").update(payload).eq("id", editing.id) : await supabase.from("despesas").insert(payload);
    if (result.error) return toast.error("Nao foi possivel salvar");
    toast.success(editing ? "Despesa atualizada com sucesso" : "Despesa cadastrada com sucesso");
    setOpen(false);
    load();
  }

  async function cancel(item: Despesa) {
    const { error } = await supabase.from("despesas").update({ status: "cancelada" }).eq("id", item.id);
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success("Despesa cancelada com sucesso");
    load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Despesas" description="Lancamentos de custos por categoria." action={<Button onClick={() => openForm()}><Plus size={16} />Nova despesa</Button>} />
      <Card><CardContent className="grid gap-3 md:grid-cols-4"><Select value={period} onChange={(event) => setPeriod(event.target.value)}><option value="hoje">Hoje</option><option value="semana">Semana</option><option value="mes-atual">Mes</option><option value="mes-anterior">Mes anterior</option></Select><Select value={category} onChange={(event) => setCategory(event.target.value)}><option value="">Todas categorias</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</Select><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="todas">Todas</option><option value="ativa">Ativas</option><option value="cancelada">Canceladas</option></Select></CardContent></Card>
      <div className="grid gap-3">
        {rows.map((item) => (
          <Card key={item.id}><CardContent className="grid gap-3 md:grid-cols-[1fr_auto] md:items-center"><div><div className="flex flex-wrap items-center gap-2"><strong>{item.descricao}</strong><Badge variant={item.status === "ativa" ? "success" : "danger"}>{item.status}</Badge></div><p className="text-sm text-muted">{item.data} - {item.categorias_despesas?.nome}</p><p className="text-danger">{money(item.valor)}</p></div><div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => openForm(item)}><Edit size={15} />Editar</Button>{item.status !== "cancelada" ? <Button size="sm" variant="danger" onClick={() => cancel(item)}><Ban size={15} />Cancelar</Button> : null}</div></CardContent></Card>
        ))}
      </div>
      {!rows.length ? <EmptyState message="Nenhuma despesa cadastrada" /> : null}
      <Modal title={editing ? "Editar despesa" : "Nova despesa"} open={open} onOpenChange={setOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Descricao" error={errors.descricao?.message}><Input {...register("descricao")} /></Field>
          <div className="grid gap-4 md:grid-cols-3"><Field label="Categoria" error={errors.categoria_id?.message}><Select {...register("categoria_id")}><option value="">Selecione</option>{categorias.map((categoria) => <option key={categoria.id} value={categoria.id}>{categoria.nome}</option>)}</Select></Field><Field label="Valor" error={errors.valor?.message}><Input type="number" step="0.01" {...register("valor")} /></Field><Field label="Data" error={errors.data?.message}><Input type="date" {...register("data")} /></Field></div>
          <Field label="Observacao" error={errors.observacao?.message}><Textarea {...register("observacao")} /></Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
        </form>
      </Modal>
    </div>
  );
}
