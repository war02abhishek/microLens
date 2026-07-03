import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import TabNavigator from "./TabNavigator";
import OnboardingScreen from "../screens/OnboardingScreen";
import CaptureScreen from "../screens/CaptureScreen";
import AIResultScreen from "../screens/AIResultScreen";

export type RootStackParamList = {
  Tabs: undefined;
  Onboarding: undefined;
  Capture: undefined;
  AIResult: { mode: "photo" | "text"; description?: string; imageBase64?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// initialRoute is resolved by App.tsx before this mounts (checking for a
// stored auth token) so a returning, already-onboarded user lands on their
// Dashboard instead of being sent through onboarding on every cold launch.
export default function AppNavigator({ initialRoute }: { initialRoute: "Onboarding" | "Tabs" }) {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="AIResult" component={AIResultScreen} options={{ presentation: "fullScreenModal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
