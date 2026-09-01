import React, { useState, useRef } from 'react';
import { projects } from '../data/projects.js';
import './Contact.css';

const projectGroups = [
  { label: 'Home Automation', cat: 'home'  },
  { label: 'IoT & Hardware',  cat: 'iot'   },
  { label: 'AI & Software',   cat: 'ai'    },
  { label: 'Robotics',        cat: 'robot' },
  { label: 'IoT Advanced',    cat: 'env'   },
  { label: 'Cybersecurity',   cat: 'cyber' },
  { label: 'Innovation',      cat: 'innov' },
  { label: 'Custom Request',  cat: 'custom'},
];

function ContactPage({ selectedProject, setSelectedProject, showToast }) {
  const [sending, setSending] = useState(false);
  const formRef = useRef(null);

  // Field values to track filled state for turning labels green
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    project: selectedProject || '',
    message: ''
  });

  // Sync if selectedProject prop changes (e.g. from modal)
  React.useEffect(() => {
    if (selectedProject) {
      setFormData(prev => ({ ...prev, project: selectedProject }));
    }
  }, [selectedProject]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'project') {
      setSelectedProject(value);
    }
  };

  const isFilled = (val) => Boolean(val && val.trim().length > 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const name  = formData.name.trim();
    const email = formData.email.trim();
    if (!name || !email) { showToast('⚠️ Please fill in your name and email.'); return; }

    setSending(true);
    try {
      const data = new FormData();
      data.append('access_key', '24ca1d93-4fc3-42cb-a195-9d15dbf7cd7b');
      data.append('subject', 'New Enquiry – MakeitLearnit Portfolio');
      data.append('name',    name);
      data.append('email',   email);
      data.append('project', formData.project || 'Not specified');
      data.append('message', formData.message || 'No message');

      const res    = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
      const result = await res.json();

      if (result.success) {
        showToast('✅ Enquiry sent! We\'ll reply within 24 hours.');
        setFormData({ name: '', email: '', project: '', message: '' });
        setSelectedProject('');
      } else {
        showToast('❌ Something went wrong. Please try again.');
      }
    } catch {
      showToast('❌ Network error. Check your connection.');
    } finally { setSending(false); }
  };

  return (
    <div className="contact-page">
      <div className="contact-hero">
        <div className="section-label">Get In Touch</div>
        <h1>Ready to <span>Order?</span></h1>
        <p>Send an enquiry and we'll get back to you within 24 hours with a detailed quote.</p>
      </div>

      <div className="contact-body">
        {/* ── FORM ── */}
        <div className="contact-box">
          <h3>📋 Send an Enquiry</h3>
          <form ref={formRef} onSubmit={handleSubmit} autoComplete="off">
            <div className="contact-field">
              <label className={isFilled(formData.name) ? 'label-green' : ''}>
                Your Name {isFilled(formData.name) && '✓'}
              </label>
              <input
                name="name"
                type="text"
                placeholder="Prithiviraj G"
                value={formData.name}
                onChange={handleChange}
                className={isFilled(formData.name) ? 'input-green' : ''}
                required
              />
            </div>
            <div className="contact-field">
              <label className={isFilled(formData.email) ? 'label-green' : ''}>
                Email Address {isFilled(formData.email) && '✓'}
              </label>
              <input
                name="email"
                type="email"
                placeholder="you@email.com"
                value={formData.email}
                onChange={handleChange}
                className={isFilled(formData.email) ? 'input-green' : ''}
                required
              />
            </div>
            <div className="contact-field">
              <label className={isFilled(formData.project) ? 'label-green' : ''}>
                Project of Interest {isFilled(formData.project) && '✓'}
              </label>
              <select
                name="project"
                value={formData.project}
                onChange={handleChange}
                className={isFilled(formData.project) ? 'input-green' : ''}
              >
                <option value="">Select a project...</option>
                {projectGroups.map(({ label, cat }) => {
                  const list = cat === 'custom'
                    ? ['Custom Project (describe below)']
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
              <label className={isFilled(formData.message) ? 'label-green' : ''}>
                Message {isFilled(formData.message) && '✓'}
              </label>
              <textarea
                name="message"
                placeholder="Tell us your requirements, deadline, or any customizations..."
                value={formData.message}
                onChange={handleChange}
                className={isFilled(formData.message) ? 'input-green' : ''}
              />
            </div>
            <button type="submit" className="submit-btn" disabled={sending}>
              {sending ? '⏳ Sending...' : 'Send Enquiry →'}
            </button>
          </form>
        </div>

        {/* ── INFO ── */}
        <div className="contact-box">
          <h3>📞 Contact Info</h3>
          {[
            { icon: '📧', label: 'Email',         value: 'makeitlearnit@zohomail.in' },
            { icon: '💬', label: 'WhatsApp',      value: '+91 9600426060' },
            { icon: '📍', label: 'Location',      value: 'Chennai, Tamil Nadu' },
            { icon: '⏱',  label: 'Response Time', value: 'Within 24 hours' },
            { icon: '🚚', label: 'Delivery',      value: 'All over Tamil Nadu 🚚' },
          ].map((item, i) => (
            <div className="info-item" key={i}>
              <div className="info-icon">{item.icon}</div>
              <div>
                <div className="info-label">{item.label}</div>
                <div className="info-value">{item.value}</div>
              </div>
            </div>
          ))}

          <div className="contact-tip">
            <div className="contact-tip-title">📅 Academic Project Deadline?</div>
            <div className="contact-tip-body">
              Mention your submission date and we'll prioritize your order with expedited build + delivery.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ContactPage;

