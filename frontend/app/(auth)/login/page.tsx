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
import { loginSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";

type FormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: FormData) {
    const { error } = await supabase.auth.signInWithPassword({ email: values.email, password: values.password });
    if (error) {
      toast.error("E-mail ou senha invalidos");
      return;
    }
    toast.success("Login realizado com sucesso");
    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Entrar</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="E-mail" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Senha" error={errors.password?.message}>
            <Input type="password" autoComplete="current-password" {...register("password")} />
          </Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Entrando..." : "Entrar"}</Button>
        </form>
        <div className="mt-5 grid gap-2 text-center text-sm text-muted">
          <Link className="text-gold hover:underline" href="/cadastro">Criar conta</Link>
          <Link className="text-muted hover:text-text" href="/recuperar-senha">Esqueci minha senha</Link>
        </div>
      </CardContent>
    </Card>
  );
}
