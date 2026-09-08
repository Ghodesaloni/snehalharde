const path = require("path");
const express = require("express");
const apiRouter = require("./server/routes");

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = "all";
    const originalSetupMiddlewares = devServerConfig.setupMiddlewares;
    devServerConfig.setupMiddlewares = (middlewares, devServer) => {
      devServer.app.use(express.json({ limit: "25mb" }));
      devServer.app.use(express.urlencoded({ extended: true, limit: "25mb" }));
      devServer.app.use("/api", apiRouter);

      if (originalSetupMiddlewares) {
        return originalSetupMiddlewares(middlewares, devServer);
      }
      return middlewares;
    };
    return devServerConfig;
  },
};
