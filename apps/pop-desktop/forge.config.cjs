const { VitePlugin } = require("@electron-forge/plugin-vite");
const { MakerZIP } = require("@electron-forge/maker-zip");

module.exports = {
  packagerConfig: { asar: true, executableName: "Pop" },
  makers: [new MakerZIP({}, ["win32", "darwin", "linux"])],
  plugins: [
    new VitePlugin({
      build: [
        { entry: "src/main.ts", config: "vite.main.config.mts", target: "main" },
        { entry: "src/preload.ts", config: "vite.preload.config.mts", target: "preload" },
      ],
      renderer: [{ name: "main_window", config: "vite.renderer.config.mts" }],
    }),
  ],
};
