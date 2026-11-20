import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';
import { COLORS } from '../styles/colors';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

export const SkeletonListingCard = () => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [opacity]);

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, { opacity }]} />
      <View style={styles.content}>
        <Animated.View style={[styles.line, { width: '80%', opacity }]} />
        <Animated.View style={[styles.line, { width: '60%', height: 20, opacity }]} />
        <View style={styles.footer}>
          <Animated.View style={[styles.circle, { opacity }]} />
          <Animated.View style={[styles.line, { width: '40%', opacity }]} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: COLUMN_WIDTH,
    backgroundColor: COLORS.accent,
    borderRadius: 24,
    marginBottom: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.1)',
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#E1E9EE',
  },
  content: {
    padding: 12,
  },
  line: {
    height: 14,
    backgroundColor: '#E1E9EE',
    borderRadius: 7,
    marginBottom: 8,
    alignSelf: 'flex-end',
  },
  footer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  circle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E1E9EE',
    marginLeft: 6,
  },
});
