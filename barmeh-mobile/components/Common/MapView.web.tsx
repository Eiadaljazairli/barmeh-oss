import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const PROVIDER_GOOGLE = 'google';

export const Marker = ({ children }: any) => <View>{children}</View>;
export const Callout = ({ children }: any) => <View>{children}</View>;

const MapView = ({ style, children }: any) => (
  <View style={[styles.container, style]}>
    <Text style={styles.text}>الخريطة متوفرة فقط في تطبيق الجوال</Text>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
  },
  text: {
    color: '#64748b',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    padding: 20,
  }
});

export default MapView;
