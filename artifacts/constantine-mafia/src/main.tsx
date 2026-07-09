import { createRoot } from 'react-dom/client';

import App from './App';

import './index.css';

// THREE.Clock was deprecated in r165 in favour of THREE.Timer.
// @react-three/fiber 9.x still uses Clock internally — suppress that warning
// until R3F ships an update.  All other console.warn traffic is unaffected.
const _warn = console.warn.bind(console);
console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].includes('THREE.Clock')) return;
  _warn(...args);
};

createRoot(document.getElementById('root')!).render(<App />);
