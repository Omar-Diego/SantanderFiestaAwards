import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Timestamp } from '@react-native-firebase/firestore';
import { addTransaction } from '../../src/services/transactions';
import { getGroupId } from '../../src/utils/storage';
import { darkColors, typography, spacing, borderRadius, shadows } from '../../src/theme';
import { format } from 'date-fns';
import { es } from 'date-fns/locale/es';

// ─── Currency formatting helpers ────────────────────────
const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function parseAmount(raw: string): number {
  // Remove everything except digits and decimal point
  const cleaned = raw.replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// ─── Main Screen ────────────────────────────────────────
export default function AddTransactionScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [amountText, setAmountText] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const descRef = useRef<TextInput>(null);

  // Load groupId
  useEffect(() => {
    (async () => {
      const gid = await getGroupId();
      setGroupId(gid);
      setLoading(false);
    })();
  }, []);

  // ─── Date navigation ────────────────────────────────
  function changeDay(delta: number) {
    setDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + delta);
      return next;
    });
  }

  // ─── Validation ──────────────────────────────────────
  function validate(): boolean {
    const errs: Record<string, string> = {};

    const amount = parseAmount(amountText);
    if (amount <= 0) errs.amount = 'Ingresa un monto válido';
    if (!description.trim()) errs.description = 'Describe el gasto';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ─── Submit ──────────────────────────────────────────
  async function handleSubmit() {
    if (!validate()) return;
    if (!groupId) {
      Alert.alert('Error', 'No hay un grupo configurado.');
      return;
    }

    setSubmitting(true);
    try {
      await addTransaction(groupId, {
        date: Timestamp.fromDate(date),
        amount: parseAmount(amountText),
        description: description.trim(),
      });

      // Success — go back to dashboard
      Alert.alert('Gasto registrado', '', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      Alert.alert('Error', 'No se pudo registrar el gasto. Verifica tu conexión.');
    } finally {
      setSubmitting(false);
    }
  }

  // ─── Loading state ──────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amount = parseAmount(amountText);
  const canSubmit = amount > 0 && description.trim().length > 0;
  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es });
  const dateLabelCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ─────────────────────────── */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <MaterialCommunityIcons
                name="arrow-left"
                size={24}
                color={darkColors.textPrimary}
              />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nuevo gasto</Text>
            <View style={{ width: 32 }} />
          </View>

          {/* ── Amount Input ────────────────────── */}
          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>MONTO</Text>
            <View style={styles.amountRow}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                value={amountText}
                onChangeText={(t) => {
                  // Only allow digits and one decimal point
                  const cleaned = t.replace(/[^0-9.]/g, '');
                  const parts = cleaned.split('.');
                  if (parts.length > 2) return; // more than one decimal point
                  if (parts[1]?.length > 2) return; // more than 2 decimal places
                  setAmountText(cleaned);
                  if (errors.amount) setErrors((e) => ({ ...e, amount: '' }));
                }}
                placeholder="0.00"
                placeholderTextColor={darkColors.textMuted}
                keyboardType="decimal-pad"
                keyboardAppearance="dark"
                autoFocus
              />
            </View>
            {errors.amount && <Text style={styles.errorText}>{errors.amount}</Text>}
            {/* Quick amounts */}
            <View style={styles.quickRow}>
              {[50, 100, 200, 500, 1000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[
                    styles.quickChip,
                    parseAmount(amountText) === val && styles.quickChipActive,
                  ]}
                  onPress={() => setAmountText(val.toString() + '.00')}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.quickChipText,
                      parseAmount(amountText) === val && styles.quickChipTextActive,
                    ]}
                  >
                    ${val}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ── Description ──────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>DESCRIPCIÓN</Text>
            {errors.description && (
              <Text style={styles.errorText}>{errors.description}</Text>
            )}
            <TextInput
              ref={descRef}
              style={styles.textInput}
              value={description}
              onChangeText={(t) => {
                setDescription(t);
                if (errors.description) setErrors((e) => ({ ...e, description: '' }));
              }}
              placeholder="Ej: Súper semanal"
              placeholderTextColor={darkColors.textMuted}
              returnKeyType="done"
              onSubmitEditing={handleSubmit}
              maxLength={60}
              keyboardAppearance="dark"
            />
          </View>

          {/* ── Date Selector ─────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FECHA</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => changeDay(-1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-left"
                  size={22}
                  color={darkColors.red}
                />
              </TouchableOpacity>
              <View style={styles.dateCenter}>
                <Text style={styles.dateText}>{dateLabelCapitalized}</Text>
                <Text style={styles.dateYear}>{date.getFullYear()}</Text>
              </View>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => changeDay(1)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={22}
                  color={darkColors.red}
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Submit Button ──────────────────────── */}
          <View style={styles.submitSection}>
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!canSubmit || submitting) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || submitting}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons
                name="check-circle-outline"
                size={22}
                color="#FFFFFF"
              />
              <Text style={styles.submitText}>
                {submitting ? 'Registrando...' : 'REGISTRAR GASTO'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ─────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: darkColors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 160,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: darkColors.textSecondary,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  backBtn: {
    padding: spacing.sm,
  },
  headerTitle: {
    ...typography.h3,
    color: darkColors.textPrimary,
  },

  // Amount
  amountSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  amountLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 2,
    marginBottom: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '700',
    color: darkColors.textPrimary,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: darkColors.textPrimary,
    minWidth: 180,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: darkColors.red,
    paddingBottom: spacing.sm,
  },
  quickRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.lg,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  quickChip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.divider,
  },
  quickChipActive: {
    backgroundColor: darkColors.red,
    borderColor: darkColors.red,
  },
  quickChipText: {
    ...typography.caption,
    color: darkColors.textSecondary,
  },
  quickChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  // Text Input
  textInput: {
    height: 52,
    backgroundColor: darkColors.surface,
    borderWidth: 1,
    borderColor: darkColors.divider,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: darkColors.textPrimary,
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: darkColors.divider,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  dateArrow: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  dateCenter: {
    flex: 1,
    alignItems: 'center',
  },
  dateText: {
    ...typography.bodyBold,
    color: darkColors.textPrimary,
  },
  dateYear: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: 2,
  },

  // Submit
  submitSection: {
    marginTop: spacing.xxxl,
    paddingHorizontal: spacing.xxl,
    alignItems: 'center',
  },
  submitButton: {
    width: '100%',
    height: 56,
    backgroundColor: darkColors.red,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.md,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitText: {
    ...typography.bodyBold,
    color: '#FFFFFF',
    fontSize: 16,
    letterSpacing: 1,
  },

  // Error
  errorText: {
    ...typography.small,
    color: darkColors.red,
    marginBottom: spacing.sm,
  },
});
