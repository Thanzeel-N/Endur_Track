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

export type BulkCuttingEntry = {
  name?: string;          // optional custom name
  length: string;
  runs: string;
  rate: string;
};

export type OtherCustomEntry = {
  name: string;
  length: string;
  runs: string;
  rate: string;
};

export type ExtraExpense = {
  description: string;
  amount: string;
};

export type AttachedRoom = {
  title: string;
  length: string;
  width: string;

  material: string;
  customMaterialName?: string;

  materialRate: number;
  thickness: number;

  roomSqft?: number;   // calculated
  roomCost?: number;   // calculated
};

export type AreaType = {
  title: string;
  length: string;
  width: string;

  material: string;
  customMaterialName?: string;

  materialRate: number;
  thickness: number;

  additionals: Record<string, boolean>;

  additionalRates: Record<string, number>;
  additionalInputs: Record<string, string>;
  additionalLengths: Record<string, string>;

  bulkCuttingEntries: BulkCuttingEntry[];

  otherCustomEntries: OtherCustomEntry[];

  extraExpenses: ExtraExpense[];

  attachedRooms: AttachedRoom[];

  // calculated fields
  area: number;
  totalSqft: number;

  baseCost: number;
  attachedBaseCost: number;

  extrasCost: number;
  extraExpensesCost: number;

  totalCost: number;
};

type SavedRecord = {
  id: string;
  date: string;
  country: 'UAE' | 'India';
  clientName: string;
  areas: AreaType[];
  grandTotal: number;
  advance: string;
  balance: number;
};

type SavedQuotation = {
  id: string;
  date: string;
  country: 'UAE' | 'India';
  client: string;
  consultant: string;
  project: string;
  plotNo: string;
  quotationNo: string;
  duration: string;

  items: any[]; // QuotationItem[]
  materials: {
    name: string;
    description: string;
    images: string[];
  }[];

  subtotal: number;
  vat: number;
  total: number;

  message: string;
  paymentTerms: string;
  excludingWork: string;
  conditions: string[];

  // ── Added these three fields (must match what you now save from QuotationScreen)
  currencySymbol?: string;     // 'AED' or '₹'
  taxLabel?: string;           // 'VAT' or 'GST'
  taxRatePercent?: string;     // '5%' or '18%'
};

/* ================= COMPONENT ================= */

