const fs = require("fs");
const path = require("path");

const DATA_DIR = path.resolve(__dirname, "../data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error("Failed to create data directory:", err);
  }
}

function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readData(collection, defaultData = []) {
  try {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) {
      // Initialize with default data
      writeData(collection, defaultData);
      return defaultData;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${collection} database:`, err);
    return defaultData;
  }
}

function writeData(collection, data) {
  try {
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error(`Error writing ${collection} database:`, err);
    return false;
  }
}

module.exports = {
  readData,
  writeData,
};
