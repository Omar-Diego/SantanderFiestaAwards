import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { darkColors, typography, spacing, borderRadius, shadows } from '../src/theme';
import PrimaryButton from '../src/components/PrimaryButton';
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

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </View>
    );
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
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>S</Text>
          </View>
          <Text style={styles.title}>Santander Fiesta Awards</Text>
          <Text style={styles.tagline}>Controla tus gastos en tiempo real, entre 2 celulares</Text>
        </View>

        <View style={styles.card}>
          <PrimaryButton
            title="CREAR NUEVO GRUPO"
            onPress={() => {
              setGroupCode('');
              setCodeError('');
              setMode('create');
            }}
            loading={submitting}
          />
        </View>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>o únete a uno</Text>
          <View style={styles.dividerLine} />
        </View>

        <View style={styles.card}>
          <PrimaryButton
            title="UNIRSE A UN GRUPO"
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
          <Text style={styles.subtitle}>Nuevo Grupo</Text>
        </View>

        <View style={styles.card}>
          <DarkInput
            label="Nombre del grupo"
            value={groupName}
            onChangeText={setGroupName}
            placeholder="Ej: Gastos Casa"
            maxLength={30}
          />

          <View style={styles.createInfo}>
            <MaterialCommunityIcons
              name="information-outline"
              size={18}
              color={darkColors.textMuted}
            />
            <Text style={styles.createInfoText}>
              Se generará un código único para compartir con la otra persona.
            </Text>
          </View>

          <PrimaryButton
            title="CREAR GRUPO"
            onPress={handleCreateGroup}
            loading={submitting}
          />

          <TouchableOpacity style={styles.backButton} onPress={() => setMode('choose')}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </TouchableOpacity>
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
        <Text style={styles.subtitle}>Unirse a Grupo</Text>
      </View>

      <View style={styles.card}>
        <DarkInput
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
          <MaterialCommunityIcons
            name="information-outline"
            size={18}
            color={darkColors.textMuted}
          />
          <Text style={styles.createInfoText}>
            Pídele a la otra persona el código de su grupo.
          </Text>
        </View>

        <PrimaryButton
          title="UNIRSE AL GRUPO"
          onPress={handleJoinGroup}
          loading={submitting}
        />

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            setMode('choose');
            setCodeError('');
          }}
        >
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// ─── Dark Input ─────────────────────────────────────────
function DarkInput({
  label,
  value,
  onChangeText,
  placeholder,
  maxLength,
  autoCapitalize,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  maxLength?: number;
  autoCapitalize?: 'none' | 'characters';
  error?: string;
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label.toUpperCase()}</Text>
      <TextInput
        style={[styles.textInput, error ? styles.textInputError : null]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={darkColors.textMuted}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize ?? 'none'}
        autoCorrect={false}
        keyboardAppearance="dark"
      />
      {error ? <Text style={styles.inputError}>{error}</Text> : null}
    </View>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: darkColors.red,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadows.md,
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  title: {
    ...typography.h2,
    color: darkColors.textPrimary,
    textAlign: 'center',
  },
  subtitle: {
    ...typography.h2,
    color: darkColors.textPrimary,
    marginBottom: spacing.sm,
  },
  tagline: {
    ...typography.body,
    color: darkColors.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.xl,
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
    backgroundColor: darkColors.divider,
  },
  dividerText: {
    ...typography.caption,
    color: darkColors.textMuted,
  },
  createInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: darkColors.surfaceElevated,
    borderRadius: borderRadius.sm,
    padding: spacing.md,
  },
  createInfoText: {
    ...typography.caption,
    color: darkColors.textSecondary,
    lineHeight: 20,
    flex: 1,
  },
  backButton: {
    alignSelf: 'center',
    padding: spacing.sm,
  },
  backButtonText: {
    ...typography.body,
    color: darkColors.textSecondary,
  },

  // Input
  inputGroup: {
    gap: spacing.sm,
  },
  inputLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.2,
  },
  textInput: {
    height: 52,
    backgroundColor: darkColors.surfaceElevated,
    borderWidth: 1,
    borderColor: darkColors.divider,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: darkColors.textPrimary,
  },
  textInputError: {
    borderColor: darkColors.red,
  },
  inputError: {
    ...typography.small,
    color: darkColors.red,
  },
});
