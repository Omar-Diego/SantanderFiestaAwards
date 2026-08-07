import { useEffect, useRef } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { getGroupInfo, isValidGroupCode } from '../../src/services/group';
import { saveGroupId, saveGroupName } from '../../src/utils/storage';
import { useToast } from '../../src/components/ToastProvider';
import { darkColors, typography, spacing } from '../../src/theme';

/**
 * Deep-link join screen — reached via santander-fiesta://join/{code}
 * (the link shared from the Alertas tab). Validates the code, saves the
 * group locally and lands on the dashboard.
 */
export default function JoinLinkScreen() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const { showToast } = useToast();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    (async () => {
      const raw = Array.isArray(code) ? code[0] : code;
      const normalized = (raw ?? '').toUpperCase().trim();

      if (!isValidGroupCode(normalized)) {
        showToast('error', 'Enlace de grupo inválido');
        router.replace('/');
        return;
      }

      try {
        const group = await getGroupInfo(normalized);
        if (!group) {
          showToast('error', 'Ese grupo no existe');
          router.replace('/');
          return;
        }

        await saveGroupId(group.id);
        await saveGroupName(group.name);
        showToast('success', `Bienvenido a ${group.name}`);
        router.replace('/(tabs)/dashboard');
      } catch {
        showToast('error', 'No se pudo conectar al grupo');
        router.replace('/');
      }
    })();
  }, [code, showToast]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.centerContent}>
        <ActivityIndicator size="large" color={darkColors.red} />
        <Text style={styles.text}>Conectando con el grupo...</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  text: {
    ...typography.body,
    color: darkColors.textSecondary,
  },
});
