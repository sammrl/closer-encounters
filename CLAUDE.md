# Simplified UFO Sightings Globe Project

This project is a simplified version of the UFO Sightings Globe visualization that resolves the tooltip and interaction issues encountered in the original implementation.

## Features

- Interactive 3D globe visualization using react-globe.gl
- Randomly generated UFO sighting data displayed as points
- Custom tooltips that display sighting information on hover
- Modal popup with detailed information when clicking on a sighting
- Auto-rotating globe that pauses when interacting with points
- Responsive design that works on various screen sizes

## Project Structure

- `src/App.tsx` - Main application component with globe implementation
- `src/App.css` - Styling for the modal and other UI elements
- `src/index.css` - Global styling including Tailwind configuration
- `public/index.html` - HTML template with font imports

## Installation

1. Clone the repository
2. Navigate to the project directory
3. Run `npm install` to install dependencies
4. Run `npm start` to start the development server

## Technology Stack

- React (with TypeScript)
- react-globe.gl for 3D globe visualization
- Three.js (v0.124.0) for WebGL rendering
- Tailwind CSS for utility-first styling

## Improvements over Previous Version

- Resolved tooltip display issues with custom tooltips
- Fixed event propagation issues with proper event handling
- Improved UI/UX with responsive modals and globe interaction
- Better performance through proper component memoization (as per react-globe.gl documentation)
- More user-friendly data visualization

## Development Notes

- When adding object/array props to the Globe component, be sure to memoize them using useMemo to prevent infinite re-renders
- Use proper event handling when interacting with the globe
- The globe's controls can be accessed via the ref (globeEl.current.controls())
- Custom tooltips are implemented as HTML strings through the pointLabel prop