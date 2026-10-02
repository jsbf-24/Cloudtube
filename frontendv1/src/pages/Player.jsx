import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function Player() {
  const { id } = useParams();
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [recommended, setRecommended] = useState([]);
  const user = JSON.parse(localStorage.getItem('user'));

  useEffect(() => {
    fetch(`${API_URL}/videos/${id}`)
      .then((res) => res.json())
      .then((data) => setVideo(data));

    fetch(`${API_URL}/videos/${id}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data));

    fetch(`${API_URL}/videos`)
      .then((res) => res.json())
      .then((data) => setRecommended(data.filter((v) => v.id !== parseInt(id))));
  }, [id]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) return alert('Debes iniciar sesión');

    const res = await fetch(`${API_URL}/videos/${id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newComment, user_id: user.user_id })
    });

    if (res.ok) {
      const added = await res.json();
      setComments([...comments, added]);
      setNewComment('');
    }
  };

  if (!video) return <p className="empty-state">Cargando video...</p>;

  return (
    <div className="player-layout">
      <div className="player-main">
        <video className="video-player" src={video.video_url} controls />
        <div className="player-heading">
          <div>
            <span className="eyebrow">Ahora reproduciendo</span>
            <h1>{video.title}</h1>
            <p className="channel-byline">Canal <strong>{video.user?.name || 'Canal'}</strong></p>
          </div>
          <span className="view-count">{video.views} vistas</span>
        </div>
        <p className="video-description">{video.description}</p>

        <section className="comments-section">
        <h2>Comentarios <span>{comments.length}</span></h2>
        {user && (
          <form className="comment-form" onSubmit={handleAddComment}>
            <input
              className="form-input"
              type="text"
              placeholder="Escribe un comentario..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              required
            />
            <button className="primary-button" type="submit">Comentar</button>
          </form>
        )}
        <ul className="comment-list">
          {comments.map((c) => (
            <li key={c.id}>
              <span className="comment-avatar">{c.user?.name?.[0]?.toUpperCase() || 'U'}</span>
              <div className="comment-body">
                <strong>{c.user?.name || 'Usuario'}</strong>
                <p>{c.content}</p>
              </div>
            </li>
          ))}
        </ul>
        {!comments.length && <p className="subtle-text">Todavía no hay comentarios.</p>}
        </section>
      </div>

      <aside className="recommendations">
        <h2>Sigue explorando</h2>
        {recommended.map((rec) => (
          <Link className="recommendation" key={rec.id} to={`/watch/${rec.id}`}>
              <img src={rec.thumbnail_url} alt={rec.title} />
              <div><h3>{rec.title}</h3><p>{rec.user?.name || 'Canal'} · {rec.views} vistas</p></div>
            </Link>
        ))}
      </aside>
    </div>
  );
}