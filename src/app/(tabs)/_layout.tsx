import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { View } from 'react-native';
import { Calendar, LayoutDashboard, Clock, CalendarDays, MoreHorizontal, Users } from 'lucide-react-native';
import { useTourFlowStore } from '@/lib/store';
import * as SplashScreen from 'expo-splash-screen';

export default function TabLayout() {
  const loadFromStorage = useTourFlowStore(s => s.loadFromStorage);

  useEffect(() => {
    async function init() {
      await loadFromStorage();
      await SplashScreen.hideAsync();
    }
    init();
  }, []);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0a0a0a',
          borderTopColor: '#1a1a1a',
          borderTopWidth: 0.5,
          height: 80,
          paddingBottom: 24,
          paddingTop: 8,
        },
        tabBarActiveTintColor: '#22c55e',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
              <LayoutDashboard size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Dates',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
              <Calendar size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: 'Schedule',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
              <Clock size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="events"
        options={{
          title: 'Events',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
              <CalendarDays size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color, focused }) => (
            <View style={{ opacity: focused ? 1 : 0.7 }}>
              <MoreHorizontal size={22} color={color} strokeWidth={focused ? 2.5 : 2} />
            </View>
          ),
        }}
      />

      {/* Hidden tabs */}
      <Tabs.Screen name="gear" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="assistant" options={{ href: null }} />
      <Tabs.Screen name="crew" options={{ href: null }} />
      <Tabs.Screen name="tours" options={{ href: null }} />
      <Tabs.Screen name="crews" options={{ href: null }} />
    </Tabs>
  );
}
