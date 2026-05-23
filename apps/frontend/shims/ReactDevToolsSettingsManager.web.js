/**
 * React Native 0.83+ ships `ReactDevToolsSettingsManager` as `.ios.js` / `.android.js` only.
 * Metro's `web` platform cannot resolve the extensionless import in `setUpReactDevTools.js`,
 * so we redirect to this stub from `metro.config.js`.
 *
 * @see https://github.com/facebook/react-native/issues (RN web + DevTools settings)
 */
"use strict";

function getGlobalHookSettings() {
  return null;
}

module.exports = {
  getGlobalHookSettings,
};
