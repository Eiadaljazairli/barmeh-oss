import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, Plus, Edit2, Trash2, Tag, Save, X } from 'lucide-react-native';
import { api, listingService } from '../../services/api';
import { COLORS } from '../../styles/colors';

interface Category {
  id: string;
  nameAr: string;
  slug: string;
  icon: string;
  parentId?: string | null;
  order: number;
}

export default function AdminCategoriesScreen() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [nameAr, setNameAr] = useState('');
  const [slug, setSlug] = useState('');
  const [icon, setIcon] = useState('');
  const [order, setOrder] = useState('0');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await listingService.getCategories();
      setCategories(data as any);
    } catch (error) {
      Alert.alert('خطأ', 'فشل تحميل الفئات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!nameAr || !slug) {
      Alert.alert('تنبيه', 'يرجى إدخال الاسم والاسم اللطيف');
      return;
    }

    try {
      setIsSaving(true);
      const data = { nameAr, slug, icon, order: parseInt(order) };
      
      if (editingCategory) {
        await api.patch(`/categories/${editingCategory.id}`, data);
      } else {
        await api.post('/categories', data);
      }
      
      setModalVisible(false);
      loadCategories();
      Alert.alert('نجاح', 'تم حفظ الفئة بنجاح');
    } catch (error) {
      Alert.alert('خطأ', 'فشل حفظ البيانات');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = (id: string) => {
    Alert.alert(
      'تأكيد الحذف',
      'هل أنت متأكد من رغبتك في حذف هذه الفئة؟ سيتم إخفاؤها من التطبيق.',
      [
        { text: 'إلغاء', style: 'cancel' },
        { 
          text: 'حذف', 
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/categories/${id}`);
              loadCategories();
            } catch (error) {
              Alert.alert('خطأ', 'فشل الحذف');
            }
          }
        }
      ]
    );
  };

  const openEdit = (cat: Category | null = null) => {
    setEditingCategory(cat);
    setNameAr(cat?.nameAr || '');
    setSlug(cat?.slug || '');
    setIcon(cat?.icon || '🛍️');
    setOrder(cat?.order?.toString() || '0');
    setModalVisible(true);
  };

  const renderItem = ({ item }: { item: Category }) => (
    <View style={styles.catCard}>
      <View style={styles.catInfo}>
        <Text style={styles.catIcon}>{item.icon}</Text>
        <View style={{ flex: 1, marginRight: 15 }}>
          <Text style={styles.catTitle}>{item.nameAr}</Text>
          <Text style={styles.catSlug}>{item.slug}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
          <Edit2 size={18} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn} onPress={() => handleDelete(item.id)}>
          <Trash2 size={18} color="#dc2626" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowRight size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>إدارة الفئات</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => openEdit()}>
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 50 }} />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Tag size={40} color={COLORS.darkGray} />
              <Text style={styles.emptyText}>لا توجد فئات حالياً</Text>
            </View>
          }
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCategory ? 'تعديل فئة' : 'إضافة فئة جديدة'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X size={24} color={COLORS.darkGray} />
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>الاسم بالعربية</Text>
              <TextInput style={styles.input} value={nameAr} onChangeText={setNameAr} placeholder="مثال: عقارات" />
              
              <Text style={styles.label}>الاسم اللطيف (Slug - English)</Text>
              <TextInput style={styles.input} value={slug} onChangeText={setSlug} placeholder="مثال: real-estate" autoCapitalize="none" />
              
              <Text style={styles.label}>أيقونة (Emoji)</Text>
              <TextInput style={styles.input} value={icon} onChangeText={setIcon} placeholder="🛍️" />
              
              <Text style={styles.label}>الترتيب</Text>
              <TextInput style={styles.input} value={order} onChangeText={setOrder} keyboardType="number-pad" />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={isSaving}>
                {isSaving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <Save size={20} color="#fff" />
                    <Text style={styles.saveBtnText}>حفظ البيانات</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  header: { backgroundColor: COLORS.primary, paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', borderBottomLeftRadius: 25, borderBottomRightRadius: 25 },
  headerTitle: { fontSize: 18, fontWeight: '900', color: '#fff', fontFamily: 'Outfit_Bold' },
  backBtn: { padding: 5 },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255, 255, 255, 0.2)', justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20 },
  catCard: { backgroundColor: '#fff', padding: 15, borderRadius: 18, marginBottom: 12, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10 },
  catInfo: { flexDirection: 'row-reverse', alignItems: 'center', flex: 1 },
  catIcon: { fontSize: 28 },
  catTitle: { fontSize: 16, fontWeight: '800', color: '#0f172a', textAlign: 'right' },
  catSlug: { fontSize: 12, color: COLORS.darkGray, textAlign: 'right' },
  actions: { flexDirection: 'row-reverse', gap: 10 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center' },
  empty: { alignItems: 'center', marginTop: 100 },
  emptyText: { marginTop: 10, color: COLORS.darkGray, fontSize: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 25, minHeight: 450 },
  modalHeader: { flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  modalTitle: { fontSize: 18, fontWeight: '900', color: COLORS.primary },
  form: { gap: 15 },
  label: { fontSize: 14, fontWeight: '700', color: COLORS.darkGray, textAlign: 'right' },
  input: { backgroundColor: '#f8fafc', borderRadius: 12, height: 44, paddingHorizontal: 15, textAlign: 'right', borderWidth: 1, borderColor: '#e2e8f0', padding: 0, textAlignVertical: 'center', includeFontPadding: false },
  saveBtn: { backgroundColor: COLORS.primary, height: 55, borderRadius: 15, flexDirection: 'row-reverse', justifyContent: 'center', alignItems: 'center', gap: 10, marginTop: 10 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
