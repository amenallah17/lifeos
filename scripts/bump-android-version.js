const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let content = fs.readFileSync(gradlePath, 'utf-8');

const match = content.match(/versionCode (\d+)/);
if (!match) {
  console.error('Could not find versionCode in build.gradle');
  process.exit(1);
}

const current = parseInt(match[1], 10);
const next = current + 1;
content = content.replace(/versionCode \d+/, `versionCode ${next}`);

const nameMatch = content.match(/versionName "([\d.]+)"/);
if (nameMatch) {
  const parts = nameMatch[1].split('.');
  parts[parts.length - 1] = String(next);
  content = content.replace(/versionName "[^"]+"/, `versionName "${parts.join('.')}"`);
}

fs.writeFileSync(gradlePath, content, 'utf-8');
console.log(`Bumped Android versionCode ${current} → ${next}`);
