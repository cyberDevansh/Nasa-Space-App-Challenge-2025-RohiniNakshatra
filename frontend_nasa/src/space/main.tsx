import React from 'react';
import { createRoot } from 'react-dom/client';
import { SolarSystemBackground } from './solar/SolarSystemBackground';

const containerId = 'solar-root';
let container = document.getElementById(containerId);
if (!container) {
  container = document.createElement('div');
  container.id = containerId;
  document.body.appendChild(container);
}

const root = createRoot(container);
root.render(<SolarSystemBackground />);

