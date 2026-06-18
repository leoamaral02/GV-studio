"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, Plus, RotateCcw, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { servicoSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Servico } from "@/lib/types";
import { money } from "@/lib/utils";

type FormData = z.infer<typeof servicoSchema>;

export function ServicosClient() {
  const supabase = createClient();
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Servico | null>(null);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(servicoSchema), defaultValues: { ativo: true } });

  async function load() {
    const [services, appointments] = await Promise.all([supabase.from("servicos").select("*").order("nome"), supabase.from("atendimentos").select("*")]);
    if (services.error || appointments.error) return toast.error("Erro ao carregar dados");
    setServicos((services.data ?? []) as Servico[]);
    setAtendimentos((appointments.data ?? []) as Atendimento[]);
  }

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => servicos.map((servico) => {
    const done = atendimentos.filter((item) => item.servico_id === servico.id && item.status === "realizado");
    return { ...servico, quantidade: done.length, faturado: done.reduce((sum, item) => sum + Number(item.valor_cobrado), 0) };
  }), [servicos, atendimentos]);

  function openForm(servico?: Servico) {
    setEditing(servico ?? null);
    reset(servico ? { ...servico, tempo_estimado_minutos: servico.tempo_estimado_minutos ?? "", descricao: servico.descricao ?? "" } : { nome: "", valor_padrao: 0, tempo_estimado_minutos: "", descricao: "", ativo: true });
    setOpen(true);
  }

  async function onSubmit(values: FormData) {
    const payload = { ...values, tempo_estimado_minutos: values.tempo_estimado_minutos === "" ? null : Number(values.tempo_estimado_minutos), descricao: values.descricao || null };
    const result = editing ? await supabase.from("servicos").update(payload).eq("id", editing.id) : await supabase.from("servicos").insert(payload);
    if (result.error) return toast.error(result.error.code === "23505" ? "Servico ja cadastrado" : "Nao foi possivel salvar");
    toast.success(editing ? "Atualizado com sucesso" : "Cadastro realizado com sucesso");
    setOpen(false);
    load();
  }

  async function toggle(servico: Servico) {
    const { error } = await supabase.from("servicos").update({ ativo: !servico.ativo }).eq("id", servico.id);
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success("Atualizado com sucesso");
    load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Servicos" description="Tabela de servicos, valores padrao e tempo estimado." action={<Button onClick={() => openForm()}><Plus size={16} />Novo servico</Button>} />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((servico) => (
          <Card key={servico.id}>
            <CardContent className="grid gap-4">
              <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold">{servico.nome}</h2><p className="text-sm text-muted">{servico.tempo_estimado_minutos ? `${servico.tempo_estimado_minutos} min` : "Sem tempo estimado"}</p></div><Badge variant={servico.ativo ? "success" : "muted"}>{servico.ativo ? "Ativo" : "Inativo"}</Badge></div>
              <div className="grid grid-cols-3 gap-2 text-sm"><span><small className="block text-muted">Valor</small><strong className="text-success">{money(servico.valor_padrao)}</strong></span><span><small className="block text-muted">Vezes</small><strong>{servico.quantidade}</strong></span><span><small className="block text-muted">Faturado</small><strong>{money(servico.faturado)}</strong></span></div>
              <div className="flex gap-2"><Button variant="secondary" size="sm" onClick={() => openForm(servico)}><Edit size={15} />Editar</Button><Button variant={servico.ativo ? "danger" : "secondary"} size="sm" onClick={() => toggle(servico)}>{servico.ativo ? <XCircle size={15} /> : <RotateCcw size={15} />}{servico.ativo ? "Inativar" : "Reativar"}</Button></div>
            </CardContent>
          </Card>
        ))}
      </div>
      {!rows.length ? <EmptyState message="Nenhum servico cadastrado" /> : null}
      <Modal title={editing ? "Editar servico" : "Novo servico"} open={open} onOpenChange={setOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Nome" error={errors.nome?.message}><Input {...register("nome")} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Valor padrao" error={errors.valor_padrao?.message}><Input type="number" step="0.01" {...register("valor_padrao")} /></Field><Field label="Tempo estimado em minutos" error={errors.tempo_estimado_minutos?.message}><Input type="number" {...register("tempo_estimado_minutos")} /></Field></div>
          <Field label="Descricao" error={errors.descricao?.message}><Textarea {...register("descricao")} /></Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
        </form>
      </Modal>
    </div>
  );
}
