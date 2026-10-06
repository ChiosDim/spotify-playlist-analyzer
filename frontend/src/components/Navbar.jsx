import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const linkClass = ({ isActive }) => `btn btn-ghost btn-sm ${isActive ? "btn-active" : ""}`;

export default function Navbar() {
  const { user, isAuthenticated, loginWithSpotify, logout } = useAuth();

  return (
    <div className="navbar bg-base-100 shadow-sm sticky top-0 z-50">
      <div className="navbar-start">
        <Link to="/" className="btn btn-ghost text-lg font-bold">
          <span className="text-primary">♪</span> Playlist Analyzer
        </Link>
      </div>

      <div className="navbar-center hidden lg:flex gap-1">
        {isAuthenticated && (
          <>
            <NavLink to="/dashboard" className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/analyze" className={linkClass}>
              Analyze
            </NavLink>
            <NavLink to="/duplicates" className={linkClass}>
              Duplicates
            </NavLink>
            <NavLink to="/compare" className={linkClass}>
              Compare
            </NavLink>
            <NavLink to="/similar-tracks" className={linkClass}>
              Similar Tracks
            </NavLink>
          </>
        )}
      </div>

      <div className="navbar-end gap-2">
        {isAuthenticated && user ? (
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
              {user.profileImage ? (
                <div className="w-9 rounded-full">
                  <img src={user.profileImage} alt={user.displayName} />
                </div>
              ) : (
                <div className="w-9 rounded-full bg-base-300 grid place-items-center text-sm font-bold">
                  {user.displayName?.[0] ?? "?"}
                </div>
              )}
            </div>
            <ul
              tabIndex={0}
              className="dropdown-content menu bg-base-100 rounded-box z-50 w-52 p-2 shadow"
            >
              <li className="px-3 py-1 text-xs text-base-content/60">{user.displayName}</li>
              <li>
                <button onClick={logout}>Log out</button>
              </li>
            </ul>
          </div>
        ) : (
          <button onClick={loginWithSpotify} className="btn btn-primary btn-sm">
            Log in with Spotify
          </button>
        )}
      </div>
    </div>
  );
}
