const fs = require('fs');
const path = require('path');

const rootDir = 'd:/QUESTION TIME CHANGER';
const frontendDir = path.join(rootDir, 'frontend');
const backendDir = path.join(rootDir, 'backend');

// Create directories
if (!fs.existsSync(frontendDir)) fs.mkdirSync(frontendDir);
if (!fs.existsSync(backendDir)) fs.mkdirSync(backendDir);

// Read package.json
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));

// Backend package.json
const backendPkg = {
  name: "technical-question-challenge-backend",
  version: "1.0.0",
  type: "commonjs",
  scripts: {
    start: "node api/index.js"
  },
  dependencies: {
    "@vercel/postgres": pkg.dependencies["@vercel/postgres"],
    "cors": pkg.dependencies["cors"],
    "express": pkg.dependencies["express"],
    "multer": pkg.dependencies["multer"]
  }
};
fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(backendPkg, null, 2));

// Frontend package.json
const frontendPkg = {
  name: "technical-question-challenge-frontend",
  version: "1.0.0",
  type: "module",
  scripts: {
    dev: "vite",
    build: "tsc -b && vite build",
    preview: "vite preview"
  },
  dependencies: {
    "@tailwindcss/vite": pkg.dependencies["@tailwindcss/vite"],
    "lucide-react": pkg.dependencies["lucide-react"],
    "mammoth": pkg.dependencies["mammoth"],
    "papaparse": pkg.dependencies["papaparse"],
    "react": pkg.dependencies["react"],
    "react-dom": pkg.dependencies["react-dom"],
    "react-router-dom": pkg.dependencies["react-router-dom"],
    "tailwindcss": pkg.dependencies["tailwindcss"]
  },
  devDependencies: pkg.devDependencies
};
fs.writeFileSync(path.join(frontendDir, 'package.json'), JSON.stringify(frontendPkg, null, 2));

// Move directories
const move = (src, dest) => {
  const fullSrc = path.join(rootDir, src);
  if (fs.existsSync(fullSrc)) {
    fs.renameSync(fullSrc, path.join(rootDir, dest, src));
  }
};

['src', 'public', 'index.html', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json'].forEach(file => move(file, 'frontend'));
['api', 'vercel.json'].forEach(file => move(file, 'backend'));

// Remove old package.json
fs.unlinkSync(path.join(rootDir, 'package.json'));

console.log("Restructuring complete!");
