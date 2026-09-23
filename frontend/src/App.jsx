import { useState } from 'react'
import * as Sentry from "@sentry/react";
import './App.css'

function App() {

  return (
    <Sentry.ErrorBoundary
      fallback={<p>Something went wrong. Please refresh.</p>}
    >
      {/* Your routes and layout go here */}
    </Sentry.ErrorBoundary>
  );
}

export default App
