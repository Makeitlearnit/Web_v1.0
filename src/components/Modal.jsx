import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const categoryEmoji = { home:'🏠', iot:'⚡', ai:'🤖', robot:'🦾', env:'🌿', cyber:'🔐', innov:'💡' };

function Modal({ project, onClose, onEnquire }) {
  const navigate = useNavigate();

  useEffect(() => {
    const fn = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    if (project) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.removeEventListener('keydown', fn); document.body.style.overflow = ''; };
  }, [project, onClose]);

  const handleEnquire = () => {
    onEnquire(project);
    navigate('/contact');
  };

  return (
    <div
      className={`modal-overlay ${project ? 'open' : ''}`}
      onClick={(e) => { if (e.target.classList.contains('modal-overlay')) onClose(); }}
    >
      <div className="modal">
        <button className="modal-close" onClick={onClose}>✕</button>
        {project && (
          <>
            {project.image
              ? <img src={project.image} alt={project.name} className="modal-img" />
              : <div className="modal-emoji">{categoryEmoji[project.category] || '📦'}</div>
            }
            <h3>{project.name}</h3>
            <div className="modal-price">{project.price}</div>
            <p className="modal-desc">{project.desc}</p>
            <div className="modal-actions">
              <button className="btn-primary" onClick={handleEnquire}>Enquire Now →</button>
              <button className="btn-secondary" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Modal;
