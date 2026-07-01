import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts"

export default function UptimeChart({ logs }) {
  if (!logs || logs.length === 0) return null

  const data = [...logs].reverse().map((log, i) => ({
    index: i + 1,
    ms: log.responseMs || 0,
    isUp: log.isUp,
    statusCode: log.statusCode,
    label: new Date(log.createdAt).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" }),
  }))

  const uptimePct = Math.round((data.filter((d) => d.isUp).length / data.length) * 100)

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Uptime: {uptimePct}%</span>
        <span className="text-xs text-muted-foreground">({data.filter((d) => d.isUp).length}/{data.length} checks ok)</span>
      </div>
      <ResponsiveContainer width="100%" height={120}>
        <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <XAxis dataKey="index" tick={false} axisLine={false} />
          <YAxis hide domain={[0, "dataMax + 500"]} />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const d = payload[0].payload
              return (
                <div className="bg-popover border rounded-lg px-3 py-2 text-xs shadow-md">
                  <p className={d.isUp ? "text-green-500" : "text-red-500"}>{d.isUp ? `OK ${d.statusCode}` : "DOWN"}</p>
                  <p className="text-muted-foreground">{d.ms}ms</p>
                  <p className="text-muted-foreground">{d.label}</p>
                </div>
              )
            }}
          />
          <Bar dataKey="ms" radius={[2, 2, 0, 0]}>
            {data.map((entry, i) => (
              <Cell key={i} fill={entry.isUp ? "#22c55e" : "#ef4444"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
