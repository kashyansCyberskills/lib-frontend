import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import api, { errorMessage, saveSession } from "./api";

function Login() {
      const navigate = useNavigate();
      const location = useLocation();
      const [loginUser, setLoginUser] = useState({
            email: "",
            password: ""
      });
      const [error, setError] = useState("");
      const [busy, setBusy] = useState(false);

      const handleChange = (e) => {
            setLoginUser({
                  ...loginUser,
                  [e.target.name]: e.target.value
            });
      };

      async function submit(e) {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
                  const response = await api.post("/members/login", loginUser);
                  saveSession(response.data);
                  navigate("/home");
            } catch (err) {
                  setError(errorMessage(err, "Could not reach the server. Is the backend running on port 8080?"));
            } finally {
                  setBusy(false);
            }
      }

      return (
            <div className="auth">
                  <h1 className="wordmark large">Library</h1>
                  <p className="muted">Sign in to browse the catalogue and manage your loans.</p>

                  {location.state?.registered && (
                        <p className="notice ok">Account created. Sign in with your new email and password.</p>
                  )}
                  {error && <p className="notice error" role="alert">{error}</p>}

                  <form onSubmit={submit}>
                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" autoComplete="username" required
                              value={loginUser.email} onChange={handleChange} />

                        <label htmlFor="password">Password</label>
                        <input id="password" type="password" name="password" autoComplete="current-password" required
                              value={loginUser.password} onChange={handleChange} />

                        <button type="submit" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
                  </form>
                  <p className="muted">
                        New here? <Link to="/register">Create an account</Link>
                  </p>
            </div>
      );
}

export default Login;
