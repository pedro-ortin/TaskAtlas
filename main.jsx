import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import TaskAtlas from "./TaskAtlas.jsx";
import Login from "./Login.jsx";
import { supabase } from "./supabaseClient.js";

function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return null; // cargando sesión

  return session ? <TaskAtlas /> : <Login />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
