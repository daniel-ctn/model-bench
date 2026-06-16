import { taskTypeLabels, failureTypeLabels } from "@/lib/constants";
import type { FailureType, TaskType } from "@/types";

export function FailureHeatmap({
  rows,
  cols,
  matrix,
}: {
  rows: FailureType[];
  cols: TaskType[];
  matrix: Map<string, number>;
}) {
  if (!rows.length || !cols.length) {
    return (
      <p className="text-muted-foreground text-sm">
        No failure patterns logged yet.
      </p>
    );
  }

  let max = 1;
  for (const v of matrix.values()) max = Math.max(max, v);

  return (
    <div className="scrollbar-thin overflow-x-auto">
      <table className="w-full border-separate border-spacing-1">
        <thead>
          <tr>
            <th className="sticky left-0 bg-card" />
            {cols.map((c) => (
              <th
                key={c}
                className="text-muted-foreground h-24 w-9 align-bottom text-xs font-normal"
              >
                <div className="flex h-full items-end justify-center">
                  <span className="origin-bottom-left translate-x-3 -rotate-45 whitespace-nowrap">
                    {taskTypeLabels[c]}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r}>
              <td className="text-muted-foreground bg-card sticky left-0 pr-2 text-right text-xs whitespace-nowrap">
                {failureTypeLabels[r]}
              </td>
              {cols.map((c) => {
                const count = matrix.get(`${r}::${c}`) ?? 0;
                const pct = count ? Math.round((count / max) * 80) + 12 : 0;
                return (
                  <td key={c} className="p-0">
                    <div
                      className="flex size-9 items-center justify-center rounded-md text-xs"
                      style={{
                        backgroundColor: count
                          ? `color-mix(in oklch, var(--destructive) ${pct}%, transparent)`
                          : "var(--muted)",
                        color:
                          pct > 50 ? "var(--destructive-foreground, white)" : undefined,
                      }}
                    >
                      {count || ""}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
