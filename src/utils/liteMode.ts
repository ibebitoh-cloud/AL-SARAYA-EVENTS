// "Lite mode" for slow, low-memory devices (e.g. a 2016 Galaxy Tab A with 2 GB of RAM).
// index.html decides it before the page draws and puts the `lite` class on <html>:
//   - automatically when the browser reports 2 GB of memory or less, 2 CPU cores or less,
//     Data Saver, or "reduce motion";
//   - or by hand: open the site once with ?lite=1 (turn on) or ?lite=0 (turn off); the choice is remembered.
// In lite mode the page drops glass blur, the moving background and decorative motion,
// and motion components only fade (no slides, scales or springs).
export const isLiteMode = (): boolean =>
  typeof document !== 'undefined' && document.documentElement.classList.contains('lite');
