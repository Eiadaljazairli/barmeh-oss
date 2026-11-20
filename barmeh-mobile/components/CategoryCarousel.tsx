import React, { useCallback, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { COLORS } from '../styles/colors';

interface Category {
  id: string;
  icon: any;
  name: string;
}

interface CategoryCarouselProps {
  categories: Category[];
  selectedId?: string;
  onSelect: (id: string) => void;
  isRTL: boolean;
}

const ACTIVE_BG = 'rgba(249, 115, 22, 0.10)';
const ACTIVE_BORDER = '#F97316';
const INACTIVE_BG = '#F1F5F9';
const INACTIVE_ICON = '#64748B';

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedId,
  onSelect,
  isRTL,
}) => {
  const scrollRef = useRef<ScrollView>(null);

  const snapToStart = useCallback(() => {
    if (isRTL) {
      scrollRef.current?.scrollToEnd({ animated: false });
    }
  }, [isRTL]);

  const isUrl = (str: any) => typeof str === 'string' && str.startsWith('http');

  const renderIcon = (iconItem: any, isActive: boolean) => {
    if (isUrl(iconItem)) {
      return (
        <Image
          source={{ uri: iconItem }}
          style={{ width: '62%', height: '62%' }}
          contentFit="contain"
        />
      );
    }
    const IconComponent =
      typeof iconItem === 'function' || typeof iconItem === 'object'
        ? iconItem
        : Package;
    return (
      <IconComponent
        size={26}
        color={isActive ? ACTIVE_BORDER : INACTIVE_ICON}
        strokeWidth={isActive ? 2.4 : 1.9}
      />
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onLayout={snapToStart}
        onContentSizeChange={snapToStart}
        contentContainerStyle={[
          styles.scrollContent,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
      >
        {categories.map((category) => {
          const isActive = selectedId === category.id;
          return (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => onSelect(category.id)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.iconContainer,
                  isActive && styles.iconContainerActive,
                ]}
              >
                {renderIcon(category.icon, isActive)}
              </View>
              <Text
                style={[
                  styles.label,
                  isActive && styles.labelActive,
                  { writingDirection: isRTL ? 'rtl' : 'ltr' },
                ]}
                numberOfLines={2}
              >
                {category.name}
              </Text>
              {isActive && <View style={styles.activeDot} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 14,
    backgroundColor: COLORS.accent,
  },
  scrollContent: {
    paddingHorizontal: 18,
    gap: 14,
    alignItems: 'flex-start',
  },
  categoryItem: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: INACTIVE_BG,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  iconContainerActive: {
    backgroundColor: ACTIVE_BG,
    borderColor: ACTIVE_BORDER,
    shadowColor: ACTIVE_BORDER,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },
  label: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    textAlign: 'center',
    lineHeight: 14,
  },
  labelActive: {
    color: ACTIVE_BORDER,
    fontWeight: '800',
  },
  activeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: ACTIVE_BORDER,
    marginTop: 2,
  },
});
