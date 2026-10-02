import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const endpoint = isLogin ? '/login' : '/users';
    const payload = isLogin ? { email: form.email, password: form.password } : form;

    const res = await fetch(`${API_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      if (isLogin) {
        localStorage.setItem('user', JSON.stringify(data));
        setUser(data);
        navigate('/');
      } else {
        setIsLogin(true);
        alert('Cuenta creada. Inicia sesión.');
      }
    } else {
      alert('Error en el proceso');
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-panel">
        <span className="eyebrow">CloudTube · Tu comunidad</span>
        <h1>{isLogin ? 'Qué bueno verte.' : 'Crea tu cuenta.'}</h1>
        <p className="auth-description">{isLogin ? 'Entra y sigue descubriendo videos.' : 'Publica lo que te gusta y encuentra nuevas ideas.'}</p>
        <form className="form-stack" onSubmit={handleSubmit}>
        {!isLogin && (
          <input
            className="form-input"
            type="text"
            placeholder="Nombre"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        )}
        <input
          className="form-input"
          type="email"
          placeholder="Correo"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="form-input"
          type="password"
          placeholder="Contraseña"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
          <button className="primary-button" type="submit">{isLogin ? 'Entrar' : 'Registrarse'}</button>
        </form>
        <button className="text-button" onClick={() => setIsLogin(!isLogin)}>
          {isLogin ? '¿No tienes cuenta? Regístrate' : '¿Tienes cuenta? Inicia sesión'}
        </button>
      </div>
      <div className="auth-aside">
        <span className="auth-orbit auth-orbit-one" />
        <span className="auth-orbit auth-orbit-two" />
        <span className="auth-play">▶</span>
        <p>Un lugar para mirar, compartir y volver.</p>
      </div>
    </section>
  );
}