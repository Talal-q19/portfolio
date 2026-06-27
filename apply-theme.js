const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'app/components/homepage');

function traverseAndReplace(currentDir) {
  const files = fs.readdirSync(currentDir);
  for (const file of files) {
    const fullPath = path.join(currentDir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      traverseAndReplace(fullPath);
    } else if (fullPath.endsWith('.jsx') || fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Cinematic Gold
      content = content.replace(/#64d8ff/gi, '#D4AF37');
      content = content.replace(/#16f2b3/gi, '#D4AF37');
      
      // Cinematic Amber
      content = content.replace(/#ffcf70/gi, '#F59E0B');
      
      // Card Backgrounds
      content = content.replace(/#132538/gi, '#151515');
      content = content.replace(/#0a1422/gi, '#101010');
      
      // Muted Borders
      content = content.replace(/#203247/gi, '#262626');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

traverseAndReplace(dir);
console.log('Colors replaced successfully!');
