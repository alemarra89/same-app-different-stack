const { withGradleProperties } = require('expo/config-plugins');

/** Keep generated C++ object paths within the limit of Ninja bundled with CMake 3.22.1. */
module.exports = function withShortAndroidPaths(config) {
  return withGradleProperties(config, (mod) => {
    const key = 'expo.android.cmakeObjectPathMax';
    const property = mod.modResults.find((entry) => entry.type === 'property' && entry.key === key);
    if (property) property.value = '240';
    else mod.modResults.push({ type: 'property', key, value: '240' });
    return mod;
  });
};
