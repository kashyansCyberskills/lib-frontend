import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api, { errorMessage } from "./api";

function Register() {
      const navigate = useNavigate();
      const [registerUser, setRegisterUser] = useState({
            name: "",
            email: "",
            phone: "",
            password: ""
      });
      const [error, setError] = useState("");
      const [busy, setBusy] = useState(false);

      const handleChange = (e) => {
            setRegisterUser({
                  ...registerUser,
                  [e.target.name]: e.target.value
            });
      };

      async function submit(e) {
            e.preventDefault();
            setError("");
            setBusy(true);
            try {
                  await api.post("/members/register", registerUser);
                  navigate("/", { state: { registered: true } });
            } catch (err) {
                  setError(errorMessage(err, "Registration failed. Please try again."));
            } finally {
                  setBusy(false);
            }
      }

      return (
            <div className="auth">
                  <h1 className="wordmark large">Library</h1>
                  <p className="muted">Create a member account to borrow books.</p>

                  {error && <p className="notice error" role="alert">{error}</p>}

                  <form onSubmit={submit}>
                        <label htmlFor="name">Full name</label>
                        <input id="name" type="text" name="name" autoComplete="name" required
                              value={registerUser.name} onChange={handleChange} />

                        <label htmlFor="email">Email</label>
                        <input id="email" type="email" name="email" autoComplete="username" required
                              value={registerUser.email} onChange={handleChange} />

                        <label htmlFor="phone">Phone (optional)</label>
                        <input id="phone" type="tel" name="phone" autoComplete="tel"
                              value={registerUser.phone} onChange={handleChange} />

                        <label htmlFor="password">Password (at least 6 characters)</label>
                        <input id="password" type="password" name="password" autoComplete="new-password"
                              required minLength={6} value={registerUser.password} onChange={handleChange} />

                        <button type="submit" disabled={busy}>{busy ? "Creating account..." : "Create account"}</button>
                  </form>
                  <p className="muted">
                        Already a member? <Link to="/">Sign in</Link>
                  </p>
            </div>
      );
}

export default Register;
