import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useRouter } from "expo-router";

export default function ConfiguracionScreen() {
  const router = useRouter();

  const handleLogout = () => {
    router.push("/"); // vuelve al login
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Configuración</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Información del usuario</Text>
        <Text style={styles.field}>
          <Text style={styles.bold}>Nombre:</Text> Valentina Darlen
        </Text>
        <Text style={styles.field}>
          <Text style={styles.bold}>RUT:</Text> 120220
        </Text>
        <Text style={styles.field}>
          <Text style={styles.bold}>Correo electrónico:</Text> valentina@empresa.cl
        </Text>
        <Text style={styles.field}>
          <Text style={styles.bold}>Empresa:</Text> TU EMPRESA
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Button title="ENROLAMIENTO" color="#C68A00" onPress={() => {}} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="ACERCA DE GEOVICTORIA" color="#C68A00" onPress={() => {}} />
      </View>
      <View style={styles.buttonContainer}>
        <Button title="CERRAR SESIÓN" color="#C68A00" onPress={handleLogout} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0074C7",
    alignItems: "center",
    paddingTop: 80,
  },
  title: {
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#fff",
    width: "85%",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  label: {
    color: "#0074C7",
    fontWeight: "bold",
    fontSize: 16,
    marginBottom: 10,
  },
  field: {
    fontSize: 14,
    marginBottom: 6,
  },
  bold: {
    color: "#0074C7",
    fontWeight: "bold",
  },
  buttonContainer: {
    width: "85%",
    marginBottom: 15,
    borderRadius: 8,
    overflow: "hidden",
  },
});
