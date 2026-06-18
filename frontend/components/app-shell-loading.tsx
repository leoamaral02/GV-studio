import { Card, CardContent } from "@/components/ui/card";

export function AppShellLoading() {
  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted">Carregando dados...</p>
      </CardContent>
    </Card>
  );
}
