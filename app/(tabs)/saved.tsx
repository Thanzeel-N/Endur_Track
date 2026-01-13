import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';

/* ================= TYPES ================= */

type AreaType = {
  title: string;
  length: string;
  width: string;
  material: string;
  area: number;
  totalCost: number;
};

type SavedRecord = {
  id: string;
  date: string;
  clientName: string;
  areas: AreaType[];
  grandTotal: number;
};

/* ================= COMPONENT ================= */

export default function SavedWork() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  /* ================= LOAD DATA (SAFE) ================= */

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem('records');
      if (!raw) {
        setRecords([]);
        return;
      }

      const parsed = JSON.parse(raw);

      // ✅ New correct format
      if (Array.isArray(parsed)) {
        setRecords(parsed);
      }
      // ✅ Old single-record format (auto migrate)
      else if (parsed.clientName && parsed.areas) {
        const migrated: SavedRecord[] = [
          {
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            clientName: parsed.clientName,
            areas: parsed.areas,
            grandTotal: parsed.grandTotal || 0,
          },
        ];
        await AsyncStorage.setItem('records', JSON.stringify(migrated));
        setRecords(migrated);
      } else {
        setRecords([]);
      }
    } catch (e) {
      console.log('Load error', e);
      setRecords([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ================= DELETE ================= */

  const deleteRecord = (id: string) => {
    Alert.alert('Delete', 'Delete this record?', [
      { text: 'Cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = records.filter(r => r.id !== id);
          setRecords(updated);
          await AsyncStorage.setItem('records', JSON.stringify(updated));
        },
      },
    ]);
  };

  /* ================= EDIT ================= */

  const editRecord = (record: SavedRecord) => {
    router.push({
      pathname: '/measurement',
      params: { editData: JSON.stringify(record) },
    });
  };

  /* ================= UI ================= */

  return (
    <ScrollView style={styles.page}>
      <Pressable onPress={() => router.back()}>
        <Text style={styles.back}>← Back</Text>
      </Pressable>

      <Text style={styles.heading}>Saved Works</Text>

      {records.length === 0 && (
        <Text style={styles.empty}>No saved work found</Text>
      )}

      {Array.isArray(records) &&
        records.map(record => {
          const expanded = expandedId === record.id;

          return (
            <Pressable
              key={record.id}
              style={styles.card}
              onPress={() =>
                setExpandedId(expanded ? null : record.id)
              }
            >
              {/* ===== CARD HEADER ===== */}
              <View style={styles.row}>
                <Text style={styles.client}>
                  {record.clientName || 'No Client'}
                </Text>
                <Text style={styles.total}>
                  ₹ {record.grandTotal.toFixed(2)}
                </Text>
              </View>

              <Text style={styles.date}>{record.date}</Text>

              {/* ===== EXPANDED DETAILS ===== */}
              {expanded && (
                <>
                  {record.areas.map((a, i) => (
                    <View key={i} style={styles.areaBox}>
                      <Text style={styles.areaTitle}>
                        {i + 1}. {a.title || 'Area'}
                      </Text>
                      <Text>Material: {a.material}</Text>
                      <Text>
                        Size: {a.length} × {a.width} m
                      </Text>
                      <Text>
                        Area: {a.area.toFixed(2)} sqft
                      </Text>
                      <Text style={styles.areaAmount}>
                        ₹ {a.totalCost.toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  {/* ===== ACTION BUTTONS ===== */}
                  <View style={styles.actions}>
                    <Pressable
                      style={[styles.btn, styles.edit]}
                      onPress={() => editRecord(record)}
                    >
                      <Text style={styles.btnText}>✏️ Edit</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.btn, styles.delete]}
                      onPress={() => deleteRecord(record.id)}
                    >
                      <Text style={styles.btnText}>🗑 Delete</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </Pressable>
          );
        })}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#eef2f5',
  },
  back: {
    marginBottom: 10,
    color: '#007bff',
  },
  heading: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
  },
  empty: {
    textAlign: 'center',
    marginTop: 40,
    color: '#777',
  },
  card: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  client: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  total: {
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  areaBox: {
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 8,
  },
  areaTitle: {
    fontWeight: 'bold',
  },
  areaAmount: {
    fontWeight: 'bold',
    marginTop: 4,
  },
  actions: {
    flexDirection: 'row',
    marginTop: 12,
  },
  btn: {
    flex: 1,
    padding: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  edit: {
    backgroundColor: '#ffc107',
  },
  delete: {
    backgroundColor: '#dc3545',
  },
  btnText: {
    fontWeight: 'bold',
  },
});
