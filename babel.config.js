module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Reanimated 4 moved the Babel plugin into react-native-worklets.
      "react-native-worklets/plugin",
    ],
  };
};
