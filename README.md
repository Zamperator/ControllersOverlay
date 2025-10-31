# Twitch Controller Support

> Overlay & input visualizer for Twitch streams using the HTML5 Gamepad API.  
> Built with React (JSX), styled with CSS3.

**Version:** 0.1.8
**Author:** Zamperator

## Running example
https://zamperia.de/controllers/?device=xbox

## Table of Contents
- [Features](#features)
- [Supported Controllers](#supported-controllers)
- [Requirements](#requirements)
- [Installation](#installation)
- [Start Development](#start-development)
- [Production Build](#production-build)
- [Usage](#usage)
- [Tips & Troubleshooting](#tips--troubleshooting)
- [Roadmap / TODO](#roadmap--todo)
- [Contributing](#contributing)
- [License](#license)

---

## Features
- Live visualization of controller inputs
- Multiple layouts (gamepads, sticks, flight)
- React frontend (ES6/JSX)
- Uses the **HTML5 Gamepad API** (no plugins)
- Customizable CSS styling

## Supported Controllers
- HotasX
- T16000 (Single) + TWS
- SNES
- NES
- N64
- GameCube
- Xbox One Controller
- Mega Drive 6-Button Controller
- Arcade sticks (various PS2/PS3/PS4 models)

> More devices are planned—see the [Roadmap](#roadmap--todo).

## Requirements
- Node.js (current LTS recommended)
- Yarn
- A modern browser with **Gamepad API** support (Chrome, Edge, Firefox)

## Installation
```bash
git clone git@github.com:Zamperator/ControllersOverlay.git
cd ControllersOverlay
yarn install
```

## Start Development
```bash
yarn dev
```
Open `http://localhost:3000`.

> Connect your controller via USB/Bluetooth and trigger **at least one input** so the Gamepad API detects and activates the device.

## Production Build
```bash
yarn build
```
The built bundle (e.g., in `dist/`) can be served by any static web server.

### IMPORTANT
**Local font required:**  
Download the **Orbitron** & **Anton** fonts from Google Fonts and place the files in `public/fonts/`.
This project does **not** serve fonts from a CDN and does **not** use `<link href="https://...">`
for privacy reasons (GDPR).\
https://fonts.google.com/specimen/Orbitron
https://fonts.google.com/specimen/Anton
**Expected path:**
```
public/
  fonts/
    anton-v27-latin-regular.woff2
    obitron-v35-latin-regular.woff2
```

## Usage
1. Run locally **or** host the built version
2. Connect a controller and perform one input
3. Add it to OBS/Streamlabs as a **Browser Source** (use your local or hosted URL)

**OBS Notes**
- Set the Browser Source size to match your scene layout
- Enable hardware acceleration in OBS for better performance

## Tips & Troubleshooting
- **Gamepad not detected?**
    - Press a button/move a stick (initializes the API)
    - Check cable / re-pair Bluetooth
    - In Chrome/Edge, inspect via `chrome://gamepad`
- **Multiple controllers**
    - Disconnect unused devices to simplify mapping
- **Browser interaction**
    - Some browsers require a click/key before inputs appear
- **Performance**
    - Set appropriate FPS for the Browser Source (e.g., 60)
    - Close GPU/CPU-heavy tabs

## Roadmap / TODO
- [ ] Add more controller layouts
- [ ] Improve UI/UX (skins/themes, options)
- [ ] Cleanup & refactor codebase and CSS
- [ ] Configurable per-device mappings
- [ ] Document OBS presets

## Contributing
Contributions welcome!
- Open issues for bugs/feature requests
- Submit PRs with clear descriptions
- Follow project conventions (React/JSX, Yarn)

## License
MIT License
