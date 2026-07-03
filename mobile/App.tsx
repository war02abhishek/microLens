import { useEffect, useState } from "react";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { BricolageGrotesque_700Bold } from "@expo-google-fonts/bricolage-grotesque";
import {
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
  Figtree_800ExtraBold,
  useFonts,
} from "@expo-google-fonts/figtree";

import AppNavigator from "./src/navigation/AppNavigator";
import { ThemeProvider } from "./src/theme/ThemeContext";
import { AuthProvider } from "./src/context/AuthContext";
import { MealLogProvider } from "./src/context/MealLogContext";
import { getAuthToken } from "./src/api/client";

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded] = useFonts({
    BricolageGrotesque_700Bold,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    Figtree_800ExtraBold,
  });
  const [initialRoute, setInitialRoute] = useState<"Onboarding" | "Tabs" | null>(null);

  useEffect(() => {
    getAuthToken().then((token) => setInitialRoute(token ? "Tabs" : "Onboarding"));
  }, []);

  useEffect(() => {
    if (fontsLoaded && initialRoute) SplashScreen.hideAsync();
  }, [fontsLoaded, initialRoute]);

  if (!fontsLoaded || !initialRoute) return null;

  return (
    <AuthProvider>
      <ThemeProvider>
        <MealLogProvider>
          <AppNavigator initialRoute={initialRoute} />
          <StatusBar style="auto" />
        </MealLogProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
