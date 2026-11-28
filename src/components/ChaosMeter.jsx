export default function ChaosMeter({
    name,
    score,
    chaosLevel,
    chaosColor,
    color,
    vehicles,
    alerts,
    overall = false
}) {
    return (
        <div className={`chaos-meter ${overall ? "chaos-meter-overall" : ""}`}>

            {/* Transit category and chaos classification */}
            <div className="chaos-meter-header">
                <div className="chaos-meter-name">
                    {color && (
                        <span
                            className="chaos-transit-dot"
                            style={{ backgroundColor: color }}
                        />
                    )}

                    <h3>{name}</h3>
                </div>

                <span
                    className="chaos-level"
                    style={{ color: chaosColor }}
                >
                    {chaosLevel}
                </span>
            </div>

            {/* Numerical Chaos Score */}
            <div className="chaos-score">
                <span style={{ color: chaosColor }}>
                    {score}
                </span>
                <span className="chaos-score-max">/ 100</span>
            </div>

            {/* Visual representation of the Chaos Score */}
            <div
                className="chaos-progress-track"
                role="meter"
                aria-label={`${name} Chaos Score`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={score}
                aria-valuetext={`${score} out of 100, ${chaosLevel}`}
            >
                <div
                    className="chaos-progress-fill"
                    style={{
                        width: `${score}%`,
                        backgroundColor: chaosColor
                    }}
                />
            </div>

            {/* Minimum and maximum scale labels */}
            <div className="chaos-scale">
                <span>Calm</span>
                <span>Chaos</span>
            </div>

            {/* Supporting statistics */}
            <div className="chaos-meter-details">
                <span>
                    <strong>{vehicles}</strong> active vehicles
                </span>

                <span>
                    <strong>{alerts}</strong> active alerts
                </span>
            </div>
        </div>
    );
}