import React, { useRef } from 'react';
import {
  View,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../styles/colors';
import { ensureAbsoluteUrl } from '../utils/url';

const { width: screenWidth } = Dimensions.get('window');

interface ImageGalleryProps {
  images: Array<{ id?: string; thumbUrl?: string; mediumUrl?: string }>;
  fallbackImage?: string;
  activeImageIndex: number;
  onImageChange: (index: number) => void;
  isRTL?: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=800&auto=format&fit=crop';

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  images,
  fallbackImage = FALLBACK_IMAGE,
  activeImageIndex,
  onImageChange,
}) => {
  const scrollViewRef = useRef<ScrollView>(null);

  const displayImages =
    images.length > 0
      ? images
      : [{ id: 'placeholder', mediumUrl: fallbackImage, thumbUrl: fallbackImage }];

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / screenWidth);
    if (index !== activeImageIndex) {
      onImageChange(index);
    }
  };

  const scrollToImage = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * screenWidth,
      animated: true,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
        contentContainerStyle={{ width: screenWidth * displayImages.length }}
      >
        {displayImages.map((img, index) => {
          const uri = ensureAbsoluteUrl(img.mediumUrl || img.thumbUrl) || fallbackImage;
          return (
            <View key={img.id || index} style={styles.imageWrapper}>
              <Image
                source={{ uri }}
                style={styles.image}
                contentFit="contain"
                transition={300}
                cachePolicy="disk"
              />
            </View>
          );
        })}
      </ScrollView>

      {displayImages.length > 1 && (
        <View style={styles.counter}>
          <Text style={styles.counterText}>
            {activeImageIndex + 1} / {displayImages.length}
          </Text>
        </View>
      )}

      {displayImages.length > 1 && (
        <View style={styles.thumbnailContainer}>
          {displayImages.map((img, index) => (
            <TouchableOpacity
              key={img.id || index}
              style={[
                styles.thumbnail,
                activeImageIndex === index && styles.thumbnailActive,
              ]}
              onPress={() => scrollToImage(index)}
            >
              <Image
                source={{
                  uri:
                    ensureAbsoluteUrl(img.thumbUrl || img.mediumUrl) || fallbackImage,
                }}
                style={styles.thumbnailImage}
                contentFit="cover"
              />
              {activeImageIndex === index && (
                <View style={styles.thumbnailOverlay} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.accent,
    position: 'relative',
  },
  scrollView: {
    height: 400,
  },
  imageWrapper: {
    width: screenWidth,
    height: 400,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  counter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    zIndex: 5,
  },
  counterText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  thumbnailContainer: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
    backgroundColor: COLORS.accent,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.05)',
  },
  thumbnail: {
    width: 60,
    height: 60,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbnailActive: {
    borderColor: COLORS.primary,
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
  },
  thumbnailOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(6, 78, 59, 0.3)',
  },
});
