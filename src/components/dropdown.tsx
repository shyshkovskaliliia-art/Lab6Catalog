import { useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

export type DropdownOption = { label: string; value: string };

type Props = {
  value: string;
  options: DropdownOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  title?: string;
};

export function Dropdown({ value, options, onChange, placeholder = 'Оберіть...', title = 'Оберіть варіант' }: Props) {
  const [open, setOpen] = useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <Pressable style={[styles.field, open && styles.fieldOpen]} onPress={() => setOpen(true)}>
        <Text style={[styles.fieldText, !selected && styles.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text style={styles.chevron}>▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => {
                const active = item.value === value;
                return (
                  <Pressable
                    style={[styles.option, active && styles.optionActive]}
                    onPress={() => { onChange(item.value); setOpen(false); }}
                  >
                    <Text style={[styles.optionText, active && styles.optionTextActive]}>{item.label}</Text>
                    {active && <Text style={styles.check}>✓</Text>}
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: '#ffffff', borderWidth: 1.5, borderColor: '#d9dcf0', borderRadius: 14,
    marginHorizontal: 22, marginBottom: 22, paddingHorizontal: 16, paddingVertical: 15,
  },
  fieldOpen: { borderColor: '#6558d3' },
  fieldText: { flex: 1, color: '#1b2236', fontSize: 16, fontWeight: '700' },
  placeholder: { color: '#8a92a8', fontWeight: '500' },
  chevron: { color: '#6558d3', fontSize: 18, fontWeight: '900', marginLeft: 10 },
  backdrop: { flex: 1, backgroundColor: 'rgba(20, 18, 48, 0.55)', justifyContent: 'flex-end', alignItems: 'center' },
  sheet: {
    width: '100%', maxWidth: 560, backgroundColor: '#ffffff', borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 18, paddingTop: 10, paddingBottom: 30,
  },
  handle: { alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: '#d9dcf0', marginBottom: 14 },
  sheetTitle: { color: '#6558d3', fontSize: 11, fontWeight: '900', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 10, marginLeft: 6 },
  option: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 15, paddingHorizontal: 14, borderRadius: 12, marginBottom: 4,
  },
  optionActive: { backgroundColor: '#eeecff' },
  optionText: { color: '#1b2236', fontSize: 16, fontWeight: '600', flex: 1 },
  optionTextActive: { color: '#5145b8', fontWeight: '800' },
  check: { color: '#6558d3', fontSize: 18, fontWeight: '900', marginLeft: 10 },
});