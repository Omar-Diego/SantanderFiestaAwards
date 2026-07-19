import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius, shadows } from '../src/theme';
import GoldButton from '../src/components/GoldButton';
import GoldInput from '../src/components/GoldInput';
import { createGroup, joinGroup, isValidGroupCode } from '../src/services/group';
import { saveGroupId, saveGroupName, getGroupId } from '../src/utils/storage';

type Mode = 'choose' | 'create' | 'join';

export default function SetupScreen() {
  const [mode, setMode] = useState<Mode>('choose');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [groupCode, setGroupCode] = useState('');
  const [groupName, setGroupName] = useState('Gastos Casa');
  const [codeError, setCodeError] = useState('');

  // Check if user already has a group saved
  useEffect(() => {
    (async () => {
      try {
        const savedGroupId = await getGroupId();
        if (savedGroupId) {
          // Already in a group → go to dashboard
          router.replace('/(tabs)/dashboard');
          return;
        }
      } catch {
        // Ignore storage errors on first launch
      }
      setLoading(false);
    })();
  }, []);

  // ─── Handle Create Group ─────────────────────────────
  async function handleCreateGroup() {
    setSubmitting(true);
    try {
      const group = await createGroup(groupName || 'Gastos Casa');
      await saveGroupId(group.id);
      await saveGroupName(group.name);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Error', 'No se pudo crear el grupo. Verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Handle Join Group ────────────────────────────────
  async function handleJoinGroup() {
    const code = groupCode.toUpperCase().trim();
    if (!isValidGroupCode(code)) {
      setCodeError('El código debe tener 4 letras + 4 números (ej: ABCD1234)');
      return;
    }

    setCodeError('');
    setSubmitting(true);
    try {
      const result = await joinGroup(code);
      if (!result.success || !result.group) {
        setCodeError('Ese código no existe. Verifica con la otra persona.');
        setSubmitting(false);
        return;
      }
      await saveGroupId(result.group.id);
      await saveGroupName(result.group.name);
      router.replace('/(tabs)/dashboard');
    } catch (err) {
      Alert.alert('Error', 'No se pudo conectar. Verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Choose mode screen ───────────────────────────────
  if (mode === 'choose') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.goldBar} />
          <Text style={styles.title}>Santander</Text>
          <Text style={styles.subtitle}>Fiesta Awards</Text>
          <Text style={styles.tagline}>Controla tus gastos en tiempo real</Text>
        </View>

        <View style={styles.card}>
          <GoldButton
            title="🏠  CREAR NUEVO GRUPO"
            onPress={() => {
              setGroupCode('');
              setCodeError('');
              setMode('create');
            }}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o únete a uno</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <GoldButton
            title="🔗  UNIRSE A UN GRUPO"
            variant="outline"
            onPress={() => {
              setGroupCode('');
              setCodeError('');
              setMode('join');
            }}
          />
        </View>
      </ScrollView>
    );
  }

  // ─── Create mode screen ───────────────────────────────
  if (mode === 'create') {
    return (
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.goldBar} />
          <Text style={styles.subtitle}>Nuevo Grupo</Text>
        </View>

        <View style={styles.card}>
          <GoldInput
            label="Nombre del grupo"
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Ej: Gastos Casa"
            maxLength={30}
          />

          <View style={styles.createInfo}>
            <Text style={styles.createInfoText}>
              Se generará un código único para compartir con la otra persona.
            </Text>
          </View>

          <GoldButton
            title="✨  CREAR GRUPO"
            onPress={handleCreateGroup}
            loading={submitting}
          />

          <GoldButton
            title="← Volver"
            variant="ghost"
            onPress={() => setMode('choose')}
            style={styles.backButton}
          />
        </View>
      </ScrollView>
    );
  }

  // ─── Join mode screen ─────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.logoSection}>
        <View style={styles.goldBar} />
        <Text style={styles.subtitle}>Unirse a Grupo</Text>
      </View>

      <View style={styles.card}>
        <GoldInput
          label="Código del grupo"
          value={groupCode}
          onChangeText={(text) => {
            setGroupCode(text.toUpperCase());
            setCodeError('');
          }}
          placeholder="Ej: ABCD1234"
          maxLength={8}
          autoCapitalize="characters"
          error={codeError}
        />

        <View style={styles.createInfo}>
          <Text style={styles.createInfoText}>
            Pídele a la otra persona el código de su grupo.
          </Text>
        </View>

        <GoldButton
          title="🔗  UNIRSE AL GRUPO"
          onPress={handleJoinGroup}
          loading={submitting}
        />

        <GoldButton
          title="← Volver"
          variant="ghost"
          onPress={() => {
            setMode('choose');
            setCodeError('');
          }}
          style={styles.backButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.huge,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.xxxl,
  },
  goldBar: {
    width: 60,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.gold,
    marginBottom: spacing.xxl,
  },
  title: {
    ...typography.h1,
    color: colors.textPrimary,
    letterSpacing: 2,
  },
  subtitle: {
    ...typography.h2,
    color: colors.gold,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.xxl,
    ...shadows.md,
    gap: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xl,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: colors.textMuted,
  },
  createInfo: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
  },
  createInfoText: {
    ...typography.caption,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  backButton: {
    marginTop: spacing.sm,
  },
});
