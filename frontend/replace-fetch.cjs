const fs = require('fs');
const path = require('path');

const walk = (dir) => {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      results.push(file);
    }
  });
  return results;
};

const files = walk('src');

files.forEach(file => {
  if (file.includes('utils\\api.ts') || file.includes('utils/api.ts')) return;
  
  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  // fetch('/api/...') -> fetch(`${API_URL}/...`)
  content = content.replace(/fetch\('(\/api[^']+)'/g, "fetch(`${API_URL}$1`.replace('/api', ''))");
  
  // fetch(`/api/...`) -> fetch(`${API_URL}/...`)
  content = content.replace(/fetch\(\`(\/api[^\`]+)\`/g, "fetch(`${API_URL}$1`.replace('/api', ''))");
  
  // const url = formData.id ? `/api/...` : '/api/...';
  content = content.replace(/const url = formData.id \? \`(\/api[^\`]+)\` : '(\/api[^']+)';/g, "const url = formData.id ? `${API_URL}$1`.replace('/api', '') : `${API_URL}$2`.replace('/api', '');");

  if (content !== original) {
    const depth = file.split(path.sep).length;
    const relativePath = depth > 2 ? '../'.repeat(depth - 2) : './';
    content = `import { API_URL } from '${relativePath}utils/api';\n` + content;
    fs.writeFileSync(file, content);
    console.log(`Updated ${file}`);
  }
});
