import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AppLoading() {
  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-elevated" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-lg bg-elevated" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Card key={index}>
            <CardContent className="grid gap-3">
              <div className="h-4 w-24 animate-pulse rounded bg-elevated" />
              <div className="h-7 w-28 animate-pulse rounded bg-elevated" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader>
          <div className="h-5 w-36 animate-pulse rounded bg-elevated" />
        </CardHeader>
        <CardContent className="grid gap-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-14 animate-pulse rounded-lg bg-elevated" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
