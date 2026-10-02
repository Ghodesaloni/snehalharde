const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const files = [
  'server/data/candidates.json',
  'server/data/interviews.json',
  'server/data/jobs.json',
  'server/data/resumes.json'
];

for (const relPath of files) {
  const fullPath = path.resolve(__dirname, '../../', relPath);
  try {
    const headRaw = execSync(`git show :2:"${relPath}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');
    const remoteRaw = execSync(`git show :3:"${relPath}"`, { maxBuffer: 50 * 1024 * 1024 }).toString('utf8');

    const headData = JSON.parse(headRaw);
    const remoteData = JSON.parse(remoteRaw);

    const mergedMap = new Map();

    if (Array.isArray(remoteData)) {
      for (const item of remoteData) {
        if (item && item.id) mergedMap.set(item.id, item);
      }
    }

    if (Array.isArray(headData)) {
      for (const item of headData) {
        if (item && item.id) mergedMap.set(item.id, item);
      }
    }

    const mergedList = Array.from(mergedMap.values());
    fs.writeFileSync(fullPath, JSON.stringify(mergedList, null, 2), 'utf8');
    console.log(`Successfully merged ${relPath}: ${mergedList.length} total unique items.`);
  } catch (err) {
    console.error(`Error resolving ${relPath}:`, err.message);
  }
}
