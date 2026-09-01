import React from 'react';
import { NavLink } from 'react-router-dom';

function Footer() {
  return (
    <footer className="footer">
      <p>© 2026 <strong>MakeitLearnit</strong> · All Rights Reserved · Tamil Nadu, India</p>
      <p style={{ marginTop: 6 }}>
        Cybersecurity projects are for educational/ethical use only. &nbsp;·&nbsp;
        <NavLink to="/contact" style={{ color: 'var(--accent)' }}>Contact Us</NavLink>
      </p>
    </footer>
  );
}

export default Footer;
