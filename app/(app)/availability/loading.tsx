import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:py-10">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-2 h-8 w-48" />
      <Skeleton className="mt-2 h-4 w-72" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <Card>
          <CardHeader className="space-y-2">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
