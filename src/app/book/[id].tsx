import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/lib/supabase';

type Book = { id: number; title: string; author: string; pages: number; cover_url: string | null; summary: string; category_id: number | null; categories?: { name: string } | null };
const demo: Record<string, Book> = {
  '-1': { id: -1, title: 'Гаррі Поттер і філософський камінь', author: 'Дж. К. Ролінґ', pages: 320, cover_url: 'https://covers.openlibrary.org/b/isbn/9780747532699-L.jpg', summary: 'Гаррі Поттер — звичайний хлопчик, який у свій одинадцятий день народження дізнається, що він чарівник. У Гоґвортсі він знаходить друзів, розкриває таємниці минулого й робить перші кроки до розуміння власної історії.', category_id: 1 },
  '-2': { id: -2, title: 'Убивство у «Східному експресі»', author: 'Аґата Крісті', pages: 256, cover_url: 'https://covers.openlibrary.org/b/isbn/9780007119318-L.jpg', summary: 'Коли розкішний потяг зупиняється через снігові замети, одного з пасажирів знаходять убитим. Еркюль Пуаро береться за розслідування, у якому кожен пасажир має мотив, а кожна деталь може виявитися ключем до розгадки.', category_id: 2 },
  '-3': { id: -3, title: 'Гордість і упередження', author: 'Джейн Остін', pages: 432, cover_url: 'https://covers.openlibrary.org/b/isbn/9780141439518-L.jpg', summary: 'Елізабет Беннет і містер Дарсі вчаться дивитися за межі першого враження та суспільних упереджень. Роман поєднує тонку іронію, сімейні історії й роздуми про кохання, характер і вибір.', category_id: 3 },
};
export default function BookDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [book, setBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data, error } = await supabase.from('books').select('id, title, author, pages, cover_url, summary, category_id, categories(name)').eq('id', Number(id)).maybeSingle();
      if (!active) return;
      if (data && !error) setBook(data as Book);
      else setBook(demo[String(id)] || null);
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [id]);
  return <ScrollView style={styles.page} contentContainerStyle={styles.content}>
    <Pressable style={styles.back} onPress={() => router.back()}><Text style={styles.backText}>← До каталогу</Text></Pressable>
    {loading ? <ActivityIndicator size="large" color="#6558d3" style={{ marginTop: 60 }} /> : !book ? <View style={styles.empty}><Text style={styles.title}>Книгу не знайдено</Text><Text style={styles.text}>Можливо, її було видалено з каталогу.</Text></View> : <View style={styles.layout}>
      <Image source={{ uri: book.cover_url || 'https://placehold.co/360x520/e8e9f5/6558d3?text=Book' }} style={styles.cover} resizeMode="cover" />
      <View style={styles.info}>
        <Text style={styles.eyebrow}>{book.categories?.name || 'КАТАЛОГ КНИГ'}</Text>
        <Text style={styles.title}>{book.title}</Text>
        <Text style={styles.author}>Автор: {book.author}</Text>
        <View style={styles.pagesPill}><Text style={styles.pagesText}>{book.pages} сторінок</Text></View>
        <Text style={styles.sectionTitle}>Про книгу</Text>
        <Text style={styles.text}>{book.summary || 'Опис цієї книги ще не додано.'}</Text>
        <View style={styles.note}><Text style={styles.noteTitle}>Час для читання</Text><Text style={styles.noteText}>Оберіть зручний момент і дозвольте цій історії захопити вас.</Text></View>
      </View>
    </View>}
  </ScrollView>;
}
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#f6f7fb' }, content: { padding: 22, paddingBottom: 50, maxWidth: 1080, width: '100%', alignSelf: 'center' },
  back: { alignSelf: 'flex-start', paddingVertical: 12, paddingHorizontal: 15, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: '#e2e6f0', marginBottom: 26 }, backText: { color: '#6558d3', fontWeight: '800' },
  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: 30, alignItems: 'flex-start' }, cover: { width: 300, height: 440, borderRadius: 16, backgroundColor: '#e8e9f5' }, info: { flex: 1, minWidth: 260, paddingTop: 8 },
  eyebrow: { color: '#6558d3', fontWeight: '900', fontSize: 11, letterSpacing: 2, textTransform: 'uppercase' }, title: { color: '#1b2236', fontSize: 34, lineHeight: 41, fontWeight: '900', marginTop: 12 }, author: { color: '#68718a', fontSize: 17, marginTop: 13 },
  pagesPill: { alignSelf: 'flex-start', backgroundColor: '#e9e7ff', borderRadius: 20, paddingVertical: 8, paddingHorizontal: 13, marginTop: 16 }, pagesText: { color: '#5145b8', fontWeight: '800' }, sectionTitle: { color: '#1b2236', fontSize: 21, fontWeight: '900', marginTop: 32, marginBottom: 10 }, text: { color: '#59647b', fontSize: 16, lineHeight: 27 },
  note: { backgroundColor: '#211e45', borderRadius: 15, padding: 18, marginTop: 28 }, noteTitle: { color: '#fff', fontSize: 16, fontWeight: '800' }, noteText: { color: '#d0cde6', lineHeight: 22, marginTop: 7 },
  empty: { alignItems: 'center', padding: 30 },
});
