import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, type ColorValue, type PressableProps } from 'react-native';
import { colors, typography } from '../../src/theme';

function TabIcon({
  name,
  color,
  size,
}: {
  name: string;
  color: ColorValue;
  size: number;
}) {
  return (
    <MaterialCommunityIcons name={name as any} size={size} color={color as string} />
  );
}

function TabBarButton({ href, ...props }: PressableProps & { href?: string }) {
  return <Pressable {...props} android_ripple={{ color: 'transparent' }} />;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.white,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          ...typography.small,
          fontSize: 11,
        },
        tabBarItemStyle: {
          backgroundColor: 'transparent',
        },
        tabBarActiveBackgroundColor: 'transparent',
        tabBarInactiveBackgroundColor: 'transparent',
        tabBarButton: TabBarButton,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Resumen',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="chart-pie" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Gasto',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="plus-circle" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="budget"
        options={{
          title: 'Presupuesto',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="wallet" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="format-list-bulleted" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
