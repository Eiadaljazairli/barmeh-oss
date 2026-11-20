import React, { useEffect, useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Constants from 'expo-constants';
import { api } from '../services/api';

interface VersionPayload {
  android: { latest: string; min: string; storeUrl: string };
  ios: { latest: string; min: string; storeUrl: string };
}

function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map((x) => parseInt(x, 10) || 0);
  const pb = b.split('.').map((x) => parseInt(x, 10) || 0);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i++) {
    const av = pa[i] ?? 0;
    const bv = pb[i] ?? 0;
    if (av < bv) return -1;
    if (av > bv) return 1;
  }
  return 0;
}

export const UpdatePrompt: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [force, setForce] = useState(false);
  const [storeUrl, setStoreUrl] = useState<string | null>(null);
  const [latest, setLatest] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const res = await api.get<VersionPayload>('/app/version');
        if (cancelled) return;

        const current = Constants.expoConfig?.version || '0.0.0';
        const platformInfo =
          Platform.OS === 'ios' ? res.data.ios : res.data.android;

        const cmpMin = compareVersions(current, platformInfo.min);
        const cmpLatest = compareVersions(current, platformInfo.latest);

        if (cmpMin < 0) {
          setForce(true);
          setOpen(true);
          setStoreUrl(platformInfo.storeUrl);
          setLatest(platformInfo.latest);
        } else if (cmpLatest < 0) {
          setForce(false);
          setOpen(true);
          setStoreUrl(platformInfo.storeUrl);
          setLatest(platformInfo.latest);
        }
      } catch {
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdate = async () => {
    if (!storeUrl) return;
    setOpening(true);
    try {
      await Linking.openURL(storeUrl);
    } catch {
    } finally {
      setOpening(false);
    }
  };

  if (!open) return null;

  return (
    <Modal
      visible={open}
      transparent
      animationType="fade"
      onRequestClose={() => {
        if (!force) setOpen(false);
      }}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <Text style={styles.title}>
            {force ? 'يجب تحديث التطبيق' : 'تحديث جديد متاح'}
          </Text>
          <Text style={styles.body}>
            {force
              ? 'هذه النسخة لم تعد مدعومة. يجب تنزيل أحدث إصدار للمتابعة.'
              : 'تتوفر نسخة جديدة من برمة بمزايا وإصلاحات أفضل. ننصح بالتحديث الآن.'}
          </Text>
          {latest && (
            <Text style={styles.versionHint}>
              النسخة الجديدة: <Text style={styles.versionBold}>{latest}</Text>
            </Text>
          )}

          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleUpdate}
            disabled={opening || !storeUrl}
            activeOpacity={0.85}
          >
            {opening ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>تحديث الآن</Text>
            )}
          </TouchableOpacity>

          {!force && (
            <TouchableOpacity
              style={styles.secondaryBtn}
              onPress={() => setOpen(false)}
              activeOpacity={0.7}
            >
              <Text style={styles.secondaryBtnText}>لاحقاً</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(8, 26, 21, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0E251F',
    textAlign: 'center',
    marginBottom: 12,
  },
  body: {
    fontSize: 15,
    lineHeight: 24,
    color: '#445',
    textAlign: 'center',
    marginBottom: 16,
  },
  versionHint: {
    fontSize: 13,
    color: '#667',
    textAlign: 'center',
    marginBottom: 20,
  },
  versionBold: {
    fontWeight: '900',
    color: '#0E251F',
  },
  primaryBtn: {
    width: '100%',
    height: 52,
    backgroundColor: '#0E251F',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: '#667',
    fontSize: 14,
    fontWeight: '700',
  },
});
