import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

function ScrollProgress() {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const fn = () => {
      const pct = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      setWidth(pct || 0);
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div className="scroll-bar">
      <div className="scroll-fill" style={{ width: `${width}%` }} />
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <NavLink to="/" className="nav-logo">
        Makeit<span className="accent">Learn</span>it
      </NavLink>
      <div className="nav-links">
        <NavLink to="/"        className={({ isActive }) => isActive ? 'active' : ''} end>Home</NavLink>
        <NavLink to="/projects"className={({ isActive }) => isActive ? 'active' : ''}>Projects</NavLink>
        <NavLink to="/3d-print"className={({ isActive }) => isActive ? 'active' : ''}>3D Print</NavLink>
        <NavLink to="/contact" className={({ isActive }) => isActive ? 'active' : ''}>Contact</NavLink>
        <a href="https://www.linkedin.com/in/prithiviraj-g-b51a6b271/" target="_blank" rel="noreferrer">LinkedIn</a>
        <NavLink to="/contact" className="nav-cta">Get a Quote</NavLink>
      </div>
    </nav>
  );
}

export { ScrollProgress, Navbar };
