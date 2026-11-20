import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { Image } from 'expo-image';
import { ensureAbsoluteUrl } from '../utils/url';

const PALETTE = [
  { bg: '#DBEAFE', fg: '#1D4ED8' },
  { bg: '#FEF3C7', fg: '#B45309' },
  { bg: '#DCFCE7', fg: '#15803D' },
  { bg: '#FCE7F3', fg: '#BE185D' },
  { bg: '#EDE9FE', fg: '#6D28D9' },
  { bg: '#FFE4E6', fg: '#BE123C' },
  { bg: '#CCFBF1', fg: '#0F766E' },
  { bg: '#FFEDD5', fg: '#C2410C' },
];

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h << 5) - h + input.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

function firstLetter(name?: string | null): string {
  if (!name) return 'U';
  const trimmed = name.trim();
  if (!trimmed) return 'U';
  const auto = trimmed.match(/^(?:user|guest)_(\d)/i);
  if (auto) return auto[1];
  return trimmed[0].toUpperCase();
}

export interface UserAvatarProps {
  name?: string | null;
  photoUrl?: string | null;
  seed?: string | null;
  size?: number;
  ring?: boolean;
  style?: ViewStyle;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  name,
  photoUrl,
  seed,
  size = 32,
  ring = false,
  style,
}) => {
  const colors = useMemo(() => {
    const key = (seed || name || 'anonymous').toString();
    return PALETTE[hashSeed(key) % PALETTE.length];
  }, [seed, name]);

  const photoAbs = photoUrl ? ensureAbsoluteUrl(photoUrl) : null;

  const containerStyle: ViewStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    ...(ring && {
      borderWidth: 1.5,
      borderColor: '#FFFFFF',
    }),
    ...style,
  };

  if (photoAbs) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: photoAbs }}
          style={{ width: size, height: size }}
          contentFit="cover"
          transition={200}
          cachePolicy="memory-disk"
        />
      </View>
    );
  }

  const letterStyle: TextStyle = {
    color: colors.fg,
    fontSize: Math.round(size * 0.45),
    fontWeight: '800',
    lineHeight: Math.round(size * 0.45) + 2,
  };

  return (
    <View style={containerStyle}>
      <Text style={letterStyle}>{firstLetter(name)}</Text>
    </View>
  );
};

export default UserAvatar;
