import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from "recharts";
import { format, parseISO } from "date-fns";
import type { AccuracyTrend } from "./hooks/useMLAnalytics";

interface PredictionAccuracyChartProps {
  data?: AccuracyTrend;
  isLoading: boolean;
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
  return (
    <div className="bg-white p-3 border rounded-lg shadow-lg">
      <p className="font-medium text-sm">{format(parseISO(data.date), "MMM d, yyyy")}</p>
      <p className="text-blue-600 text-sm mt-1">
        Accuracy: <span className="font-semibold">{data.accuracy.toFixed(1)}%</span>
      </p>
      <p className="text-purple-600 text-sm">
        Confidence: <span className="font-semibold">{(data.confidence * 100).toFixed(0)}%</span>
      </p>
      <p className="text-gray-500 text-sm">
        Samples: <span className="font-semibold">{data.samples}</span>
      </p>
    </div>
  );
}

export function PredictionAccuracyChart({ data, isLoading }: PredictionAccuracyChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64 mt-1" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = data?.trend.map(point => ({
    ...point,
    date: point.date,
    upperBound: Math.min(100, point.accuracy + (1 - point.confidence) * 10),
    lowerBound: Math.max(0, point.accuracy - (1 - point.confidence) * 10),
  })) ?? [];

  const summary = data?.summary;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Prediction Accuracy Trend</CardTitle>
            <CardDescription>Daily accuracy with confidence bands</CardDescription>
          </div>
          {summary && (
            <div className="flex gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-500">Average</p>
                <p className="font-semibold text-blue-600">{summary.avgAccuracy}%</p>
              </div>
              <div className="text-center">
                <p className="text-gray-500">Target</p>
                <p className="font-semibold text-emerald-600">{summary.targetAccuracy}%</p>
              </div>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No prediction data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => format(parseISO(value), "MMM d")}
              />
              <YAxis
                domain={[60, 100]}
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => `${value}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={85} stroke="#10B981" strokeDasharray="5 5" label={{ value: "Target 85%", position: "right", fontSize: 11, fill: "#10B981" }} />
              <ReferenceLine y={80} stroke="#F59E0B" strokeDasharray="3 3" opacity={0.5} />
              <Area
                type="monotone"
                dataKey="accuracy"
                stroke="none"
                fill="url(#accuracyGradient)"
              />
              <Line
                type="monotone"
                dataKey="accuracy"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: "#3B82F6", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, strokeWidth: 0, fill: "#2563EB" }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
