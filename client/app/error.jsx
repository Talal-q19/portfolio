'use client';
export default function Error({ reset }) {
  return <div role="alert" className="py-24 text-center">
    <p>Portfolio content is temporarily unavailable.</p>
    <button type="button" onClick={reset} className="mt-4 rounded border border-white/30 px-5 py-3">Try again</button>
  </div>;
}
