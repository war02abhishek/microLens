import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";

import DashboardScreen from "../screens/DashboardScreen";
import HistoryScreen from "../screens/HistoryScreen";
import ThemeGalleryScreen from "../screens/ThemeGalleryScreen";
import ProfileScreen from "../screens/ProfileScreen";
import CustomTabBar from "./CustomTabBar";

export type TabParamList = {
  Home: undefined;
  History: undefined;
  ThemeGallery: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

export default function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }} tabBar={(props) => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="History" component={HistoryScreen} />
      <Tab.Screen name="ThemeGallery" component={ThemeGalleryScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
