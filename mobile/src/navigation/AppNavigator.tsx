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
  AIResult: { mode: "photo" | "text"; description?: string } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO: gate initialRouteName on a persisted "has onboarded" flag once
// profile data is synced with the backend — for now every launch starts
// at Onboarding, matching the design handoff's default state.
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Tabs" component={TabNavigator} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="Capture" component={CaptureScreen} options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="AIResult" component={AIResultScreen} options={{ presentation: "fullScreenModal" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
