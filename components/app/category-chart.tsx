"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  formatTenths,
  type BreakdownRow,
  type CategoryBreakdown,
} from "@/lib/category-breakdown";
import { formatPaise } from "@/lib/money";
import { button } from "@/lib/ui";

const BAR_SIZE = 20; // thin marks: 24px at most
const ROW_HEIGHT = 36; // a bar plus air around it
const CHAR_WIDTH = 7.2; // rough width of one 13px digit or letter

function shortName(name: string): string {
  return name.length > 14 ? `${name.slice(0, 13)}…` : name;
}

function fillFor(row: BreakdownRow): string {
  return row.isOther ? "var(--viz-other)" : "var(--viz-series-1)";
}

// Values lead and the name follows. The short line in front of the name is a key
// to the mark's colour. Text always uses text colours, never the series colour.
function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: BreakdownRow }[];
}) {
  const row = active ? payload?.[0]?.payload : undefined;
  if (!row) return null;

  return (
    <div
      data-testid="chart-tooltip"
      className="rounded-md bg-white px-3 py-2 text-sm shadow-md ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
    >
      <p className="font-semibold text-zinc-950 dark:text-zinc-50">
        {formatPaise(row.amount)}
      </p>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <span
          aria-hidden="true"
          className="inline-block h-0.5 w-3"
          style={{ background: fillFor(row) }}
        />
        <span>
          {row.name} · {formatTenths(row.tenths)}
          {row.isOther ? ` · ${row.count} categories` : ""}
        </span>
      </p>
    </div>
  );
}

// Ranked horizontal bars: one per category, largest first, all in one hue. The
// bar length carries the amount and the label carries the name, so colour is
// never needed to tell categories apart. Has a table view for the same numbers.
export function CategoryChart({
  monthLabel,
  breakdown,
}: {
  monthLabel: string;
  breakdown: CategoryBreakdown;
}) {
  const [showTable, setShowTable] = useState(false);
  const { rows, allRows, total } = breakdown;

  const labels = rows.map((row) => formatPaise(row.amount));
  const longestLabel = Math.max(...labels.map((label) => label.length));
  const longestName = Math.max(...rows.map((row) => shortName(row.name).length));
  const rightMargin = Math.ceil(longestLabel * CHAR_WIDTH) + 12;
  const nameWidth = Math.ceil(longestName * CHAR_WIDTH) + 16;
  const height = rows.length * ROW_HEIGHT + 12;

  const summary = `Spending by category for ${monthLabel}: ${rows
    .map((row) => `${row.name} ${formatPaise(row.amount)} (${formatTenths(row.tenths)})`)
    .join(", ")}.`;

  return (
    <div className="viz-root flex flex-1 flex-col">
      <div className="flex justify-end">
        <button
          type="button"
          aria-pressed={showTable}
          onClick={() => setShowTable((value) => !value)}
          className={button("secondary", "sm")}
        >
          {showTable ? "View as chart" : "View as table"}
        </button>
      </div>

      {showTable ? (
        <table
          data-testid="chart-table"
          className="mt-3 w-full text-sm"
        >
          <caption className="sr-only">
            Spending by category for {monthLabel}
          </caption>
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <th scope="col" className="py-2 pr-3 font-medium">
                Category
              </th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">
                Amount
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Share
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {allRows.map((row) => (
              <tr key={row.key} data-testid="chart-table-row">
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {row.name}
                </th>
                <td className="py-2 pr-3 text-right tabular-nums">
                  {formatPaise(row.amount)}
                </td>
                <td className="py-2 text-right tabular-nums text-zinc-600 dark:text-zinc-400">
                  {formatTenths(row.tenths)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-300 font-semibold dark:border-zinc-700">
              <th scope="row" className="py-2 pr-3 text-left">
                Total
              </th>
              <td className="py-2 pr-3 text-right tabular-nums">
                {formatPaise(total)}
              </td>
              <td className="py-2 text-right tabular-nums">100.0%</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <div
          role="img"
          aria-label={summary}
          data-testid="chart-figure"
          className="my-auto w-full"
          style={{ height }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rows}
              layout="vertical"
              margin={{ top: 6, right: rightMargin, bottom: 6, left: 0 }}
            >
              <XAxis type="number" hide domain={[0, "dataMax"]} />
              <YAxis
                type="category"
                dataKey="name"
                width={nameWidth}
                interval={0}
                tickLine={false}
                tickFormatter={shortName}
                axisLine={{ stroke: "var(--viz-baseline)" }}
                tick={{ fill: "var(--viz-text-secondary)", fontSize: 13 }}
              />
              <Tooltip
                cursor={{ fill: "var(--viz-hover)" }}
                content={<ChartTooltip />}
                isAnimationActive={false}
              />
              <Bar
                dataKey="amount"
                barSize={BAR_SIZE}
                minPointSize={3}
                radius={[0, 4, 4, 0]}
                isAnimationActive={false}
              >
                {rows.map((row) => (
                  <Cell key={row.key} fill={fillFor(row)} />
                ))}
                <LabelList
                  dataKey="amount"
                  position="right"
                  formatter={(value) => formatPaise(Number(value))}
                  style={{ fill: "var(--viz-text-primary)", fontSize: 12 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Total {formatPaise(total)}
        {rows.some((row) => row.isOther)
          ? ". Smaller categories are grouped as “All other”; the table lists each one."
          : "."}
      </p>
    </div>
  );
}
