// Learn more https://docs.expo.dev/guides/customizing-metro
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(projectRoot);
config.watchFolders = [monorepoRoot];

const reactDevToolsSettingsStub = path.join(
  projectRoot,
  "shims/ReactDevToolsSettingsManager.web.js",
);

const upstreamResolveRequest =
  typeof config.resolver.resolveRequest === "function"
    ? config.resolver.resolveRequest.bind(config.resolver)
    : null;

/**
 * RN 0.83+ `setUpReactDevTools.js` requires `ReactDevToolsSettingsManager` without a
 * `.web.js` implementation; only `.ios.js` / `.android.js` exist. Web dev bundling fails.
 */
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    platform === "web" &&
    typeof moduleName === "string" &&
    moduleName.endsWith("ReactDevToolsSettingsManager")
  ) {
    return {
      type: "sourceFile",
      filePath: reactDevToolsSettingsStub,
    };
  }
  if (upstreamResolveRequest) {
    return upstreamResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
