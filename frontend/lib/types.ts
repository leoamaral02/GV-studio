export type Profile = {
  id: string;
  nome_profissional: string;
  nome_salao: string | null;
  whatsapp: string;
  logo_url: string | null;
};

export type Cliente = {
  id: string;
  user_id: string;
  nome: string;
  whatsapp: string;
  data_nascimento: string | null;
  observacoes: string | null;
  preferencias: string | null;
  alergias: string | null;
  ativo: boolean;
  created_at: string;
};

export type Servico = {
  id: string;
  user_id: string;
  nome: string;
  valor_padrao: number;
  tempo_estimado_minutos: number | null;
  descricao: string | null;
  ativo: boolean;
};

export type Atendimento = {
  id: string;
  user_id: string;
  cliente_id: string;
  servico_id: string;
  data: string;
  hora_inicio: string;
  hora_fim: string;
  duracao_minutos: number;
  valor_cobrado: number;
  forma_pagamento: string;
  observacoes: string | null;
  status: "realizado" | "cancelado";
  clientes?: Pick<Cliente, "nome" | "whatsapp"> | null;
  servicos?: Pick<Servico, "nome"> | null;
};

export type CategoriaDespesa = {
  id: string;
  user_id: string;
  nome: string;
  ativo: boolean;
};

export type Despesa = {
  id: string;
  user_id: string;
  categoria_id: string;
  descricao: string;
  valor: number;
  data: string;
  observacao: string | null;
  status: "ativa" | "cancelada";
  categorias_despesas?: Pick<CategoriaDespesa, "nome"> | null;
};
