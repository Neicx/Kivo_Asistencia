import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TextInput, Button, Alert } from 'react-native';
import React, { useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router'; // <-- Importa useRouter

export default function App() {
  const [Rut, setRut] = useState(null);
  const [contraseña, setContraseña] = useState("");
  const router = useRouter(); // <-- Hook de navegación

  const respuestalogin = async () => {
    try {
      const response = await fetch('http://192.168.56.1:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rut: Rut, password: contraseña })
      });

      if (response.status === 200) { // <-- Verifica el status code
        const data = await response.json();
        await AsyncStorage.setItem('token', data.access);
        Alert.alert('Login Exitoso');
        router.push('/marcas'); // <-- Navega a la vista solo si es exitoso
      } else {
        Alert.alert('Error de autenticación', 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Ocurrió un error durante la solicitud de login');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Bienvenido a Kivo!</Text>

      <View style={{ width: 300, marginBottom: 10 }}>
        <Text style={styles.Text_Label}>Ingrese su Rut</Text>
      </View>
      <View style={styles.credenciales}>
        <TextInput
          style={styles.TextInput}
          value={Rut}
          onChangeText={setRut}
          placeholder='Rut'
        />
      </View>

      <View style={{ width: 300, marginBottom: 10 }}>
        <Text style={styles.Text_Label}>Ingrese su Contraseña</Text>
      </View>
      <View style={styles.credenciales}>
        <TextInput
          style={styles.TextInput}
          textContentType={'password'}
          secureTextEntry={true}
          value={contraseña}
          onChangeText={setContraseña}
          placeholder='Ingrese Su Contraseña'
        />
      </View>

      <View style={styles.Button_Container}>
        <Button title="Inicia Sesion" onPress={respuestalogin} />
      </View>

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  TextInput: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    paddingHorizontal: 10,
    width: 300,
  },
  Text_Label: {
    alignSelf: 'flex-start',
    marginTop: 4,
    marginBottom: 4,
  },
  Button_Container: {
    marginTop: 20,
    height: 40,
    width: 180,
  },
  credenciales: {
    width: 300,
    flexDirection: 'row',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: {
    fontSize: 30,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});
