// Dynamic config for Expo: merge app.json + ensure `.env` loads from THIS package directory
// (monorepo / Turbo / odd cwd quirks). Mirrors EXPO_PUBLIC_ADMIN_URL into extra for expo-constants.
"use strict";

const path = require("node:path");
const appJson = require("./app.json");

// Load `.env*` into Node process.env before Metro serializes EXPO_PUBLIC_* into the bundle.
require("@expo/env").load(path.resolve(__dirname));

module.exports = {
  expo: {
    ...appJson.expo,
    extra: {
      ...(typeof appJson.expo.extra === "object" && appJson.expo.extra !== null
        ? appJson.expo.extra
        : {}),
      EXPO_PUBLIC_ADMIN_URL: process.env.EXPO_PUBLIC_ADMIN_URL ?? "",
    },
  },
};
