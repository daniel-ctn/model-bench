import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:py-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  children,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description ? (
          <p className="text-muted-foreground max-w-2xl text-sm">
            {description}
          </p>
        ) : null}
      </div>
      {children ? (
        <div className="flex flex-wrap items-center gap-2">{children}</div>
      ) : null}
    </div>
  );
}