export default function SavedWork() {
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<SavedQuotation[]>([]);
  const [selectedQuotationId, setSelectedQuotationId] = useState<string | null>(null);

  const toggleSelect = (id: string) => {
    setSelectedQuotationId(prev => prev === id ? null : id);
  };

  /* ================= LOAD DATA ================= */

  const loadData = async () => {
    try {
      const raw = await AsyncStorage.getItem('records');
      
      if (!raw || raw.trim() === '') {
        console.log('No valid records data found');
        setRecords([]);
        return;
      }

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        console.error('JSON parse failed. Raw content was:', raw);
        console.error('Parse error:', parseErr);
        
        Alert.alert(
          'Corrupted Data',
          'Saved records appear to be damaged. Starting fresh.\n\n(Old data cannot be recovered automatically)'
        );
        
        await AsyncStorage.removeItem('records');
        setRecords([]);
        return;
      }

      // Handle legacy single object (your existing migration)
      if (!Array.isArray(parsed) && parsed && typeof parsed === 'object') {
        parsed = [{
          id: Date.now().toString(),
          date: parsed.date || new Date().toLocaleString(),
          clientName: parsed.clientName || 'Unnamed',
          areas: Array.isArray(parsed.areas) ? parsed.areas : [],
          grandTotal: Number(parsed.grandTotal) || 0,
          advance: String(parsed.advance || '0'),
          balance: Number(parsed.balance) || 0,
        }];
      }

      // Final safety net
      const safeRecords = Array.isArray(parsed) ? parsed : [];
      
      // Optional: clean/fix numbers (from previous fix)
      const cleaned = safeRecords.map(r => ({
        ...r,
        grandTotal: Number(r.grandTotal) || 0,
        balance: Number(r.balance) || 0,
        advance: String(r.advance || '0'),
      }));

      setRecords(cleaned);

      // If we had to fix anything, save cleaned version
      if (cleaned.length > 0) {
        await AsyncStorage.setItem('records', JSON.stringify(cleaned));
      }

    } catch (e) {
      console.error('Error in loadData:', e);
      Alert.alert('Error', 'Failed to load saved records');
      setRecords([]);
    }
  };

  const loadQuotations = async () => {
    try {
      const raw = await AsyncStorage.getItem("quotations");
      setQuotations(raw ? JSON.parse(raw) : []);
    } catch (e) {
      console.log("Error loading quotations", e);
      setQuotations([]);
    }
  };

  useEffect(() => {
    loadData();
    loadQuotations();
  }, []);

  /* ================= DELETE ================= */

  const deleteRecord = (id: string) => {
    Alert.alert('Delete Record', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = records.filter(r => r.id !== id);
          setRecords(updated);
          await AsyncStorage.setItem('records', JSON.stringify(updated));
          Alert.alert('Deleted', 'Record removed successfully');
        },
      },
    ]);
  };

  const deleteQuotation = (id: string) => {
    Alert.alert("Delete Quotation", "Are you sure?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = quotations.filter(q => q.id !== id);
          setQuotations(updated);
          await AsyncStorage.setItem("quotations", JSON.stringify(updated));
          Alert.alert("Deleted", "Quotation removed successfully");
        },
      },
    ]);
  };

  /* ================= EDIT ================= */

  const editRecord = (record: SavedRecord) => {
  const pathname =
    record.country === "UAE"
      ? "/measurement-uae"
      : "/measurement"; // India page

  router.push({
    pathname,
    params: { editData: JSON.stringify(record) },
  });
};

  const editQuotation = (quotation: SavedQuotation) => {
    router.push({
      pathname: "/quotation",
      params: { editQuotation: JSON.stringify(quotation) },
    });
  };

  /* ================= RENDER ================= */

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: 70 }}
    >
      <Text style={styles.heading}>Saved Measurements</Text>

      {records.length === 0 ? (
        <Text style={styles.empty}>No saved records yet</Text>
      ) : (
        records.map(record => {
          const isExpanded = expandedId === record.id;
          const advanceNum = Number(record.advance || 0);
          const balance = record.grandTotal - advanceNum;

          return (
            <View key={record.id} style={styles.card}>
              <Pressable
                onPress={() => setExpandedId(isExpanded ? null : record.id)}
              >
                <View style={styles.headerRow}>
                  <View>
                    <Text style={styles.clientName}>
                      {record.clientName || 'Unnamed Client'}
                    </Text>
                    <Text style={styles.date}>{record.date}</Text>
                  </View>
                  {/* ✅ COUNTRY BADGE */}
                  <View style={{ marginTop: 4 }}>
                    <Text style={{
                      backgroundColor:
                        record.country === "India" ? "#FFE0B2" : "#C8E6C9",
                      color:record.country === "India" ? "#E65100" : "#1B5E20",
                      paddingHorizontal: 8,
                      paddingVertical: 3,
                      borderRadius: 5,
                      fontSize: 12,
                      fontWeight: "bold",
                      alignSelf: "flex-start",
                    }}>
                      {record.country === "India" ? "🇮🇳 INDIA" : "🇦🇪 UAE"}
                    </Text>
                  </View>
              
                  <Text style={styles.grandTotal}>
                    {record.grandTotal.toFixed(2)}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryText}>
                    Advance: {advanceNum.toFixed(2)}
                  </Text>
                  <Text
                    style={[
                      styles.summaryText,
                      { color: balance > 0 ? '#d32f2f' : balance === 0 ? '#2e7d32' : '#1976d2' },
                    ]}
                  >
                    Balance: {balance.toFixed(2)}
                  </Text>
                </View>
              </Pressable>

              {isExpanded && (
                <View style={styles.expandedContent}>
                  {record.areas.map((area, idx) => (
                    <View key={idx} style={styles.areaItem}>
                      <Text style={styles.areaTitle}>
                        {idx + 1}. {area.title || 'Unnamed Area'}
                      </Text>

                      <View style={styles.areaDetailRow}>
                        <Text style={styles.detailLabel}>Material:</Text>
                        <Text style={styles.detailValue}>
                          {area.material === 'Other'
                            ? area.customMaterialName || 'Other'
                            : area.material}
                          {area.material === 'Cement Board' && ` (${area.thickness} mm)`}
                        </Text>
                      </View>

                      <View style={styles.areaDetailRow}>
                        <Text style={styles.detailLabel}>Size:</Text>
                        <Text style={styles.detailValue}>
                          {area.length || '-'} × {area.width || '-'} m
                        </Text>
                      </View>

                      <View style={styles.areaDetailRow}>
                        <Text style={styles.detailLabel}>Total Area:</Text>
                        <Text style={styles.detailValue}>
                          {area.area.toFixed(2)} sqft
                        </Text>
                      </View>

                      <View style={styles.areaDetailRow}>
                        <Text style={styles.detailLabel}>Attached Rooms:</Text>
                        <Text style={styles.detailValue}>
                          {area.attachedRooms?.length || 0}
                        </Text>
                      </View>

                      <Text style={styles.areaCost}>
                        Cost: {area.totalCost.toFixed(2)}
                      </Text>
                    </View>
                  ))}

                  <View style={styles.actionButtons}>
                    <Pressable
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => editRecord(record)}
                    >
                      <Text style={styles.btnText}>✏️ Edit</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => deleteRecord(record.id)}
                    >
                      <Text style={styles.btnText}>🗑 Delete</Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </View>
          );
        })
      )}

      {/* ================= SAVED QUOTATIONS ================= */}

      <Text style={[styles.heading, { marginTop: 30 }]}>
        Saved Quotations
      </Text>

      {quotations.length === 0 ? (
        <Text style={styles.empty}>No saved quotations yet</Text>
      ) : (
        quotations.map(q => {
          const isSelected = selectedQuotationId === q.id;

          // Use saved currency & tax label if available, fallback to AED/VAT
          const currency = q.currencySymbol || '';
          const taxName = q.taxLabel || 'TAX';

          return (
            <View
              key={q.id}
              style={[
                styles.card,
                isSelected && {
                  borderColor: '#2196F3',
                  borderWidth: 2,
                  elevation: 6,
                  shadowOpacity: 0.2,
                },
              ]}
            >
              <View>
                <Pressable onPress={() => toggleSelect(q.id)}>
                  <View style={styles.headerRow}>
                    <View>
                      <Text style={styles.clientName}>
                        {q.client || "Unnamed Client"}
                      </Text>
                      <Text style={styles.date}>{q.date}</Text>
                      <Text style={{ fontSize: 13, color: "#555" }}>
                        {q.project}
                      </Text>
                    </View>
                    <View style={{ flexDirection: "row", marginTop: 4 }}>
                      <Text style={{
                        backgroundColor: q.country === "India" ? "#FFE0B2" : "#C8E6C9",
                        color: q.country === "India" ? "#E65100" : "#1B5E20",
                        paddingHorizontal: 8,
                        paddingVertical: 3,
                        borderRadius: 6,
                        fontSize: 12,
                        fontWeight: "600",
                      }}>
                        {q.country === "India" ? "🇮🇳 INDIA" : "🇦🇪 UAE"}
                      </Text>
                    </View>

                    <Text style={styles.grandTotal}>
                      {currency} {q.total.toFixed(2)}
                    </Text>
                    
                  </View>

                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryText}>
                      Items: {q.items.length}
                    </Text>
                    <Text style={styles.summaryText}>
                      {taxName}: {currency} {q.vat.toFixed(2)}
                    </Text>
                  </View>
                </Pressable>

                {isSelected && (
                  <View style={styles.actionButtons}>
                    <Pressable
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => editQuotation(q)}
                    >
                      <Text style={styles.btnText}>✏️ Edit</Text>
                    </Pressable>

                    <Pressable
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => {
                        Alert.alert(
                          "Delete Quotation",
                          "Are you sure you want to delete this quotation?",
                          [
                            { text: "Cancel", style: "cancel" },
                            {
                              text: "Delete",
                              style: "destructive",
                              onPress: () => deleteQuotation(q.id),
                            },
                          ]
                        );
                      }}
                    >
                      <Text style={styles.btnText}>🗑 Delete</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 16,
  },
  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a3c5e',
    textAlign: 'center',
    marginBottom: 20,
  },
  empty: {
    textAlign: 'center',
    fontSize: 16,
    color: '#757575',
    marginTop: 60,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  clientName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976d2',
  },
  grandTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2e7d32',
  },
  date: {
    fontSize: 13,
    color: '#757575',
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  summaryText: {
    fontSize: 14,
    color: '#424242',
  },
  expandedContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  areaItem: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  areaTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1976d2',
    marginBottom: 8,
  },
  areaDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  detailLabel: {
    color: '#555',
    fontSize: 13,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '500',
  },
  areaCost: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#d32f2f',
    textAlign: 'right',
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  editBtn: {
    backgroundColor: '#1976d2',
  },
  deleteBtn: {
    backgroundColor: '#d32f2f',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});