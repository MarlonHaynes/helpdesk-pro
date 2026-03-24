import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

export default function PageLayout() {
  return (
    <>
      <Navbar />
      <main className="app-main">
        <div className="page-shell">
          <Outlet />
        </div>
      </main>
    </>
  );
}