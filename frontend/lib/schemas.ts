import { z } from "zod";
import { minutesBetween, normalizePhone } from "@/lib/utils";

const phone = z.string().min(10, "WhatsApp obrigatorio").refine((value) => normalizePhone(value).length >= 10, "WhatsApp invalido");

export const loginSchema = z.object({
  email: z.string().min(1, "E-mail obrigatorio").email("E-mail invalido"),
  password: z.string().min(1, "Senha obrigatoria")
});

export const signupSchema = z.object({
  nome_profissional: z.string().min(1, "Nome obrigatorio"),
  nome_salao: z.string().optional(),
  whatsapp: phone,
  email: z.string().min(1, "E-mail obrigatorio").email("E-mail invalido"),
  password: z.string().min(8, "Senha com minimo de 8 caracteres"),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  path: ["confirmPassword"],
  message: "As senhas precisam ser iguais"
});

export const resetSchema = z.object({
  email: z.string().min(1, "E-mail obrigatorio").email("E-mail invalido")
});

export const clienteSchema = z.object({
  nome: z.string().min(1, "Nome obrigatorio"),
  whatsapp: phone,
  data_nascimento: z.string().optional(),
  observacoes: z.string().optional(),
  preferencias: z.string().optional(),
  alergias: z.string().optional(),
  ativo: z.boolean().default(true)
});

export const servicoSchema = z.object({
  nome: z.string().min(1, "Nome obrigatorio"),
  valor_padrao: z.coerce.number().positive("Valor maior que zero"),
  tempo_estimado_minutos: z.coerce.number().positive("Tempo maior que zero").optional().or(z.literal("")),
  descricao: z.string().optional(),
  ativo: z.boolean().default(true)
});

export const atendimentoSchema = z.object({
  cliente_id: z.string().min(1, "Cliente obrigatorio"),
  servico_id: z.string().min(1, "Servico obrigatorio"),
  data: z.string().min(1, "Data obrigatoria"),
  hora_inicio: z.string().min(1, "Hora inicio obrigatoria"),
  hora_fim: z.string().min(1, "Hora fim obrigatoria"),
  valor_cobrado: z.coerce.number().min(0, "Valor invalido"),
  forma_pagamento: z.string().min(1, "Forma de pagamento obrigatoria"),
  observacoes: z.string().optional(),
  status: z.enum(["realizado", "cancelado"]).default("realizado")
}).refine((data) => minutesBetween(data.hora_inicio, data.hora_fim) > 0, {
  path: ["hora_fim"],
  message: "Hora fim deve ser maior que hora inicio"
});

export const despesaSchema = z.object({
  categoria_id: z.string().min(1, "Categoria obrigatoria"),
  descricao: z.string().min(1, "Descricao obrigatoria"),
  valor: z.coerce.number().positive("Valor maior que zero"),
  data: z.string().min(1, "Data obrigatoria"),
  observacao: z.string().optional(),
  status: z.enum(["ativa", "cancelada"]).default("ativa")
});

export const categoriaSchema = z.object({
  nome: z.string().min(1, "Nome obrigatorio"),
  ativo: z.boolean().default(true)
});

export const profileSchema = z.object({
  nome_profissional: z.string().min(1, "Nome obrigatorio"),
  nome_salao: z.string().optional(),
  whatsapp: phone,
  logo_url: z.string().optional()
});
