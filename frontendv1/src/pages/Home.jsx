import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/videos`)
      .then((res) => res.json())
      .then((data) => setVideos(data))
      .catch(() => setVideos([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredVideos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return videos;
    return videos.filter((video) =>
      `${video.title} ${video.description || ''}`.toLowerCase().includes(normalizedQuery)
    );
  }, [query, videos]);

  const featuredVideo = videos[0];

  return (
    <div className="home-page">
      {featuredVideo && !query && (
        <section className="featured" style={{ '--featured-image': `url("${featuredVideo.thumbnail_url}")` }}>
          <div className="featured-copy">
            <span className="eyebrow"><span className="live-dot" /> Recién llegado</span>
            <h1>{featuredVideo.title}</h1>
            <p className="featured-channel">En el canal de <strong>{featuredVideo.user?.name || 'Canal'}</strong></p>
            <p>{featuredVideo.description || 'Descubre este video y sigue explorando lo que la comunidad comparte.'}</p>
            <Link className="watch-button" to={`/watch/${featuredVideo.id}`}><span>▶</span> Ver ahora</Link>
          </div>
          <div className="featured-art" role="img" aria-label={featuredVideo.title} />
        </section>
      )}

      <section className="video-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Tu próximo descubrimiento</span>
            <h2>{query ? 'Resultados' : 'Videos para explorar'}</h2>
          </div>
          <label className="search-box">
            <span aria-hidden="true">⌕</span>
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar videos" aria-label="Buscar videos" />
          </label>
        </div>

        {loading ? <p className="empty-state">Cargando videos...</p> : filteredVideos.length ? (
          <div className="video-grid">
            {filteredVideos.map((vid) => (
              <article className="video-card" key={vid.id}>
                <Link className="thumbnail-link" to={`/watch/${vid.id}`}>
                  <img className="video-thumbnail" src={vid.thumbnail_url} alt={vid.title} />
                  <span className="thumbnail-play">▶</span>
                </Link>
                <div className="video-info">
                  <Link to={`/watch/${vid.id}`}><h3 className="video-title">{vid.title}</h3></Link>
                  <p className="video-meta channel-name">{vid.user?.name || 'Canal'}</p>
                  <p className="video-meta">{vid.views} vistas <span>·</span> {new Date(vid.created_at).toLocaleDateString()}</p>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="empty-state">{query ? 'No encontramos videos con esa búsqueda.' : 'Todavía no hay videos publicados.'}</p>}
      </section>
    </div>
  );
}