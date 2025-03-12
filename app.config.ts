import "dotenv/config";
import { ConfigContext, ExpoConfig } from "expo/config";

const IS_DEV = process.env.APP_VARIANT === "development";
const IS_PREVIEW = process.env.APP_VARIANT === "preview";

// console.log("CLERK KEY:", process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY);

const getUniqueIdentifier = () => {
  if (IS_DEV) {
    return "site.rahulvijay.travelone.dev";
  }

  if (IS_PREVIEW) {
    return "site.rahulvijay.travelone.preview";
  }

  return "site.rahulvijay.travelone";
};

const getAppName = () => {
  if (IS_DEV) {
    return "TravelOne (Dev)";
  }

  if (IS_PREVIEW) {
    return "TravelOne (Preview)";
  }

  return "TravelOne";
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: getAppName(),
  slug: "tavelone",
  version: "1.0.0", 
  orientation: "portrait",
  icon: "./assets/images/icon.png",
  scheme: "travelone",
  userInterfaceStyle: "automatic",
  newArchEnabled: true,
  ios: {
    supportsTablet: true,
    bundleIdentifier: getUniqueIdentifier(),
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/images/splash-icon.png", // Make sure this has transparency
      backgroundColor: "#ffffff",
    },
    package: getUniqueIdentifier(),
  },
  web: {
    bundler: "metro",
    output: "static",
    favicon: "./assets/images/icon.png",
  },
  plugins: [
    "expo-router",
    [
      "expo-splash-screen",
      {
        image: "./assets/images/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        backgroundColor: "#ffffff",
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    router: { origin: false },
    eas: { projectId: "fc0a62ef-a6cf-455e-b697-2c6ff07d4fbf" },
    CLERK_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
    API_URL: process.env.EXPO_PUBLIC_API_URL,
    APP_URL: process.env.EXPO_PUBLIC_APP_URL,
    SECURITY_KEY: process.env.EXPO_PUBLIC_SECURITY_KEY,
  },
  owner: "rahulvijay",
});
