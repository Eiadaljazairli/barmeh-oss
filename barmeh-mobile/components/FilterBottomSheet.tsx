import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { X } from 'lucide-react-native';
import { DynamicCategoryFilters, AttributeFilters } from './DynamicCategoryFilters';
import { COLORS } from '../styles/colors';

interface Props {
  visible: boolean;
  onClose: () => void;
  categorySlug: string | null;
  values: AttributeFilters;
  onChange: (v: AttributeFilters) => void;
  onClear: () => void;
  isRTL: boolean;
  language: 'ar' | 'en' | string;
}

export const FilterBottomSheet: React.FC<Props> = ({
  visible,
  onClose,
  categorySlug,
  values,
  onChange,
  onClear,
  isRTL,
  language,
}) => {
  const isAr = language === 'ar';
  const activeCount = Object.keys(values).length;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View
            style={[
              styles.header,
              { flexDirection: isRTL ? 'row-reverse' : 'row' },
            ]}
          >
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <X size={22} color={COLORS.secondary} />
            </TouchableOpacity>
            <Text style={styles.title}>
              {isAr ? 'فلاتر متقدمة' : 'Advanced filters'}
              {activeCount > 0 && (
                <Text style={styles.countBadge}> ({activeCount})</Text>
              )}
            </Text>
            <TouchableOpacity onPress={onClear} disabled={activeCount === 0}>
              <Text
                style={[
                  styles.clearText,
                  activeCount === 0 && styles.clearTextDisabled,
                ]}
              >
                {isAr ? 'مسح' : 'Clear'}
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <DynamicCategoryFilters
              categorySlug={categorySlug}
              values={values}
              onChange={onChange}
              isRTL={isRTL}
              language={language}
            />
            <View style={{ height: 16 }} />
          </ScrollView>

          <TouchableOpacity
            style={styles.applyBtn}
            onPress={onClose}
            activeOpacity={0.85}
          >
            <Text style={styles.applyText}>
              {isAr ? 'تطبيق' : 'Apply'}
            </Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
    maxHeight: '85%',
    minHeight: 280,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  header: {
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#f5f5f7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  countBadge: {
    color: COLORS.gold,
    fontWeight: '900',
  },
  clearText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.gold,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  clearTextDisabled: {
    color: 'rgba(0,0,0,0.25)',
  },
  content: {
    paddingTop: 12,
  },
  applyBtn: {
    marginHorizontal: 20,
    marginTop: 12,
    backgroundColor: COLORS.gold,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '900',
  },
});
