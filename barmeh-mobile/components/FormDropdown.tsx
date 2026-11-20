import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Modal, 
  FlatList, 
  Dimensions,
  TouchableWithoutFeedback
} from 'react-native';
import { ChevronDown, X, Check } from 'lucide-react-native';
import { COLORS } from '../styles/colors';

const { height } = Dimensions.get('window');

interface Option {
  label: string;
  value: string;
}

interface Props {
  label: string;
  value: string | null;
  options: Option[];
  onSelect: (value: string) => void;
  placeholder?: string;
  isRTL: boolean;
  required?: boolean;
}

export const FormDropdown: React.FC<Props> = ({ 
  label, 
  value, 
  options, 
  onSelect, 
  placeholder, 
  isRTL,
  required 
}) => {
  const [modalVisible, setModalVisible] = useState(false);
  
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { textAlign: isRTL ? 'right' : 'left' }]}>
          {label}
          {required && <Text style={{ color: '#ef4444' }}> *</Text>}
        </Text>
      ) : null}
      
      <TouchableOpacity 
        style={[styles.selector, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={[
          styles.valueText, 
          !selectedOption && { color: '#94a3b8' },
          { textAlign: isRTL ? 'right' : 'left' }
        ]}>
          {selectedOption ? selectedOption.label : (placeholder || 'اختر...')}
        </Text>
        <ChevronDown size={20} color={COLORS.secondary} />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={[styles.modalHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={styles.modalTitle}>{label}</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <X size={24} color={COLORS.secondary} />
                  </TouchableOpacity>
                </View>

                <FlatList
                  data={options}
                  keyExtractor={(item) => item.value}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={[styles.optionItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                      onPress={() => {
                        onSelect(item.value);
                        setModalVisible(false);
                      }}
                    >
                      <Text style={[
                        styles.optionText,
                        value === item.value && styles.optionTextActive,
                        { textAlign: isRTL ? 'right' : 'left' }
                      ]}>
                        {item.label}
                      </Text>
                      {value === item.value && <Check size={20} color={COLORS.primary} />}
                    </TouchableOpacity>
                  )}
                  style={styles.list}
                  showsVerticalScrollIndicator={false}
                />
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.darkGray,
    marginBottom: 8,
  },
  selector: {
    height: 54,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  valueText: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.secondary,
    flex: 1,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: height * 0.7,
    paddingBottom: 40,
  },
  modalHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.secondary,
  },
  list: {
    paddingHorizontal: 24,
  },
  optionItem: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#f8fafc',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    color: COLORS.darkGray,
    fontWeight: '600',
    flex: 1,
  },
  optionTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});
