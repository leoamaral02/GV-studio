"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, MessageCircle, Plus, UserX } from "lucide-react";
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
import { clienteSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import type { Atendimento, Cliente } from "@/lib/types";
import { money, normalizePhone, whatsappUrl } from "@/lib/utils";
import { clientStats } from "./data-utils";

type ClienteFormInput = z.input<typeof clienteSchema>;
type ClienteFormOutput = z.output<typeof clienteSchema>;
type ClienteStats = Cliente & { total_gasto: number; total_atendimentos: number; ultimo_atendimento: string | null };

export function ClientesClient() {
  const supabase = createClient();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Cliente | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("ativas");
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ClienteFormInput, unknown, ClienteFormOutput>({ resolver: zodResolver(clienteSchema), defaultValues: { ativo: true } });

  async function load() {
    const [clients, appointments] = await Promise.all([
      supabase.from("clientes").select("*").order("nome"),
      supabase.from("atendimentos").select("*")
    ]);
    if (clients.error || appointments.error) return toast.error("Erro ao carregar dados");
    setClientes((clients.data ?? []) as Cliente[]);
    setAtendimentos((appointments.data ?? []) as Atendimento[]);
  }

  useEffect(() => { load(); }, []);

  const rows = useMemo(() => {
    const stats = clientStats(clientes, atendimentos) as ClienteStats[];
    return stats.filter((cliente) => {
      const matchesSearch = `${cliente.nome} ${cliente.whatsapp}`.toLowerCase().includes(query.toLowerCase());
      const matchesStatus = status === "todas" || (status === "ativas" ? cliente.ativo : !cliente.ativo);
      return matchesSearch && matchesStatus;
    });
  }, [clientes, atendimentos, query, status]);

  function newClient() {
    setEditing(null);
    reset({ nome: "", whatsapp: "", data_nascimento: "", observacoes: "", preferencias: "", alergias: "", ativo: true });
    setOpen(true);
  }

  function editClient(cliente: Cliente) {
    setEditing(cliente);
    reset({ ...cliente, data_nascimento: cliente.data_nascimento ?? "", observacoes: cliente.observacoes ?? "", preferencias: cliente.preferencias ?? "", alergias: cliente.alergias ?? "" });
    setOpen(true);
  }

  async function onSubmit(values: ClienteFormOutput) {
    const payload = {
      ...values,
      whatsapp: normalizePhone(values.whatsapp),
      data_nascimento: values.data_nascimento || null,
      observacoes: values.observacoes || null,
      preferencias: values.preferencias || null,
      alergias: values.alergias || null
    };
    const result = editing
      ? await supabase.from("clientes").update(payload).eq("id", editing.id)
      : await supabase.from("clientes").insert(payload);
    if (result.error) {
      toast.error(result.error.code === "23505" ? "WhatsApp ja cadastrado para esta usuaria" : "Nao foi possivel salvar");
      return;
    }
    toast.success(editing ? "Cliente atualizada com sucesso" : "Cliente cadastrada com sucesso");
    setOpen(false);
    load();
  }

  async function deactivate(cliente: Cliente) {
    const { error } = await supabase.from("clientes").update({ ativo: !cliente.ativo }).eq("id", cliente.id);
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success(cliente.ativo ? "Cliente inativada com sucesso" : "Cliente atualizada com sucesso");
    load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Clientes" description="Cadastro, historico e acesso rapido ao WhatsApp." action={<Button onClick={newClient}><Plus size={16} />Nova cliente</Button>} />
      <Card><CardContent className="grid gap-3 md:grid-cols-3"><Input placeholder="Buscar por nome ou WhatsApp" value={query} onChange={(event) => setQuery(event.target.value)} /><Select value={status} onChange={(event) => setStatus(event.target.value)}><option value="ativas">Ativas</option><option value="inativas">Inativas</option><option value="todas">Todas</option></Select></CardContent></Card>
      <div className="hidden overflow-hidden rounded-lg border border-border md:block">
        <table className="w-full border-collapse text-sm">
          <thead className="bg-surface text-left text-muted"><tr><th className="p-3">Nome</th><th className="p-3">WhatsApp</th><th className="p-3">Ultimo atendimento</th><th className="p-3">Total gasto</th><th className="p-3">Qtd.</th><th className="p-3">Status</th><th className="p-3">Acoes</th></tr></thead>
          <tbody>
            {rows.map((cliente) => (
              <tr key={cliente.id} className="border-t border-border bg-background">
                <td className="p-3 font-medium"><Link className="hover:text-gold" href={`/clientes/${cliente.id}`}>{cliente.nome}</Link></td>
                <td className="p-3 text-muted">{cliente.whatsapp}</td>
                <td className="p-3 text-muted">{cliente.ultimo_atendimento ?? "-"}</td>
                <td className="p-3 text-success">{money(cliente.total_gasto)}</td>
                <td className="p-3">{cliente.total_atendimentos}</td>
                <td className="p-3"><Badge variant={cliente.ativo ? "success" : "muted"}>{cliente.ativo ? "Ativa" : "Inativa"}</Badge></td>
                <td className="p-3"><div className="flex gap-2"><Button asChild size="icon" variant="secondary"><a href={whatsappUrl(cliente.whatsapp, "Ola, tudo bem? Passando para saber se voce gostaria de agendar um horario.")} target="_blank" aria-label="WhatsApp"><MessageCircle size={16} /></a></Button><Button size="icon" variant="secondary" onClick={() => editClient(cliente)}><Edit size={16} /></Button><Button size="icon" variant="danger" onClick={() => deactivate(cliente)}><UserX size={16} /></Button></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid gap-3 md:hidden">
        {rows.map((cliente) => (
          <Card key={cliente.id}><CardContent className="grid gap-3"><div className="flex items-start justify-between gap-3"><div><Link href={`/clientes/${cliente.id}`} className="font-semibold">{cliente.nome}</Link><p className="text-sm text-muted">{cliente.whatsapp}</p></div><Badge variant={cliente.ativo ? "success" : "muted"}>{cliente.ativo ? "Ativa" : "Inativa"}</Badge></div><div className="grid grid-cols-2 gap-2 text-sm"><span className="text-muted">Total: <strong className="text-success">{money(cliente.total_gasto)}</strong></span><span className="text-muted">Atend.: <strong className="text-text">{cliente.total_atendimentos}</strong></span></div><div className="flex gap-2"><Button asChild size="sm" variant="secondary"><a href={whatsappUrl(cliente.whatsapp)} target="_blank"><MessageCircle size={15} />WhatsApp</a></Button><Button size="sm" variant="secondary" onClick={() => editClient(cliente)}>Editar</Button></div></CardContent></Card>
        ))}
      </div>
      {!rows.length ? <EmptyState message="Nenhum cliente cadastrado ainda" /> : null}
      <Modal title={editing ? "Editar cliente" : "Nova cliente"} open={open} onOpenChange={setOpen}>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Nome" error={errors.nome?.message}><Input {...register("nome")} /></Field><Field label="WhatsApp" error={errors.whatsapp?.message}><Input {...register("whatsapp")} /></Field></div>
          <Field label="Data de nascimento" error={errors.data_nascimento?.message}><Input type="date" {...register("data_nascimento")} /></Field>
          <Field label="Observacoes" error={errors.observacoes?.message}><Textarea {...register("observacoes")} /></Field>
          <div className="grid gap-4 md:grid-cols-2"><Field label="Preferencias" error={errors.preferencias?.message}><Textarea {...register("preferencias")} /></Field><Field label="Alergias/cuidados" error={errors.alergias?.message}><Textarea {...register("alergias")} /></Field></div>
          <Button disabled={isSubmitting}>{isSubmitting ? "Salvando..." : "Salvar"}</Button>
        </form>
      </Modal>
    </div>
  );
}
