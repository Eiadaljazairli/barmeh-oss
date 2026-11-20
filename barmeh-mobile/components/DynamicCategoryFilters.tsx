import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { CATEGORY_SCHEMAS, CategoryField } from '../constants/categorySchemas';
import { COLORS } from '../styles/colors';
import { ChevronDown, X, Check, SlidersHorizontal } from 'lucide-react-native';

export type AttributeFilters = Record<string, string>;

interface DynamicCategoryFiltersProps {
  categorySlug: string | null;
  values: AttributeFilters;
  onChange: (next: AttributeFilters) => void;
  isRTL: boolean;
  language: 'ar' | 'en' | string;
}

export const DynamicCategoryFilters: React.FC<DynamicCategoryFiltersProps> = ({
  categorySlug,
  values,
  onChange,
  isRTL,
  language,
}) => {
  const [activeModalField, setActiveModalField] = useState<CategoryField | null>(null);

  if (!categorySlug) return null;
  const schema = CATEGORY_SCHEMAS[categorySlug];
  if (!schema || schema.length === 0) return null;

  const selectFields = schema.filter((f) => f.type === 'select' && f.options?.length);
  if (selectFields.length === 0) return null;

  const isAr = language === 'ar';

  const setValue = (key: string, value: string | null) => {
    const next = { ...values };
    if (value === null) {
      delete next[key];
    } else {
      next[key] = value;
    }
    onChange(next);
  };

  const renderField = (field: CategoryField) => {
    const active = values[field.key];
    const label = isAr ? field.labelAr : field.labelEn;
    const activeOption = field.options?.find((opt) => opt.value === active);
    const activeLabel = activeOption ? (isAr ? activeOption.labelAr : activeOption.labelEn) : (isAr ? 'الكل' : 'All');

    return (
      <View key={field.key} style={styles.dropdownContainer}>
        <TouchableOpacity
          style={[styles.dropdownBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
          onPress={() => setActiveModalField(field)}
          activeOpacity={0.7}
        >
          <View style={[styles.selectorLeft, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <SlidersHorizontal size={16} color={COLORS.primary} />
            <Text style={styles.dropdownLabel}>
              {label}:
            </Text>
            <Text style={styles.dropdownValue}>
              {activeLabel}
            </Text>
          </View>
          <ChevronDown size={18} color={COLORS.primary} />
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {selectFields.map(renderField)}

      <Modal
        visible={!!activeModalField}
        animationType="slide"
        transparent
        onRequestClose={() => setActiveModalField(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActiveModalField(null)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={styles.modalTitle}>
                {activeModalField ? (isAr ? activeModalField.labelAr : activeModalField.labelEn) : ''}
              </Text>
              <TouchableOpacity onPress={() => setActiveModalField(null)}>
                <X size={24} color={COLORS.secondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.modalItem,
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                  !values[activeModalField?.key || ''] && styles.modalItemActive
                ]}
                onPress={() => {
                  if (activeModalField) setValue(activeModalField.key, null);
                  setActiveModalField(null);
                }}
              >
                <Text style={[
                  styles.modalItemText,
                  !values[activeModalField?.key || ''] && styles.modalItemTextActive
                ]}>
                  {isAr ? 'الكل' : 'All'}
                </Text>
                {!values[activeModalField?.key || ''] && <Check size={18} color={COLORS.primary} />}
              </TouchableOpacity>

              {activeModalField?.options?.map((opt) => {
                const isSelected = values[activeModalField.key] === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      styles.modalItem,
                      { flexDirection: isRTL ? 'row-reverse' : 'row' },
                      isSelected && styles.modalItemActive
                    ]}
                    onPress={() => {
                      setValue(activeModalField.key, opt.value);
                      setActiveModalField(null);
                    }}
                  >
                    <Text style={[
                      styles.modalItemText,
                      isSelected && styles.modalItemTextActive
                    ]}>
                      {isAr ? opt.labelAr : opt.labelEn}
                    </Text>
                    {isSelected && <Check size={18} color={COLORS.primary} />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
  },
  dropdownContainer: {
    marginBottom: 8,
  },
  dropdownBtn: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorLeft: {
    alignItems: 'center',
    gap: 8,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.secondary,
    opacity: 0.7,
  },
  dropdownValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.secondary,
  },
  modalScroll: {
    padding: 16,
  },
  modalItem: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
  },
  modalItemActive: {
    backgroundColor: 'rgba(6, 78, 59, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(6, 78, 59, 0.1)',
  },
  modalItemText: {
    fontSize: 16,
    color: COLORS.secondary,
    fontWeight: '600',
  },
  modalItemTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
