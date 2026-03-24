import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function PageLayout() {
  return (
    <div className="app-wrapper">
      <Navbar />
      <main className="app-main">
        <div className="page-shell">
          <Outlet />
        </div>
      </main>
    </div>
  );
}