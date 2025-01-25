import { Tabs } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import currentUser from '@/hooks/getCurrentUser';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#007AFF',
    }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Groups',
          tabBarIcon: ({ color }) => <MaterialIcons name="group" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="todos"
        options={{
          title: 'Todos',
          tabBarIcon: ({ color }) => <MaterialIcons name="check-circle" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color }) => <MaterialIcons name="people" size={24} color={color} />,
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <MaterialIcons name="settings" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}