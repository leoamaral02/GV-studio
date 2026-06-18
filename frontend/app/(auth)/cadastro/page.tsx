"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signupSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";
import { normalizePhone } from "@/lib/utils";

type FormData = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const supabase = createClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(signupSchema) });

  async function onSubmit(values: FormData) {
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: {
          nome_profissional: values.nome_profissional,
          nome_salao: values.nome_salao ?? "",
          whatsapp: normalizePhone(values.whatsapp)
        }
      }
    });

    if (error) {
      toast.error(error.message.includes("registered") ? "E-mail ja cadastrado" : "Nao foi possivel salvar");
      return;
    }

    if (data.user) {
      await supabase.from("profiles").upsert({
        id: data.user.id,
        nome_profissional: values.nome_profissional,
        nome_salao: values.nome_salao || null,
        whatsapp: normalizePhone(values.whatsapp)
      });
      await supabase.rpc("create_default_records");
    }

    toast.success("Cadastro realizado com sucesso");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Criar conta</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="Nome da profissional" error={errors.nome_profissional?.message}><Input {...register("nome_profissional")} /></Field>
          <Field label="Nome do salao" error={errors.nome_salao?.message}><Input {...register("nome_salao")} /></Field>
          <Field label="WhatsApp" error={errors.whatsapp?.message}><Input inputMode="tel" {...register("whatsapp")} /></Field>
          <Field label="E-mail" error={errors.email?.message}><Input type="email" autoComplete="email" {...register("email")} /></Field>
          <Field label="Senha" error={errors.password?.message}><Input type="password" autoComplete="new-password" {...register("password")} /></Field>
          <Field label="Confirmar senha" error={errors.confirmPassword?.message}><Input type="password" autoComplete="new-password" {...register("confirmPassword")} /></Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Criando..." : "Criar conta"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          Ja tem conta? <Link href="/login" className="text-gold hover:underline">Entrar</Link>
        </p>
      </CardContent>
    </Card>
  );
}
