import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import { getGroupId, getGroupName } from '../../src/utils/storage';
import { formatGroupCode } from '../../src/services/group';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';

// ─── Main Screen (Alertas) — código del grupo ───────────
// Replaces the old alerts concept: this tab shows the group code and a
// shareable WhatsApp link so the other phone can join in one tap.
export default function AlertsScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);

  useEffect(() => {
    (async () => {
      const [gid, name] = await Promise.all([getGroupId(), getGroupName()]);
      setGroupId(gid);
      setGroupName(name);
      setStorageLoaded(true);
    })();
  }, []);

  async function handleShare() {
    if (!groupId) return;
    // WhatsApp only turns http/https URLs into tappable links, so the message
    // leads with the code (always usable) and keeps the deep link as extra info.
    const message = [
      `Únete a mi grupo "${groupName ?? 'de gastos'}" en Santander Fiesta Awards.`,
      '',
      `Código: ${formatGroupCode(groupId)}`,
      '',
      'Abre la app, elige "Unirse a un grupo" y escribe el código.',
    ].join('\n');

    try {
      const canOpenWhatsApp = await Linking.canOpenURL('https://wa.me/');
      if (canOpenWhatsApp) {
        await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`);
        return;
      }
    } catch {
      // fall through to the generic share sheet
    }
    try {
      await Share.share({ message, title: 'Únete a mi grupo de gastos' });
    } catch {
      // User dismissed the share sheet — nothing to do
    }
  }

  if (!storageLoaded) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={darkColors.red} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <AmbientGlow height={240} intensity={0.8} />

      <View style={styles.header}>
        <TabHeader
          title="Alertas"
          subtitle={groupName ? `Grupo · ${groupName}` : undefined}
        />
      </View>

      <View style={styles.content}>
        {/* ── Code card ─────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <MaterialCommunityIcons
              name="account-group-outline"
              size={28}
              color={darkColors.red}
            />
          </View>
          <Text style={styles.label}>CÓDIGO DEL GRUPO</Text>
          {groupId ? (
            <Text style={styles.code} adjustsFontSizeToFit numberOfLines={1}>
              {formatGroupCode(groupId)}
            </Text>
          ) : (
            <Text style={styles.noCode}>Sin grupo configurado</Text>
          )}
          <Text style={styles.hint}>
            Comparte el código para que la otra persona se una a tu grupo al
            instante.
          </Text>
        </View>

        {/* ── Actions ───────────────────────────────── */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.whatsappBtn, !groupId && styles.whatsappBtnDisabled]}
            onPress={handleShare}
            disabled={!groupId}
            activeOpacity={0.8}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="whatsapp" size={20} color={darkColors.green} />
            <Text style={styles.whatsappText}>Compartir por WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
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
  header: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
  },
  card: {
    alignItems: 'center',
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: darkColors.red + '1F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  label: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.4,
  },
  code: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 3,
    color: darkColors.textPrimary,
    maxWidth: '100%',
  },
  noCode: {
    ...typography.h3,
    color: darkColors.textMuted,
  },
  hint: {
    ...typography.caption,
    color: darkColors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  actions: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  whatsappBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    height: 56,
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    borderColor: darkColors.green,
  },
  whatsappBtnDisabled: {
    opacity: 0.5,
  },
  whatsappText: {
    ...typography.bodyBold,
    fontSize: 16,
    letterSpacing: 0.8,
    color: darkColors.green,
  },
});
