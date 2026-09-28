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
      if (content.includes("fetch('/api/") || content.includes("fetch(`/api/")) {
        const depth = fullPath.split(path.sep).length - path.resolve('d:/QUESTION TIME CHANGER/src').split(path.sep).length;
        let importPath = '../'.repeat(depth - 1) + 'config';
        if (depth === 1) importPath = './config';
        content = `import { API_BASE_URL } from '${importPath}';\n` + content;
        content = content.replace(/fetch\('\/api\//g, "fetch(`${API_BASE_URL}/api/");
        content = content.replace(/fetch\(`\/api\//g, "fetch(`${API_BASE_URL}/api/");
        content = content.replace(/src=\{currentQuestion.image_url\}/g, "src={currentQuestion.image_url?.startsWith('http') ? currentQuestion.image_url : `${API_BASE_URL}${currentQuestion.image_url}`}");
        content = content.replace(/src=\{editingQuestion.image_url\}/g, "src={editingQuestion.image_url?.startsWith('http') ? editingQuestion.image_url : `${API_BASE_URL}${editingQuestion.image_url}`}");
        content = content.replace(/src=\{q.image_url\}/g, "src={q.image_url?.startsWith('http') ? q.image_url : `${API_BASE_URL}${q.image_url}`}");
        fs.writeFileSync(fullPath, content);
        console.log('Updated ' + fullPath);
      }
    }
  }
}
processDir('d:/QUESTION TIME CHANGER/src');
