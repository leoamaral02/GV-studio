import { ClientePerfilClient } from "@/components/features/cliente-perfil-client";

export default async function ClientePerfilPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientePerfilClient clienteId={id} />;
}
