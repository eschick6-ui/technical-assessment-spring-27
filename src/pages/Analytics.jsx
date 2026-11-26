import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Cell
} from "recharts";

// Temporary data for testing Recharts
const SAMPLE_DATA = [
    { line: "Red", vehicles: 24, color: "#DA291C" },
    { line: "Orange", vehicles: 18, color: "#ED8B00" },
    { line: "Blue", vehicles: 12, color: "#003DA5" },
    { line: "Green", vehicles: 48, color: "#00843D" },
];

export default function Analytics() {
    return (
        <section className="page">

            <div className="page-header">
                <h1>Analytics</h1>

                <p>
                    Explore the data behind Boston's transit system
                    and discover how chaotic your commute really is.
                </p>
            </div>

            {/* Temporary chart for testing Recharts */}
            <div className="analytics-chart-card">

                <h2>Active Vehicles by Transit Line</h2>

                <p>Number of active vehicles across the MBTA network.</p>

                <div className="analytics-chart">

                    <ResponsiveContainer width="100%" height="100%">

                        <BarChart data={SAMPLE_DATA}>

                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#334155"
                                vertical={false}
                            />

                            <XAxis
                                dataKey="line"
                                stroke="#94A3B8"
                                tick={{ fontSize: 12 }}
                            />

                            <YAxis
                                stroke="#94A3B8"
                                tick={{ fontSize: 12 }}
                                allowDecimals={false}
                            />

                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#19212E",
                                    border: "1px solid #334155",
                                    borderRadius: "8px"
                                }}
                                labelStyle={{
                                    color: "#F1F5F9"
                                }}
                                itemStyle={{
                                    color: "#F1F5F9"
                                }}
                                cursor={{
                                    fill: "rgba(255, 255, 255, 0.05)"
                                }}
                            />

                            <Bar
                                dataKey="vehicles"
                                name="Active Vehicles"
                                radius={[6, 6, 0, 0]}
                            >

                                {SAMPLE_DATA.map((entry) => (
                                    <Cell
                                        key={entry.line}
                                        fill={entry.color}
                                    />
                                ))}

                            </Bar>

                        </BarChart>

                    </ResponsiveContainer>

                </div>

            </div>

        </section>
    );
}