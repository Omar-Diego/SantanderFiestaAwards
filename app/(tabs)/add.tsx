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
import { Ionicons } from '@expo/vector-icons';
import firestore from '@react-native-firebase/firestore';
import { CATEGORIES } from '../../src/utils/categories';
import { addTransaction } from '../../src/services/transactions';
import { getGroupId } from '../../src/utils/storage';
import { colors, typography, spacing, borderRadius, shadows } from '../../src/theme';
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
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date());

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const descRef = useRef<TextInput>(null);
  const notesRef = useRef<TextInput>(null);

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
    if (!categoryId) errs.category = 'Selecciona una categoría';
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
        date: firestore.Timestamp.fromDate(date),
        amount: parseAmount(amountText),
        description: description.trim(),
        category: categoryId!,
        notes: notes.trim() || undefined,
      });

      // Success — go back to dashboard
      Alert.alert('✅ Gasto registrado', '', [
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
        <View style={styles.accentBar} />
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const amount = parseAmount(amountText);
  const canSubmit = amount > 0 && !!categoryId && description.trim().length > 0;
  const dateLabel = format(date, "EEEE d 'de' MMMM", { locale: es });
  const dateLabelCapitalized = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.accentBar} />

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
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
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
                placeholderTextColor={colors.textMuted}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            {errors.amount && (
              <Text style={styles.errorText}>{errors.amount}</Text>
            )}
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

          {/* ── Category Grid ────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>CATEGORÍA</Text>
            {errors.category && (
              <Text style={styles.errorText}>{errors.category}</Text>
            )}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const selected = categoryId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryItem,
                      selected && {
                        backgroundColor: cat.color + '20',
                        borderColor: cat.color,
                      },
                    ]}
                    onPress={() => {
                      setCategoryId(cat.id);
                      if (errors.category) setErrors((e) => ({ ...e, category: '' }));
                    }}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.categoryIconWrap,
                        { backgroundColor: cat.color + '15' },
                        selected && { backgroundColor: cat.color + '30' },
                      ]}
                    >
                      <Ionicons name={cat.icon as any} size={22} color={cat.color} />
                    </View>
                    <Text
                      style={[
                        styles.categoryName,
                        selected && { color: cat.color, fontWeight: '600' },
                      ]}
                      numberOfLines={1}
                    >
                      {cat.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
              placeholderTextColor={colors.textMuted}
              returnKeyType="next"
              onSubmitEditing={() => notesRef.current?.focus()}
              maxLength={60}
            />
          </View>

          {/* ── Date Selector ─────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>FECHA</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => changeDay(-1)}
              >
                <Ionicons name="chevron-back" size={22} color={colors.gold} />
              </TouchableOpacity>
              <View style={styles.dateCenter}>
                <Text style={styles.dateText}>{dateLabelCapitalized}</Text>
                <Text style={styles.dateYear}>{date.getFullYear()}</Text>
              </View>
              <TouchableOpacity
                style={styles.dateArrow}
                onPress={() => changeDay(1)}
              >
                <Ionicons name="chevron-forward" size={22} color={colors.gold} />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Notes (optional) ──────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>NOTAS (opcional)</Text>
            <TextInput
              ref={notesRef}
              style={[styles.textInput, styles.notesInput]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas adicionales..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={2}
              maxLength={200}
            />
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
              <Ionicons
                name="checkmark-circle-outline"
                size={22}
                color={colors.textOnGold}
              />
              <Text style={styles.submitText}>
                {submitting ? 'Registrando...' : 'REGISTRAR GASTO'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.syncHint}>
              Se sincronizará al instante con el otro teléfono
            </Text>
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
    backgroundColor: colors.background,
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.gold,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.huge,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    ...typography.body,
    color: colors.textSecondary,
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
    color: colors.textPrimary,
  },

  // Amount
  amountSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xxl,
  },
  amountLabel: {
    ...typography.label,
    color: colors.textMuted,
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
    color: colors.gold,
    marginRight: spacing.xs,
  },
  amountInput: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
    minWidth: 180,
    textAlign: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.goldLight,
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
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickChipActive: {
    backgroundColor: colors.gold,
    borderColor: colors.gold,
  },
  quickChipText: {
    ...typography.caption,
    color: colors.textSecondary,
  },
  quickChipTextActive: {
    color: colors.textOnGold,
    fontWeight: '600',
  },

  // Sections
  section: {
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  sectionLabel: {
    ...typography.label,
    color: colors.textMuted,
    letterSpacing: 1.5,
    marginBottom: spacing.md,
  },

  // Category Grid
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryItem: {
    width: '18%',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    backgroundColor: colors.surface,
    ...shadows.sm,
  },
  categoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  categoryName: {
    ...typography.small,
    color: colors.textSecondary,
    fontSize: 10,
    textAlign: 'center',
  },

  // Text Input
  textInput: {
    height: 52,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    ...typography.body,
    color: colors.textPrimary,
  },
  notesInput: {
    height: 72,
    paddingTop: spacing.md,
    textAlignVertical: 'top',
  },

  // Date
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
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
    color: colors.textPrimary,
  },
  dateYear: {
    ...typography.small,
    color: colors.textMuted,
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
    backgroundColor: colors.gold,
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
    color: colors.textOnGold,
    fontSize: 16,
    letterSpacing: 1,
  },
  syncHint: {
    ...typography.small,
    color: colors.textMuted,
    marginTop: spacing.md,
    textAlign: 'center',
  },

  // Error
  errorText: {
    ...typography.small,
    color: colors.error,
    marginBottom: spacing.sm,
  },
});
