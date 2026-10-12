import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./Login";
import Register from "./Register";
import Dashboard from "./Dashboard";
import Books from "./Books";
import Members from "./Members";
import Borrow from "./Borrow";
import NavBar from "./NavBar";
import { getUser, isStaff } from "./api";

// Pages behind the login. staffOnly pages bounce members back to the dashboard.
function Protected({ children, staffOnly = false }) {
  const user = getUser();
  if (!user || !localStorage.getItem("token")) {
    return <Navigate to="/" replace />;
  }
  if (staffOnly && !isStaff(user)) {
    return <Navigate to="/home" replace />;
  }
  return (
    <>
      <NavBar user={user} />
      <main className="page">{children}</main>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={<Protected><Dashboard /></Protected>} />
        <Route path="/books" element={<Protected><Books /></Protected>} />
        <Route path="/borrow" element={<Protected><Borrow /></Protected>} />
        <Route path="/members" element={<Protected staffOnly><Members /></Protected>} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
export default App;
