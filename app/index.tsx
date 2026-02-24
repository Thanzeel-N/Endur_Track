import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ImageBackground,
} from 'react-native';
import { router } from 'expo-router';

export default function Dashboard() {
  return (
    <ImageBackground
      source={require('../assets/images/logo.png')}
      style={styles.background}
      resizeMode="contain"
    >
      {/* Light overlay */}
      <View style={styles.overlay}>


        <View style={styles.cards}>
  <Pressable
    style={styles.card}
    onPress={() => router.push('/measurement')}
  >
    <Text style={styles.cardTitle}>📐 Work Measurement 🛠️</Text>
    <Text style={styles.cardDesc}>
      Create new site measurements
    </Text>
  </Pressable>

  <Pressable
    style={styles.card}
    onPress={() => router.push('/saved')}
  >
    <Text style={styles.cardTitle}>Saved Works 🗂️</Text>
    <Text style={styles.cardDesc}>
      View & edit saved records
    </Text>
  </Pressable>

  {/* ✅ NEW QUOTATION CARD */}
  <Pressable
    style={styles.card}
    onPress={() => router.push('/quotation')}
  >
    <Text style={styles.cardTitle}>📄 Quotation Generator</Text>
    <Text style={styles.cardDesc}>
      Create & export project quotations
    </Text>
  </Pressable>
</View>


      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },

  overlay: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },

  header: {
    marginBottom: 26,
  },

  company: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#0f172a',
  },

  tagline: {
    marginTop: 4,
    fontSize: 14,
    color: '#475569',
  },

  cards: {
    gap: 18,
  },

  card: {
    backgroundColor: '#cdedf6',        // 🔥 dark card
    paddingVertical: 28,               // 🔥 bigger card
    paddingHorizontal: 22,
    borderRadius: 18,
    elevation: 4,
  },

  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },

  cardDesc: {
    marginTop: 6,
    fontSize: 14,
    color: '#424242',
  },
});
