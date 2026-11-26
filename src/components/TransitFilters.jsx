import { useState, useEffect, useRef } from "react";
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
    matchingRouteCount,
    routeSuggestions,
    onRouteSelect,
    getRouteDisplayName
}) {
    // Track whether the route dropdown is open
    const [dropdownOpen, setDropdownOpen] = useState(false);

    // Track the suggestion highlighted by keyboard navigation
    const [activeIndex, setActiveIndex] = useState(-1);

    // Reference the entire search container
    const searchContainerRef = useRef(null);

    // Reference the search input
    const searchInputRef = useRef(null);

    // Update suggestions as the user types
    function handleInputChange(event) {

        onSearchChange(event.target.value);

        setDropdownOpen(true);

        setActiveIndex(-1);

    }

    // Select a route and close the dropdown
    function selectRoute(route) {

        onRouteSelect(route);

        setDropdownOpen(false);

        setActiveIndex(-1);

        searchInputRef.current?.focus();

    }

    // Clear the search query and restore available suggestions
    function clearSearch() {

        onSearchChange("");

        setActiveIndex(-1);

        setDropdownOpen(true);

        searchInputRef.current?.focus();

    }

    // Open or close the route dropdown
    function toggleDropdown() {

        setDropdownOpen(!dropdownOpen);

        setActiveIndex(-1);

    }

    // Close the dropdown when clicking outside the search container
    useEffect(() => {

        function handleOutsideClick(event) {

            if (
                searchContainerRef.current &&
                !searchContainerRef.current.contains(event.target)
            ) {

                setDropdownOpen(false);

                setActiveIndex(-1);

            }

        }

        document.addEventListener("pointerdown", handleOutsideClick);

        // Remove the event listener when the component unmounts
        return () => {

            document.removeEventListener(
                "pointerdown",
                handleOutsideClick
            );

        };

    }, []);

    // Support keyboard navigation through route suggestions
    function handleSearchKeyDown(event) {

        // Close the dropdown when Escape is pressed
        if (event.key === "Escape") {

            setDropdownOpen(false);

            setActiveIndex(-1);

            return;

        }

        // Open the dropdown and move down through suggestions
        if (event.key === "ArrowDown") {

            event.preventDefault();

            setDropdownOpen(true);

            setActiveIndex((previousIndex) =>
                Math.min(
                    previousIndex + 1,
                    routeSuggestions.length - 1
                )
            );

        }

        // Move up through suggestions
        else if (event.key === "ArrowUp") {

            event.preventDefault();

            setActiveIndex((previousIndex) =>
                Math.max(previousIndex - 1, 0)
            );

        }

        // Select the highlighted route when Enter is pressed
        else if (
            event.key === "Enter" &&
            dropdownOpen &&
            routeSuggestions[activeIndex]
        ) {

            event.preventDefault();

            selectRoute(routeSuggestions[activeIndex]);

        }

    }

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

            {/* Route search with autocomplete dropdown */}
            <div
                className="route-search"
                ref={searchContainerRef}
                onBlur={(event) => {
                    if (!event.currentTarget.contains(event.relatedTarget)) {
                        setDropdownOpen(false);
                        setActiveIndex(-1);
                    }
                }}
            >

                <label
                    className="route-search-label"
                    htmlFor="route-search-input"
                >
                    Search Routes
                </label>

                <div className="route-search-container">

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
                            ref={searchInputRef}
                            id="route-search-input"
                            type="search"
                            className="route-search-input"
                            placeholder="Search name or number..."
                            value={searchQuery}
                            autoComplete="off"
                            role="combobox"
                            aria-autocomplete="list"
                            aria-expanded={dropdownOpen}
                            aria-controls="route-suggestions"
                            aria-activedescendant={
                                dropdownOpen && routeSuggestions[activeIndex]
                                    ? `route-option-${activeIndex}`
                                    : undefined
                            }
                            onChange={handleInputChange}
                            onClick={() => setDropdownOpen(true)}
                            onKeyDown={handleSearchKeyDown}
                        />

                        {/* Clear search button */}
                        {searchQuery && (
                            <button
                                type="button"
                                className="route-search-clear"
                                aria-label="Clear route search"
                                onClick={clearSearch}
                            >
                                ×
                            </button>
                        )}

                        {/* Dropdown toggle */}
                        <button
                            type="button"
                            className="route-dropdown-toggle"
                            aria-label={
                                dropdownOpen
                                    ? "Close route suggestions"
                                    : "Open route suggestions"
                            }
                            aria-expanded={dropdownOpen}
                            aria-controls="route-suggestions"
                            onClick={toggleDropdown}
                        >
                            <svg
                                className={`route-dropdown-arrow ${
                                    dropdownOpen ? "expanded" : ""
                                }`}
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                aria-hidden="true"
                            >
                                <path d="m6 9 6 6 6-6" />
                            </svg>
                        </button>

                    </div>

                    {/* Route autocomplete suggestions */}
                    {dropdownOpen && (

                        <div className="route-dropdown">

                            <div className="route-dropdown-header">
                                {searchQuery.trim()
                                    ? "Matching routes"
                                    : "Available routes"}
                            </div>

                            <div
                                id="route-suggestions"
                                className="route-suggestion-list"
                                role="listbox"
                                aria-label="Route suggestions"
                            >

                                {routeSuggestions.map((route, index) => (

                                    <div
                                        key={route.id}
                                        id={`route-option-${index}`}
                                        role="option"
                                        aria-selected={activeIndex === index}
                                        className={`route-suggestion ${
                                            activeIndex === index ? "active" : ""
                                        }`}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onMouseDown={(event) =>
                                            event.preventDefault()
                                        }
                                        onClick={() => selectRoute(route)}
                                    >

                                        {/* Route color indicator */}
                                        <span
                                            className="route-suggestion-dot"
                                            style={{
                                                backgroundColor:
                                                    route.attributes.color
                                                        ? `#${route.attributes.color}`
                                                        : "#3388FF"
                                            }}
                                        />

                                        {/* Route display name */}
                                        <span className="route-suggestion-name">
                                            {getRouteDisplayName(route)}
                                        </span>

                                        <span
                                            className="route-suggestion-arrow"
                                            aria-hidden="true"
                                        >
                                            ↖
                                        </span>

                                    </div>

                                ))}

                            </div>

                            {/* No matching suggestions */}
                            {routeSuggestions.length === 0 && (
                                <p className="route-dropdown-empty">
                                    No matching routes found.
                                </p>
                            )}

                            {/* Indicate when more matching routes exist */}
                            {matchingRouteCount > routeSuggestions.length && (
                                <div className="route-dropdown-footer">
                                    Showing {routeSuggestions.length} of{" "}
                                    {matchingRouteCount} routes.
                                    Type to narrow your search.
                                </div>
                            )}

                        </div>

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