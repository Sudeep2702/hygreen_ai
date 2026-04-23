import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({ values, color }: { values: number[]; color: string }) {
  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-10 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
