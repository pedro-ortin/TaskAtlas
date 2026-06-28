import { useState } from "react";
import { supabase } from "./supabaseClient";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError("Credenciales incorrectas");
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "#1a1410", fontFamily: "Inter, sans-serif"
    }}>
      <div style={{
        background: "#2a1f14", border: "1px solid #3d2b1a", borderRadius: 12,
        padding: "2.5rem 2rem", width: "100%", maxWidth: 360
      }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>◆</div>
          <h1 style={{ margin: 0, color: "#c4a882", fontSize: 22, fontWeight: 600 }}>Petrus</h1>
          <p style={{ margin: "4px 0 0", color: "#7a6a5a", fontSize: 13 }}>Task Atlas</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{
              padding: "10px 14px", borderRadius: 8, border: "1px solid #3d2b1a",
              background: "#1a1410", color: "#e8d5b7", fontSize: 14, outline: "none"
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{
              padding: "10px 14px", borderRadius: 8, border: "1px solid #3d2b1a",
              background: "#1a1410", color: "#e8d5b7", fontSize: 14, outline: "none"
            }}
          />
          {error && <p style={{ margin: 0, color: "#e07070", fontSize: 13 }}>{error}</p>}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 4, padding: "10px", borderRadius: 8, border: "none",
              background: "#8b6914", color: "#fff", fontSize: 14, fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
