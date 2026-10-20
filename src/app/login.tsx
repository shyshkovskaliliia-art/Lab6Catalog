import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/context/AuthContext';

export default function LoginScreen() {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [registerMode, setRegisterMode] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError(''); setNotice(''); setLoading(true);
    const result = registerMode
      ? await signUp(email, password, name)
      : await signIn(email, password);
    setLoading(false);
    if (!result.success) { setError(result.message || 'Не вдалося виконати операцію.'); return; }
    if (result.message) { setNotice(result.message); return; }
    router.replace('/catalog');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.eyebrow}>КАТАЛОГ КНИГ</Text>
        <Text style={styles.title}>{registerMode ? 'Створення акаунта' : 'Вхід у систему'}</Text>
        <Text style={styles.subtitle}>Увійдіть, щоб отримати доступ до свого профілю.</Text>
        {registerMode && <TextInput style={styles.input} placeholder="Ваше ім’я" placeholderTextColor="#8290a5" value={name} onChangeText={setName} />}
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#8290a5" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoCorrect={false} />
        <TextInput style={styles.input} placeholder="Пароль (мінімум 6 символів)" placeholderTextColor="#8290a5" value={password} onChangeText={setPassword} secureTextEntry />
        {!!error && <Text style={styles.error}>{error}</Text>}
        {!!notice && <Text style={styles.notice}>{notice}</Text>}
        <Pressable style={[styles.button, loading && { opacity: 0.6 }]} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>{registerMode ? 'Зареєструватися' : 'Увійти'}</Text>}
        </Pressable>
        <Pressable onPress={() => { setRegisterMode(!registerMode); setError(''); setNotice(''); }}>
          <Text style={styles.link}>{registerMode ? 'Вже маєте акаунт? Увійти' : 'Немає акаунта? Зареєструватися'}</Text>
        </Pressable>
        <Pressable onPress={() => router.replace('/catalog')}><Text style={styles.guest}>Продовжити як гість →</Text></Pressable>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: 22, backgroundColor: '#f3f5fb' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#e4e8f0' },
  eyebrow: { color: '#6b65d8', fontWeight: '800', letterSpacing: 2, textAlign: 'center', marginBottom: 10 },
  title: { fontSize: 28, fontWeight: '800', textAlign: 'center', color: '#172033' },
  subtitle: { fontSize: 14, textAlign: 'center', color: '#64708a', marginTop: 8, marginBottom: 22, lineHeight: 21 },
  input: { backgroundColor: '#f7f8fc', borderWidth: 1, borderColor: '#e1e6f0', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 12, color: '#172033' },
  button: { backgroundColor: '#6558d3', borderRadius: 12, padding: 15, alignItems: 'center', marginTop: 4 },
  buttonText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  error: { color: '#bd2c45', marginBottom: 10 }, notice: { color: '#24754b', marginBottom: 10 },
  link: { color: '#6558d3', textAlign: 'center', marginTop: 18, fontWeight: '700' },
  guest: { color: '#65708a', textAlign: 'center', marginTop: 22, fontWeight: '700' },
});
