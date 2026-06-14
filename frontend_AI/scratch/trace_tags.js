import fs from 'fs';

const content = fs.readFileSync('app/pages/index.vue', 'utf-8');
const tagRegex = /<(\/?[a-zA-Z0-9:-]+)(?:\s+[^>]*?)?>/g;
let match;
const stack = [];
const lines = content.split('\n');

function getLineNumber(index) {
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    count += lines[i].length + 1;
    if (count > index) return i + 1;
  }
  return lines.length;
}

console.log('Tracing tag stack...');
while ((match = tagRegex.exec(content)) !== null) {
  if (match.index >= content.indexOf('</template>')) break;
  if (match.index < content.indexOf('<template>') + '<template>'.length) continue;

  const fullTag = match[0];
  const tagName = match[1];
  const lineNum = getLineNumber(match.index);

  if (fullTag.endsWith('/>') || ['img', 'br', 'hr', 'input', 'link', 'meta'].includes(tagName.toLowerCase())) {
    continue;
  }

  if (tagName.toLowerCase() === 'div' || tagName.toLowerCase() === '/div') {
    if (tagName.startsWith('/')) {
      if (stack.length === 0) {
        console.log(`[Line ${lineNum}] Error: Closed </div> but stack is empty!`);
      } else {
        const last = stack.pop();
        console.log(`[Line ${lineNum}] Popped <div> (opened at line ${last.line}). Stack size is now ${stack.length}`);
      }
    } else {
      stack.push({ name: tagName, line: lineNum });
      console.log(`[Line ${lineNum}] Pushed <div>. Stack size is now ${stack.length}`);
    }
  }
}

console.log('\nFinal Stack size:', stack.length);
if (stack.length > 0) {
  console.log('Remaining divs on stack:');
  stack.forEach(t => console.log(`- <div> opened at line ${t.line}`));
}
