"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Edit, ImageUp, Mail, Plus, Smartphone, XCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { PageHeader } from "@/components/page-header";
import { categoriaSchema, profileSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import type { CategoriaDespesa, Profile } from "@/lib/types";
import { normalizePhone } from "@/lib/utils";

type ProfileForm = z.infer<typeof profileSchema>;
type CategoryForm = z.infer<typeof categoriaSchema>;

export function ConfiguracoesClient() {
  const router = useRouter();
  const supabase = createClient();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [categories, setCategories] = useState<CategoriaDespesa[]>([]);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoriaDespesa | null>(null);
  const [categoryToToggle, setCategoryToToggle] = useState<CategoriaDespesa | null>(null);
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const categoryForm = useForm<CategoryForm>({ resolver: zodResolver(categoriaSchema), defaultValues: { ativo: true } });
  const logoPreview = profileForm.watch("logo_url");

  async function load() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    setAccountEmail(userData.user.email ?? "");
    const [profileResult, categoryResult] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userData.user.id).single(),
      supabase.from("categorias_despesas").select("*").order("nome")
    ]);
    if (profileResult.data) {
      setProfile(profileResult.data as Profile);
      profileForm.reset({
        nome_profissional: profileResult.data.nome_profissional,
        nome_salao: profileResult.data.nome_salao ?? "",
        whatsapp: profileResult.data.whatsapp,
        logo_url: profileResult.data.logo_url ?? ""
      });
    }
    if (categoryResult.data) setCategories(categoryResult.data as CategoriaDespesa[]);
  }

  useEffect(() => { load(); }, []);

  async function saveProfile(values: ProfileForm) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return toast.error("Voce nao tem permissao para acessar este registro");
    const { error } = await supabase.from("profiles").upsert({
      id: userData.user.id,
      nome_profissional: values.nome_profissional,
      nome_salao: values.nome_salao || null,
      whatsapp: normalizePhone(values.whatsapp),
      logo_url: values.logo_url || null
    });
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success("Atualizado com sucesso");
    load();
    router.refresh();
  }

  async function sendPasswordReset() {
    if (!accountEmail) return toast.error("E-mail da conta nao encontrado");

    const { error } = await supabase.auth.resetPasswordForEmail(accountEmail, {
      redirectTo: `${location.origin}/login`
    });

    if (error) return toast.error("Nao foi possivel enviar o link");
    toast.success("Enviamos um link para alterar a senha");
  }

  async function handleLogoUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Escolha uma imagem valida");
      return;
    }

    try {
      const optimizedLogo = await resizeLogo(file);
      profileForm.setValue("logo_url", optimizedLogo, { shouldDirty: true });
    } catch {
      toast.error("Nao foi possivel processar a imagem");
    }
  }

  function openCategory(category?: CategoriaDespesa) {
    setEditingCategory(category ?? null);
    categoryForm.reset(category ? { nome: category.nome, ativo: category.ativo } : { nome: "", ativo: true });
    setCategoryOpen(true);
  }

  async function saveCategory(values: CategoryForm) {
    const result = editingCategory
      ? await supabase.from("categorias_despesas").update(values).eq("id", editingCategory.id)
      : await supabase.from("categorias_despesas").insert(values);
    if (result.error) return toast.error("Nao foi possivel salvar");
    toast.success("Salvo com sucesso");
    setCategoryOpen(false);
    load();
  }

  async function toggleCategory(category: CategoriaDespesa) {
    const { error } = await supabase.from("categorias_despesas").update({ ativo: !category.ativo }).eq("id", category.id);
    if (error) return toast.error("Nao foi possivel salvar");
    toast.success("Atualizado com sucesso");
    setCategoryToToggle(null);
    load();
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Configuracoes" description="Perfil, conta, categorias e preferencias do app." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Perfil</CardTitle></CardHeader>
          <CardContent>
            <form className="grid gap-4" onSubmit={profileForm.handleSubmit(saveProfile)}>
              <Field label="Nome da profissional" error={profileForm.formState.errors.nome_profissional?.message}><Input {...profileForm.register("nome_profissional")} /></Field>
              <Field label="Nome do salao" error={profileForm.formState.errors.nome_salao?.message}><Input {...profileForm.register("nome_salao")} /></Field>
              <Field label="WhatsApp" error={profileForm.formState.errors.whatsapp?.message}><Input {...profileForm.register("whatsapp")} /></Field>
              <Field label="Upload de logo" error={profileForm.formState.errors.logo_url?.message}>
                <div className="grid gap-3">
                  {logoPreview ? (
                    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
                      <Image src={logoPreview} alt="Preview da logo" width={56} height={56} unoptimized className="h-14 w-14 rounded-lg border border-border object-cover" />
                      <Button type="button" variant="secondary" size="sm" onClick={() => profileForm.setValue("logo_url", "", { shouldDirty: true })}>Remover logo</Button>
                    </div>
                  ) : null}
                  <label className="flex min-h-12 cursor-pointer items-center justify-between gap-3 rounded-lg border border-border bg-background px-3 text-sm text-muted transition hover:border-gold-mid hover:text-text">
                    <span className="flex min-w-0 items-center gap-2">
                      <ImageUp size={16} className="shrink-0 text-gold" />
                      <span className="truncate">Escolher imagem da logo</span>
                    </span>
                    <span className="shrink-0 rounded-md border border-gold-mid bg-gold-soft px-2.5 py-1 text-xs font-semibold text-gold">Upload</span>
                    <input className="sr-only" type="file" accept="image/*" onChange={handleLogoUpload} />
                  </label>
                </div>
              </Field>
              <Button>Salvar perfil</Button>
            </form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Conta e aparencia</CardTitle></CardHeader>
          <CardContent className="grid gap-4 text-sm">
            <section className="grid gap-2">
              <SectionTitle icon={<Mail size={16} />} title="Conta" />
              <InfoRow label="E-mail da conta" value={accountEmail || "Carregando..."} />
              <div className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-medium text-text">Alterar senha</p>
                    <p className="mt-1 text-xs text-muted">Enviaremos um link seguro para o e-mail da conta.</p>
                  </div>
                  <Button type="button" variant="secondary" size="sm" onClick={sendPasswordReset}>Enviar link</Button>
                </div>
              </div>
            </section>

            <section className="grid gap-2">
              <SectionTitle icon={<ImageUp size={16} />} title="Aparencia" />
              <InfoRow label="Tema" value="Escuro padrao" />
              <InfoRow label="Logo" value={profile?.logo_url ? "Configurada" : "Nao configurada"} />
            </section>

            <section className="grid gap-2">
              <SectionTitle icon={<Smartphone size={16} />} title="Aplicativo" />
              <InfoRow label="PWA" value="Manifest e icone configurados" />
              <InfoRow label="Instalacao" value="Disponivel pelo navegador" />
            </section>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><div className="flex items-center justify-between gap-3"><CardTitle>Categorias de despesas</CardTitle><Button size="sm" onClick={() => openCategory()}><Plus size={15} />Criar categoria</Button></div></CardHeader>
        <CardContent className="grid gap-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-3">
              <div className="flex items-center gap-2"><strong>{category.nome}</strong><Badge variant={category.ativo ? "success" : "muted"}>{category.ativo ? "Ativa" : "Inativa"}</Badge></div>
              <div className="flex gap-2"><Button size="sm" variant="secondary" onClick={() => openCategory(category)}><Edit size={15} />Editar</Button><Button size="sm" variant={category.ativo ? "danger" : "secondary"} onClick={() => setCategoryToToggle(category)}><XCircle size={15} />{category.ativo ? "Inativar" : "Reativar"}</Button></div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Modal title={editingCategory ? "Editar categoria" : "Criar categoria"} open={categoryOpen} onOpenChange={setCategoryOpen}>
        <form className="grid gap-4" onSubmit={categoryForm.handleSubmit(saveCategory)}>
          <Field label="Nome" error={categoryForm.formState.errors.nome?.message}><Input {...categoryForm.register("nome")} /></Field>
          <Button>Salvar</Button>
        </form>
      </Modal>
      <ConfirmModal
        open={Boolean(categoryToToggle)}
        onOpenChange={(open) => !open && setCategoryToToggle(null)}
        title={categoryToToggle?.ativo ? "Tem certeza que deseja inativar esta categoria?" : "Tem certeza que deseja reativar esta categoria?"}
        description={categoryToToggle?.ativo ? "Ela nao sera apagada e as despesas antigas continuam preservadas." : "A categoria voltara a aparecer nos cadastros de despesas."}
        confirmLabel={categoryToToggle?.ativo ? "Inativar" : "Reativar"}
        onConfirm={() => categoryToToggle && toggleCategory(categoryToToggle)}
      />
    </div>
  );
}

function SectionTitle({ icon, title }: { icon: ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 text-sm font-semibold text-gold">
      {icon}
      {title}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_minmax(120px,auto)] items-center gap-4 rounded-lg border border-border bg-background p-3">
      <span className="min-w-0 text-muted">{label}</span>
      <strong className="min-w-0 break-words text-right text-text">{value}</strong>
    </div>
  );
}

function resizeLogo(file: File) {
  return new Promise<string>((resolve, reject) => {
    const image = new window.Image();
    const url = URL.createObjectURL(file);

    image.onload = () => {
      const canvas = document.createElement("canvas");
      const size = 160;
      const scale = Math.max(size / image.width, size / image.height);
      const width = image.width * scale;
      const height = image.height * scale;
      const x = (size - width) / 2;
      const y = (size - height) / 2;
      const context = canvas.getContext("2d");

      canvas.width = size;
      canvas.height = size;

      if (!context) {
        URL.revokeObjectURL(url);
        reject(new Error("Canvas indisponivel"));
        return;
      }

      context.fillStyle = "#0A0A0A";
      context.fillRect(0, 0, size, size);
      context.drawImage(image, x, y, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/webp", 0.82));
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Imagem invalida"));
    };

    image.src = url;
  });
}
