import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { ScrollProgress, Navbar } from './components/Navbar';
import Modal from './components/Modal';
import HomePage from './pages/Home';
import ProjectsPage from './pages/Projects';
import ContactPage from './pages/Contact';
import PrintingService from './pages/PrintingService';
import Footer from './components/Footer';
import GestureOverlay from './components/GestureOverlay';
import './global.css';

function Toast({ message }) {
  return (
    <div className={`toast ${message ? 'show' : ''}`}>
      <span>{message}</span>
    </div>
  );
}

function CursorGlow() {
  const glowRef = useRef(null);
  useEffect(() => {
    const move = (e) => {
      if (glowRef.current) {
        glowRef.current.style.left = `${e.clientX}px`;
        glowRef.current.style.top  = `${e.clientY}px`;
      }
    };
    window.addEventListener('mousemove', move, { passive: true });
    return () => window.removeEventListener('mousemove', move);
  }, []);
  return <div className="cursor-glow" ref={glowRef} />;
}

// Page transition wrapper
function PageWrapper({ children }) {
  const { pathname } = useLocation();
  const [display, setDisplay] = useState('none');
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setDisplay('block');
    setVisible(false);
    const t1 = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setVisible(true);
        window.scrollTo(0, 0);
      });
    });
    return () => cancelAnimationFrame(t1);
  }, [pathname]);

  return (
    <div
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.4s ease, transform 0.4s ease',
      }}
    >
      {children}
    </div>
  );
}

function App() {
  const [modalProject, setModalProject]     = useState(null);
  const [selectedProject, setSelectedProject] = useState('');
  const [toastMsg, setToastMsg]             = useState('');

  const showToast = useCallback((msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  }, []);

  const handleViewDetails = useCallback((p) => setModalProject(p), []);
  const handleCloseModal  = useCallback(() => setModalProject(null), []);
  const handleEnquire     = useCallback((p) => {
    setModalProject(null);
    setSelectedProject(p.name);
  }, []);

  return (
    <BrowserRouter>
      <CursorGlow />
      <ScrollProgress />
      <Navbar />
      <GestureOverlay />

      <PageWrapper>
        <Routes>
          <Route path="/"         element={<HomePage />} />
          <Route path="/projects" element={<ProjectsPage onViewDetails={handleViewDetails} />} />
          <Route path="/contact"  element={
            <ContactPage
              selectedProject={selectedProject}
              setSelectedProject={setSelectedProject}
              showToast={showToast}
            />
          } />
          <Route path="/3d-print" element={<PrintingService />} />
        </Routes>
        <Footer />
      </PageWrapper>

      <Modal
        project={modalProject}
        onClose={handleCloseModal}
        onEnquire={handleEnquire}
      />
      <Toast message={toastMsg} />
    </BrowserRouter>
  );
}

export default App;
