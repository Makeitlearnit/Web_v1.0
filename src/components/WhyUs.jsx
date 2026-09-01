import React from 'react';

function WhyUs() {
  const reasons = [
    { icon: '🎓', title: 'Academic Ready', desc: 'Suited for final year submissions, research demos and tech expos.' },
    { icon: '📱', title: 'Post-Delivery Support', desc: 'WhatsApp support for setup, debugging and demo assistance included.' },
    { icon: '🚀', title: 'Scalable Prototypes', desc: 'Projects are designed for easy upgrade into startup-grade products.' },
    { icon: '✅', title: 'Original Work', desc: 'Every build is original. Plagiarism-free with unique design approach.' },
    { icon: '⚡', title: 'Fast Delivery', desc: 'Quick turnaround with express options for urgent deadlines.' },
    { icon: '🔧', title: 'Full Documentation', desc: 'Circuit diagrams, code, and presentation materials included.' },
  ];

  return (
    <section className="why-section" id="why">
      <div className="why-header">
        <div className="section-label">Why Choose Us</div>
        <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 26, fontWeight: 800 }}>
          Engineering You Can Rely On
        </div>
      </div>
      <div className="why-grid">
        {reasons.map((r, i) => (
          <div className="why-card" key={i}>
            <div className="why-icon">{r.icon}</div>
            <div className="why-title">{r.title}</div>
            <div className="why-desc">{r.desc}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default WhyUs;
