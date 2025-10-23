import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

// Set document title from RESUME.json profile.name
import resumeData from './data/RESUME.json';
const profileName = (resumeData as any)?.profile?.name ?? '';
if (profileName) {
  document.title = `${profileName} - CV`;
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);