require('dotenv').config({ path: '.env.local' });

module.exports = {
  expo: {
    name: 'kaapeh-house-app',
    slug: 'kaapeh-house-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: 'src/assets/images/icon.png',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    scheme: 'kaapehhouseapp',
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.anonymous.kaapeh-house-app',
    },
    android: {
      adaptiveIcon: {
        foregroundImage: 'src/assets/images/adaptive-icon.png',
        backgroundColor: '#ffffff',
      },
    },
    web: {
      favicon: 'src/assets/images/favicon.png',
    },
    plugins: [
      'expo-asset',
      [
        'expo-splash-screen',
        {
          backgroundColor: '#ffffff',
          image: 'src/assets/images/splash-icon.png',
        },
      ],
    ],
    extra: {
      azureOpenAIEndpoint: process.env.AZURE_OPENAI_ENDPOINT,
      azureOpenAIKey: process.env.AZURE_OPENAI_KEY,
      azureOpenAIDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    },
  },
};

