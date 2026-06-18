"use client";

import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { resetSchema } from "@/lib/schemas";
import { createClient } from "@/lib/supabase/client";

type FormData = z.infer<typeof resetSchema>;

export default function ResetPage() {
  const supabase = createClient();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({ resolver: zodResolver(resetSchema) });

  async function onSubmit(values: FormData) {
    await supabase.auth.resetPasswordForEmail(values.email, { redirectTo: `${location.origin}/login` });
    toast.success("Se este e-mail estiver cadastrado, enviaremos as instrucoes.");
  }

  return (
    <Card>
      <CardHeader><CardTitle>Recuperar senha</CardTitle></CardHeader>
      <CardContent>
        <form className="grid gap-4" onSubmit={handleSubmit(onSubmit)}>
          <Field label="E-mail" error={errors.email?.message}><Input type="email" {...register("email")} /></Field>
          <Button disabled={isSubmitting}>{isSubmitting ? "Enviando..." : "Enviar instrucoes"}</Button>
        </form>
        <p className="mt-5 text-center text-sm text-muted">
          <Link href="/login" className="text-gold hover:underline">Voltar para login</Link>
        </p>
      </CardContent>
    </Card>
  );
}
