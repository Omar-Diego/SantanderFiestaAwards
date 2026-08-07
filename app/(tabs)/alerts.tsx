import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Share,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale/es';
import AmbientGlow from '../../src/components/AmbientGlow';
import TabHeader from '../../src/components/TabHeader';
import { getGroupId, getGroupName, getOrCreateDeviceId } from '../../src/utils/storage';
import { formatGroupCode } from '../../src/services/group';
import { useGroupEvents } from '../../src/hooks/useGroupEvents';
import { darkColors, typography, spacing, borderRadius } from '../../src/theme';
import type { GroupEvent } from '../../src/types';

// ─── Currency formatter ─────────────────────────────────
const fmt = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  minimumFractionDigits: 2,
});

function formatCurrency(amount: number): string {
  return fmt.format(amount);
}

// ─── Event presentation ─────────────────────────────────
const EVENT_META: Record<GroupEvent['type'], { icon: string; color: string }> = {
  expense_added: { icon: 'plus-circle-outline', color: darkColors.green },
  expense_deleted: { icon: 'trash-can-outline', color: darkColors.red },
  expense_updated: { icon: 'pencil-circle-outline', color: darkColors.warning },
  budget_reached: { icon: 'alert-circle-outline', color: darkColors.red },
  budget_reset: { icon: 'credit-card-outline', color: darkColors.green },
};

function eventText(ev: GroupEvent): string {
  const money = (n?: number) => (n == null ? '' : formatCurrency(n));
  switch (ev.type) {
    case 'expense_added':
      return `Gasto registrado · ${ev.description ?? ''} · ${money(ev.amount)}`;
    case 'expense_deleted':
      return `Gasto eliminado · ${ev.description ?? ''}`;
    case 'expense_updated':
      return `Gasto editado · ${ev.description ?? ''} · ${money(ev.amount)}`;
    case 'budget_reached':
      return `Crédito alcanzado · Gastaste ${money(ev.amount)} de ${money(ev.budgetAmount)}`;
    case 'budget_reset':
      return `Crédito restablecido · Meta de ${money(ev.amount)}`;
  }
}

function EventRow({ event, isMine }: { event: GroupEvent; isMine: boolean }) {
  const meta = EVENT_META[event.type];
  const when = formatDistanceToNow(event.createdAt, { addSuffix: true, locale: es });
  return (
    <View style={styles.eventRow}>
      <View style={[styles.eventIcon, { backgroundColor: meta.color + '1F' }]}>
        <MaterialCommunityIcons name={meta.icon as any} size={20} color={meta.color} />
      </View>
      <View style={styles.eventInfo}>
        <Text style={styles.eventText} numberOfLines={2}>
          {eventText(event)}
        </Text>
        <Text style={styles.eventMeta}>
          {when} · {isMine ? 'Tú' : 'Otro celular'}
        </Text>
      </View>
    </View>
  );
}

// ─── Main Screen (Alertas) — código del grupo + feed ────
export default function AlertsScreen() {
  const [groupId, setGroupId] = useState<string | null>(null);
  const [groupName, setGroupName] = useState<string | null>(null);
  const [storageLoaded, setStorageLoaded] = useState(false);
  const [localDeviceId, setLocalDeviceId] = useState<string | null>(null);

  // Real-time activity feed (shared between the 2 phones)
  const { events } = useGroupEvents(groupId);
  const latestEvents = events.slice(0, 3);

  useEffect(() => {
    (async () => {
      const [gid, name] = await Promise.all([getGroupId(), getGroupName()]);
      setGroupId(gid);
      setGroupName(name);
      setStorageLoaded(true);
      const deviceId = await getOrCreateDeviceId();
      setLocalDeviceId(deviceId);
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

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
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

        {/* ── Activity feed (últimas 3) ──────────────── */}
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>ÚLTIMAS ALERTAS</Text>
          {latestEvents.length > 0 ? (
            latestEvents.map((ev) => (
              <EventRow
                key={ev.id}
                event={ev}
                isMine={localDeviceId != null && ev.deviceId === localDeviceId}
              />
            ))
          ) : (
            <View style={styles.feedEmpty}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={28}
                color={darkColors.textMuted}
              />
              <Text style={styles.feedEmptyText}>Aún no hay alertas</Text>
              <Text style={styles.feedEmptySub}>
                Los cambios de gastos y presupuesto aparecerán aquí.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
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
    paddingBottom: 160,
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

  // Feed
  feedSection: {
    marginTop: spacing.xxl,
    gap: spacing.sm,
  },
  feedTitle: {
    ...typography.label,
    color: darkColors.textSecondary,
    letterSpacing: 1.4,
    marginBottom: spacing.xs,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: darkColors.surface,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: darkColors.borderSubtle,
    padding: spacing.lg,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  eventInfo: {
    flex: 1,
  },
  eventText: {
    ...typography.body,
    color: darkColors.textPrimary,
    fontWeight: '600',
    lineHeight: 20,
  },
  eventMeta: {
    ...typography.small,
    color: darkColors.textMuted,
    marginTop: 2,
  },
  feedEmpty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  feedEmptyText: {
    ...typography.bodyBold,
    color: darkColors.textSecondary,
  },
  feedEmptySub: {
    ...typography.small,
    color: darkColors.textMuted,
    textAlign: 'center',
  },
});
