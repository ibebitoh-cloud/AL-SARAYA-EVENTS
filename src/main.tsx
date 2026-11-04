import {createRoot} from 'react-dom/client';
import {LazyMotion, MotionConfig} from 'motion/react';
import App from './App.tsx';
import {isLiteMode} from './utils/liteMode';
import './index.css';
import './light-accents.css';

// Components use motion's light `m` elements; the animation engine downloads separately.
const loadMotionFeatures = () => import('./lib/motionFeatures').then((mod) => mod.default);

createRoot(document.getElementById('root')!).render(
  <LazyMotion features={loadMotionFeatures}>
    {/* On weak devices, keep only fades (no transforms, springs or layout moves). */}
    <MotionConfig reducedMotion={isLiteMode() ? 'always' : 'user'}>
      <App />
    </MotionConfig>
  </LazyMotion>,
);

// The DALI loader from index.html stays up for at least a moment after the app is ready, then fades out.
const splash = document.getElementById('dali-splash');
if (splash) {
  window.setTimeout(() => {
    splash.classList.add('is-done');
    window.setTimeout(() => splash.remove(), 500);
  }, Math.max(0, 1400 - performance.now()));
}
