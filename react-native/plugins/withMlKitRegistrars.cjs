const { withAppBuildGradle } = require('expo/config-plugins');

/** Preserve the ML Kit registrar constructors used by the release QR scanner. */
module.exports = function withMlKitRegistrars(config) {
  return withAppBuildGradle(config, (mod) => {
    if (mod.modResults.language !== 'groovy') {
      throw new Error('ML Kit keep rules require the Expo Groovy build.gradle template.');
    }
    const marker = '// Event Check-in: ML Kit registrar constructors.';
    if (!mod.modResults.contents.includes(marker)) {
      mod.modResults.contents += `\n${marker}\nandroid.buildTypes.release.proguardFiles(file("$rootDir/../proguard-rules.pro"))\n`;
    }
    return mod;
  });
};
