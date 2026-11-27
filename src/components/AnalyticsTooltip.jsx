// Display information about the selected chart data point
export default function AnalyticsTooltip({
    active,
    payload,
    valueLabel
}) {

    // Do not display the tooltip unless a data point is selected
    if (!active || !payload?.length) {
        return null;
    }

    // Retrieve the selected data point
    const data = payload[0].payload;

    return (
        <div className="analytics-tooltip">

            <div className="analytics-tooltip-title">

                <span
                    className="analytics-tooltip-dot"
                    style={{ backgroundColor: data.color }}
                />

                <strong>{data.name}</strong>

            </div>

            <p>
                {valueLabel}:{" "}
                <strong>{payload[0].value}</strong>
            </p>

        </div>
    );
}