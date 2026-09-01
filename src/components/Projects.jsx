import React, { useState, useEffect } from 'react';
import { projects } from '../data/projects.js';

const RATINGS_URL = import.meta.env.VITE_RATINGS_URL;

// ── Google Sheets CSV URL (publicly shared sheet) ──
const SHEET_ID = '17fhpxFGq5AEsi5jWUarmDBW4acu7njoqFTXaID3k_is';
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`;

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

function buildRatings(rows) {
  const header = rows[0];
  const projectCols = [];
  header.forEach((h, i) => {
    if (h.toLowerCase().includes('select your project')) projectCols.push(i);
  });
  const map = {};
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
      .then(text => setRatings(buildRatings(parseCSV(text))))
      .catch(err => console.warn('Ratings fetch failed:', err));
  }, []);
  return ratings;
}





const categories = {
  all:   { label: 'All Projects',     icon: '🔬' },
  home:  { label: 'Home Automation',  icon: '🏠' },
  iot:   { label: 'IoT & Hardware',   icon: '⚡' },
  ai:    { label: 'AI & Software',    icon: '🤖' },
  robot: { label: 'Robotics',         icon: '🦾' },
  env:   { label: 'IoT Advanced',     icon: '🌿' },
  cyber: { label: 'Cybersecurity',    icon: '🔐' },
  innov: { label: 'Innovation',       icon: '💡' },
};

const sectionMeta = {
  home:  { title: 'Home Automation',        iconClass: 'icon-home',  emoji: '🏠' },
  iot:   { title: 'IoT & Hardware Systems', iconClass: 'icon-iot',   emoji: '⚡' },
  ai:    { title: 'AI & Software-Based',    iconClass: 'icon-ai',    emoji: '🤖' },
  robot: { title: 'Robotics & Automation',  iconClass: 'icon-robot', emoji: '🦾' },
  env:   { title: 'IoT Advanced / Env',     iconClass: 'icon-env',   emoji: '🌿' },
  cyber: { title: 'Cybersecurity',          iconClass: 'icon-cyber', emoji: '🔐' },
  innov: { title: 'Innovation',             iconClass: 'icon-innov', emoji: '💡' },
};

const categoryOrder = ['home', 'iot', 'ai', 'robot', 'env', 'cyber', 'innov'];

function Card({ project, onViewDetails, ratings }) {
  // Fall back to 5.0 stars, 0 count, 0 buys
  const r = (ratings && ratings[project.name]) || { rating: 5.0, count: 0, buys: 0 };
  return (
    <div className="card">
      <div className="card-thumb" style={{ background: 'var(--surface2)' }}>
        {project.image
          ? <img src={project.image} alt={project.name} loading="lazy" />
          : <div style={{ color: 'var(--muted)', fontSize: 32 }}>📦</div>
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
            {categories[project.category]?.label.split(' ')[0]}
          </span>
        </div>
        <button className="card-btn" onClick={() => onViewDetails(project)}>
          View Details
        </button>
      </div>
    </div>
  );
}

function ProjectSection({ category, projects: sectionProjects, onViewDetails, ratings }) {
  const meta = sectionMeta[category];
  if (!sectionProjects.length) return null;
  return (
    <section className="section">
      <div className="section-header">
        <div className={`section-icon ${meta.iconClass}`}>{meta.emoji}</div>
        <div>
          <div className="section-title">{meta.title}</div>
        </div>
        <div className="section-count">{sectionProjects.length} projects</div>
      </div>
      {category === 'cyber' && (
        <div className="cyber-notice">
          ⚠️ For educational & ethical use only. All cybersecurity builds are intended for lab environments.
        </div>
      )}
      <div className="grid">
        {sectionProjects.map((p, i) => (
          <Card key={i} project={p} onViewDetails={onViewDetails} ratings={ratings} />
        ))}
      </div>
    </section>
  );
}

function Projects({ onViewDetails }) {
  const [filter, setFilter] = useState('all');
  const ratings = useRatings();

  const projectsByCategory = categoryOrder.reduce((acc, cat) => {
    acc[cat] = projects.filter(p => p.category === cat);
    return acc;
  }, {});

  return (
    <>
      <div id="products" className="filter-section">
        <div className="filter-bar">
          {Object.entries(categories).map(([key, { label }]) => (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {categoryOrder.map(cat => {
        const visible = filter === 'all' || filter === cat;
        if (!visible) return null;
        return (
          <ProjectSection
            key={cat}
            category={cat}
            projects={projectsByCategory[cat]}
            onViewDetails={onViewDetails}
            ratings={ratings}
          />
        );
      })}
    </>
  );
}

export default Projects;


