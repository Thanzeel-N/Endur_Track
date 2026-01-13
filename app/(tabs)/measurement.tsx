import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { router, useLocalSearchParams } from 'expo-router';

/* ================= CONSTANTS ================= */

const MATERIALS = [
  { name: 'Gypsum MR Board (Kool Brand)', rate: 150 },
  { name: 'Gypsum Board', rate: 120 },
  { name: 'Gypsum Partition', rate: 180 },
  { name: 'Glass Wool', rate: 60 },
  { name: 'Grid Ceiling', rate: 110 },
  { name: 'Aluminium Grid Ceiling', rate: 140 },
  { name: 'Cement Board', rate: 200 },
];

const THICKNESS = [
  { mm: 6, extraRate: 0 },
  { mm: 8, extraRate: 10 },
  { mm: 10, extraRate: 20 },
  { mm: 12, extraRate: 35 },
  { mm: 18, extraRate: 60 },
];

const ADDITIONALS = [
  { key: 'cornerBeading', label: 'Corner Beading', rate: 15 },
  { key: 'accessPanel', label: 'Access Panel', rate: 25 },
  { key: 'cutting', label: 'Cuttings', rate: 20 },
  { key: 'bulkCutting', label: 'Bulk Cutting', rate: 30 },
  { key: 'profiling', label: 'Profiling', rate: 40 },
];

const METER_TO_FEET = 3.28084;

/* ================= COMPONENT ================= */

