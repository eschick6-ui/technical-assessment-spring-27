export default function TransitFilters({
    categories,
    selectedCategories,
    onToggle,
    onSelectAll,
    onClearAll,
    totalVehicles,
    visibleVehicles,
    loading,
    error,
    searchQuery,
    onSearchChange,
    matchingRouteCount
}) {

    return (
        <div className="filter-panel">

            {/* Filter header */}
            <div className="filter-header">

                <div>
                    <h3>Filter Transit Lines</h3>

                    <p>
                        Choose which transit lines appear on the live map.
                    </p>
                </div>

                <span className="filter-selection-count">
                    {selectedCategories.length} of {categories.length} selected
                </span>

            </div>

            {/* Route loading and error information */}
            {loading && (
                <p className="filter-message">
                    Loading route information...
                </p>
            )}

            {error && (
                <p className="filter-message" role="alert">
                    Unable to load the complete route list.
                    Using available vehicle route information.
                </p>
            )}

            {/* Individual transit category buttons */}
            <div className="filter-options">

                {categories.map((category) => {

                    const isSelected = selectedCategories.includes(
                        category.id
                    );

                    return (
                        <button
                            key={category.id}
                            type="button"
                            className={`filter-chip ${
                                isSelected ? "selected" : ""
                            }`}
                            style={{
                                "--line-color": category.color
                            }}
                            aria-pressed={isSelected}
                            onClick={() => onToggle(category.id)}
                        >

                            <span className="filter-dot" />

                            <span>{category.name}</span>

                            <span
                                className="filter-indicator"
                                aria-hidden="true"
                            >
                                {isSelected ? "✓" : "+"}
                            </span>

                        </button>
                    );

                })}

            </div>

            {/* Route search */}
            <div className="route-search">

                <label
                    className="route-search-label"
                    htmlFor="route-search-input"
                >
                    Search Routes
                </label>

                <div className="route-search-input-wrapper">

                    {/* Search icon */}
                    <svg
                        className="route-search-icon"
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                    >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21 -4.35 -4.35" />
                    </svg>

                    {/* Search input */}
                    <input
                        id="route-search-input"
                        type="search"
                        className="route-search-input"
                        placeholder="Search by route name or number..."
                        value={searchQuery}
                        onChange={(event) =>
                            onSearchChange(event.target.value)
                        }
                    />

                    {/* Clear search button */}
                    {searchQuery && (
                        <button
                            type="button"
                            className="route-search-clear"
                            aria-label="Clear route search"
                            onClick={() => onSearchChange("")}
                        >
                            ×
                        </button>
                    )}

                </div>

                {/* Search feedback */}
                {searchQuery.trim() && (
                    <p
                        className="route-search-feedback"
                        aria-live="polite"
                    >
                        {matchingRouteCount === 0
                            ? "No matching routes found."
                            : `${matchingRouteCount} matching ${
                                matchingRouteCount === 1 ? "route" : "routes"
                            }`}
                    </p>
                )}

            </div>

            {/* Filter controls and vehicle count */}
            <div className="filter-footer">

                <div className="filter-actions">

                    <button
                        type="button"
                        className="filter-action-button"
                        onClick={onSelectAll}
                    >
                        Select All
                    </button>

                    <button
                        type="button"
                        className="filter-action-button"
                        onClick={onClearAll}
                    >
                        Clear All
                    </button>

                </div>

                <span className="filter-vehicle-count">
                    Showing {visibleVehicles} of {totalVehicles} vehicles
                </span>

            </div>

        </div>
    );
}