import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-2 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <Card className="mt-6">
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
