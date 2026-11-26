import { useState } from "react";

// Convert API values into readable text
function formatAlertText(value) {

    if (!value) {
        return "Unknown";
    }

    return value
        .toLowerCase()
        .replaceAll("_", " ")
        .replace(/\b\w/g, (character) =>
            character.toUpperCase()
        );

}

// Determine the severity classification of an alert
function getSeverityLevel(severity) {

    if (severity >= 7) {
        return "major";
    }

    if (severity >= 4) {
        return "moderate";
    }

    if (severity >= 2) {
        return "minor";
    }

    return "informational";

}

// Format timestamps using Boston's time zone
function formatAlertDate(value) {

    if (!value) {
        return "Unavailable";
    }

    return new Date(value).toLocaleString("en-US", {
        timeZone: "America/New_York",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
    });

}

export default function AlertCard({
    alert,
    routeLookup,
    affectedRouteIds,
    lastRefreshed
}) {

    // Track whether additional alert details are visible
    const [expanded, setExpanded] = useState(false);

    // Extract the alert's attributes
    const {
        header,
        description,
        severity,
        effect,
        cause,
        lifecycle,
        updated_at,
        active_period,
        url
    } = alert.attributes;

    // Determine the alert's severity classification
    const severityLevel = getSeverityLevel(severity);

    // Use the most recent successful refresh time
    const now = lastRefreshed.getTime();

    // Retrieve the currently active time period
    const currentPeriod = active_period?.find((period) =>
        (!period.start || new Date(period.start).getTime() <= now) &&
        (!period.end || new Date(period.end).getTime() > now)
    );

    return (
        <article className={`alert-card severity-${severityLevel}`}>

            {/* Alert effect and severity */}
            <div className="alert-card-top">

                <span className="alert-effect">
                    {formatAlertText(effect)}
                </span>

                <span className={`alert-severity ${severityLevel}`}>
                    {formatAlertText(severityLevel)} · {severity}/10
                </span>

            </div>

            {/* Affected transit routes */}
            <div className="alert-route-list">

                {affectedRouteIds.map((routeId) => {

                    const route = routeLookup[routeId];

                    const routeName =
                        route?.attributes?.short_name ||
                        route?.attributes?.long_name ||
                        routeId;

                    const routeColor = route?.attributes?.color
                        ? `#${route.attributes.color}`
                        : "#94A3B8";

                    return (
                        <span
                            key={routeId}
                            className="alert-route-label"
                        >
                            <span
                                className="alert-route-dot"
                                style={{
                                    backgroundColor: routeColor
                                }}
                            />

                            {routeName}

                        </span>
                    );

                })}

                {affectedRouteIds.length === 0 && (
                    <span className="alert-route-label">
                        No specific route provided
                    </span>
                )}

            </div>

            {/* Main alert headline */}
            <h3 className="alert-header">
                {header || "Service Alert"}
            </h3>

            {/* Expandable alert information */}
            <div
                className={`alert-details ${
                    expanded ? "expanded" : ""
                }`}
                aria-hidden={!expanded}
                inert={!expanded}
            >

                <div className="alert-details-inner">

                    {description && (
                        <p className="alert-description">
                            {description}
                        </p>
                    )}

                    <div className="alert-metadata">

                        <div>
                            <span>Cause</span>

                            <strong>
                                {formatAlertText(cause)}
                            </strong>
                        </div>

                        <div>
                            <span>Active Since</span>

                            <strong>
                                {formatAlertDate(currentPeriod?.start)}
                            </strong>
                        </div>

                        <div>
                            <span>Expected End</span>

                            <strong>
                                {currentPeriod
                                    ? currentPeriod.end
                                        ? formatAlertDate(currentPeriod.end)
                                        : "Not specified"
                                    : "Unavailable"}
                            </strong>
                        </div>

                        <div>
                            <span>Last Updated</span>

                            <strong>
                                {formatAlertDate(updated_at)}
                            </strong>
                        </div>

                    </div>

                    {url && /^https?:\/\//i.test(url) && (
                        <a
                            className="alert-more-info"
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            More information ↗
                        </a>
                    )}

                </div>

            </div>

            {/* Alert footer */}
            <div className="alert-card-footer">

                <span className="alert-lifecycle">
                    {formatAlertText(lifecycle)}
                </span>

                <button
                    type="button"
                    className="alert-details-toggle"
                    aria-expanded={expanded}
                    onClick={() => setExpanded(!expanded)}
                >

                    {expanded ? "Hide details" : "View details"}

                    <span
                        className={`alert-details-arrow ${
                            expanded ? "expanded" : ""
                        }`}
                        aria-hidden="true"
                    >
                        ▾
                    </span>

                </button>

            </div>

        </article>
    );

}