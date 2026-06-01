import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/constants/theme';

export function BrandIcon({ size = 80 }: { size?: number }) {
  return (
    <View accessibilityLabel="Logo SubastAR" style={{ width: size, height: size }}>
      <View style={[styles.artboard, { left: (size - 120) / 2, top: (size - 120) / 2, transform: [{ scale: size / 120 }] }]}>
        <View style={styles.tile} />
        <View style={styles.ring} />
        <View style={styles.ringMask} />
        <View style={styles.arrowStem} />
        <View style={styles.arrowHead} />
        <View style={styles.handle} />
        <View style={styles.gavelHead} />
        <View style={styles.baseTop} />
        <View style={styles.baseBottom} />
        <View style={styles.sparkOne} />
        <View style={styles.sparkTwo} />
      </View>
    </View>
  );
}

export function BrandWordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Text style={[styles.wordmark, compact && styles.compact]}>
      Subast<Text style={styles.accent}>AR</Text>
    </Text>
  );
}

export function BrandLogo({ iconSize = 88, centered = true }: { iconSize?: number; centered?: boolean }) {
  return (
    <View style={[styles.lockup, centered && styles.lockupCentered]}>
      <BrandIcon size={iconSize} />
      <BrandWordmark />
    </View>
  );
}

const styles = StyleSheet.create({
  artboard: { height: 120, position: 'absolute', width: 120 },
  tile: { backgroundColor: colors.primary, borderRadius: 27, height: 112, left: 4, position: 'absolute', top: 4, width: 112 },
  ring: { borderColor: '#FFF', borderRadius: 38, borderWidth: 4, height: 76, left: 25, position: 'absolute', top: 25, width: 76 },
  ringMask: { backgroundColor: colors.primary, height: 26, left: 77, position: 'absolute', top: 20, transform: [{ rotate: '-23deg' }], width: 22 },
  arrowStem: { backgroundColor: '#FFF', borderRadius: 3, height: 5, left: 75, position: 'absolute', top: 42, transform: [{ rotate: '-45deg' }], width: 29 },
  arrowHead: {
    borderBottomWidth: 9,
    borderColor: 'transparent',
    borderLeftColor: '#FFF',
    borderTopWidth: 9,
    borderLeftWidth: 13,
    height: 0,
    left: 95,
    position: 'absolute',
    top: 25,
    transform: [{ rotate: '-45deg' }],
    width: 0,
  },
  gavelHead: { backgroundColor: '#FFF', borderRadius: 4, height: 18, left: 43, position: 'absolute', top: 42, transform: [{ rotate: '29deg' }], width: 29 },
  handle: { backgroundColor: '#FFF', borderRadius: 4, height: 9, left: 57, position: 'absolute', top: 60, transform: [{ rotate: '31deg' }], width: 37 },
  baseTop: { backgroundColor: '#FFF', borderRadius: 5, height: 8, left: 35, position: 'absolute', top: 76, width: 38 },
  baseBottom: { backgroundColor: '#FFF', borderRadius: 5, height: 7, left: 30, position: 'absolute', top: 86, width: 51 },
  sparkOne: { backgroundColor: '#FFF', borderRadius: 2, height: 3, left: 29, position: 'absolute', top: 65, transform: [{ rotate: '40deg' }], width: 9 },
  sparkTwo: { backgroundColor: '#FFF', borderRadius: 2, height: 3, left: 28, position: 'absolute', top: 72, width: 7 },
  lockup: { alignItems: 'center', gap: 10 },
  lockupCentered: { alignSelf: 'center' },
  wordmark: { color: colors.primaryDark, fontSize: 26, fontFamily: fonts.black, letterSpacing: -0.6 },
  compact: { fontSize: 17, width: 78, letterSpacing: -0.3, lineHeight: 20 },
  accent: { color: colors.primary },
});
