import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as Print from "expo-print";
import { useLocalSearchParams } from "expo-router";
import * as Sharing from "expo-sharing";
import { File, Directory, Paths } from "expo-file-system";
import React, { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useColorScheme,
  View,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { quotationHTML, QuotationItem } from "../utils/pdf";

/* ===== THEME COLORS ===== */
const lightColors = {
  background: "#FFFFFF",
  card: "#F8F8F8",
  border: "#000000",
  text: "#000000",
  inputBg: "#FFFFFF",
  placeholder: "#666666",
};

const darkColors = {
  background: "#000000",
  card: "#121212",
  border: "#333333",
  text: "#FFFFFF",
  inputBg: "#1E1E1E",
  placeholder: "#AAAAAA",
};

const DEFAULT_TEMPLATE = {

  message: `Dear Sir/Madam,

    Thank you for considering ASSAQF Technical Services LLC for your gypsum and interior works requirements. We truly appreciate the opportunity to provide you with our quotation. With over 25+ years of experience, Assaqf is committed to delivering premium quality workmanship, timely execution, and elegant interior solutions. Below is the detailed cost breakdown for the proposed scope of work.`,
  
  standardmethod:`We used ceiling materials details frame with Channels,channels section to section 40cm distance.intermediate 80cm distance,angle support 100 meter and perimeter in wallsaid.powder joint compound two coat with fiber.`,

  conditions: [
    "Electricity, Water and adequate work space will be provided by the client.",
    "Any other site obstacles will be handled by the client.",
    "If plywood work is required, client will provide the plywood materials.",
  ],

  paymentTerms: [
    "50% Advance",
    "40% After framing",
    "Payments should clear within 10 days",
  ],

  excludingWork: [
    "Electrical work",
    "Civil work",
    "Painting work",
  ],
};

const DRAFT_KEY = "quotation_draft_v1";

/* ===== CUSTOM BUTTON ===== */
const PrimaryButton = ({ title, onPress } : { title: string; onPress: () => void }) => (
  <Pressable
    onPress={onPress}
    style={{
      backgroundColor: "#8B6F47",
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
      alignItems: "center",
      justifyContent: "center",
      marginVertical: 6,
      minWidth: 120,                        // prevents very narrow buttons
      borderWidth: 1,
      borderColor: "#6B5A38",               // slightly darker border for depth
    }}
  >
    <Text
      style={{
        color: "#FFFFFF",
        fontSize: 14,
        fontWeight: "600",
      }}
    >
      {title}
    </Text>
  </Pressable>
);

const QuotationScreen = () => {
  const scheme = useColorScheme();
  const COLORS = scheme === "dark" ? darkColors : lightColors;

  const [country, setCountry] = useState<'UAE' | 'India'>('UAE');

  const currencySymbol = country === 'India' ? '₹' : 'AED';
  const taxLabel = country === 'India' ? 'GST' : 'VAT';

  const [consultant, setConsultant] = useState("");
  const [plotNo, setPlotNo] = useState("");
  const [quotationNo, setQuotationNo] = useState("");
  const [duration, setDuration] = useState("");

  const [client, setClient] = useState("");
  const [project, setProject] = useState("");
  const [coverPoster, setCoverPoster] = useState<string | null>("");

  const [message, setMessage] = useState(DEFAULT_TEMPLATE.message);
  const [standardMethod, setStandardMethod] = useState(DEFAULT_TEMPLATE.standardmethod);

  const [conditions, setConditions] = useState<string[]>([...DEFAULT_TEMPLATE.conditions]);

  const [paymentTerms, setPaymentTerms] = useState<string[]>([...DEFAULT_TEMPLATE.paymentTerms]);

  const [excludingWork, setExcludingWork] = useState<string[]>([...DEFAULT_TEMPLATE.excludingWork]);

  const [taxRatePercent, setTaxRatePercent] = useState<number>(
    country === 'India' ? 18 : 5
  );

// When country changes → reset to default if wanted
  useEffect(() => {
    setTaxRatePercent(country === 'India' ? 18 : 5);
  }, [country]);



  type SavedQuotation = {
    id: string;
    date: string;
    country: 'UAE' | 'India';
    coverPoster: string | null;
    client: string;
    consultant: string;
    project: string;
    plotNo: string;
    quotationNo: string;
    duration: string;
    items: QuotationItem[];
    materials: {
      name: string;
      description: string;
      images: string[];
    }[];
    subtotal: number;
    vat: number;
    total: number;
    message: string;
    standardMethod: string;
    paymentTerms: string[];       // ← changed to array
    excludingWork: string[];      // ← changed to array
    conditions: string[];
    currencySymbol?: string;
    taxLabel?: string;
    taxRatePercent?: number;
  };

  const saveQuotation = async () => {
    try {
      const raw = await AsyncStorage.getItem("quotations");
      const existing: SavedQuotation[] = raw ? JSON.parse(raw) : [];

      const quotationData: SavedQuotation = {
        id: editQuotation?.id || Date.now().toString(),
        date: editQuotation?.date || new Date().toLocaleString(
          'en-GB', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        country,
        client,
        consultant,
        project,
        plotNo,
        quotationNo,
        duration,
        items,
        materials,
        subtotal,
        vat,
        total,
        message,
        standardMethod,
        paymentTerms, // now array
        excludingWork, // now array
        conditions,
        coverPoster: null
      };

      let updatedQuotations: SavedQuotation[];

      if (editQuotation) {
        updatedQuotations = existing.map(q =>
          q.id === editQuotation.id ? quotationData : q
        );
      } else {
        updatedQuotations = [quotationData, ...existing];
      }

      await AsyncStorage.setItem("quotations", JSON.stringify(updatedQuotations));
       await AsyncStorage.removeItem(DRAFT_KEY);
      alert(editQuotation ? "Quotation updated ✅" : "Quotation saved ✅");
    } catch (e) {
      console.error(e);
      alert("Failed to save quotation ❌");
    }
  };

  const saveDraft = async () => {
    try {
      const draftData = {
        client,
        consultant,
        project,
        plotNo,
        quotationNo,
        duration,
        items,
        message, 
        materials, 
        standardMethod,
        conditions,
        paymentTerms,
        excludingWork,
        taxRatePercent,
        country,
      };

      await AsyncStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));

      console.log("Draft saved");
    } catch (e) {
      console.log("Draft save error", e);
    }
  };

  useEffect(() => {
    const loadDraft = async () => {
      try {
        if (editQuotation) return;

        const raw = await AsyncStorage.getItem(DRAFT_KEY);

        if (!raw) return;

        const draft = JSON.parse(raw);

        setCoverPoster(draft.coverPoster ?? "");
        setClient(draft.client ?? "");
        setConsultant(draft.consultant ?? "");
        setProject(draft.project ?? "");
        setPlotNo(draft.plotNo ?? "");
        setQuotationNo(draft.quotationNo ?? "");
        setDuration(draft.duration ?? "");
        

        setItems(
          Array.isArray(draft.items) && draft.items.length > 0
            ? draft.items
            : [{ desc: "", qty: 1, rate: 0 }]
        );
        setMaterials([]);

        setMessage(draft.message ?? DEFAULT_TEMPLATE.message);
        setStandardMethod(draft.standardMethod ?? DEFAULT_TEMPLATE.standardmethod);

        setConditions(draft.conditions ?? DEFAULT_TEMPLATE.conditions);
        setPaymentTerms(draft.paymentTerms ?? DEFAULT_TEMPLATE.paymentTerms);
        setExcludingWork(draft.excludingWork ?? DEFAULT_TEMPLATE.excludingWork);
        setTaxRatePercent(draft.taxRatePercent ?? (draft.country === 'India' ? 18 : 5));

        setCountry(draft.country ?? "UAE");

        console.log("Draft loaded");
      } catch (e) {
        console.log("Draft load error", e);
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    saveDraft();
  }, [
    coverPoster,
    client,
    consultant,
    project,
    plotNo,
    quotationNo,
    duration,
    QuotationItem,
    message,
    standardMethod,
    conditions,
    paymentTerms,
    excludingWork,
    taxRatePercent,
    country,
  ]);

  const pickCoverPoster = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true, // ✅ IMPORTANT
    });

    if (!result.canceled && result.assets[0].base64) {
      setCoverPoster(`data:image/jpeg;base64,${result.assets[0].base64}`);
    }
  };


  /* ===== WORK ITEMS ===== */
  const [items, setItems] = useState<QuotationItem[]>([{ desc: "", qty: 1, rate: 0 }]);

  /* ===== COMMON MATERIALS ===== */
  const [materials, setMaterials] = useState<
  { name: string; description: string; images: string[] }[]
