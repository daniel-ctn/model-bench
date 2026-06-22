import { type LucideIcon } from "lucide-react";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

/** A titled card used to frame charts, lists and tables across the app. */
export function SectionCard({
  title,
  description,
  eyebrow,
  icon: Icon,
  action,
  children,
  className,
  contentClassName,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small uppercase kicker above the title — the section's "voice". */
  eyebrow?: React.ReactNode;
  icon?: LucideIcon;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        {eyebrow || Icon ? (
          <div className="text-muted-foreground mb-1.5 flex items-center gap-1.5">
            {Icon ? <Icon className="size-3.5" /> : null}
            {eyebrow ? <span className="eyebrow">{eyebrow}</span> : null}
          </div>
        ) : null}
        <CardTitle className="text-base">{title}</CardTitle>
        {description ? <CardDescription>{description}</CardDescription> : null}
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent className={cn(contentClassName)}>{children}</CardContent>
    </Card>
  );
}
