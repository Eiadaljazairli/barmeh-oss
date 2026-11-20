import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

const BG = '#0E251F';
const GOLD = '#C4A052';
const TAGLINE = 'السوق المحلي السوري';
const MIN_SPLASH_MS = 1600;

const LETTERS = [
  { src: require('../assets/images/letters/b.png'), w: 115 },
  { src: require('../assets/images/letters/a.png'), w: 138 },
  { src: require('../assets/images/letters/r.png'), w: 127 },
  { src: require('../assets/images/letters/m.png'), w: 140 },
  { src: require('../assets/images/letters/e.png'), w: 120 },
  { src: require('../assets/images/letters/h.png'), w: 118 },
] as const;
const WORD_W = 758;
const WORD_H = 136;

export interface AnimatedSplashProps {
  ready: boolean;
  onFinish: () => void;
}

export default function AnimatedSplash({ ready, onFinish }: AnimatedSplashProps) {
  const { width } = useWindowDimensions();

  const rises = useRef(LETTERS.map(() => new Animated.Value(1))).current;
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineShift = useRef(new Animated.Value(10)).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const overlayScale = useRef(new Animated.Value(1)).current;

  const [mountedAt] = useState(() => Date.now());
  const exiting = useRef(false);
  const finished = useRef(false);

  const finishOnce = useCallback(() => {
    if (finished.current) return;
    finished.current = true;
    onFinish();
  }, [onFinish]);

  const onLayout = useCallback(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.stagger(
        70,
        rises.map((v) =>
          Animated.timing(v, {
            toValue: 0,
            duration: 520,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ),
      ),
      Animated.sequence([
        Animated.delay(550),
        Animated.parallel([
          Animated.timing(dividerScale, {
            toValue: 1,
            duration: 500,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(taglineOpacity, {
            toValue: 1,
            duration: 450,
            useNativeDriver: true,
          }),
          Animated.timing(taglineShift, {
            toValue: 0,
            duration: 450,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready || exiting.current) return;
    const wait = Math.max(0, MIN_SPLASH_MS - (Date.now() - mountedAt));
    const tm = setTimeout(() => {
      exiting.current = true;
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 420,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayScale, {
          toValue: 1.08,
          duration: 420,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start(finishOnce);
    }, wait);
    return () => clearTimeout(tm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    const cap = setTimeout(finishOnce, 6000);
    return () => clearTimeout(cap);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordWidth = Math.min(width * 0.62, 230);
  const scale = wordWidth / WORD_W;
  const letterH = WORD_H * scale;

  return (
    <Animated.View
      style={[
        styles.overlay,
        { opacity: overlayOpacity, transform: [{ scale: overlayScale }] },
      ]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      <Animated.View style={[styles.lettersRow, { direction: 'ltr' }]}>
        {LETTERS.map((letter, i) => {
          const w = letter.w * scale;
          return (
            <Animated.View
              key={i}
              style={{ width: w, height: letterH, overflow: 'hidden' }}
            >
              <Animated.Image
                source={letter.src}
                resizeMode="stretch"
                style={{
                  width: w,
                  height: letterH,
                  transform: [
                    {
                      translateY: rises[i].interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, letterH * 1.1],
                      }),
                    },
                  ],
                }}
              />
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.View
        style={[styles.divider, { transform: [{ scaleX: dividerScale }] }]}
      />
      <Animated.Text
        style={[
          styles.tagline,
          { opacity: taglineOpacity, transform: [{ translateY: taglineShift }] },
        ]}
      >
        {TAGLINE}
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
    elevation: 999,
  },
  lettersRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  divider: {
    width: 64,
    height: 3,
    borderRadius: 2,
    backgroundColor: GOLD,
    marginTop: 26,
  },
  tagline: {
    marginTop: 14,
    fontSize: 15,
    letterSpacing: 0.5,
    color: '#CFC9BD',
    writingDirection: 'rtl',
  },
});
