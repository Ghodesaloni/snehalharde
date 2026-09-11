require("dotenv").config();
const express = require("express");
const path = require("path");
const cors = require("cors");
const apiRouter = require("./routes");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));

// Mount API routes
app.use("/api", apiRouter);

// Serve static frontend build in production
const distPath = path.resolve(__dirname, "../dist");
app.use(express.static(distPath));

// Fallback for React Router SPA routes
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) {
    return res.status(404).json({ error: "Endpoint not found" });
  }
  res.sendFile(path.join(distPath, "index.html"));
});

if (require.main === module) {
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`AvaHire HR Portal server listening on port ${PORT}`);
  });
}

module.exports = app;
