"use client";

import { useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { niceTicks } from "@/lib/chart-scale";
import type { MonthlyTrend, TrendPoint } from "@/lib/monthly-trend";
import { formatPaise } from "@/lib/money";
import { button } from "@/lib/ui";

const CHART_HEIGHT = 240;
const LABEL_WIDTH = 82; // room for the right-most value label, which ends at the last point

// Axis ticks only: ₹10K, ₹1.5L. Exact values are in the labels, tooltip and table.
const compact = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

type DotProps = { cx?: number; cy?: number; index?: number };

function ChartTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: readonly { payload?: TrendPoint }[];
}) {
  const point = active ? payload?.[0]?.payload : undefined;
  if (!point) return null;

  return (
    <div
      data-testid="trend-tooltip"
      className="rounded-md bg-white px-3 py-2 text-sm shadow-md ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700"
    >
      <p className="font-semibold text-zinc-950 dark:text-zinc-50">
        {formatPaise(point.amount)}
      </p>
      <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
        <span
          aria-hidden="true"
          className="inline-block h-0.5 w-3"
          style={{ background: "var(--viz-series-1)" }}
        />
        <span>
          {point.longLabel}
          {point.isCurrent ? " · so far" : ""}
        </span>
      </p>
    </div>
  );
}

// A line with an area wash for the monthly total. The latest month is still in
// progress, so its marker is hollow; the tooltip and the note below say so too.
// Only the latest point and the peak carry a value label: the axis, tooltip and
// table view carry the rest.
export function TrendChart({ trend }: { trend: MonthlyTrend }) {
  const [showTable, setShowTable] = useState(false);
  const { points, peakIndex, total } = trend;
  const last = points.length - 1;
  // Round numbers from zero up to just past the peak: 0 / 5K / 10K / 15K.
  const ticks = niceTicks(trend.max);
  const current = points.find((p) => p.isCurrent);

  // A peak label next to the latest label would collide, so it is left to the
  // tooltip and table in that case.
  const showPeakLabel = peakIndex >= 0 && peakIndex < last - 1;

  const summary = `Monthly spending, last ${points.length} months: ${points
    .map((p) => `${p.longLabel} ${formatPaise(p.amount)}${p.isCurrent ? " so far" : ""}`)
    .join(", ")}.`;

  const renderDot = (props: DotProps) => {
    const { cx, cy, index } = props;
    if (cx === undefined || cy === undefined || index === undefined) return <g />;
    const hollow = points[index]?.isCurrent;
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={5}
        fill={hollow ? "var(--viz-surface)" : "var(--viz-series-1)"}
        stroke={hollow ? "var(--viz-series-1)" : "var(--viz-surface)"}
        strokeWidth={2}
      />
    );
  };

  const renderLabel = (props: {
    x?: number | string;
    y?: number | string;
    index?: number;
    value?: unknown;
  }) => {
    const { x, y, index, value } = props;
    if (index === undefined || x === undefined || y === undefined) return null;
    const isLast = index === last;
    if (!isLast && !(showPeakLabel && index === peakIndex)) return null;
    return (
      <text
        key={`label-${index}`}
        x={Number(x)}
        y={Number(y) - 12}
        textAnchor={isLast ? "end" : "middle"}
        fontSize={12}
        fontWeight={600}
        style={{ fill: "var(--viz-text-primary)" }}
      >
        {formatPaise(Number(value))}
      </text>
    );
  };

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
        <table data-testid="trend-table" className="mt-3 w-full text-sm">
          <caption className="sr-only">Monthly spending, last {points.length} months</caption>
          <thead>
            <tr className="border-b border-zinc-200 text-left text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800">
              <th scope="col" className="py-2 pr-3 font-medium">
                Month
              </th>
              <th scope="col" className="py-2 text-right font-medium">
                Spent
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-900">
            {points.map((point) => (
              <tr key={point.month} data-testid="trend-table-row">
                <th scope="row" className="py-2 pr-3 text-left font-medium">
                  {point.longLabel}
                  {point.isCurrent ? (
                    <span className="ml-2 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      so far
                    </span>
                  ) : null}
                </th>
                <td className="py-2 text-right tabular-nums">
                  {formatPaise(point.amount)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-zinc-300 font-semibold dark:border-zinc-700">
              <th scope="row" className="py-2 pr-3 text-left">
                Total, {points.length} months
              </th>
              <td className="py-2 text-right tabular-nums">{formatPaise(total)}</td>
            </tr>
          </tfoot>
        </table>
      ) : (
        <div
          role="img"
          aria-label={summary}
          data-testid="trend-figure"
          className="mt-1 w-full"
          style={{ height: CHART_HEIGHT }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={points}
              margin={{ top: 24, right: 14, bottom: 4, left: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--viz-grid)" />
              <XAxis
                dataKey="label"
                tickLine={false}
                interval={0}
                axisLine={{ stroke: "var(--viz-baseline)" }}
                tick={{ fill: "var(--viz-text-secondary)", fontSize: 12 }}
              />
              <YAxis
                width={LABEL_WIDTH - 30}
                tickLine={false}
                axisLine={false}
                domain={[0, ticks[ticks.length - 1]]}
                ticks={ticks}
                tickFormatter={(value) => compact.format(Number(value) / 100)}
                tick={{ fill: "var(--viz-text-secondary)", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ stroke: "var(--viz-baseline)", strokeWidth: 1 }}
                content={<ChartTooltip />}
                isAnimationActive={false}
              />
              <Area
                type="linear"
                dataKey="amount"
                stroke="var(--viz-series-1)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="var(--viz-series-1)"
                fillOpacity={0.1}
                dot={renderDot}
                activeDot={{
                  r: 6,
                  fill: "var(--viz-series-1)",
                  stroke: "var(--viz-surface)",
                  strokeWidth: 2,
                }}
                isAnimationActive={false}
              >
                <LabelList dataKey="amount" content={renderLabel} />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {current ? (
        <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
          {current.longLabel} is still in progress: {formatPaise(current.amount)}{" "}
          so far.
        </p>
      ) : null}
    </div>
  );
}
