import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>🎉 ICQ Messenger</Text>
      <Text style={styles.subtitle}>Приложение работает стабильно!</Text>
      <Text style={styles.info}>Backend: http://185.123.195.44:3000</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 18,
    color: '#2563eb',
    marginBottom: 10,
  },
  info: {
    fontSize: 14,
    color: '#999999',
    marginTop: 20,
  },
});
