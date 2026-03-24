import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export const LoginPage = () => {
  const { login, status, user } = useAuth();
  const [email, setEmail] = useState("admin@velozity.dev");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);

  if (status === "authenticated" && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    try {
      await login(email, password);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Login failed.");
    }
  };

  return (
    <div className="login-page">
      <section className="login-card">
        <p className="eyebrow">Assignment build</p>
        <h1>Real-Time Project Dashboard</h1>
        <p>
          Sign in with one of the seeded users to test admin, project manager, and developer
          access.
        </p>
        <form className="stack" onSubmit={handleSubmit}>
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} />
          </label>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="error-text">{error}</p> : null}
          <button type="submit">Sign In</button>
        </form>
        <div className="seed-hint">
          <strong>Seeded password:</strong> `password123`
        </div>
      </section>
    </div>
  );
};
