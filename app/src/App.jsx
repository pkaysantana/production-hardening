import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { usePrivy } from '@privy-io/react-auth';
import { useEffect, useState } from 'react'
import { getSupabase } from './lib/supabase'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Orders from './pages/Orders'
import OrderDetail from './pages/OrderDetail'

function App() {
  const { ready, authenticated } = usePrivy();

  if (!ready) return <p>Loading…</p>

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route
          path="/login"
          element={!authenticated ? <Login /> : <Navigate to="/dashboard" />}
        />

        <Route
          path="/dashboard"
          element={authenticated ? <Dashboard /> : <Navigate to="/login" />}
        />

        <Route
          path="/orders"
          element={authenticated ? <Orders /> : <Navigate to="/login" />}
        />

        <Route
          path="/orders/:id"
          element={authenticated ? <OrderDetail /> : <Navigate to="/login" />}
        />
      </Routes>
    </BrowserRouter>
  )
}
export default App