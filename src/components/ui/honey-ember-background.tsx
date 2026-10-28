import type { ReactNode } from 'react';

// An opulent, cinematic ambient background for SARAYA EVENT.
// Supports both Dark Mode (Imperial Midnight Obsidian & Gold Embers)
// and Light Mode (Royal Alabaster & Warm Champagne Pearl).
// Motion stops for visitors who prefer reduced motion.

interface HoneyEmberBackgroundProps {
  children?: ReactNode;
  className?: string;
  theme?: 'dark' | 'light';
}

const CSS = `
.rpb{position:relative;isolation:isolate;overflow:hidden;transition:background-color .4s ease}
.rpb.dark{background:#070b12}
.rpb.light{background:#faf9f6}

.rpb-blob{position:absolute;border-radius:9999px;filter:blur(90px);pointer-events:none;z-index:0;will-change:transform}

/* Dark mode palette: Deep sapphire night with warm gold amber glows */
.rpb.dark .rpb-blob.a{width:75vmax;height:75vmax;left:-20vmax;top:-25vmax;background:radial-gradient(circle,rgba(217,119,6,0.18) 0%,rgba(15,23,42,0) 70%);animation:rpb-a 28s ease-in-out infinite alternate}
.rpb.dark .rpb-blob.b{width:65vmax;height:65vmax;right:-15vmax;top:10vmax;background:radial-gradient(circle,rgba(30,27,75,0.45) 0%,rgba(15,23,42,0) 70%);opacity:.9;animation:rpb-b 32s ease-in-out infinite alternate}
.rpb.dark .rpb-blob.c{width:80vmax;height:70vmax;left:10vmax;bottom:-30vmax;background:radial-gradient(circle,rgba(180,83,9,0.15) 0%,rgba(7,11,18,0) 70%);animation:rpb-c 36s ease-in-out infinite alternate}
.rpb.dark .rpb-blob.d{width:55vmax;height:55vmax;right:10vmax;bottom:-15vmax;background:radial-gradient(circle,rgba(245,158,11,0.12) 0%,rgba(15,23,42,0) 70%);animation:rpb-d 24s ease-in-out infinite alternate}
.rpb.dark .rpb-dots{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.18;background-image:radial-gradient(rgba(245,158,11,0.5) 1px,transparent 1.2px);background-size:16px 16px}

/* Light mode palette: Royal alabaster & champagne marble */
.rpb.light .rpb-blob.a{width:75vmax;height:75vmax;left:-18vmax;top:-22vmax;background:radial-gradient(circle,rgba(254,243,199,0.7) 0%,rgba(250,249,246,0) 70%);animation:rpb-a 28s ease-in-out infinite alternate}
.rpb.light .rpb-blob.b{width:65vmax;height:65vmax;right:-10vmax;top:-5vmax;background:radial-gradient(circle,rgba(253,230,138,0.5) 0%,rgba(250,249,246,0) 70%);opacity:.9;animation:rpb-b 32s ease-in-out infinite alternate}
.rpb.light .rpb-blob.c{width:80vmax;height:70vmax;left:5vmax;bottom:-30vmax;background:radial-gradient(circle,rgba(254,215,170,0.45) 0%,rgba(250,249,246,0) 70%);animation:rpb-c 36s ease-in-out infinite alternate}
.rpb.light .rpb-blob.d{width:55vmax;height:55vmax;right:-15vmax;bottom:-18vmax;background:radial-gradient(circle,rgba(243,244,246,0.8) 0%,rgba(250,249,246,0) 70%);animation:rpb-d 24s ease-in-out infinite alternate}
.rpb.light .rpb-dots{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.09;background-image:radial-gradient(rgba(180,83,9,0.6) 1px,transparent 1.2px);background-size:14px 14px}

.rpb-content{position:relative;z-index:2}
@keyframes rpb-a{to{transform:translate(8vmax,6vmax) scale(1.06)}}
@keyframes rpb-b{to{transform:translate(-7vmax,5vmax) scale(1.1)}}
@keyframes rpb-c{to{transform:translate(-10vmax,-5vmax) scale(.95)}}
@keyframes rpb-d{to{transform:translate(-5vmax,-6vmax) scale(1.08)}}
@media (prefers-reduced-motion: reduce){.rpb-blob{animation:none!important}}
`;

export function HoneyEmberBackground({ children, className = '', theme = 'dark' }: HoneyEmberBackgroundProps) {
  return (
    <div className={`rpb ${theme} ${className}`}>
      <style>{CSS}</style>
      <div className="rpb-blob a" aria-hidden="true" />
      <div className="rpb-blob b" aria-hidden="true" />
      <div className="rpb-blob c" aria-hidden="true" />
      <div className="rpb-blob d" aria-hidden="true" />
      <div className="rpb-dots" aria-hidden="true" />
      <div className="rpb-content h-full w-full">{children}</div>
    </div>
  );
}
