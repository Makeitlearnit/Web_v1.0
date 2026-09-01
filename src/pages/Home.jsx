import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { projects } from '../data/projects.js';
import './Home.css';

const features = [
  { icon: '📄', title: 'Full Documentation', desc: 'Circuit diagrams, code, and project reports included with every purchase.' },
  { icon: '🛠️', title: 'Real Hardware Builds', desc: 'Physical prototypes tested before handover. No simulation-only projects.' },
  { icon: '🎓', title: 'Academic Ready', desc: 'Suited for final year submissions, research demos and tech expos.' },
  { icon: '📱', title: 'Post-Delivery Support', desc: 'WhatsApp support for setup, debugging and demo assistance included.' },
  { icon: '🚀', title: 'Scalable Prototypes', desc: 'Projects are designed for easy upgrade into startup-grade products.' },
  { icon: '✅', title: 'Original Work', desc: 'Every build is original. Plagiarism-free with unique design approach.' },
];

const catConfig = [
  { key: 'home',  label: 'Home Automation', icon: '🏠' },
  { key: 'iot',   label: 'IoT & Hardware',  icon: '⚡' },
  { key: 'ai',    label: 'AI & Software',   icon: '🤖' },
  { key: 'robot', label: 'Robotics',        icon: '🦾' },
  { key: 'env',   label: 'IoT Advanced',    icon: '🌿' },
  { key: 'cyber', label: 'Cybersecurity',   icon: '🔐' },
  { key: 'innov', label: 'Innovation',      icon: '💡' },
];

function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } },
      { threshold: 0.12 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function AnimatedCounter({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const started = useRef(false);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const end = parseInt(target);
        const step = Math.ceil(end / 50);
        let cur = 0;
        const timer = setInterval(() => {
          cur = Math.min(cur + step, end);
          setCount(cur);
          if (cur >= end) clearInterval(timer);
        }, 30);
      }
    }, { threshold: 0.5 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function ProjectShowcase() {
  // Pick the first project from each category as the "hero" project
  const showcaseItems = catConfig.map(cat => {
    const firstProject = projects.find(p => p.category === cat.key);
    return { ...cat, project: firstProject };
  }).filter(item => item.project);

  // Duplicate the list so the animation loops seamlessly
  const doubledItems = [...showcaseItems, ...showcaseItems];

  return (
    <section className="showcase-strip">
      <div className="showcase-header">
        <h2>Featured <span>Projects</span></h2>
        <p>A selection from each category — hover to pause</p>
      </div>
      <div className="marquee-track">
        {doubledItems.map((item, i) => (
          <Link to={`/projects?cat=${item.key}`} className="showcase-card" key={`${item.key}-${i}`}>
            <div className="showcase-img-wrap">
              {item.project.image && (
                <img src={item.project.image} alt={item.project.name} loading="lazy" />
              )}
            </div>
            <div className="showcase-info">
              <div>
                <span className={`showcase-cat-label label-${item.key}`}>{item.label}</span>
                <div className="showcase-project-name" style={{ marginTop: 6 }}>{item.project.name}</div>
              </div>
              <div className="showcase-price">{item.project.price}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function HomePage() {
  const featRef = useReveal();
  const catRef  = useReveal();

  return (
    <div className="home-page">
      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="hero-glow" />
        <div className="hero-glow-2" />

        <div className="hero-badge">
          <span className="hero-badge-dot" />
          Live Projects Available Now
        </div>

        <h1>
          Build Smarter with{' '}
          <em>Real Engineering</em>{' '}
          <span className="em2">Projects</span>
        </h1>
        <p className="hero-sub">
          IoT systems, AI-integrated hardware, robotics, and cybersecurity builds —
          engineered from the ground up, ready to deploy.
        </p>
        <div className="hero-btns">
          <Link to="/projects" className="btn-primary">Browse Projects →</Link>
          <Link to="/contact" className="btn-secondary">Get a Quote</Link>
        </div>

        <div className="hero-stats">
          {[
            { val: '40', suf: '+', label: 'Projects Available' },
            { val: '6',  suf: '',  label: 'Categories' },
            { val: '100',suf: '%', label: 'Original Builds' },
            { val: '24', suf: 'h', label: 'Response Time' },
          ].map((s, i) => (
            <div className="stat" key={i}>
              <div className="stat-num">
                <AnimatedCounter target={s.val} suffix={s.suf} />
              </div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 3D PRINT SERVICE BANNER ── */}
      <section className="reveal-container" style={{ padding: '0 20px', marginTop: '-20px', marginBottom: '60px', position: 'relative', zIndex: 10 }}>
        <div className="reveal" style={{ maxWidth: '1200px', margin: '0 auto', background: 'linear-gradient(135deg, #1e1e2f 0%, #2a2a4a 100%)', borderRadius: '16px', padding: '32px 40px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid rgba(255,255,255,0.1)', flexWrap: 'wrap', gap: '20px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
          <div>
            <h3 style={{ fontSize: '22px', marginBottom: '8px' }}>🖨️ Online 3D Printing Service</h3>
            <p style={{ color: 'var(--muted)', fontSize: '15px', maxWidth: '600px' }}>Upload your .stl, .obj, or CAD files directly in our interactive 3D viewer and get high-quality 3D prints for your projects.</p>
          </div>
          <Link to="/3d-print" className="btn-primary" style={{ whiteSpace: 'nowrap' }}>Try 3D Viewer →</Link>
        </div>
      </section>

      {/* ── CATEGORIES ── */}
      <section className="categories-strip reveal-container" ref={catRef}>
        <div className="strip-header reveal">
          <h2>Explore Categories</h2>
          <Link to="/projects" className="btn-secondary" style={{ padding: '9px 18px', fontSize: 13 }}>View All →</Link>
        </div>
        <div className="cat-grid">
          {catConfig.map((c, i) => (
            <Link
              to={`/projects?cat=${c.key}`}
              className="cat-card reveal"
              key={c.key}
              style={{ animationDelay: `${i * 0.07}s`, transitionDelay: `${i * 0.07}s` }}
            >
              <div className="cat-icon">{c.icon}</div>
              <div className="cat-name">{c.label}</div>
              <div className="cat-count">
                {projects.filter(p => p.category === c.key).length} projects
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── AUTO-SCROLLING PROJECT SHOWCASE ── */}
      <ProjectShowcase />

      {/* ── WHY US ── */}
      <section className="features-strip reveal-container" ref={featRef}>
        <div className="reveal" style={{ textAlign: 'center', marginBottom: 48 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Why Choose MakeitLearnit</div>
          <h2 className="features-strip-title" style={{ marginBottom: 8 }}>
            Built by Engineers, for <span>Engineers</span>
          </h2>
          <p style={{ color: 'var(--muted)', fontSize: 15, margin: '0 auto', maxWidth: 600 }}>
            Every project comes tested, documented and ready to present.
          </p>
        </div>
        <div className="features-grid">
          {features.map((f, i) => (
            <div
              className="feature-card reveal"
              key={i}
              style={{ transitionDelay: `${i * 0.08}s` }}
            >
              <div className="feature-icon">{f.icon}</div>
              <div className="feature-title">{f.title}</div>
              <div className="feature-desc">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

export default HomePage;
