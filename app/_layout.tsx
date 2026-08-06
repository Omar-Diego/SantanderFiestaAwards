import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { darkColors } from '../src/theme';

export default function RootLayout() {
  return (
    <View style={styles.root}>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Slot />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  flex: {
    flex: 1,
  },
});
