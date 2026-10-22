import type { ReactNode } from 'react';

// A soft, slowly drifting gradient in honey, amber and peach, with a faint dot texture.
// Children render on top. Motion stops for visitors who prefer reduced motion.

interface HoneyEmberBackgroundProps {
  children?: ReactNode;
  className?: string;
}

const CSS = `
.heb{position:relative;isolation:isolate;overflow:hidden;background:#fff8e4}
.heb-blob{position:absolute;border-radius:9999px;filter:blur(70px);pointer-events:none;z-index:0;will-change:transform}
.heb-blob.a{width:70vmax;height:70vmax;left:-18vmax;top:-22vmax;background:#fcc94f;animation:heb-a 26s ease-in-out infinite alternate}
.heb-blob.b{width:62vmax;height:62vmax;left:28vmax;top:-6vmax;background:#f5b335;opacity:.9;animation:heb-b 30s ease-in-out infinite alternate}
.heb-blob.c{width:80vmax;height:64vmax;left:8vmax;bottom:-30vmax;background:#fdbcae;animation:heb-c 34s ease-in-out infinite alternate}
.heb-blob.d{width:50vmax;height:50vmax;right:-20vmax;bottom:-18vmax;background:#fff3dc;animation:heb-d 22s ease-in-out infinite alternate}
.heb-dots{position:absolute;inset:0;z-index:1;pointer-events:none;opacity:.14;background-image:radial-gradient(#ffffff 1px,transparent 1.2px);background-size:9px 9px}
.heb-content{position:relative;z-index:2}
@keyframes heb-a{to{transform:translate(10vmax,8vmax) scale(1.08)}}
@keyframes heb-b{to{transform:translate(-8vmax,6vmax) scale(1.12)}}
@keyframes heb-c{to{transform:translate(-12vmax,-6vmax) scale(.94)}}
@keyframes heb-d{to{transform:translate(-6vmax,-8vmax) scale(1.1)}}
@media (prefers-reduced-motion: reduce){.heb-blob{animation:none!important}}
`;

export function HoneyEmberBackground({ children, className = '' }: HoneyEmberBackgroundProps) {
  return (
    <div className={`heb ${className}`}>
      <style>{CSS}</style>
      <div className="heb-blob a" aria-hidden="true" />
      <div className="heb-blob b" aria-hidden="true" />
      <div className="heb-blob c" aria-hidden="true" />
      <div className="heb-blob d" aria-hidden="true" />
      <div className="heb-dots" aria-hidden="true" />
      <div className="heb-content h-full w-full">{children}</div>
    </div>
  );
}
