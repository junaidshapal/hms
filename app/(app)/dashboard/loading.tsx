import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-10">
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-64" />
      </div>
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Card key={i}>
            <CardContent className="p-5">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="mt-3 h-6 w-12" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}
