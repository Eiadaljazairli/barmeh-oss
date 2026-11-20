import React, { useEffect, useRef } from 'react';
import { StyleSheet, Animated, Easing, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

interface SplashScreenProps {
  onFinish: () => void;
}

const WORD = ['B', 'A', 'R', 'M', 'E', 'H'];
const GOLD = '#D4B26A';

export const BarmehSplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  const letterAnims = useRef(
    WORD.map(() => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(34),
      scale: new Animated.Value(0.6),
      rotate: new Animated.Value(1),
    }))
  ).current;
  const dividerScale = useRef(new Animated.Value(0)).current;
  const tagOpacity = useRef(new Animated.Value(0)).current;
  const tagTranslate = useRef(new Animated.Value(10)).current;
  const containerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});

    const safetyTimer = setTimeout(() => {
      onFinish();
    }, 4500);

    const letterIns = letterAnims.map((a) =>
      Animated.parallel([
        Animated.timing(a.opacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(a.translateY, {
          toValue: 0,
          damping: 9,
          stiffness: 140,
          mass: 0.7,
          useNativeDriver: true,
        }),
        Animated.spring(a.scale, {
          toValue: 1,
          damping: 8,
          stiffness: 130,
          mass: 0.7,
          useNativeDriver: true,
        }),
        Animated.spring(a.rotate, {
          toValue: 0,
          damping: 9,
          stiffness: 120,
          mass: 0.7,
          useNativeDriver: true,
        }),
      ])
    );

    Animated.sequence([
      Animated.stagger(90, letterIns),
      Animated.parallel([
        Animated.timing(dividerScale, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tagOpacity, {
          toValue: 1,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tagTranslate, {
          toValue: 0,
          duration: 420,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(900),
      Animated.timing(containerOpacity, {
        toValue: 0,
        duration: 420,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(() => {
      clearTimeout(safetyTimer);
      onFinish();
    });

    return () => clearTimeout(safetyTimer);
  }, [
    letterAnims,
    dividerScale,
    tagOpacity,
    tagTranslate,
    containerOpacity,
    onFinish,
  ]);

  return (
    <Animated.View style={[styles.container, { opacity: containerOpacity }]}>
      <LinearGradient
        colors={['#0A1C17', '#0E251F', '#0B211B']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.center}>
        <View style={styles.row}>
          {WORD.map((char, i) => {
            const rotate = letterAnims[i].rotate.interpolate({
              inputRange: [0, 1],
              outputRange: ['0deg', '-14deg'],
            });
            return (
              <Animated.Text
                key={`${char}-${i}`}
                style={[
                  styles.letter,
                  {
                    opacity: letterAnims[i].opacity,
                    transform: [
                      { translateY: letterAnims[i].translateY },
                      { scale: letterAnims[i].scale },
                      { rotate },
                    ],
                  },
                ]}
              >
                {char}
              </Animated.Text>
            );
          })}
        </View>

        <Animated.View
          style={[styles.divider, { transform: [{ scaleX: dividerScale }] }]}
        />

        <Animated.Text
          style={[
            styles.tag,
            { opacity: tagOpacity, transform: [{ translateY: tagTranslate }] },
          ]}
        >
          السوق المحلي السوري
        </Animated.Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99999,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  row: {
    direction: 'ltr',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: {
    fontSize: 88,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 8,
    marginHorizontal: 1,
    textShadowColor: 'rgba(212,178,106,0.6)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 32,
  },
  divider: {
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: GOLD,
    marginTop: 28,
    marginBottom: 18,
  },
  tag: {
    fontSize: 24,
    fontWeight: '700',
    color: GOLD,
    letterSpacing: 1,
  },
});
