// --------- src/index.js ---------
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './chatApp.css';

// 1) Grab the <div id="root"> from your public/index.html
const container = document.getElementById('root');

// 2) Tell React to manage that container
const root = createRoot(container);

// 3) Render your App
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
