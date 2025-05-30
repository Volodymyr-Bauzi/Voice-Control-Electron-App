const fs = require('fs');
const path = require('path');

console.log('Current working directory:', process.cwd());
console.log('__dirname:', __dirname);

const wakeWord = 'hey flexi';
const formattedWakeWord = wakeWord.trim().replace(/\s+/g, '_');

const possiblePaths = [
  // Development paths
  path.join(__dirname, 'resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
  path.join(__dirname, 'src/main/resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
  path.join(__dirname, '../resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
  path.join(__dirname, '../../resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
  
  // Production paths
  ...(process.resourcesPath ? [
    path.join(process.resourcesPath, 'resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
    path.join(process.resourcesPath, 'app/resources/models/keywords', `${formattedWakeWord}_windows.ppn`),
    path.join(process.resourcesPath, 'app.asar.unpacked/resources/models/keywords', `${formattedWakeWord}_windows.ppn`)
  ] : [])
];

console.log('\nChecking for wake word file at these locations:');
let found = false;
for (const p of possiblePaths) {
  const exists = fs.existsSync(p);
  console.log(`${exists ? '✅ FOUND   ' : '❌ MISSING '} ${p}`);
  if (exists) {
    found = true;
    console.log(`   File size: ${fs.statSync(p).size} bytes`);
    console.log(`   Last modified: ${fs.statSync(p).mtime}`);
  }
}

if (!found) {
  console.log('\n❌ Could not find wake word file in any of the checked locations.');
  console.log('Please make sure the file exists at one of these paths:');
  possiblePaths.forEach(p => console.log(`- ${p}`));
} else {
  console.log('\n✅ Found wake word file!');
}
