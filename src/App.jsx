import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";

import LiveMap from "./pages/LiveMap.jsx";
import ServiceAlerts from "./pages/ServiceAlerts.jsx";
// Load the Analytics page only when it is needed
const Analytics = lazy(() => import("./pages/Analytics"));
import MyCommute from "./pages/MyCommute.jsx";

import "./App.css";

export default function App() {
    return (
        <div className="app">

            <Navbar />

            <main className="main-content">

                <Routes>

                    <Route
                        path="/"
                        element={<LiveMap />}
                    />

                    <Route
                        path="/alerts"
                        element={<ServiceAlerts />}
                    />

                    <Route
                        path="/analytics"
                        element={
                            <Suspense
                                fallback={
                                    <section className="page">
                                        <p className="page-loading">
                                            Loading analytics...
                                        </p>
                                    </section>
                                }
                            >
                                <Analytics />
                            </Suspense>
                        }
                    />

                    <Route
                        path="/commute"
                        element={<MyCommute />}
                    />

                    <Route
                        path="*"
                        element={<h1>Page not found</h1>}
                    />

                </Routes>

            </main>

            <footer className="footer">
                Powered by MBTA V3 API | Boston Transit Chaos Meter
            </footer>

        </div>
    );
}