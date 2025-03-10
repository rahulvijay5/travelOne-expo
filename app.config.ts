import "dotenv/config";

const IS_DEV = process.env.APP_VARIANT === 'development';
const IS_PREVIEW = process.env.APP_VARIANT === 'preview';

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return 'site.rahulvijay.travelone.dev';
  }

  if (IS_PREVIEW) {
    return 'site.rahulvijay.travelone.preview';
  }

  return 'site.rahulvijay.travelone';
};

const getAppName = () => {
  if (IS_DEV) {
    return 'TravelOne (Dev)';
  }

  if (IS_PREVIEW) {
    return 'TravelOne (Preview)';
  }

  return 'TravelOne';
};


const config = {
  name: "TravelOne",
  slug: "travelone",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "travelone",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: "site.rahulvijay.travelone",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false
    }
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/icon.png", // Make sure this has transparency
      backgroundColor: "#ffffff"
    },
    package: "site.rahulvijay.travelone"
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png"
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff"
      }
    ]
  ],
  experiments: {
    typedRoutes: true
  },
  extra: {
    router: { origin: false },
    eas: { projectId: "d082d275-f1c5-4b61-a1a6-026ba127a452" },
    CLERK_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    APP_URL: process.env.EXPO_PUBLIC_APP_URL,
    SECURITY_KEY: process.env.EXPO_PUBLIC_SECURITY_KEY
  },
  owner: "rahulvijay"
};

export default ({ config }) => ({
  ...config,
  name:getAppName(),
  ios: {
    ...config.ios,
    bundleIdentifier: getUniqueIdentifier(),
  },
  android: {
    ...config.android,
    package: getUniqueIdentifier(),
  },
});