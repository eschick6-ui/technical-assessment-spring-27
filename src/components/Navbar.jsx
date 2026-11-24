import { NavLink } from "react-router-dom";

export default function Navbar() {
    return (
        <header className="navbar">

            <NavLink to="/" className="brand">
                <div className="brand-logo">T</div>

                <div className="brand-text">
                    <span className="brand-title">
                        Chaos Meter
                    </span>

                    <span className="brand-subtitle">
                        Boston Transit
                    </span>
                </div>
            </NavLink>

            <nav className="nav-links" aria-label="Main navigation">

                <NavLink to="/" end>
                    Live Map
                </NavLink>

                <NavLink to="/alerts">
                    Service Alerts
                </NavLink>

                <NavLink to="/analytics">
                    Analytics
                </NavLink>

                <NavLink to="/commute">
                    My Commute
                </NavLink>

            </nav>

        </header>
    );
}