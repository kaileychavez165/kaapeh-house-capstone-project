// Fix for jest-expo compatibility issues with React Native 0.81
// Ensure NativeModules mocks are properly initialized before jest-expo setup runs
const originalMockNativeModules = require('react-native/Libraries/BatchedBridge/NativeModules');

// Create a UIManager object that will always be available
const uiManagerObject = {};

// Ensure UIManager exists
if (!originalMockNativeModules.UIManager || typeof originalMockNativeModules.UIManager !== 'object') {
  Object.defineProperty(originalMockNativeModules, 'UIManager', {
    configurable: true,
    enumerable: true,
    value: uiManagerObject,
    writable: true,
  });
}

// Create a proxy that intercepts property access to ensure NativeUnimoduleProxy.viewManagersMetadata exists
const mockNativeModulesProxy = new Proxy(originalMockNativeModules, {
  get(target, prop) {
    const value = target[prop];
    
    // Ensure UIManager is always an object
    if (prop === 'UIManager') {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        return uiManagerObject;
      }
      return value;
    }
    
    // Ensure NativeUnimoduleProxy always has viewManagersMetadata
    if (prop === 'NativeUnimoduleProxy') {
      if (value && typeof value === 'object') {
        // If viewManagersMetadata doesn't exist, add it
        if (!value.viewManagersMetadata || typeof value.viewManagersMetadata !== 'object') {
          value.viewManagersMetadata = {};
        }
      }
    }
    
    return value;
  },
  set(target, prop, value) {
    target[prop] = value;
    return true;
  },
});

// Monkey-patch require to intercept NativeModules access
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
  const result = originalRequire.apply(this, arguments);
  if (id === 'react-native/Libraries/BatchedBridge/NativeModules' || 
      (typeof id === 'string' && id.includes('react-native') && id.includes('NativeModules'))) {
    return mockNativeModulesProxy;
  }
  return result;
};
