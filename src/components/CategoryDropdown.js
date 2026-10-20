import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function CategoryDropdown({ items, value, onChange, placeholder = 'Оберіть рубрику' }) {
  const [open, setOpen] = useState(false);
  const selected = items.find(i => i.id === value);

  return (
    <>
      <TouchableOpacity style={s.box} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={s.boxText}>{selected ? selected.name : placeholder}</Text>
        <Text style={s.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.overlay} onPress={() => setOpen(false)}>
          <View style={s.sheet}>
            <FlatList
              data={items}
              keyExtractor={i => String(i.id)}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <TouchableOpacity
                    style={[s.row, active && s.rowActive]}
                    onPress={() => { onChange(item.id); setOpen(false); }}
                  >
                    <Text style={[s.rowText, active && s.rowTextActive]}>{item.name}</Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 14, marginBottom: 10,
  },
  boxText: { fontSize: 16, color: '#111' },
  arrow: { fontSize: 16, color: '#555' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 24 },
  sheet: { backgroundColor: '#fff', borderRadius: 12, maxHeight: '60%', overflow: 'hidden' },
  row: {
    paddingVertical: 14, paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#ddd',
  },
  rowActive: { backgroundColor: '#fdecea' },
  rowText: { fontSize: 16, color: '#111' },
  rowTextActive: { color: '#d9534f', fontWeight: '700' },
});