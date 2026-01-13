// import { View, Text, StyleSheet, Pressable } from 'react-native';

// export default function Dashboard() {
//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>Dashboard</Text>

//       <Text style={styles.subtitle}>
//         Welcome! You have successfully logged in.
//       </Text>

//       <View style={styles.cards}>
//         <Pressable style={styles.card}>
//           <Text style={styles.cardIcon}>📐</Text>
//           <Text style={styles.cardText}>Work Measurement</Text>
//         </Pressable>

//         <Pressable style={styles.card}>
//           <Text style={styles.cardIcon}>📁</Text>
//           <Text style={styles.cardText}>Saved Work</Text>
//         </Pressable>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 30,
//     backgroundColor: '#f4f6f8',
//   },
//   title: {
//     fontSize: 26,
//     fontWeight: 'bold',
//   },
//   subtitle: {
//     marginTop: 10,
//     fontSize: 16,
//     color: '#555',
//   },
//   cards: {
//     flexDirection: 'row',
//     gap: 20,
//     marginTop: 40,
//   },
//   card: {
//     flex: 1,
//     backgroundColor: '#fff',
//     paddingVertical: 30,
//     borderRadius: 12,
//     alignItems: 'center',
//     elevation: 4,
//   },
//   cardIcon: {
//     fontSize: 28,
//     marginBottom: 10,
//   },
//   cardText: {
//     fontSize: 16,
//     fontWeight: '600',
//   },
// });

import { View, Text, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export default function Dashboard() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Dashboard</Text>
      <Text style={styles.subtitle}>
        Welcome! You have successfully logged in.
      </Text>

      <View style={styles.cards}>
        <Pressable
          style={styles.card}
          onPress={() => router.push('/measurement')}
        >
          <Text style={styles.icon}>📐</Text>
          <Text>Work Measurement</Text>
        </Pressable>

        <Pressable
          style={styles.card}
          onPress={() => router.push('/saved')}
        >
          <Text style={styles.icon}>📁</Text>
          <Text>Saved Work</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    backgroundColor: '#f4f6f8',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  cards: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 40,
  },
  card: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 4,
  },
  icon: {
    fontSize: 26,
    marginBottom: 8,
  },
});
