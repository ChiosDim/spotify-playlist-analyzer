import { Routes, Route, Link } from "react-router-dom";
import * as Sentry from "@sentry/react";

function Home() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Spotify Playlist Analyzer</h1>
      <p className="mb-4">Frontend is running.</p>
      <Link to="/about" className="btn btn-primary">
        Go to About
      </Link>
    </div>
  );
}

function About() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">About</h1>
      <Link to="/" className="btn btn-ghost">
        Back home
      </Link>
    </div>
  );
}

export default function App() {
  return (
    <Sentry.ErrorBoundary fallback={<p className="p-8">Something went wrong.</p>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
      </Routes>
    </Sentry.ErrorBoundary>
  );
}
