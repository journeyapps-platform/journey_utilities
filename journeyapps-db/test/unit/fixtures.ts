let schema3Xml: string;

function nodeReadFile(file: string) {
  console.log('noderead', file);
  const fs = require('fs');
  const path = require('path');
  return fs.readFileSync(path.join(__dirname, file), 'utf-8');
}

const isNode = typeof process !== 'undefined' && process.versions != null && process.versions.node != null;

if (isNode) {
  schema3Xml = nodeReadFile('../fixtures/schema3.xml');
} else {
  schema3Xml = require('!!raw-loader!../fixtures/schema3.xml').default;
}

export { schema3Xml };
