import { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, StyleSheet } from 'react-native';
import { darkColors } from '../src/theme';
import ToastProvider from '../src/components/ToastProvider';
import GroupEventDetector from '../src/components/GroupEventDetector';
import { getGroupId } from '../src/utils/storage';

export default function RootLayout() {
  const [groupId, setGroupId] = useState<string | null>(null);

  // Load the saved group so the budget event detector can run app-wide
  useEffect(() => {
    getGroupId()
      .then(setGroupId)
      .catch(() => setGroupId(null));
  }, []);

  return (
    <View style={styles.root}>
      <GestureHandlerRootView style={styles.flex}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <ToastProvider>
            <GroupEventDetector groupId={groupId} />
            <Slot />
          </ToastProvider>
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
