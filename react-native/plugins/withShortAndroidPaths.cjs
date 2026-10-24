const { withAppBuildGradle, withGradleProperties } = require('expo/config-plugins');
const { createHash } = require('node:crypto');
const os = require('node:os');
const path = require('node:path');

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
    // RelWithDebInfo adds enough characters to exceed Ninja's limit in this monorepo.
    // Keep Windows staging short and isolate checkouts with a stable project-path hash.
    const projectHash = createHash('sha256').update(path.resolve(mod.modRequest.projectRoot))
      .digest('hex').slice(0, 12);
    const staging = process.platform === 'win32'
      ? path.join(os.tmpdir(), 'rn-cxx', projectHash).replaceAll('\\', '/')
      : '$rootDir/../.cxx';
    const block = `${marker}\nandroid.externalNativeBuild.cmake.buildStagingDirectory = file(${JSON.stringify(staging)})\n`;
    const existing = /\/\/ Event Check-in: short CMake staging directory\.\r?\nandroid\.externalNativeBuild\.cmake\.buildStagingDirectory = file\([^\r\n]+\)\r?\n?/;
    if (mod.modResults.contents.includes(marker)) {
      if (!existing.test(mod.modResults.contents)) {
        throw new Error('Cannot update the existing short CMake staging configuration.');
      }
      mod.modResults.contents = mod.modResults.contents.replace(existing, () => block);
    } else {
      mod.modResults.contents += `\n${block}`;
    }
    return mod;
  });
};
