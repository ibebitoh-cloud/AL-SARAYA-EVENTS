import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './light-accents.css';

createRoot(document.getElementById('root')!).render(<App />);

// The spinning D from index.html stays up for at least a moment after the app is ready, then fades out.
const splash = document.getElementById('dali-splash');
if (splash) {
  window.setTimeout(() => {
    splash.classList.add('is-done');
    window.setTimeout(() => splash.remove(), 500);
  }, Math.max(0, 1400 - performance.now()));
}
