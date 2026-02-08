import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { getSupabase } from "./lib/supabase";
import { getCachedProfile, setCachedProfile, clearCachedProfile } from "./lib/profileCache";

import Login from "./pages/Login";
import ConnectWallet from "./pages/ConnectWallet";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";

function App() {
  const supabase = getSupabase();
  const { ready, authenticated } = usePrivy();
  const { wallets } = useWallets();

  const [session, setSession] = useState(undefined);
  const [profile, setProfile] = useState(getCachedProfile());
  const [role, setRole] = useState(
    localStorage.getItem("role") || "buyer"
  );

  useEffect(() => {
    localStorage.setItem("role", role);
  }, [role]);

  const walletAddress = wallets?.[0]?.address;

  /* -----------------------------
     Supabase session tracking
  ------------------------------ */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setSession(session ?? null);
      if (!session) {
        clearCachedProfile();
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  /* -----------------------------
     Fetch + cache profile ONCE
  ------------------------------ */
  useEffect(() => {
    if (!session || !authenticated || !walletAddress || profile) return;

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("wallet_address", walletAddress)
        .single();

      if (error) {
        console.error("Failed to load profile", error);
        return;
      }

      setCachedProfile(data);
      setProfile(data);
    };

    loadProfile();
  }, [session, authenticated, walletAddress]);

  if (!ready || session === undefined) return <p>Loading…</p>;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={!session ? <Login /> : <Navigate to="/connect-wallet" />}
        />

        <Route
          path="/connect-wallet"
          element={
            session && !authenticated
              ? <ConnectWallet />
              : <Navigate to="/dashboard" />
          }
        />

        <Route
          path="/dashboard"
          element={
            session && authenticated && profile
              ? <Dashboard profile={profile} role={role} setRole={setRole} />

              : <Navigate to="/login" />
          }
        />

        <Route
          path="/orders"
          element={
            session && authenticated && profile
              ? <Orders profileId={profile.id} role={role} />
              : <Navigate to="/login" />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;