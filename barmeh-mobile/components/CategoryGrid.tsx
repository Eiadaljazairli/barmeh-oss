import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { COLORS } from '../styles/colors';

const { width } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
}

interface CategoryGridProps {
  categories: Category[];
  selectedId: string;
  onSelect: (id: string) => void;
  isRTL: boolean;
}

const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, selectedId, onSelect, isRTL }) => {
  const isUrl = (str: string) => str?.startsWith('http');

  const renderItem = ({ item }: { item: Category }) => {
    const isActive = selectedId === item.id;

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => onSelect(item.id)}
        style={[styles.item, isActive && styles.itemActive]}
      >
        <View style={[styles.iconContainer, isActive && styles.iconActive]}>
          {isUrl(item.icon) ? (
            <Image
              source={{ uri: item.icon }}
              style={{ width: '100%', height: '100%', borderRadius: 18 }}
              contentFit="cover"
            />
          ) : item.icon ? (
            <Text style={styles.emoji}>{item.icon}</Text>
          ) : (
            <View style={{ width: 20, height: 2, backgroundColor: isActive ? COLORS.accent : COLORS.gold, borderRadius: 1 }} />
          )}
        </View>
        <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={4}
        scrollEnabled={false}
        contentContainerStyle={[styles.list, { flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 16,
  },
  list: {
    justifyContent: 'space-between',
  },
  item: {
    width: (width - 64) / 4,
    alignItems: 'center',
    marginBottom: 20,
  },
  itemActive: {
  },
  iconContainer: {
    width: 60,
    height: 60,
    backgroundColor: '#fff',
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(196, 160, 82, 0.1)',
    marginBottom: 8,
  },
  iconActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.gold,
    borderWidth: 2,
  },
  emoji: {
    fontSize: 28,
  },
  label: {
    fontSize: 12,
    color: COLORS.secondary,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  labelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});

export default CategoryGrid;
