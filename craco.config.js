require("dotenv").config();
const path = require("path");
const express = require("express");
const apiRouter = require("./server/routes");

// Fix invalid or non-numeric WDS_SOCKET_PORT (such as "ws://localhost:3000") which causes
// webpack-dev-server client to format WebSocket URL as ":NaN/ws"
if (
  process.env.WDS_SOCKET_PORT &&
  (isNaN(Number(process.env.WDS_SOCKET_PORT)) || !/^\d+$/.test(String(process.env.WDS_SOCKET_PORT).trim()))
) {
  delete process.env.WDS_SOCKET_PORT;
}

module.exports = {
  webpack: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    configure: (webpackConfig) => {
      const definePlugin = webpackConfig.plugins.find(
        (plugin) => plugin && plugin.constructor && plugin.constructor.name === "DefinePlugin"
      );
      if (definePlugin && definePlugin.definitions && definePlugin.definitions["process.env"]) {
        const envDefs = definePlugin.definitions["process.env"];
        if (
          envDefs.WDS_SOCKET_PORT &&
          (envDefs.WDS_SOCKET_PORT.includes("ws://") || envDefs.WDS_SOCKET_PORT === '"NaN"')
        ) {
          delete envDefs.WDS_SOCKET_PORT;
        }
      }
      return webpackConfig;
    },
  },
  devServer: (devServerConfig) => {
    devServerConfig.allowedHosts = "all";

    if (devServerConfig.client && devServerConfig.client.webSocketURL) {
      if (typeof devServerConfig.client.webSocketURL === "object") {
        const port = devServerConfig.client.webSocketURL.port;
        if (port !== undefined && (isNaN(Number(port)) || !/^\d+$/.test(String(port).trim()))) {
          delete devServerConfig.client.webSocketURL.port;
        }
      }
    }

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
