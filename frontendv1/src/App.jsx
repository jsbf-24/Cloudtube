import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Auth from './pages/Auth';
import Home from './pages/Home';
import Player from './pages/Player';
import Profile from './pages/Profile';
import './site.css';

export default function App() {
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      <nav className="topbar">
        <Link className="brand" to="/" aria-label="CloudTube, inicio">
          <span className="brand-mark">▶</span>
          <span>cloud<span className="brand-accent">tube</span></span>
        </Link>
        <div className="nav-links">
          <Link className="nav-link" to="/">Explorar</Link>
        {user ? (
          <>
            <Link className="nav-link" to="/profile">Mi canal</Link>
            <button className="nav-button" onClick={logout}>Cerrar sesión</button>
          </>
        ) : (
          <Link className="nav-button nav-button-primary" to="/auth">Iniciar sesión</Link>
        )}
        </div>
      </nav>

      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route path="/watch/:id" element={<Player />} />
          <Route path="/profile" element={<Profile user={user} />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}