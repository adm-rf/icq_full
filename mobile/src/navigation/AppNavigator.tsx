import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { RootStackParamList, AuthStackParamList, MainTabParamList, ChatStackParamList } from './types';

// Placeholder screens - TODO: Import actual screen components
const LoginScreen = () => null;
const RegisterScreen = () => null;
const ChatListScreen = () => null;
const ChatRoomScreen = () => null;
const ContactsScreen = () => null;
const SettingsScreen = () => null;

const Stack = createStackNavigator<RootStackParamList>();
const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTabs = createBottomTabNavigator<MainTabParamList>();
const ChatStack = createStackNavigator<ChatStackParamList>();

// Auth Stack Navigator
const AuthStackNavigator = () => (
  <AuthStack.Navigator screenOptions={{ headerShown: false }}>
    <AuthStack.Screen name="Login" component={LoginScreen} />
    <AuthStack.Screen name="Register" component={RegisterScreen} />
  </AuthStack.Navigator>
);

// Main Tab Navigator
const MainTabNavigator = () => (
  <MainTabs.Navigator>
    <MainTabs.Screen name="Chats" component={ChatListScreen} />
    <MainTabs.Screen name="Contacts" component={ContactsScreen} />
    <MainTabs.Screen name="Settings" component={SettingsScreen} />
  </MainTabs.Navigator>
);

// Chat Stack Navigator
const ChatStackNavigator = () => (
  <ChatStack.Navigator>
    <ChatStack.Screen name="ChatList" component={ChatListScreen} />
    <ChatStack.Screen name="ChatRoom" component={ChatRoomScreen} />
  </ChatStack.Navigator>
);

// Main App Navigator
export const AppNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* TODO: Check authentication state and conditionally render Auth or Main */}
      <Stack.Screen name="Auth" component={AuthStackNavigator} />
      {/* <Stack.Screen name="Main" component={MainTabNavigator} /> */}
      {/* <Stack.Screen name="Chat" component={ChatStackNavigator} /> */}
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigator;
