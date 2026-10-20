import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Picker } from '@react-native-picker/picker';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

type Category = { id: number; name: string; description?: string | null };
type Book = { id: number; category_id: number | null; title: string; author: string; pages: number; cover_url: string | null; summary: string; categories?: { name: string } | null };

const fallbackBooks: Book[] = [
  { id: -1, category_id: 1, title: 'Гаррі Поттер і філософський камінь', author: 'Дж. К. Ролінґ', pages: 320, cover_url: 'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg', summary: 'Історія хлопчика, який дізнається про магічний світ, знаходить друзів і починає навчання у Гоґвортсі.' },
  { id: -2, category_id: 2, title: 'Убивство у «Східному експресі»', author: 'Аґата Крісті', pages: 256, cover_url: 'https://covers.openlibrary.org/b/isbn/9780007119318-L.jpg', summary: 'Знаменитий детектив Еркюль Пуаро розслідує загадкове вбивство у потязі, що застряг у снігу.' },
  { id: -3, category_id: 3, title: 'Гордість і упередження', author: 'Джейн Остін', pages: 432, cover_url: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', summary: 'Класичний роман про родину Беннетів, суспільні очікування, кохання та перше враження.' },
];

export default function CatalogScreen() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dbError, setDbError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingBookId, setEditingBookId] = useState<number | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [pages, setPages] = useState('200');
  const [coverUrl, setCoverUrl] = useState('');
  const [summary, setSummary] = useState('');
  const [newCategory, setNewCategory] = useState('');

  const loadData = useCallback(async () => {
    setDbError('');
    const [categoryResult, bookResult] = await Promise.all([
      supabase.from('categories').select('id, name, description').order('name'),
      supabase.from('books').select('id, category_id, title, author, pages, cover_url, summary, categories(name)').order('title'),
    ]);
    if (categoryResult.error || bookResult.error) {
      setDbError('Не вдалося завантажити дані з Supabase. Перевірте .env та виконайте SQL із файлу supabase/lab6_setup.sql.');
      setCategories([]);
      setBooks(fallbackBooks);
    } else {
      setCategories(categoryResult.data || []);
      setBooks((bookResult.data || []).map(book => ({
        ...book,
        categories: Array.isArray(book.categories) ? book.categories[0] ?? null : book.categories,
      })));
    }
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const visibleBooks = books.filter(book => selectedCategory === 'all' || String(book.category_id) === selectedCategory);
  const addBook = async () => {
    if (!title.trim() || !author.trim() || !summary.trim()) {
      Alert.alert('Заповніть поля', 'Потрібно вказати назву, автора та опис книги.');
      return;
    }
    const payload = {
      title: title.trim(), author: author.trim(), pages: Math.max(1, Number(pages) || 1),
      cover_url: coverUrl.trim() || null, summary: summary.trim(),
      category_id: newCategory ? Number(newCategory) : null,
    };
    const result = editingBookId
      ? await supabase.from('books').update(payload).eq('id', editingBookId)
      : await supabase.from('books').insert(payload);
    if (result.error) { Alert.alert('Не вдалося зберегти книгу', result.error.message); return; }
    setTitle(''); setAuthor(''); setPages('200'); setCoverUrl(''); setSummary(''); setNewCategory(''); setEditingBookId(null); setShowAddForm(false);
    await loadData();
  };
  const editBook = (book: Book) => {
    if (book.id < 0) { Alert.alert('Демо-книга', 'Демонстраційні записи не можна редагувати. Налаштуйте Supabase.'); return; }
    setEditingBookId(book.id); setTitle(book.title); setAuthor(book.author); setPages(String(book.pages));
    setCoverUrl(book.cover_url || ''); setSummary(book.summary || ''); setNewCategory(book.category_id ? String(book.category_id) : '');
    setShowAddForm(true);
  };
  const addCategory = async () => {
    if (!categoryName.trim()) return;
    const { error } = await supabase.from('categories').insert({ name: categoryName.trim() });
    if (error) { Alert.alert('Не вдалося додати категорію', error.message); return; }
    setCategoryName('');
    await loadData();
  };
  const deleteBook = async (book: Book) => {
    if (book.id < 0) { Alert.alert('Демо-книга', 'Ця книга показується як приклад. Налаштуйте Supabase, щоб керувати записами.'); return; }
    const { error } = await supabase.from('books').delete().eq('id', book.id);
    if (error) Alert.alert('Помилка видалення', error.message);
    else loadData();
  };

  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadData(); }} />}>
      <View style={styles.topBar}>
        <View><Text style={styles.brand}>BIBLIOTEKA / 06</Text><Text style={styles.greeting}>{user ? `Вітаємо, ${user.name}` : 'Читайте щось прекрасне'}</Text></View>
        <View style={styles.topActions}>
          {user ? <Pressable style={styles.outlineButton} onPress={async () => { await signOut(); }}><Text style={styles.outlineText}>Вийти</Text></Pressable> : <Pressable style={styles.outlineButton} onPress={() => router.push('/login')}><Text style={styles.outlineText}>Увійти</Text></Pressable>}
        </View>
      </View>
      <View style={styles.hero}>
        <Text style={styles.heroEyebrow}>ВАША НАСТУПНА ІСТОРІЯ ПОЧИНАЄТЬСЯ ТУТ</Text>
        <Text style={styles.heroTitle}>Знайдіть книгу,{"\n"}яка залишиться з вами.</Text>
        <Text style={styles.heroText}>Каталог улюблених історій — від фантастичних світів до класики літератури.</Text>
        <View style={styles.stats}><View><Text style={styles.statNumber}>{books.length}</Text><Text style={styles.statLabel}>КНИГ У КАТАЛОЗІ</Text></View><View><Text style={styles.statNumber}>{categories.length || 3}</Text><Text style={styles.statLabel}>КАТЕГОРІЙ</Text></View><View><Text style={styles.statNumber}>{user ? 'Так' : 'Гість'}</Text><Text style={styles.statLabel}>СТАТУС</Text></View></View>
      </View>
      <View style={styles.sectionHead}>
        <View><Text style={styles.sectionEyebrow}>КОЛЕКЦІЯ</Text><Text style={styles.sectionTitle}>Книги каталогу</Text></View>
        {user?.role === 'admin' && <Pressable style={styles.primaryButton} onPress={() => setShowAddForm(!showAddForm)}><Text style={styles.primaryButtonText}>{showAddForm ? 'Скасувати' : '+ Додати книгу'}</Text></Pressable>}
      </View>
      {showAddForm && user?.role === 'admin' && <View style={styles.formCard}>
        <Text style={styles.formTitle}>{editingBookId ? 'Редагувати книгу' : 'Нова книга'}</Text>
        <TextInput style={styles.input} placeholder="Назва книги" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Автор" value={author} onChangeText={setAuthor} />
        <TextInput style={styles.input} placeholder="Кількість сторінок" value={pages} onChangeText={setPages} keyboardType="number-pad" />
        <TextInput style={styles.input} placeholder="URL обкладинки (необов’язково)" value={coverUrl} onChangeText={setCoverUrl} autoCapitalize="none" />
        <TextInput style={[styles.input, styles.multiline]} placeholder="Короткий опис" value={summary} onChangeText={setSummary} multiline />
        <Text style={styles.fieldLabel}>Категорія</Text>
        <View style={styles.pickerWrap}><Picker selectedValue={newCategory} onValueChange={setNewCategory}><Picker.Item label="Без категорії" value="" />{categories.map(c => <Picker.Item key={c.id} label={c.name} value={String(c.id)} />)}</Picker></View>
        <Pressable style={styles.primaryButton} onPress={addBook}><Text style={styles.primaryButtonText}>Зберегти книгу</Text></Pressable>
      </View>}
      {user?.role === 'admin' && <View style={styles.categoryAdmin}>
        <Text style={styles.formTitle}>Керування категоріями</Text>
        <View style={styles.categoryRow}><TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder="Назва нової категорії" value={categoryName} onChangeText={setCategoryName} /><Pressable style={styles.primaryButton} onPress={addCategory}><Text style={styles.primaryButtonText}>Додати</Text></Pressable></View>
      </View>}
      <Text style={styles.fieldLabel}>Фільтр за категорією</Text>
      <View style={styles.pickerWrap}><Picker selectedValue={selectedCategory} onValueChange={setSelectedCategory}><Picker.Item label="Усі категорії" value="all" />{categories.map(c => <Picker.Item key={c.id} label={c.name} value={String(c.id)} />)}</Picker></View>
      {!!dbError && <View style={styles.notice}><Text style={styles.noticeText}>{dbError}</Text><Text style={styles.noticeSmall}>Поки що відображаються демонстраційні книги. Після налаштування бази даних з’являться записи з хмари.</Text></View>}
      {loading && <ActivityIndicator size="large" color="#6558d3" style={{ margin: 24 }} />}
      {!loading && visibleBooks.length === 0 && <Text style={styles.empty}>У цій категорії поки немає книг.</Text>}
      <View style={styles.bookGrid}>{visibleBooks.map(book => <View key={book.id} style={styles.bookCard}>
        <Pressable onPress={() => router.push({ pathname: '/book/[id]', params: { id: String(book.id) } })}>
          <Image source={{ uri: book.cover_url || 'https://placehold.co/360x520/e8e9f5/6558d3?text=Book' }} style={styles.cover} resizeMode="cover" />
          <View style={styles.bookInfo}><Text style={styles.categoryTag}>{book.categories?.name || categories.find(c => c.id === book.category_id)?.name || 'Книга'}</Text><Text style={styles.bookTitle}>{book.title}</Text><Text style={styles.author}>{book.author}</Text><Text style={styles.pages}>{book.pages} сторінок</Text><Text style={styles.detailsLink}>Детальніше ↗</Text></View>
        </Pressable>
        {user?.role === 'admin' && <View style={styles.adminRow}><Pressable style={styles.editButton} onPress={() => editBook(book)}><Text style={styles.editText}>Редагувати</Text></Pressable><Pressable style={styles.deleteButton} onPress={() => deleteBook(book)}><Text style={styles.deleteText}>Видалити</Text></Pressable></View>}
      </View>)}</View>
      <View style={styles.footer}><Text style={styles.footerTitle}>Бібліотека — це завжди більше, ніж книги.</Text><Text style={styles.footerText}>Навчальний проєкт • Лабораторна робота №6</Text><Pressable onPress={() => router.push('/login')}><Text style={styles.footerLink}>Керування акаунтом →</Text></Pressable></View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7fb' }, content: { paddingBottom: 44 },
  topBar: { paddingHorizontal: 22, paddingTop: 26, paddingBottom: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', maxWidth: 1100, width: '100%', alignSelf: 'center' },
  brand: { color: '#6558d3', fontSize: 12, fontWeight: '900', letterSpacing: 2 }, greeting: { color: '#1b2236', fontSize: 16, fontWeight: '700', marginTop: 5 }, topActions: { flexDirection: 'row', gap: 8 },
  outlineButton: { borderWidth: 1, borderColor: '#d8dced', borderRadius: 10, paddingVertical: 10, paddingHorizontal: 15, backgroundColor: '#fff' }, outlineText: { color: '#252d43', fontWeight: '700' },
  hero: { backgroundColor: '#201d43', marginHorizontal: 18, borderRadius: 24, padding: 26, maxWidth: 1064, width: 'auto', alignSelf: 'center', marginBottom: 34 },
  heroEyebrow: { color: '#c7c1ff', fontSize: 10, letterSpacing: 1.5, fontWeight: '800', marginBottom: 14 }, heroTitle: { color: '#fff', fontSize: 34, fontWeight: '900', lineHeight: 40 }, heroText: { color: '#d2d0e4', fontSize: 15, lineHeight: 23, marginTop: 13, maxWidth: 510 },
  stats: { flexDirection: 'row', gap: 30, marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#484568' }, statNumber: { color: '#fff', fontSize: 22, fontWeight: '800' }, statLabel: { color: '#aaa7c9', fontSize: 9, letterSpacing: 1, marginTop: 5 },
  sectionHead: { paddingHorizontal: 22, marginBottom: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', maxWidth: 1100, width: '100%', alignSelf: 'center' }, sectionEyebrow: { color: '#6558d3', fontSize: 10, fontWeight: '900', letterSpacing: 2 }, sectionTitle: { fontSize: 28, fontWeight: '900', color: '#1b2236', marginTop: 5 },
  primaryButton: { backgroundColor: '#6558d3', borderRadius: 10, paddingVertical: 12, paddingHorizontal: 15, alignItems: 'center', alignSelf: 'flex-start' }, primaryButtonText: { color: '#fff', fontWeight: '800' },
  categoryAdmin: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginHorizontal: 22, marginBottom: 22, borderWidth: 1, borderColor: '#e5e8f2' }, categoryRow: { flexDirection: 'row', gap: 8, alignItems: 'center' }, adminRow: { flexDirection: 'row' }, editButton: { flex: 1, backgroundColor: '#eeecff', padding: 12, alignItems: 'center' }, editText: { color: '#5145b8', fontWeight: '800' }, formCard: { backgroundColor: '#fff', padding: 18, borderRadius: 16, marginHorizontal: 22, marginBottom: 22, borderWidth: 1, borderColor: '#e5e8f2' }, formTitle: { fontSize: 20, fontWeight: '800', color: '#20263b', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#dfe3ef', borderRadius: 10, padding: 12, marginBottom: 10, color: '#1b2236', backgroundColor: '#fff' }, multiline: { minHeight: 85, textAlignVertical: 'top' }, fieldLabel: { color: '#515b73', fontWeight: '800', marginHorizontal: 22, marginBottom: 7, marginTop: 2 },
  pickerWrap: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#e1e5ef', borderRadius: 12, marginHorizontal: 22, marginBottom: 22, overflow: 'hidden' },
  notice: { backgroundColor: '#fff8e8', borderColor: '#f1dba8', borderWidth: 1, padding: 14, borderRadius: 12, marginHorizontal: 22, marginBottom: 20 }, noticeText: { color: '#7a5716', fontWeight: '800' }, noticeSmall: { color: '#7a5716', marginTop: 5, lineHeight: 20 },
  bookGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 18, paddingHorizontal: 18 }, bookCard: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#e7e9f2', width: 280, marginBottom: 5 }, cover: { width: '100%', height: 290, backgroundColor: '#e8e9f5' }, bookInfo: { padding: 16 }, categoryTag: { color: '#6558d3', fontSize: 10, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 1 }, bookTitle: { color: '#20263b', fontSize: 19, fontWeight: '800', marginTop: 8, lineHeight: 25 }, author: { color: '#68718a', fontSize: 14, marginTop: 6 }, pages: { color: '#68718a', fontSize: 12, marginTop: 10 }, detailsLink: { color: '#6558d3', fontWeight: '800', marginTop: 14 },
  deleteButton: { backgroundColor: '#fff0f1', padding: 12, alignItems: 'center' }, deleteText: { color: '#b42336', fontWeight: '800' }, empty: { textAlign: 'center', color: '#68718a', marginVertical: 25 }, footer: { alignItems: 'center', padding: 35, marginTop: 20 }, footerTitle: { color: '#20263b', fontSize: 19, fontWeight: '800', textAlign: 'center' }, footerText: { color: '#7a8398', marginTop: 8, textAlign: 'center' }, footerLink: { color: '#6558d3', marginTop: 14, fontWeight: '800' },
});
