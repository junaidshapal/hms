import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
      <Skeleton className="h-4 w-32" />
      <Card className="mt-4">
        <CardHeader>
          <div className="flex items-start gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="mt-2 h-3 w-2/3" />
        </CardContent>
      </Card>
      <div className="mt-8 space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-4 w-32" />
              <div className="flex flex-wrap gap-2">
                {Array.from({ length: 6 }).map((_, j) => (
                  <Skeleton key={j} className="h-8 w-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
