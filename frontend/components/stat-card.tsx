import { Card, CardContent } from "@/components/ui/card";

export function StatCard({ label, value, tone = "gold" }: { label: string; value: string; tone?: "gold" | "green" | "red" | "blue" }) {
  const color = {
    gold: "text-gold",
    green: "text-success",
    red: "text-danger",
    blue: "text-info"
  }[tone];

  return (
    <Card>
      <CardContent>
        <p className="text-sm text-muted">{label}</p>
        <p className={`mt-2 text-2xl font-bold ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
