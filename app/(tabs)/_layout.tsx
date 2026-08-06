import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { darkColors, typography } from '../../src/theme';

const BAR_HEIGHT = 68;

// ─── Tab definitions (single source of truth for the bar) ───
// Defined locally instead of reading options.tabBarIcon, which is not
// reliably exposed by expo-router to a custom tab bar.
const TAB_CONFIG: Record<string, { label: string; icon: (focused: boolean) => string }> = {
  dashboard: { label: 'Inicio', icon: (focused) => (focused ? 'home' : 'home-outline') },
  budget: { label: 'Crédito', icon: () => 'finance' },
  history: { label: 'Actividad', icon: () => 'format-list-bulleted' },
  alerts: { label: 'Alertas', icon: (focused) => (focused ? 'bell' : 'bell-outline') },
};

// ─── Custom Floating Pill Tab Bar ───────────────────────
// Replicates the Santander app navbar: a fully-rounded pill
// container, and the active tab wrapped in a lighter pill
// that holds both the icon and the label.
function FloatingTabBar({ state, navigation }: any) {
  const insets = useSafeAreaInsets();

  const visibleRoutes = state.routes.filter(
    (route: any) => TAB_CONFIG[route.name] != null
  );

  return (
    <View style={[styles.barShadow, { bottom: insets.bottom + 16 }]}>
      <View style={styles.bar}>
        {visibleRoutes.map((route: any) => {
          const config = TAB_CONFIG[route.name];
          const isFocused = state.index === state.routes.indexOf(route);
          const color = isFocused ? '#FFFFFF' : darkColors.textSecondary;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          const onLongPress = () => {
            navigation.emit({ type: 'tabLongPress', target: route.key });
            if (!isFocused) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.item}
              android_ripple={{ color: 'transparent' }}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
            >
              <View style={[styles.itemPill, isFocused && styles.itemPillActive]}>
                <MaterialCommunityIcons
                  name={config.icon(isFocused) as any}
                  size={22}
                  color={color}
                />
                <Text
                  style={[styles.label, isFocused && styles.labelActive]}
                  numberOfLines={1}
                >
                  {config.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{ headerShown: false }}
        tabBar={(props) => <FloatingTabBar {...props} />}
      >
        <Tabs.Screen name="dashboard" options={{ title: 'Inicio' }} />
        <Tabs.Screen name="budget" options={{ title: 'Crédito' }} />
        <Tabs.Screen name="history" options={{ title: 'Actividad' }} />
        <Tabs.Screen name="alerts" options={{ title: 'Alertas' }} />
        {/* Registrar gasto: hidden from the bar, opened from Home's quick actions */}
        <Tabs.Screen name="add" options={{ href: null }} />
      </Tabs>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // Floating pill nav bar.
  // Elevation/shadow lives on the outer layer; the rounded background on the
  // inner one (overflow hidden keeps the pill shape on Android and avoids the
  // square-corner bug when switching tabs).
  barShadow: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: BAR_HEIGHT,
    borderRadius: BAR_HEIGHT / 2,
    shadowColor: '#000000',
    shadowOpacity: 0.45,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 14,
  },
  bar: {
    flex: 1,
    backgroundColor: darkColors.surface,
    borderRadius: BAR_HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Capsule that wraps icon + label; lighter grey when active.
  // Stretches inside its slot with a UNIFORM 6px margin on every side, so the
  // gap to the bar is identical horizontally and vertically on any screen and
  // any tab. Overflow hidden keeps the rounded clip on Android.
  itemPill: {
    flex: 1,
    alignSelf: 'stretch',
    margin: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: (BAR_HEIGHT - 12) / 2,
    overflow: 'hidden',
    backgroundColor: 'transparent',
    gap: 2,
  },
  itemPillActive: {
    backgroundColor: darkColors.surfaceElevated,
  },
  label: {
    ...typography.small,
    fontSize: 10.5,
    fontWeight: '600',
    letterSpacing: 0.2,
    color: darkColors.textSecondary,
  },
  labelActive: {
    color: '#FFFFFF',
  },

  // Floating action button (Registrar gasto) — same two-layer trick
});
