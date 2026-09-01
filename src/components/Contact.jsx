import React, { useState, useRef } from 'react';
import { projects } from '../data/projects.js';

const projectGroups = [
  { label: 'Home Automation',   cat: 'home'  },
  { label: 'IoT & Hardware',    cat: 'iot'   },
  { label: 'AI & Software',     cat: 'ai'    },
  { label: 'Robotics',          cat: 'robot' },
  { label: 'IoT Advanced',      cat: 'env'   },
  { label: 'Cybersecurity',     cat: 'cyber' },
  { label: 'Innovation',        cat: 'innov' },
  { label: 'Custom Request',    cat: 'custom'},
];

const customOptions = {
  custom: ['Custom Project (describe below)']
};

function Contact({ selectedProject, setSelectedProject, showToast }) {
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

  // Track filled state per field for green label/border
  const [filled, setFilled] = useState({ name: false, email: false, project: false, msg: false });

  const markFilled = (field, value) => {
    const isFilled = typeof value === 'string' ? value.trim() !== '' : value !== '';
    setFilled(prev => ({ ...prev, [field]: isFilled }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = formRef.current;
    const name = form.cName.value.trim();
    const email = form.cEmail.value.trim();
    if (!name || !email) { showToast('⚠️ Please fill in your name and email.'); return; }

    setSending(true);
    try {
      const data = new FormData();
      data.append('access_key', '24ca1d93-4fc3-42cb-a195-9d15dbf7cd7b');
      data.append('subject', 'New Enquiry from MakeitLearnit Portfolio');
      data.append('name', name);
      data.append('email', email);
      data.append('project', form.cProject.value || 'Not specified');
      data.append('message', form.cMsg.value || 'No message');

      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
      const result = await res.json();

      if (result.success) {
        showToast('✅ Enquiry sent! We\'ll contact you within 24 hours.');
        form.reset();
        setSelectedProject('');
        setFilled({ name: false, email: false, project: false, msg: false });
      } else {
        showToast('❌ Something went wrong. Please try again.');
      }
    } catch {
      showToast('❌ Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="contact-outer" id="contact">
      <div className="contact-header">
        <div className="section-label">Get In Touch</div>
        <h2>Ready to Order?</h2>
      </div>
      <div className="contact-grid">
        {/* Form */}
        <div className="contact-box">
          <h3>Send an Enquiry</h3>
          <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">

            <div className="contact-field">
              <label className={filled.name ? 'label-filled' : ''}>Your Name</label>
              <input
                name="cName" type="text" placeholder="Prithiviraj G" required
                className={filled.name ? 'input-filled' : ''}
                onInput={e => markFilled('name', e.target.value)}
              />
            </div>

            <div className="contact-field">
              <label className={filled.email ? 'label-filled' : ''}>Email Address</label>
              <input
                name="cEmail" type="email" placeholder="you@email.com" required
                className={filled.email ? 'input-filled' : ''}
                onInput={e => markFilled('email', e.target.value)}
              />
            </div>

            <div className="contact-field">
              <label className={(filled.project || selectedProject) ? 'label-filled' : ''}>Project of Interest</label>
              <select
                name="cProject"
                value={selectedProject}
                className={(filled.project || selectedProject) ? 'input-filled' : ''}
                onChange={(e) => {
                  setSelectedProject(e.target.value);
                  markFilled('project', e.target.value);
                }}
              >
                <option value="">Select a project...</option>
                {projectGroups.map(({ label, cat }) => {
                  const list = cat === 'custom'
                    ? customOptions.custom
                    : projects.filter(p => p.category === cat).map(p => p.name);
                  return list.length ? (
                    <optgroup key={cat} label={label}>
                      {list.map(n => <option key={n} value={n}>{n}</option>)}
                    </optgroup>
                  ) : null;
                })}
              </select>
            </div>

            <div className="contact-field">
              <label className={filled.msg ? 'label-filled' : ''}>Message</label>
              <textarea
                name="cMsg"
                placeholder="Tell us your requirements, deadline or any customizations..."
                className={filled.msg ? 'input-filled' : ''}
                onInput={e => markFilled('msg', e.target.value)}
              />
            </div>

            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? 'Sending...' : 'Send Enquiry →'}
            </button>
          </form>
        </div>

        {/* Info */}
        <div className="contact-box">
          <h3>Contact Info</h3>
          <div className="info-item">
            <div className="info-icon">📧</div>
            <div>
              <div className="info-label">Email</div>
              <div className="info-value">makeitlearnit@zohomail.in</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">💬</div>
            <div>
              <div className="info-label">WhatsApp</div>
              <div className="info-value">+91 9600426060</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">📍</div>
            <div>
              <div className="info-label">Location</div>
              <div className="info-value">Chennai, Tamil Nadu</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">⏱</div>
            <div>
              <div className="info-label">Response Time</div>
              <div className="info-value">Within 24 hours</div>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon">🚚</div>
            <div>
              <div className="info-label">Delivery</div>
              <div className="info-value">All over Tamil Nadu 🚚</div>
            </div>
          </div>
          <div className="contact-tip">
            <div className="contact-tip-title">📅 Academic Project Deadline?</div>
            <div className="contact-tip-body">Mention your submission date and we'll prioritize your order with expedited build + delivery.</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;

