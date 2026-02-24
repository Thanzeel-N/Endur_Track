import { Stack, router } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#8B6F47' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="saved" options={{ title: 'Saved Works' }} />

      <Stack.Screen
        name="measurement"
        options={{
          title: 'Measurement',
          headerRight: () => (
            <Pressable
              onPress={() => router.push('/measurement-uae')}
              style={{ paddingHorizontal: 12 }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>
                UAE
              </Text>
            </Pressable>
          ),
        }}
      />

      {/* New page – you will build this */}
      <Stack.Screen
        name="measurement-uae"
        options={{ title: 'UAE Measurement' }}
      />
    </Stack>
  );
}
