import Navbar from "./Navbar";

export default function Layout({ children }) {
  return (
    <div className="min-h-full flex flex-col bg-base-200">
      <Navbar />
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-8">{children}</main>
      <footer className="footer footer-center p-4 bg-base-100 text-base-content/50 text-xs">
        <p>Spotify Playlist Analyzer</p>
      </footer>
    </div>
  );
}
