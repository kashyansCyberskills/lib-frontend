import { NavLink, useNavigate } from "react-router-dom";
import { clearSession, isStaff } from "./api";

function NavBar({ user }) {
      const navigate = useNavigate();

      function logout() {
            clearSession();
            navigate("/");
      }

      return (
            <header className="topbar">
                  <span className="wordmark">Library</span>
                  <nav>
                        <NavLink to="/home">Dashboard</NavLink>
                        <NavLink to="/books">Books</NavLink>
                        <NavLink to="/borrow">{isStaff(user) ? "Borrowing" : "My books"}</NavLink>
                        {isStaff(user) && <NavLink to="/members">Members</NavLink>}
                  </nav>
                  <div className="who">
                        <span>{user.name} <small>({user.role.toLowerCase()})</small></span>
                        <button className="link" onClick={logout}>Sign out</button>
                  </div>
            </header>
      );
}

export default NavBar;
