import { Ionicons } from '@expo/vector-icons';
import { Tabs } from "expo-router";
import React from 'react';
import './globals.css';

export default function RootLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#f9fafb',
        },
        headerShown: false,
      }}
    />
  );
}
