// The animation engine for motion's `m` components. main.tsx loads it on its own after the first
// paint (LazyMotion), so it is not part of the first JavaScript download.
// domMax (not domAnimation) because the header and language pill use `layout` animations.
export { domMax as default } from 'motion/react';
