const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf-8');
      
      // Fix single quoted template strings
      content = content.replace(/fetch\(`\$\{API_BASE_URL\}\/api\/([a-zA-Z0-9_/$\{\}]+)'\)/g, "fetch(`${API_BASE_URL}/api/$1`)");
      // Fix double quoted template strings (if any)
      content = content.replace(/fetch\(`\$\{API_BASE_URL\}\/api\/([a-zA-Z0-9_/$\{\}]+)"\)/g, "fetch(`${API_BASE_URL}/api/$1`)");
      
      // Also fix fetch options like fetch(`${API_BASE_URL}/api/questions', {
      content = content.replace(/fetch\(`\$\{API_BASE_URL\}\/api\/([a-zA-Z0-9_]+)',/g, "fetch(`${API_BASE_URL}/api/$1`,");

      // More robust generic replace for any string ending in ' that started with `
      content = content.replace(/`(\$\{API_BASE_URL\}\/api\/[^`']*?)'/g, "`$1`");

      fs.writeFileSync(fullPath, content);
      console.log('Fixed ' + fullPath);
    }
  }
}
processDir('d:/QUESTION TIME CHANGER/src');
