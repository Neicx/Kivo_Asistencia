import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons'; // <-- Agregado para íconos

export default function App() {
  const [Rut, setRut] = useState('');
  const [contraseña, setContraseña] = useState('');
  const [loading, setLoading] = useState(false); // <-- Estado para loading
  const [error, setError] = useState(''); // <-- Estado para errores
  const router = useRouter();

  const validarInputs = () => {
    if (!Rut.trim()) {
      setError('Por favor, ingresa tu RUT.');
      return false;
    }
    if (!contraseña.trim()) {
      setError('Por favor, ingresa tu contraseña.');
      return false;
    }
    setError('');
    return true;
  };

  const respuestalogin = async () => {
    if (!validarInputs()) return;

    setLoading(true);
    try {
      const response = await fetch('http://192.168.1.50:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: Rut, password: contraseña })
      });

      if (response.status === 200) {
        const data = await response.json();
        await AsyncStorage.setItem('token', data.access);
        Alert.alert('¡Login Exitoso!', 'Bienvenido a Kivo.');
        router.push('/marcas');
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Usuario o contraseña incorrectos.');
      }
    } catch (error) {
      console.error(error);
      setError('Error de conexión. Verifica tu internet.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={styles.card}>
        <View style={styles.header}>
          <Ionicons name="lock-closed" size={50} color="#3b82f6" />
          <Text style={styles.titulo}>Bienvenido a Kivo!</Text>
          <Text style={styles.subtitulo}>Ingresa tus credenciales para continuar</Text>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>RUT</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person" size={20} color="#6b7280" style={styles.icon} />
            <TextInput
              style={styles.TextInput}
              value={Rut}
              onChangeText={(text) => {
                setRut(text);
                setError(''); // Limpiar error al escribir
              }}
              placeholder="Ingresa tu RUT"
              placeholderTextColor="#9ca3af"
              keyboardType="default"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="key" size={20} color="#6b7280" style={styles.icon} />
            <TextInput
              style={styles.TextInput}
              textContentType="password"
              secureTextEntry={true}
              value={contraseña}
              onChangeText={(text) => {
                setContraseña(text);
                setError(''); // Limpiar error al escribir
              }}
              placeholder="Ingresa tu contraseña"
              placeholderTextColor="#9ca3af"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={respuestalogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="log-in" size={20} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Iniciar Sesión</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <StatusBar style="auto" />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Gradiente de fondo (nota: en RN usa ImageBackground para gradientes complejos, pero aquí lo simulamos)
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '100%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10, // Para Android
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginTop: 10,
    textAlign: 'center',
  },
  subtitulo: {
    fontSize: 16,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 5,
  },
  inputContainer: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    backgroundColor: '#f9fafb',
    paddingHorizontal: 15,
    height: 50,
  },
  icon: {
    marginRight: 10,
  },
  TextInput: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3b82f6',
    borderRadius: 10,
    height: 50,
    width: '100%',
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  buttonDisabled: {
    backgroundColor: '#9ca3af',
  },
  buttonIcon: {
    marginRight: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
});
