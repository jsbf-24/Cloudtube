import React, { useEffect, useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL;

export default function Profile({ user }) {
  const [videos, setVideos] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);

  const fetchUserVideos = () => {
    fetch(`${API_URL}/videos`)
      .then((res) => res.json())
      .then((data) => setVideos(data.filter((v) => v.user_id === user?.user_id)));
  };

  useEffect(() => {
    if (user) fetchUserVideos();
  }, [user]);

  const handleUpload = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('user_id', user.user_id);
    formData.append('video_file', videoFile);
    formData.append('thumbnail_file', thumbFile);

    const res = await fetch(`${API_URL}/videos`, {
      method: 'POST',
      body: formData
    });

    if (res.ok) {
      alert('Video subido exitosamente');
      fetchUserVideos();
      setTitle('');
      setDescription('');
    }
  };

  const handleDelete = async (id) => {
    await fetch(`${API_URL}/videos/${id}`, { method: 'DELETE' });
    fetchUserVideos();
  };

  if (!user) return <p>Inicia sesión para ver tu perfil.</p>;

  return (
    <div className="profile-page">
      <header className="profile-header">
        <div className="profile-avatar">{user.name?.[0]?.toUpperCase() || 'U'}</div>
        <div><span className="eyebrow">Tu espacio</span><h1>{user.name}</h1><p>{user.email}</p></div>
        <div className="profile-stat"><strong>{videos.length}</strong><span>videos publicados</span></div>
      </header>

      <section className="upload-section">
        <div className="section-heading"><div><span className="eyebrow">Comparte con la comunidad</span><h2>Publicar un video</h2></div></div>
        <form className="upload-form" onSubmit={handleUpload}>
          <div className="upload-fields">
            <input className="form-input" type="text" placeholder="Título del video" value={title} onChange={(e) => setTitle(e.target.value)} required />
            <textarea className="form-input" placeholder="Cuéntanos de qué trata" value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>
          <div className="file-fields">
            <label className="file-control"><span>Archivo de video</span><input type="file" accept="video/mp4" onChange={(e) => setVideoFile(e.target.files[0])} required /></label>
            <label className="file-control"><span>Miniatura</span><input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files[0])} required /></label>
          </div>
          <button className="primary-button upload-button" type="submit">Subir video <span>↗</span></button>
        </form>
      </section>

      <section className="my-videos">
        <div className="section-heading"><div><span className="eyebrow">Tu biblioteca</span><h2>Mis videos</h2></div></div>
        {videos.length ? videos.map((vid) => (
          <article className="manage-video" key={vid.id}>
            <img src={vid.thumbnail_url} alt="" />
            <div><h3>{vid.title}</h3><p>{vid.views} vistas</p></div>
            <button className="danger-button" onClick={() => handleDelete(vid.id)}>Eliminar</button>
          </article>
        )) : <p className="empty-state">Tus videos publicados aparecerán aquí.</p>}
      </section>
    </div>
  );
}