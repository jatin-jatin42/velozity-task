import { NavLink, Outlet } from "react-router-dom";
import { NotificationBell } from "../components/NotificationBell";
import { useAuth } from "../contexts/AuthContext";

const navByRole = {
  ADMIN: [
    { to: "/", label: "Dashboard" },
    { to: "/clients", label: "Clients" },
    { to: "/projects", label: "Projects" },
    { to: "/activity", label: "Activity" }
  ],
  PROJECT_MANAGER: [
    { to: "/", label: "Dashboard" },
    { to: "/projects", label: "Projects" },
    { to: "/activity", label: "Activity" }
  ],
  DEVELOPER: [
    { to: "/", label: "Dashboard" },
    { to: "/my-tasks", label: "My Tasks" }
  ]
};

export const ShellLayout = () => {
  const { user, logout } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="shell">
      <aside className="sidebar">
        <div>
          <p className="eyebrow">Velozity</p>
          <h1>Realtime Ops</h1>
        </div>
        <nav className="nav-links">
          {navByRole[user.role].map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__footer">
          <p>{user.name}</p>
          <span>{user.roleLabel}</span>
        </div>
      </aside>
      <main className="content">
        <header className="topbar">
          <div>
            <p className="eyebrow">Internal dashboard</p>
            <h2>Agency project visibility without refreshes</h2>
          </div>
          <div className="topbar__actions">
            <NotificationBell />
            <button type="button" className="ghost-button" onClick={() => void logout()}>
              Logout
            </button>
          </div>
        </header>
        <Outlet />
      </main>
    </div>
  );
};
