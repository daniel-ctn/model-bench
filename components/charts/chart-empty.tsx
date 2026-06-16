import { ChartSpline } from "lucide-react";

export function ChartEmpty({ message }: { message: string }) {
  return (
    <div className="text-muted-foreground flex h-[260px] flex-col items-center justify-center gap-2 text-center text-sm">
      <ChartSpline className="size-6 opacity-40" />
      <p className="max-w-[220px]">{message}</p>
    </div>
  );
}
