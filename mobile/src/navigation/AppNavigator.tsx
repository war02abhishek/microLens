import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import OnboardingScreen from "../screens/OnboardingScreen";
import DashboardScreen from "../screens/DashboardScreen";
import MealCaptureScreen from "../screens/MealCaptureScreen";
import MealReviewScreen from "../screens/MealReviewScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ThemeGalleryScreen from "../screens/ThemeGalleryScreen";
import ProfileScreen from "../screens/ProfileScreen";

export type RootStackParamList = {
  Onboarding: undefined;
  Dashboard: undefined;
  MealCapture: undefined;
  MealReview: undefined;
  History: undefined;
  ThemeGallery: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// TODO once onboarding state is wired up: gate the initial route on
// whether the user has completed onboarding (AsyncStorage / profile check).
export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding">
        <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ headerShown: false }} />
        <Stack.Screen name="MealCapture" component={MealCaptureScreen} options={{ title: "Log a meal" }} />
        <Stack.Screen name="MealReview" component={MealReviewScreen} options={{ title: "Confirm" }} />
        <Stack.Screen name="History" component={HistoryScreen} options={{ title: "History" }} />
        <Stack.Screen name="ThemeGallery" component={ThemeGalleryScreen} options={{ title: "Themes" }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
