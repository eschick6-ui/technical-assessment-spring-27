export default function LiveMap() {
    return (
        <section className="page">

            <div className="page-header">
                <h1>Boston, what's the chaos today?</h1>

                <p>
                    Bringing order to Boston's daily transit chaos
                    with real-time MBTA data.
                </p>
            </div>

            <div className="transit-colors">
                <span className="line-red"></span>
                <span className="line-orange"></span>
                <span className="line-blue"></span>
                <span className="line-green"></span>
                <span className="line-purple"></span>
                <span className="line-silver"></span>
            </div>

            <div className="placeholder map-placeholder">
                <h2>Live Transit Map</h2>
                <p>Interactive vehicle tracking coming soon.</p>
            </div>

        </section>
    );
}