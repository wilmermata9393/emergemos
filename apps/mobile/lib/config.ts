import Constants from 'expo-constants';

// URL de la API. En Expo Go, el teléfono debe alcanzar tu computadora por su
// IP de red local (no "localhost"). Cambia "apiUrl" en app.json por la IP de
// tu máquina, por ejemplo: http://192.168.1.50:4000/api
export const API_URL: string =
  (Constants.expoConfig?.extra?.apiUrl as string) ?? 'http://localhost:4000/api';
