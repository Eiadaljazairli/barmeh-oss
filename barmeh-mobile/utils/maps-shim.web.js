import React from 'react';
import { View, Text } from 'react-native';

const MapView = ({ children, style }) => (
  <View style={[{ backgroundColor: '#e0e0e0', justifyContent: 'center', alignItems: 'center' }, style]}>
    <Text style={{ color: '#666' }}>الخريطة متوفرة فقط في تطبيق الجوال</Text>
    {children}
  </View>
);

export const Marker = () => null;
export const Callout = () => null;
export const Circle = () => null;
export const Polyline = () => null;
export const Polygon = () => null;

export default MapView;
