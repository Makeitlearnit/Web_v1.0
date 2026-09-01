import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { projects } from '../data/projects.js';
import './Projects.css';

const categories = {
  all:   'All Projects',
  home:  'Home Automation',
  iot:   'IoT & Hardware',
  ai:    'AI & Software',
  robot: 'Robotics',
  env:   'IoT Advanced',
  cyber: 'Cybersecurity',
  innov: 'Innovation',
};

const sectionMeta = {
  home:  { title: 'Home Automation',         icon: '🏠', iconClass: 'icon-home'  },
  iot:   { title: 'IoT & Hardware Systems',  icon: '⚡', iconClass: 'icon-iot'   },
  ai:    { title: 'AI & Software-Based',     icon: '🤖', iconClass: 'icon-ai'    },
  robot: { title: 'Robotics & Automation',   icon: '🦾', iconClass: 'icon-robot' },
  env:   { title: 'IoT Advanced / Env',      icon: '🌿', iconClass: 'icon-env'   },
  cyber: { title: 'Cybersecurity',           icon: '🔐', iconClass: 'icon-cyber' },
  innov: { title: 'Innovation',              icon: '💡', iconClass: 'icon-innov' },
};

const catOrder = ['home', 'iot', 'ai', 'robot', 'env', 'cyber', 'innov'];

// ── Google Sheets CSV URL (publicly shared sheet) ──
const SHEET_ID = '17fhpxFGq5AEsi5jWUarmDBW4acu7njoqFTXaID3k_is';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

// Parse CSV text into array of rows (handles quoted commas correctly)
function parseCSV(text) {
  const rows = [];
  for (const line of text.trim().split('\n')) {
    const cols = [];
    let cur = '', inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    rows.push(cols);
  }
  return rows;
}

// Build ratings map { projectName: { rating, count, buys } } from CSV rows
function buildRatings(rows) {
  // Header row: find all "Select your Project" column indices
  const header = rows[0];
  const projectCols = [];
  header.forEach((h, i) => {
    if (h.toLowerCase().includes('select your project')) {
      projectCols.push(i); // rating = i+1, purchase = i+2
    }
  });

  const map = {}; // { name: { sum, count, buys } }

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.length < 2) continue;
    for (const pi of projectCols) {
      const name    = (row[pi]   || '').trim();
      const ratingS = (row[pi+1] || '').trim();
      const bought  = (row[pi+2] || '').trim().toLowerCase();
      if (!name || !ratingS) continue;
      const rating = parseFloat(ratingS);
      if (isNaN(rating)) continue;
      if (!map[name]) map[name] = { sum: 0, count: 0, buys: 0 };
      map[name].sum   += rating;
      map[name].count += 1;
      if (bought === 'yes') map[name].buys += 1;
    }
  }

  // Convert sums to averages
  const result = {};
  for (const [name, d] of Object.entries(map)) {
    result[name] = {
      rating: Math.round((d.sum / d.count) * 10) / 10,
      count:  d.count,
      buys:   d.buys,
    };
  }
  return result;
}

function starsHtml(rating) {
  const full  = Math.floor(rating);
  const half  = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(empty);
}

function useRatings() {
  const [ratings, setRatings] = useState({});
  useEffect(() => {
    fetch(SHEET_CSV_URL)
      .then(r => r.text())
      .then(text => {
        const rows = parseCSV(text);
        setRatings(buildRatings(rows));
      })
      .catch(err => console.warn('Ratings fetch failed:', err));
  }, []);
  return ratings;
}



function Card({ project, delay, onViewDetails, ratings }) {
  // If a project doesn't have custom sheet data, default to 5.0 rating, 0 reviewers, 0 sold
  const r = (ratings && ratings[project.name]) || { rating: 5.0, count: 0, buys: 0 };
  return (
    <div
      className="card"
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="card-thumb">
        {project.image
          ? <img src={project.image} alt={project.name} loading="lazy" />
          : <span style={{ fontSize: 36, opacity: 0.3 }}>📦</span>
        }
      </div>
      <div className="card-body">
        <div className="card-name">{project.name}</div>

        <div className="card-ratings">
          <span className="stars" title={`${r.rating} out of 5`}>{starsHtml(r.rating)}</span>
          <span className="rating-score">{r.rating.toFixed(1)}</span>
          <span className="rating-count">({r.count})</span>
          <span className="buy-count">{r.buys} sold</span>
        </div>

        <div className="card-meta">
          <div className="card-price">{project.price}</div>
          <span className={`card-tag tag-${project.category}`}>
            {categories[project.category]?.split(' ')[0]}
          </span>
        </div>
        <button className="card-btn" onClick={() => onViewDetails(project)}>
          View Details
        </button>
      </div>
    </div>
  );
}

function ProjectSection({ category, sectionProjects, onViewDetails, ratings }) {
  const meta = sectionMeta[category];
  const ref = useRef(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          e.target.querySelectorAll('.card').forEach((c, i) => {
            c.style.animationDelay = `${i * 0.06}s`;
            c.style.animationPlayState = 'running';
          });
          obs.unobserve(e.target);
        }
      },
      { threshold: 0.05 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  if (!sectionProjects.length) return null;

  return (
    <section className="section" ref={ref}>
      <div className="section-header">
        <div className={`section-icon ${meta.iconClass}`}>{meta.icon}</div>
        <div className="section-title">{meta.title}</div>
        <div className="section-count">{sectionProjects.length} projects</div>
      </div>
      {category === 'cyber' && (
        <div className="cyber-notice">
          ⚠️ For educational & ethical use only. All cybersecurity builds are intended for lab environments.
        </div>
      )}
      <div className="grid">
        {sectionProjects.map((p, i) => (
          <Card key={i} project={p} delay={i * 0.05} onViewDetails={onViewDetails} ratings={ratings} />
        ))}
      </div>
    </section>
  );
}

function ProjectsPage({ onViewDetails }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCat = searchParams.get('cat') || 'all';
  const [filter, setFilter] = useState(initialCat);
  const ratings = useRatings();

  useEffect(() => {
    const cat = searchParams.get('cat') || 'all';
    setFilter(cat);
  }, [searchParams]);

  const handleFilter = (key) => {
    setFilter(key);
    if (key === 'all') setSearchParams({});
    else setSearchParams({ cat: key });
  };

  const byCategory = catOrder.reduce((acc, cat) => {
    acc[cat] = projects.filter(p => p.category === cat);
    return acc;
  }, {});

  return (
    <div className="projects-page">
      <div className="projects-header">
        <div className="section-label">Catalogue</div>
        <h1>Engineering <span>Projects</span></h1>
        <p>Browse {projects.length}+ handcrafted builds across 7 categories. Click any card for full details.</p>
      </div>

      <div className="filter-section">
        <div className="filter-bar-inner">
          {Object.entries(categories).map(([key, label]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => handleFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {catOrder.map(cat => {
        if (filter !== 'all' && filter !== cat) return null;
        return (
          <ProjectSection
            key={cat}
            category={cat}
            sectionProjects={byCategory[cat]}
            onViewDetails={onViewDetails}
            ratings={ratings}
          />
        );
      })}
    </div>
  );
}

export default ProjectsPage;