>([]);

  const updateItem = (itemIndex: number, field: keyof QuotationItem, value: any) => {
    setItems(prevItems =>
      prevItems.map((item, index) =>
        index === itemIndex
          ? { ...item, [field]: value }   // create new object
          : item
      )
    );
  };

  const addItem = () => {
    setItems([...items, { desc: "", qty: 1, rate: 0 }]);
  };

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated.length ? updated : [{ desc: "", qty: 1, rate: 0 }]);
  };

  const addMaterial = () => {
    setMaterials([
      ...materials,
      {
        name: "",
        description: "",
        images: []
      }
    ]);
  };

  const removeMaterial = (index: number) => {
    const updated = materials.filter((_, i) => i !== index);
    setMaterials(updated);
  };

  const updateMaterialName = (index: number, value: string) => {
    const updated = [...materials];
    updated[index].name = value;
    setMaterials(updated);
  };

  const updateMaterialDescription = (index: number, value: string) => {
    const updated = [...materials];
    updated[index].description = value;
    setMaterials(updated);
  };

  const pickMaterialImage = async (index: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      alert("Permission required to access photos");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      base64: true,           // ← Add this line (critical!)
    });

    if (!result.canceled && result.assets[0].base64) {
      const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
      const updated = [...materials];
      updated[index].images.push(base64Image);
      setMaterials(updated);
    }
};

  const removeMaterialImage = (materialIndex: number, imageIndex: number) => {
    const updated = [...materials];

    if (!updated[materialIndex].images) return;

    updated[materialIndex].images =
      updated[materialIndex].images.filter((_, i) => i !== imageIndex);

    setMaterials(updated);
  };

  const changeMaterialImage = async (materialIndex: number, imageIndex: number) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert("Permission required");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      base64: true,
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0].base64) {

      const updated = [...materials];

      updated[materialIndex].images[imageIndex] =
        `data:image/jpeg;base64,${result.assets[0].base64}`;

      setMaterials(updated);
    }
  };

  const numberToWords = (num: number) => {
    const ones = [
      '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
      'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen',
      'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
    ];

    const tens = [
      '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
      'Sixty', 'Seventy', 'Eighty', 'Ninety'
    ];

    const convertHundreds = (n: number) => {
      let str = '';

      if (n > 99) {
        str += ones[Math.floor(n / 100)] + ' Hundred ';
        n %= 100;
      }

      if (n > 19) {
        str += tens[Math.floor(n / 10)] + ' ';
        n %= 10;
      }

      if (n > 0) {
        str += ones[n] + ' ';
      }

      return str.trim();
    };

    if (num === 0) return 'Zero';

    let result = '';

    const crores = Math.floor(num / 10000000);
    num %= 10000000;

    const lakhs = Math.floor(num / 100000);
    num %= 100000;

    const thousands = Math.floor(num / 1000);
    num %= 1000;

    const hundreds = num;

    if (crores) result += convertHundreds(crores) + ' Crore ';
    if (lakhs) result += convertHundreds(lakhs) + ' Lakh ';
    if (thousands) result += convertHundreds(thousands) + ' Thousand ';
    if (hundreds) result += convertHundreds(hundreds);

    return result.trim();
  };

  
  // ── Shared handler logic for all three list sections ─────────────────────
  const updateListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number,
    text: string
  ) => {
    const updated = [...list];
    updated[index] = text;
    setList(updated);
  };

  const addListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    setList([...list, ""]);
  };

  const removeListItem = (
    list: string[],
    setList: React.Dispatch<React.SetStateAction<string[]>>,
    index: number
  ) => {
    const updated = list.filter((_, i) => i !== index);
    setList(updated.length ? updated : [""]);
  };

  const subtotal = items.reduce((sum, item) => sum + item.qty * item.rate, 0);
  const taxRate = taxRatePercent / 100;
  const vat = subtotal * taxRate;
  const total = subtotal + vat;
  const totalInWords = numberToWords(Math.round(total));

  

  const generatePDF = async () => {
    const html = quotationHTML({
      coverPoster,
      date: new Date().toDateString(),
      client,
      consultant,
      project,
      plotNo,
      quotationNo,
      duration,
      items,
      materials,
      subtotal,
      
      vat,
      total,
      totalInWords: `${currencySymbol} ${totalInWords} Only`,
      message,
      standardMethod, 
      paymentTerms: paymentTerms.join('\n'),
      conditions,
      excludingWork: excludingWork.join('\n'),
      currencySymbol,
      taxLabel,
      taxRatePercent: `${taxRatePercent}%`,
    });

    const tempFile = await Print.printToFileAsync({ html });

    const fileName =
      `Assaqf_Quotation_${client || "Client"}_${Date.now()}`
        .replace(/\s+/g, "_") + ".pdf";

    // ✅ correct directory
    const folder = new Directory(Paths.document, "quotations");

    // ✅ FIX: create only if not exists
    if (!(await folder.exists)) {
      await folder.create({ intermediates: true });
    }
    const newFile = new File(folder, fileName);

    // move file
    const sourceFile = new File(tempFile.uri);
    await sourceFile.move(newFile);

    await Sharing.shareAsync(newFile.uri);
  };

  const params = useLocalSearchParams();
  const editQuotation = params?.editQuotation
    ? JSON.parse(params.editQuotation as string)
    : null;

  useEffect(() => {
    if (!editQuotation) return;

    setCoverPoster(editQuotation.coverPoster || null);
    setClient(editQuotation.client);
    setConsultant(editQuotation.consultant);
    setProject(editQuotation.project);
    setPlotNo(editQuotation.plotNo);
    setQuotationNo(editQuotation.quotationNo);
    setDuration(editQuotation.duration);

    setItems(editQuotation.items);
    setMaterials(editQuotation.materials || []);

    setMessage(editQuotation.message || "");
    setStandardMethod(editQuotation.standardMethod || "");

    // ── Load arrays (fallback to single string split if old format) ──
    setConditions(editQuotation.conditions || [""]);
    setPaymentTerms(
      Array.isArray(editQuotation.paymentTerms)
        ? editQuotation.paymentTerms
        : editQuotation.paymentTerms?.split('\n').filter(Boolean) || [""]
    );
    setExcludingWork(
      Array.isArray(editQuotation.excludingWork)
        ? editQuotation.excludingWork
        : editQuotation.excludingWork?.split('\n').filter(Boolean) || [""]
    );
    setTaxRatePercent(
    editQuotation.taxRatePercent || (country === 'India' ? 18 : 5)
    
  );
  }, []);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >

        

        {/* Country selector */}
        <Text style={{ color: COLORS.text, fontWeight: "bold", marginBottom: 8 }}>
          Select Country / Currency
        </Text>

        <View style={{ flexDirection: 'row', marginBottom: 24, gap: 12 }}>
          <Pressable
            onPress={() => setCountry('UAE')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: country === 'UAE' ? '#8B6F47' : COLORS.card,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: country === 'UAE' ? 'white' : COLORS.text, fontWeight: country === 'UAE' ? 'bold' : 'normal' }}>
              UAE (AED + VAT)
            </Text>
          </Pressable>

          <Pressable
            onPress={() => setCountry('India')}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: country === 'India' ? '#8B6F47' : COLORS.card,
              borderRadius: 8,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: country === 'India' ? 'white' : COLORS.text, fontWeight: country === 'India' ? 'bold' : 'normal' }}>
              India (₹ + GST)
            </Text>
          </Pressable>
        </View>

        {/* Cover Poster */}
        <Text style={{ color: COLORS.text, fontWeight: "bold" }}>Cover Poster</Text>
        <PrimaryButton title="UPLOAD COVER POSTER" onPress={pickCoverPoster} />
        {coverPoster && (
          <Image
            source={{ uri: coverPoster }}
            style={{ width: "100%", height: 200, resizeMode: "contain", borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 }}
          />
        )}

        {/* Client & Project Info */}
        <Text style={{ color: COLORS.text }}>Client Name</Text>
        <TextInput value={client} onChangeText={setClient} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 10 }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text }}>Project Name</Text>
        <TextInput value={project} onChangeText={setProject} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 20 }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text }}>Consultants / Main Contractor</Text>
        <TextInput value={consultant} onChangeText={setConsultant} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 10 }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text }}>Plot No</Text>
        <TextInput value={plotNo} onChangeText={setPlotNo} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 10 }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text }}>Quotation No</Text>
        <TextInput value={quotationNo} onChangeText={setQuotationNo} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 10 }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text }}>Duration Time</Text>
        <TextInput value={duration} onChangeText={setDuration} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 10 }} placeholderTextColor={COLORS.placeholder} />

        {/* Message */}
        <Text style={{ color: COLORS.text, fontWeight: "bold" }}>Message to Main Contractor</Text>
        <TextInput multiline numberOfLines={4} value={message} onChangeText={setMessage} placeholder="Write your message here..." style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8, marginBottom: 15, textAlignVertical: "top" }} placeholderTextColor={COLORS.placeholder} />

        <Text style={{ color: COLORS.text, fontWeight: "bold", marginTop: 15 }}>
          This is the standard method we follow for our gypsum ceiling work.
        </Text>

        <TextInput
          multiline
          numberOfLines={4}
          value={standardMethod}
          onChangeText={setStandardMethod}
          placeholder="Enter standard method details..."
          style={{
            borderWidth: 1,
            borderColor: COLORS.border,
            backgroundColor: COLORS.inputBg,
            color: COLORS.text,
            padding: 8,
            marginBottom: 15,
            textAlignVertical: "top"
          }}
          placeholderTextColor={COLORS.placeholder}
        />

        {/* Work Items */}
        {items.map((item, itemIndex) => (
          <View key={itemIndex} style={{ position: "relative", backgroundColor: COLORS.card, borderWidth: 1, borderColor: COLORS.border, padding: 10, marginBottom: 20 }}>
            <Pressable style={styles.removeBtn} onPress={() => removeItem(itemIndex)}>
              <Text style={{ color: "red", fontSize: 18 }}>×</Text>
            </Pressable>
            <Text style={{ color: COLORS.text }}>Work Description</Text>
            <TextInput value={item.desc} onChangeText={(t) => updateItem(itemIndex, "desc", t)} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 6, marginBottom: 8 }} placeholderTextColor={COLORS.placeholder} />

            <Text style={{ color: COLORS.text }}>Quantity</Text>
            <TextInput keyboardType="numeric" value={item.qty.toString()} onChangeText={(t) => updateItem(itemIndex, "qty", Number(t))} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 6, marginBottom: 8 }} placeholderTextColor={COLORS.placeholder} />

            <Text style={{ color: COLORS.text }}>Rate</Text>
            <TextInput keyboardType="numeric" value={item.rate.toString()} onChangeText={(t) => updateItem(itemIndex, "rate", Number(t))} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 6, marginBottom: 8 }} placeholderTextColor={COLORS.placeholder} />

            <Text style={{ color: COLORS.text }}>Total: {currencySymbol} {item.qty * item.rate}</Text>
          </View>
        ))}
        <PrimaryButton title="ADD WORK ITEM" onPress={addItem} />

        {/* Common Materials */}
        <Text style={{ color: COLORS.text, fontWeight: "bold", marginTop: 20 }}>
          Common Materials / Products
        </Text>

        {materials.map((mat, index) => (
          <View
            key={index}
            style={{
              position: "relative",
              backgroundColor: COLORS.card,
              borderWidth: 1,
              borderColor: COLORS.border,
              padding: 10,
              marginBottom: 15,
            }}
          >

            {/* REMOVE BUTTON */}
            <Pressable
              style={styles.removeBtn}
              onPress={() => removeMaterial(index)}
            >
              <Text style={{ color: "red", fontSize: 18 }}>×</Text>
            </Pressable>


            {/* NAME */}
            <TextInput
              placeholder="Material / Product name"
              value={mat.name}
              onChangeText={(t) => updateMaterialName(index, t)}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.inputBg,
                color: COLORS.text,
                padding: 6,
                marginBottom: 6,
              }}
              placeholderTextColor={COLORS.placeholder}
            />


            {/* DESCRIPTION */}
            <TextInput
              placeholder="Material details / description"
              value={mat.description}
              onChangeText={(t) => updateMaterialDescription(index, t)}
              multiline
              numberOfLines={3}
              style={{
                borderWidth: 1,
                borderColor: COLORS.border,
                backgroundColor: COLORS.inputBg,
                color: COLORS.text,
                padding: 6,
                marginBottom: 8,
                textAlignVertical: "top",
              }}
              placeholderTextColor={COLORS.placeholder}
            />


            {/* IMAGE BUTTON */}
            <PrimaryButton
              title="UPLOAD IMAGE"
              onPress={() => pickMaterialImage(index)}
            />


            {/* IMAGE PREVIEW */}
            <View style={{ flexDirection: "row", flexWrap: "wrap", marginTop: 6 }}>
              {mat.images.map((img, i) => (
                <View key={i} style={{ marginRight: 8, marginBottom: 8 }}>

                  {/* CHANGE IMAGE */}
                  <Pressable onPress={() => changeMaterialImage(index, i)}>
                    <Image
                      source={{ uri: img }}
                      style={{
                        width: 70,
                        height: 70,
                        borderWidth: 1,
                        borderColor: COLORS.border,
                      }}
                    />
                  </Pressable>

                  {/* REMOVE BUTTON */}
                  <Pressable
                    style={{
                      position: "absolute",
                      top: -6,
                      right: -6,
                      backgroundColor: "white",
                      borderRadius: 10,
                      width: 20,
                      height: 20,
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    onPress={() => removeMaterialImage(index, i)}
                  >
                    <Text style={{ color: "red", fontWeight: "bold" }}>×</Text>
                  </Pressable>

                </View>
              ))}
            </View>

          </View>
        ))}

        <PrimaryButton title="ADD MATERIAL" onPress={addMaterial} />

        {/* Conditions - unchanged */}
        <Text style={{ color: COLORS.text, fontWeight: "bold" }}>Conditions</Text>
        {conditions.map((cond, i) => (
          <View key={i} style={{ position: "relative", marginBottom: 10 }}>
            <Pressable style={styles.removeBtn} onPress={() => removeListItem(conditions, setConditions, i)}>
              <Text style={{ color: "red", fontSize: 18 }}>×</Text>
            </Pressable>
            <TextInput value={cond} placeholder={`Condition ${i + 1}`} onChangeText={(t) => updateListItem(conditions, setConditions, i, t)} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8 }} placeholderTextColor={COLORS.placeholder} />
          </View>
        ))}
        <PrimaryButton title="ADD ANOTHER CONDITION" onPress={() => addListItem(conditions, setConditions)} />

        {/* Payment Terms - now same structure as Conditions */}
        <Text style={{ color: COLORS.text, fontWeight: "bold", marginTop: 20 }}>Payment Terms</Text>
        {paymentTerms.map((term, i) => (
          <View key={i} style={{ position: "relative", marginBottom: 10 }}>
            <Pressable style={styles.removeBtn} onPress={() => removeListItem(paymentTerms, setPaymentTerms, i)}>
              <Text style={{ color: "red", fontSize: 18 }}>×</Text>
            </Pressable>
            <TextInput value={term} placeholder={`Payment term ${i + 1}`} onChangeText={(t) => updateListItem(paymentTerms, setPaymentTerms, i, t)} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8 }} placeholderTextColor={COLORS.placeholder} />
          </View>
        ))}
        <PrimaryButton title="ADD PAYMENT TERM" onPress={() => addListItem(paymentTerms, setPaymentTerms)} />

        {/* Excluding Work - now same structure as Conditions */}
        <Text style={{ color: COLORS.text, fontWeight: "bold", marginTop: 20 }}>Excluding Work</Text>
        {excludingWork.map((ex, i) => (
          <View key={i} style={{ position: "relative", marginBottom: 10 }}>
            <Pressable style={styles.removeBtn} onPress={() => removeListItem(excludingWork, setExcludingWork, i)}>
              <Text style={{ color: "red", fontSize: 18 }}>×</Text>
            </Pressable>
            <TextInput value={ex} placeholder={`Exclusion ${i + 1}`} onChangeText={(t) => updateListItem(excludingWork, setExcludingWork, i, t)} style={{ borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.inputBg, color: COLORS.text, padding: 8 }} placeholderTextColor={COLORS.placeholder} />
          </View>
        ))}
        <PrimaryButton title="ADD EXCLUSION" onPress={() => addListItem(excludingWork, setExcludingWork)} />

        


        <Text style={{ color: COLORS.text, fontWeight: "bold", marginTop: 16 }}>
          Tax Rate (%)
        </Text>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <TextInput
            keyboardType="numeric"
            value={taxRatePercent.toString()}
            onChangeText={t => setTaxRatePercent(Number(t) || 0)}
            style={{
              borderWidth: 1,
              borderColor: COLORS.border,
              backgroundColor: COLORS.inputBg,
              color: COLORS.text,
              padding: 10,
              width: 100,
              borderRadius: 6,
            }}
            placeholder="e.g. 5"
            placeholderTextColor={COLORS.placeholder}
          />
        </View>

        {/* Totals */}
        <Text style={{ color: COLORS.text, marginTop: 20 }}>Subtotal: {currencySymbol} {subtotal}</Text>
        <Text style={{ color: COLORS.text }}>{taxLabel}: {currencySymbol} {vat.toFixed(2)}</Text>
        <Text style={{ color: COLORS.text, fontWeight: "bold" }}>Grand Total: {currencySymbol} {total}</Text>
        <Text style={{
          color: COLORS.text,
          marginTop: 5,
          fontStyle: "italic"
        }}>
          In Words: {totalInWords}  Only
        </Text>
        
        <PrimaryButton title={editQuotation ? "UPDATE QUOTATION" : "SAVE QUOTATION"} onPress={saveQuotation} />
        <PrimaryButton title="GENERATE PDF" onPress={generatePDF} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = {
  removeBtn: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ffecec00",
    zIndex: 10,
  },
};

export default QuotationScreen;