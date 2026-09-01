import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader';

export default function PrintingService() {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Loading & parsing model...');
  const [uploadedFile, setUploadedFile] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [toastMsg, setToastMsg] = useState('');

  const sceneRef = useRef(null);
  const cameraRef = useRef(null);
  const rendererRef = useRef(null);
  const controlsRef = useRef(null);
  const currentModelRef = useRef(null);
  const animationFrameRef = useRef(null);
  const materialRef = useRef(null);

  useEffect(() => {
    // 1. Scene, Camera, Renderer Setup
    const container = containerRef.current;
    const canvas = canvasRef.current;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 1000);
    camera.position.set(0, 75, 160);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // 2. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // 3. Grid & Lighting
    const grid = new THREE.GridHelper(200, 40, 0x555555, 0x333333);
    grid.position.y = -0.01;
    scene.add(grid);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dirLight1.position.set(50, 100, 50);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xffffff, 0.4);
    dirLight2.position.set(-50, 50, -50);
    scene.add(dirLight2);

    materialRef.current = new THREE.MeshStandardMaterial({
      color: 0xd8c8b8,
      metalness: 0.1,
      roughness: 0.45
    });

    // Handle Resize
    const onResize = () => {
      if (!container || !camera || !renderer) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', onResize);

    // Animation Loop
    const animate = () => {
      animationFrameRef.current = requestAnimationFrame(animate);
      // Auto-rotation disabled per request
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Dynamically load occt-import-js from CDN to avoid WASM resolution issues
    if (!window.occtimportjs) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/occt-import-js@0.0.12/dist/occt-import-js.js';
      script.async = true;
      document.body.appendChild(script);
    }

    return () => {
      window.removeEventListener('resize', onResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (renderer) renderer.dispose();
      if (controls) controls.dispose();
      // Cleanup scene objects
      while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
      }
    };
  }, []);

  const placeModel = (meshOrGroup) => {
    const scene = sceneRef.current;
    const controls = controlsRef.current;
    if (!scene || !controls) return;

    if (currentModelRef.current) scene.remove(currentModelRef.current);

    currentModelRef.current = meshOrGroup;
    scene.add(currentModelRef.current);

    const box = new THREE.Box3().setFromObject(currentModelRef.current);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());

    // Auto-scale to fit nicely in 50 unit box
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const scale = 50 / maxDim;
      currentModelRef.current.scale.set(scale, scale, scale);
    }

    // Recalculate box & place on top of grid plate
    box.setFromObject(currentModelRef.current);
    box.getCenter(center);
    currentModelRef.current.position.x -= center.x;
    currentModelRef.current.position.z -= center.z;
    currentModelRef.current.position.y -= box.min.y;

    controls.target.set(0, (box.max.y - box.min.y) / 2, 0);
    controls.update();
  };

  const loadFile = async (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    setIsLoading(true);
    setUploadedFile(file);

    try {
      if (ext === 'stl') {
        const buffer = await file.arrayBuffer();
        const geometry = new STLLoader().parse(buffer);
        geometry.computeVertexNormals();
        const mesh = new THREE.Mesh(geometry, materialRef.current);
        placeModel(mesh);
      } 
      else if (ext === 'obj') {
        const text = await file.text();
        const obj = new OBJLoader().parse(text);
        obj.traverse(child => {
          if (child.isMesh) child.material = materialRef.current;
        });
        placeModel(obj);
      } 
      else if (['step', 'stp', 'iges', 'igs'].includes(ext)) {
        if (!window.occtimportjs) {
          throw new Error("CAD parser library is still loading. Please try again in a moment.");
        }
        setLoadingText('Initializing CAD Engine...');
        const occt = await window.occtimportjs();
        setLoadingText('Parsing CAD model...');
        const buffer = await file.arrayBuffer();
        const fileData = new Uint8Array(buffer);
        
        let result;
        if (ext === 'step' || ext === 'stp') {
          result = occt.ReadStepFile(fileData, null);
        } else {
          result = occt.ReadIgesFile(fileData, null);
        }

        if (!result.success) throw new Error("CAD Parsing failed");

        const group = new THREE.Group();
        for (const meshData of result.meshes) {
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', new THREE.Float32BufferAttribute(meshData.attributes.position.array, 3));
          if (meshData.attributes.normal) {
            geometry.setAttribute('normal', new THREE.Float32BufferAttribute(meshData.attributes.normal.array, 3));
          } else {
            geometry.computeVertexNormals();
          }
          if (meshData.index) {
            geometry.setIndex(new THREE.BufferAttribute(meshData.index.array, 1));
          }
          const mesh = new THREE.Mesh(geometry, materialRef.current);
          group.add(mesh);
        }
        placeModel(group);
      } else {
        throw new Error("Unsupported file format");
      }
    } catch (err) {
      alert("Failed to parse the 3D file: " + err.message);
      setUploadedFile(null);
    } finally {
      setIsLoading(false);
      setLoadingText('Loading & parsing model...');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) {
      loadFile(e.dataTransfer.files[0]);
    }
  };

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 4500);
  };

  const handleEnquire = async (e) => {
    e.preventDefault();
    const name  = formData.name.trim();
    const email = formData.email.trim();
    if (!name || !email) { showToast('⚠️ Please fill in your name and email.'); return; }
    if (!uploadedFile) { showToast('⚠️ Please upload a 3D model first.'); return; }

    setSending(true);
    try {
      // 1. Upload file to a temporary host (tmpfiles.org) because Web3Forms free tier doesn't support large attachments
      showToast('⏳ Uploading 3D model to secure temporary storage...');
      const uploadData = new FormData();
      uploadData.append('file', uploadedFile);
      
      const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: uploadData
      });
      const uploadJson = await uploadRes.json();
      
      if (uploadJson.status !== 'success') {
        throw new Error('File upload failed');
      }

      // Convert viewing link to direct download link
      const directDownloadLink = uploadJson.data.url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

      // 2. Submit form with the download link
      showToast('⏳ Sending quote request...');
      const data = new FormData();
      data.append('access_key', '24ca1d93-4fc3-42cb-a195-9d15dbf7cd7b');
      data.append('subject', 'New 3D Print Quote Request');
      data.append('name',    name);
      data.append('email',   email);
      
      const combinedMessage = `
Name: ${name}
Email: ${email}

--- Message/Requirements ---
${formData.message || 'No additional details provided.'}

--- 3D Model File ---
Download Link: ${directDownloadLink}
(Note: This is a secure temporary link that will expire, please download it as soon as possible).
      `.trim();

      data.append('message', combinedMessage);

      const res = await fetch('https://api.web3forms.com/submit', { method: 'POST', body: data });
      const result = await res.json();

      if (result.success) {
        showToast('✅ Quote request and 3D model sent successfully!');
        setFormData({ name: '', email: '', message: '' });
      } else {
        showToast('❌ Something went wrong sending the email.');
      }
    } catch (err) {
      console.error(err);
      showToast('❌ Network error. Check your connection or try a smaller file.');
    } finally { 
      setSending(false); 
    }
  };

  return (
    <div className="section" style={{ padding: '80px 20px', minHeight: 'calc(100vh - 80px)' }}>
      <div className="container" style={{ maxWidth: '800px', margin: '0 auto' }}>
        
        <h1 style={{ fontSize: '32px', marginBottom: '24px', fontWeight: 'bold' }}>Online 3D Printing Service</h1>
        
        <div style={{ fontSize: '14px', color: 'var(--muted)', marginBottom: '24px' }}>
          <span>Home</span> &rarr; <span style={{ color: 'var(--accent)' }}>3D Print Service</span>
        </div>

        {/* 3D Canvas Box */}
        <div 
          ref={containerRef}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          style={{
            width: '100%',
            height: '450px',
            backgroundColor: '#1e1e1e', // Dark background for the viewer
            borderRadius: '16px',
            overflow: 'hidden',
            position: 'relative',
            border: '2px dashed var(--border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)'
          }}
        >
          {isLoading && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.7)',
              color: '#fff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '16px',
              fontWeight: 500,
              zIndex: 10
            }}>
              <div className="spinner" style={{ marginBottom: '16px', width: '30px', height: '30px', border: '3px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
              {loadingText}
            </div>
          )}
          <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
        </div>

        {/* Upload Controls */}
        <button 
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%',
            marginTop: '24px',
            padding: '16px',
            backgroundColor: 'var(--accent)',
            color: '#fff',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            transition: 'opacity 0.2s'
          }}
          onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
          onMouseOut={e => e.currentTarget.style.opacity = '1'}
        >
          <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
          </svg>
          {uploadedFile ? 'Upload a Different Model' : 'Upload 3D Model'}
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          accept=".stl,.obj,.stp,.step,.igs,.iges" 
          onChange={(e) => {
            if (e.target.files.length) loadFile(e.target.files[0]);
          }}
        />

        {!uploadedFile && (
          <>
            <p style={{ marginTop: '16px', fontSize: '15px', fontWeight: 600, textAlign: 'center' }}>
              Upload or simply drag a single 3D model into the box
            </p>
            <p style={{ fontSize: '13px', color: 'var(--muted)', marginTop: '6px', textAlign: 'center' }}>
              We currently support .stl, .obj, .stp, .step, .igs, .iges file formats
            </p>
          </>
        )}

        {/* Quote Request Form - Appears after a file is uploaded */}
        {uploadedFile && (
          <div style={{ marginTop: '32px', background: 'var(--surface2)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <h3 style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📦</span> Get a Print Quote for: {uploadedFile.name}
            </h3>
            <form onSubmit={handleEnquire} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <input
                type="text"
                placeholder="Your Name"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <input
                type="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)' }}
              />
              <textarea
                placeholder="Material preference, color, quantity, or other details..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                rows={3}
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', resize: 'vertical' }}
              />
              <button 
                type="submit" 
                disabled={sending}
                style={{
                  padding: '14px',
                  backgroundColor: '#4ade80',
                  color: '#1a1a2e',
                  border: 'none',
                  borderRadius: '8px',
                  fontWeight: 600,
                  fontSize: '15px',
                  cursor: sending ? 'not-allowed' : 'pointer',
                  opacity: sending ? 0.7 : 1
                }}
              >
                {sending ? '⏳ Sending Model...' : 'Send for Quote →'}
              </button>
            </form>
          </div>
        )}
        
        <style dangerouslySetInnerHTML={{__html: `
          @keyframes spin { 100% { transform: rotate(360deg); } }
        `}} />
      </div>

      {/* Global Toast Component fallback (if App's toast doesn't reach here) */}
      <div className={`toast ${toastMsg ? 'show' : ''}`}>
        <span>{toastMsg}</span>
      </div>
    </div>
  );
}
