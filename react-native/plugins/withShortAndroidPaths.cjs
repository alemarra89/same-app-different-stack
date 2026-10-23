const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');

/** Keep generated C++ object paths within the limit of Ninja bundled with CMake 3.22.1. */
module.exports = function withShortAndroidPaths(config) {
  config = withGradleProperties(config, (mod) => {
    const key = 'expo.android.cmakeObjectPathMax';
    const property = mod.modResults.find((entry) => entry.type === 'property' && entry.key === key);
    if (property) property.value = '240';
    else mod.modResults.push({ type: 'property', key, value: '240' });
    return mod;
  });

  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('Short Android paths require the Expo Groovy build.gradle template.');
    }
    const marker = '// Event Check-in: short CMake staging directory.';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n${marker}\nandroid.externalNativeBuild.cmake.buildStagingDirectory = file("$rootDir/../.cxx")\n`;
    }
    return mod;
  });
};
