const fs = require('fs');
const path = require('path');

// Get current time formatted as **time AM/PM** -
const now = new Date();
const hours = now.getHours();
const minutes = now.getMinutes().toString().padStart(2, '0');
const ampm = hours >= 12 ? 'PM' : 'AM';
const displayHours = hours % 12 || 12;
const timeStamp = `**${displayHours}:${minutes} ${ampm}** -`;

// Get today's date for the filename
const year = now.getFullYear();
const month = now.getMonth() + 1;
const day = now.getDate();
const pbpFilename = `${year}-${month}-${day}-pbp.md`;
const pbpPath = path.join(__dirname, 'posts/daily', pbpFilename);

// Read today.md
const todayPath = path.join(__dirname, 'today.md');
const entry = fs.readFileSync(todayPath, 'utf8').trim();

if (!entry) {
  console.log('today.md is empty — nothing to log.');
  process.exit();
}

// Create pbp file if it doesn't exist yet
if (!fs.existsSync(pbpPath)) {
  const dateStr = `${month}/${day}/${year}`;
  const frontmatter = `---\ntitle: ${month}/${day} — Play by Play\ndate: ${dateStr}\n---\n\n`;
  fs.writeFileSync(pbpPath, frontmatter);
  console.log(`Created new pbp file: ${pbpFilename}`);
}

// Append the entry
const newEntry = `${timeStamp} ${entry}\n`;
fs.appendFileSync(pbpPath, '\n' + newEntry);

// Clear today.md
fs.writeFileSync(todayPath, '');

console.log(`Logged at ${displayHours}:${minutes} ${ampm} → ${pbpFilename}`);