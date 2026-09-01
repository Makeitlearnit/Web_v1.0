import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FilesetResolver, HandLandmarker, DrawingUtils } from '@mediapipe/tasks-vision';

// ── Configuration ─────────────────────────────────────────────────────────────
const GESTURE_LABELS = {
  move: '☝ Moving',
  dwell: '✊ Pressing',
  click: '✅ Clicked!',
  scrollUp: '✌ Scrolling Up',
  scrollDown: '👉 Scrolling Down',
  idle: '',
  paused: '⏸ Gestures Off',
  loading: '⏳ Loading AI...',
  camera_error: '❌ Camera Error'
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function GestureOverlay() {
  const [event, setEvent] = useState({ type: 'idle', enabled: true, connected: false });
  const [modelLoading, setModelLoading] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [showDebug, setShowDebug] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingUtilsRef = useRef(null);
  const landmarkerRef = useRef(null);
  const requestRef = useRef(null);
  
  // State machine refs
  const stateRef = useRef({
    type: 'idle',
    enabled: true,
    cursorX: window.innerWidth / 2,
    cursorY: window.innerHeight / 2,
    showDebug: false,
    isClickTriggered: false
  });

  // ── Initialization ─────────────────────────────────────────────────────────
  const initMediaPipe = async () => {
    try {
      setModelLoading(true);
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.21/wasm'
      );
      
      landmarkerRef.current = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
          delegate: 'GPU'
        },
        runningMode: 'VIDEO',
        numHands: 1,
        minHandDetectionConfidence: 0.7,
        minHandPresenceConfidence: 0.7,
        minTrackingConfidence: 0.7
      });
      
      setModelLoading(false);
      startCamera();
    } catch (err) {
      console.error('Failed to initialize MediaPipe:', err);
      setModelLoading(false);
      setCameraError(err.message || String(err));
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.addEventListener('loadeddata', predictWebcam);
      }
    } catch (err) {
      console.error('Camera access denied or error:', err);
      setCameraError(err.message || String(err));
    }
  };

  useEffect(() => {
    initMediaPipe();
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // ── Gesture Detection Logic ───────────────────────────────────────────────
  const processLandmarks = (landmarks) => {
    const s = stateRef.current;
    
    if (!s.enabled) {
      setEvent({ type: 'paused', enabled: false, connected: true });
      return;
    }

    const wrist = landmarks[0];

    // Index Finger Landmarks
    const indexMcp = landmarks[5];
    const indexPip = landmarks[6];
    const indexTip = landmarks[8];

    // Middle Finger Landmarks
    const middleMcp = landmarks[9];
    const middlePip = landmarks[10];
    const middleTip = landmarks[12];

    // Ring & Pinky tips
    const ringTip = landmarks[16];
    const pinkyTip = landmarks[20];

    // Check finger states
    const isIndexExtended = indexTip.y < indexPip.y;
    const isMiddleExtended = middleTip.y < middlePip.y;
    const isRingCurled = ringTip.y > landmarks[14].y;
    const isPinkyCurled = pinkyTip.y > landmarks[18].y;

    // Cursor positioning (using Pip and 0.45 smoothing factor like demo)
    const targetX = (1 - indexPip.x) * window.innerWidth;
    const targetY = indexPip.y * window.innerHeight;
    s.cursorX += (targetX - s.cursorX) * 0.45;
    s.cursorY += (targetY - s.cursorY) * 0.45;

    // Clamp coordinates
    s.cursorX = Math.max(0, Math.min(s.cursorX, window.innerWidth - 1));
    s.cursorY = Math.max(0, Math.min(s.cursorY, window.innerHeight - 1));

    // 1. SCROLL UP (Two Fingers Extended)
    if (isIndexExtended && isMiddleExtended && isRingCurled) {
      s.type = 'scrollUp';
      s.isClickTriggered = false;
      window.scrollBy({ top: -16, behavior: 'instant' });
      setEvent({ type: 'scrollUp', enabled: true, connected: true });
      return;
    }

    // 2. SCROLL DOWN (Index Pointing Sideways)
    const dx = Math.abs(indexTip.x - indexMcp.x);
    const dy = Math.abs(indexTip.y - indexMcp.y);
    const isHorizontalPointing = dx > dy * 1.3;

    if (isHorizontalPointing && !isMiddleExtended) {
      s.type = 'scrollDown';
      s.isClickTriggered = false;
      window.scrollBy({ top: 16, behavior: 'instant' });
      setEvent({ type: 'scrollDown', enabled: true, connected: true });
      return;
    }

    // 3. POINT & CLICK (Single Index Finger)
    if (isRingCurled && isPinkyCurled && !isMiddleExtended) {
      const distTipWrist = Math.hypot(indexTip.x - wrist.x, indexTip.y - wrist.y);
      const distPipWrist = Math.hypot(indexPip.x - wrist.x, indexPip.y - wrist.y);
      const isBentToClick = distTipWrist < distPipWrist * 0.94;

      if (isBentToClick) {
        s.type = 'dwell'; // Represents "Fist" state
        if (!s.isClickTriggered) {
          s.isClickTriggered = true;
          
          const element = document.elementFromPoint(s.cursorX, s.cursorY);
          if (element) {
            if (typeof element.click === 'function') {
               element.click();
            } else {
               const clickEvent = new MouseEvent('click', {
                 view: window, bubbles: true, cancelable: true, clientX: s.cursorX, clientY: s.cursorY
               });
               element.dispatchEvent(clickEvent);
            }
          }
          setEvent({ type: 'click', x: s.cursorX, y: s.cursorY, enabled: true, connected: true });
          return;
        }
        setEvent({ type: 'dwell', x: s.cursorX, y: s.cursorY, enabled: true, connected: true });
        return;
      } else {
        s.type = 'move';
        s.isClickTriggered = false;
        setEvent({ type: 'move', x: s.cursorX, y: s.cursorY, enabled: true, connected: true });
        return;
      }
    }

    // 4. Default State
    s.type = 'idle';
    s.isClickTriggered = false;
    setEvent({ type: 'idle', enabled: true, connected: true });
  };

  const predictWebcam = async () => {
    if (!videoRef.current || !landmarkerRef.current) return;
    
    let lastVideoTime = -1;
    
    const step = () => {
      if (videoRef.current && videoRef.current.readyState >= 2) {
        const startTimeMs = performance.now();
        if (lastVideoTime !== videoRef.current.currentTime) {
          lastVideoTime = videoRef.current.currentTime;
          
          try {
            const results = landmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
            
            if (results.landmarks && results.landmarks.length > 0) {
              processLandmarks(results.landmarks[0]);
            } else {
              // No hands detected
              const s = stateRef.current;
              s.type = 'idle';
              s.isClickTriggered = false;
              setEvent(prev => (prev.type !== 'idle' || !prev.connected) ? { type: 'idle', enabled: s.enabled, connected: true } : prev);
            }
            
            // Debug View Drawing
            if (stateRef.current.showDebug && canvasRef.current && videoRef.current) {
              const canvas = canvasRef.current;
              const ctx = canvas.getContext('2d');
              
              if (canvas.width !== videoRef.current.videoWidth) {
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
              }
              
              if (!drawingUtilsRef.current) {
                drawingUtilsRef.current = new DrawingUtils(ctx);
              }
              
              ctx.save();
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              
              // Mirror the output
              ctx.translate(canvas.width, 0);
              ctx.scale(-1, 1);
              
              ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
              
              if (results.landmarks) {
                for (const landmarks of results.landmarks) {
                  drawingUtilsRef.current.drawConnectors(landmarks, HandLandmarker.HAND_CONNECTIONS, {
                    color: "#00e5a0",
                    lineWidth: 3
                  });
                  drawingUtilsRef.current.drawLandmarks(landmarks, { color: "#ffffff", lineWidth: 2, radius: 4 });
                }
              }
              ctx.restore();
            }
          } catch (e) {
            console.error(e);
            setCameraError(e.message || String(e));
          }
        }
      }
      requestRef.current = requestAnimationFrame(step);
    };
    
    step();
  };

  // ── Render Helpers ────────────────────────────────────────────────────────
  const handleToggle = useCallback(() => {
    stateRef.current.enabled = !stateRef.current.enabled;
    setEvent(prev => ({ ...prev, enabled: stateRef.current.enabled }));
  }, []);

  const { type, enabled = true, connected = false } = event;
  
  // Use stateRef for latest cursor pos during render to avoid lag
  const cursorX = stateRef.current.cursorX;
  const cursorY = stateRef.current.cursorY;
  
  const showCursor = (connected || type === 'idle') && enabled && (type === 'move' || type === 'dwell' || type === 'click');
  const showScrollUp = enabled && type === 'scrollUp';
  const showScrollDown = enabled && type === 'scrollDown';
  
  let label = '';
  if (cameraError) label = GESTURE_LABELS.camera_error;
  else if (modelLoading) label = GESTURE_LABELS.loading;
  else if (connected) label = GESTURE_LABELS[type] ?? '';

  const dotColor = {
    move: 'var(--accent)',
    dwell: '#ef4444',
    click: '#ef4444',
  }[type] ?? 'var(--accent)';

  useEffect(() => {
    if (type === 'dwell' || type === 'click') {
      document.body.setAttribute('data-gesture-dwell', 'true');
    } else {
      document.body.removeAttribute('data-gesture-dwell');
    }
  }, [type]);

  return (
    <>
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        autoPlay
        playsInline
        muted
      />

      {/* ── Custom cursor dot ───────────────────────────────────────── */}
      {showCursor && (
        <div
          className={`gc-cursor ${type === 'dwell' || type === 'click' ? 'clicking' : ''}`}
          style={{
            left: cursorX,
            top: cursorY,
            '--dot-color': dotColor,
            transition: 'width 0.1s, height 0.1s, background-color 0.1s'
          }}
        >
        </div>
      )}

      {/* ── Scroll indicator arrows ─────────────────────────────────── */}
      {showScrollUp && (
        <div className="gc-scroll-indicator gc-scroll-up">
          <span className="gc-scroll-icon">▲</span>
          <span className="gc-scroll-text">Scroll Up</span>
        </div>
      )}
      
      {showScrollDown && (
        <div className="gc-scroll-indicator gc-scroll-down">
          <span className="gc-scroll-icon">▼</span>
          <span className="gc-scroll-text">Scroll Down</span>
        </div>
      )}

      {/* ── Gesture HUD label ───────────────────────────────────────── */}
      {label && (
        <div className="gc-hud">
          <span 
            className="gc-hud-dot" 
            style={{ 
              background: connected ? 'var(--accent)' : (modelLoading ? '#f5a623' : '#ff6b6b'),
              animation: modelLoading ? 'gc-dot-pulse 0.8s infinite' : undefined
            }} 
          />
          {label}
        </div>
      )}

      {/* ── Toggle FAB ──────────────────────────────────────────────── */}
      <button
        id="gesture-toggle-btn"
        className={`gc-toggle-fab ${connected ? 'gc-connected' : 'gc-disconnected'} ${!enabled ? 'gc-off' : ''}`}
        onClick={handleToggle}
        title={connected ? (enabled ? 'Disable gestures' : 'Enable gestures') : 'Gesture controller initializing...'}
        aria-label="Toggle hand gesture control"
      >
        <span className="gc-fab-icon">🖐</span>
        <span className="gc-fab-label">
          {cameraError 
            ? 'Camera Error' 
            : modelLoading 
              ? 'Loading AI...' 
              : !connected
                ? 'Gesture: Off'
                : enabled
                  ? 'Gesture: On'
                  : 'Gesture: Paused'}
        </span>
        <span className={`gc-fab-dot ${connected ? (enabled ? 'dot-on' : 'dot-paused') : 'dot-off'}`} />
      </button>

      {/* ── Debug View Toggle Button ──────────────────────────────────── */}
      {connected && (
        <button
          className="gc-debug-btn"
          onClick={() => {
            stateRef.current.showDebug = !stateRef.current.showDebug;
            setShowDebug(stateRef.current.showDebug);
          }}
        >
          {showDebug ? '👁️ Hide Camera' : '👁️ Show Camera'}
        </button>
      )}

      {/* ── Debug View Window ─────────────────────────────────────────── */}
      {showDebug && (
        <div className="gc-debug-window">
          <div className="gc-debug-title">Gesture Camera Preview</div>
          <canvas ref={canvasRef} className="gc-debug-canvas" />
        </div>
      )}
    </>
  );
}
