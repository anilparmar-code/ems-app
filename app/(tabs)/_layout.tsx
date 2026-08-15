import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/haptic-tab';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  // Primary brand color is #0a0a0a, and inactive is #737373
  const activeColor = colorScheme === 'dark' ? '#ffffff' : '#0a0a0a';
  const inactiveColor = colorScheme === 'dark' ? '#9ba1a6' : '#737373';
  const headerBgColor = colorScheme === 'dark' ? '#151718' : '#ffffff';
  const headerTitleColor = colorScheme === 'dark' ? '#ffffff' : '#171717';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: activeColor,
        tabBarInactiveTintColor: inactiveColor,
        tabBarButton: HapticTab,
        headerShown: true,
        headerStyle: {
          backgroundColor: headerBgColor,
          elevation: 2,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          borderBottomWidth: 1,
          borderBottomColor: colorScheme === 'dark' ? '#303030' : '#e5e5e5',
        },
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
          color: headerTitleColor,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Departments',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'business' : 'business-outline'} size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="employees"
        options={{
          title: 'Employees',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
