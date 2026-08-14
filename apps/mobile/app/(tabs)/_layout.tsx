import { Tabs } from 'expo-router';
import { Text } from 'react-native';

const icon = (emoji: string) => ({ color }: { color: string }) =>
  <Text style={{ fontSize: 22, color }}>{emoji}</Text>;

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: '#6d7f6f' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
        tabBarActiveTintColor: '#6d7f6f',
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Inicio', tabBarIcon: icon('🏠') }} />
      <Tabs.Screen name="appointments" options={{ title: 'Citas', tabBarIcon: icon('📅') }} />
      <Tabs.Screen name="prescriptions" options={{ title: 'Recetas', tabBarIcon: icon('💊') }} />
      <Tabs.Screen name="diary" options={{ title: 'Diario', tabBarIcon: icon('📔') }} />
    </Tabs>
  );
}
