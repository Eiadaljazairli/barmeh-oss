import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Switch } from 'react-native';
import { CATEGORY_SCHEMAS, CategoryField } from '../constants/categorySchemas';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../styles/colors';
import { ChevronDown, Info } from 'lucide-react-native';
import { FormDropdown } from './FormDropdown';

interface Props {
  categorySlug: string;
  values: { [key: string]: any };
  onChange: (key: string, value: any) => void;
  isRTL: boolean;
}

const DynamicAttributesForm: React.FC<Props> = ({ categorySlug, values, onChange, isRTL }) => {
  const { t } = useTranslation();
  const fields = CATEGORY_SCHEMAS[categorySlug] || [];

  if (fields.length === 0) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Info size={18} color={COLORS.primary} />
        <Text style={[styles.headerText, { marginLeft: isRTL ? 0 : 8, marginRight: isRTL ? 8 : 0 }]}>
          {t('post.additional_details')}
        </Text>
      </View>

      <View style={[styles.grid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {fields.map((field) => (
          <View key={field.key} style={[styles.fieldContainer, field.type === 'boolean' && styles.fullWidth]}>
            <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
              {isRTL ? field.labelAr : field.labelEn}
              {field.required && <Text style={{ color: '#ef4444' }}> *</Text>}
            </Text>

            {field.type === 'select' ? (
              <FormDropdown
                label=""
                value={values[field.key] || null}
                options={field.options?.map(opt => ({
                  label: isRTL ? opt.labelAr : opt.labelEn,
                  value: opt.value
                })) || []}
                onSelect={(val) => onChange(field.key, val)}
                isRTL={isRTL}
                placeholder={isRTL ? 'اختر...' : 'Select...'}
              />
            ) : field.type === 'boolean' ? (
              <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={styles.switchLabel}>
                  {values[field.key] ? (isRTL ? 'نعم' : 'Yes') : (isRTL ? 'لا' : 'No')}
                </Text>
                <Switch
                  value={!!values[field.key]}
                  onValueChange={(val) => onChange(field.key, val)}
                  trackColor={{ false: '#e2e8f0', true: COLORS.primary }}
                  thumbColor="#fff"
                />
              </View>
            ) : (
              <View style={[styles.inputWrapper, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TextInput
                  style={[styles.input, { textAlign: isRTL ? 'right' : 'left' }]}
                  placeholder={isRTL ? (field.placeholderAr || 'أدخل القيمة') : (field.placeholderEn || 'Enter value')}
                  placeholderTextColor="#94a3b8"
                  keyboardType={field.type === 'number' ? 'numeric' : 'default'}
                  value={values[field.key]?.toString() || ''}
                  onChangeText={(val) => onChange(field.key, field.type === 'number' ? val.replace(/[^0-9]/g, '') : val)}
                />
                {(field.suffixAr || field.suffixEn) && (
                  <Text style={[styles.suffix, { [isRTL ? 'marginRight' : 'marginLeft']: 5 }]}>
                    {isRTL ? field.suffixAr : field.suffixEn}
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 25,
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  fieldContainer: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 18,
  },
  fullWidth: {
    width: '100%',
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  inputWrapper: {
    height: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.secondary,
    fontWeight: '600',
    includeFontPadding: false,
    height: '100%',
    textAlignVertical: 'center',
  },
  suffix: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '800',
    marginLeft: 5,
  },
  selectWrapper: {
    marginTop: 2,
  },
  optionsRow: {
    flexWrap: 'wrap',
    gap: 6,
  },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  optionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  optionText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.secondary,
  },
  optionTextActive: {
    color: '#fff',
  },
  switchRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  }
});

export default DynamicAttributesForm;
