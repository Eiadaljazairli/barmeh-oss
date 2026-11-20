import React from 'react';
import MapView, { Marker, Callout, PROVIDER_GOOGLE, Region } from 'react-native-maps';

export interface MapViewProps {
  mapRef?: React.RefObject<MapView>;
  initialRegion: Region;
  style?: any;
  children?: React.ReactNode;
  provider?: any;
  showsUserLocation?: boolean;
  showsMyLocationButton?: boolean;
  scrollEnabled?: boolean;
  zoomEnabled?: boolean;
  pitchEnabled?: boolean;
  rotateEnabled?: boolean;
}

const CustomMapView: React.FC<MapViewProps> = ({
  mapRef,
  initialRegion,
  style,
  children,
  provider = PROVIDER_GOOGLE,
  ...props
}) => {
  return (
    <MapView
      ref={mapRef}
      provider={provider}
      style={style}
      initialRegion={initialRegion}
      {...props}
    >
      {children}
    </MapView>
  );
};

export { Marker, Callout, PROVIDER_GOOGLE };
export default CustomMapView;