export default function Measurement() {
  const { editData } = useLocalSearchParams();
  const isEdit = !!editData;

  const [recordId, setRecordId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');

  const [areas, setAreas] = useState([
    {
      title: '',
      length: '',
      width: '',
      material: MATERIALS[0].name,
      materialRate: MATERIALS[0].rate,
      thickness: 6,
      thicknessRate: 0,
      additionals: {} as Record<string, boolean>,
      additionalRates: Object.fromEntries(
        ADDITIONALS.map(a => [a.key, a.rate])
      ),
      area: 0,
      baseCost: 0,
      extrasCost: 0,
      totalCost: 0,
    },
  ]);

  /* ================= LOAD EDIT DATA ================= */

  useEffect(() => {
    if (editData) {
      const parsed = JSON.parse(editData as string);
      setRecordId(parsed.id);
      setClientName(parsed.clientName);
      setAreas(parsed.areas);
    }
  }, [editData]);

  /* ================= CALCULATION ================= */

  const calculate = (list: any[], index: number) => {
    const a = list[index];

    const areaSqft =
      Number(a.length || 0) *
      Number(a.width || 0) *
      METER_TO_FEET *
      METER_TO_FEET;

    const baseCost = areaSqft * (a.materialRate + a.thicknessRate);

    const extraQty =
      Number(a.length || 0) * Number(a.width || 0) * 3.28;

    let extrasCost = 0;
    ADDITIONALS.forEach(ex => {
      if (a.additionals[ex.key]) {
        extrasCost += extraQty * a.additionalRates[ex.key];
      }
    });

    a.area = areaSqft;
    a.baseCost = baseCost;
    a.extrasCost = extrasCost;
    a.totalCost = baseCost + extrasCost;
  };

  const handleChange = (i: number, field: string, value: any) => {
    const list = [...areas];
    list[i][field] = value;

    if (field === 'material') {
      const mat = MATERIALS.find(m => m.name === value);
      list[i].materialRate = mat?.rate || 0;
      list[i].thickness = 6;
      list[i].thicknessRate = 0;
    }

    if (field === 'thickness') {
      list[i].thicknessRate =
        THICKNESS.find(t => t.mm === value)?.extraRate || 0;
    }

    calculate(list, i);
    setAreas(list);
  };

  const toggleExtra = (i: number, key: string) => {
    const list = [...areas];
    list[i].additionals[key] = !list[i].additionals[key];
    calculate(list, i);
    setAreas(list);
  };

  const updateAdditionalRate = (i: number, key: string, value: string) => {
    const list = [...areas];
    list[i].additionalRates[key] = Number(value || 0);
    calculate(list, i);
    setAreas(list);
  };

  const addArea = () => {
    setAreas([
      ...areas,
      {
        title: '',
        length: '',
        width: '',
        material: MATERIALS[0].name,
        materialRate: MATERIALS[0].rate,
        thickness: 6,
        thicknessRate: 0,
        additionals: {},
        additionalRates: Object.fromEntries(
          ADDITIONALS.map(a => [a.key, a.rate])
        ),
        area: 0,
        baseCost: 0,
        extrasCost: 0,
        totalCost: 0,
      },
    ]);
  };

  const grandTotal = areas.reduce((s, a) => s + a.totalCost, 0);

  /* ================= SAVE / UPDATE ================= */

  const saveOffline = async () => {
    const raw = await AsyncStorage.getItem('records');
    const list = raw ? JSON.parse(raw) : [];
    const safeList = Array.isArray(list) ? list : [];

    if (isEdit && recordId) {
      const updated = safeList.map((r: any) =>
        r.id === recordId
          ? { ...r, clientName, areas, grandTotal }
          : r
      );

      await AsyncStorage.setItem('records', JSON.stringify(updated));
      Alert.alert('Updated', 'Work updated successfully');
    } else {
      safeList.push({
        id: Date.now().toString(),
        date: new Date().toLocaleString(),
        clientName,
        areas,
        grandTotal,
      });

      await AsyncStorage.setItem('records', JSON.stringify(safeList));
      Alert.alert('Saved', 'Work saved successfully');
    }

    router.back();
  };

  /* ================= PDF ================= */

  /* ================= PDF (FULL DATA) ================= */

  const generatePDF = async () => {
    const rows = areas
      .map((a, i) => {
        const extras = ADDITIONALS.filter(
          ex => a.additionals[ex.key]
        )
          .map(ex => `${ex.label} (₹${a.additionalRates[ex.key]})`)
          .join(', ') || '-';

        return `
          <tr>
            <td>${i + 1}</td>
            <td>${a.title || '-'}</td>
            <td>${a.length} × ${a.width}</td>
            <td>${a.material}</td>
            <td>${a.area.toFixed(2)}</td>
            <td>${extras}</td>
            <td>₹ ${a.totalCost.toFixed(2)}</td>
          </tr>
        `;
      })
      .join('');

    const html = `
    <html>
    <head>
      <style>
        body { font-family: Arial; padding: 20px; }
        h2 { text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { border: 1px solid #000; padding: 8px; font-size: 12px; }
        th { background: #f0f0f0; }
        .total { text-align: right; font-size: 18px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <h2>Gypsum Work Quotation</h2>
      <p><b>Client:</b> ${clientName || '-'}</p>
      <p><b>Date:</b> ${new Date().toLocaleDateString()}</p>

      <table>
        <tr>
          <th>#</th>
          <th>Area</th>
          <th>Size (m)</th>
          <th>Material</th>
          <th>Sqft</th>
          <th>Additionals</th>
          <th>Total</th>
        </tr>
        ${rows}
      </table>

      <div class="total">
        <b>Grand Total: ₹ ${grandTotal.toFixed(2)}</b>
      </div>
    </body>
    </html>
    `;

    const file = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(file.uri);
  };

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.page}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.mode}>
        {isEdit ? '✏️ Edit Measurement' : '➕ New Measurement'}
      </Text>

      <TextInput
        placeholder="Client Name"
        value={clientName}
        onChangeText={setClientName}
        style={styles.clientTitle}
      />

      {areas.map((a, i) => (
        <View key={i} style={styles.areaCard}>
          <TextInput
            placeholder="Area name"
            value={a.title}
            onChangeText={v => handleChange(i, 'title', v)}
            style={styles.input}
          />

          <TextInput
            placeholder="Length (m)"
            keyboardType="numeric"
            value={a.length}
            onChangeText={v => handleChange(i, 'length', v)}
            style={styles.input}
          />

          <TextInput
            placeholder="Breadth (m)"
            keyboardType="numeric"
            value={a.width}
            onChangeText={v => handleChange(i, 'width', v)}
            style={styles.input}
          />

          <Text style={styles.label}>Material</Text>
          <View style={styles.pickerBox}>
            <Picker
              selectedValue={a.material}
              onValueChange={v => handleChange(i, 'material', v)}
            >
              {MATERIALS.map(m => (
                <Picker.Item key={m.name} label={m.name} value={m.name} />
              ))}
            </Picker>
          </View>

              <TextInput
                placeholder="Material Rate (₹)"
                keyboardType="numeric"
                value={String(a.materialRate)}
                onChangeText={v => handleChange(i, 'materialRate', Number(v))}
                style={styles.input}
            />
          <Text style={styles.label}>Additionals</Text>
          {ADDITIONALS.map(ex => (
            <View key={ex.key} style={styles.extraRow}>
              <Pressable
                style={styles.checkbox}
                onPress={() => toggleExtra(i, ex.key)}
              >
                {a.additionals[ex.key] && <Text>✓</Text>}
              </Pressable>
              <Text style={{ flex: 1 }}>{ex.label}</Text>
              <TextInput
                style={styles.rateInput}
                keyboardType="numeric"
                value={String(a.additionalRates[ex.key])}
                onChangeText={v =>
                  updateAdditionalRate(i, ex.key, v)
                }
              />
            </View>
          ))}

          <Text style={styles.total}>
            Total: ₹ {a.totalCost.toFixed(2)}
          </Text>
        </View>
      ))}

      <Pressable style={styles.addBtn} onPress={addArea}>
        <Text>+ Add Area</Text>
      </Pressable>

      <Text style={styles.grand}>
        Grand Total: ₹ {grandTotal.toFixed(2)}
      </Text>

      <Pressable style={styles.saveBtn} onPress={saveOffline}>
        <Text>{isEdit ? '✏️ Update' : '💾 Save'}</Text>
      </Pressable>

      <Pressable style={styles.pdfBtn} onPress={generatePDF}>
        <Text style={{ color: '#fff' }}>📄 PDF</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: { padding: 15, backgroundColor: '#eef2f5' },
  back: { color: '#007bff', marginBottom: 10 },
  mode: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  clientTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    borderBottomWidth: 1,
  },
  areaCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    padding: 10,
    borderRadius: 6,
    marginBottom: 10,
  },
  label: { fontWeight: 'bold', marginTop: 10 },
  pickerBox: { borderWidth: 1, borderRadius: 6, marginBottom: 10 },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderWidth: 1,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateInput: {
    width: 70,
    borderWidth: 1,
    padding: 6,
    borderRadius: 6,
    textAlign: 'center',
  },
  total: { fontWeight: 'bold', marginTop: 10 },
  addBtn: {
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  grand: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 10,
  },
  saveBtn: {
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 10,
  },
  pdfBtn: {
    padding: 12,
    backgroundColor: '#007bff',
    alignItems: 'center',
  },
});
