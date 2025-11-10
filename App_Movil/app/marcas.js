import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function App() {
  const [time, setTime] = useState("00:00:00");
  const [selectedTab, setSelectedTab] = useState("asistencia");

  return (
    <SafeAreaView style={styles.container}>
      {/* Encabezado */}
      <View style={styles.header}>
        <Text style={styles.companyText}>TU EMPRESA</Text>
        <Text style={styles.greeting}>Hola, Valentina</Text>
        <Text style={styles.timer}>{time}</Text>
        <Text style={styles.date}>Viernes 08, mayo 2020</Text>

        {/* Tarjeta de turno */}
        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.shiftText}> Turno</Text>
          </View>
          <Text style={styles.shiftDetail}>07:00 - 15:00 (60 Minutos)</Text>
        </View>
      </View>

      {/* Botones de entrada y salida */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.entryButton}>
          <Text style={styles.entryText}>ENTRADA</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.exitButton}>
          <Text style={styles.exitText}>SALIDA</Text>
        </TouchableOpacity>
      </View>

      {/* Barra inferior */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.bottomItem}
          onPress={() => setSelectedTab("asistencia")}
        >
          <Ionicons
            name="hand-left-outline"
            size={22}
            color={selectedTab === "asistencia" ? "#007AFF" : "#999"}
          />
          <Text
            style={[
              styles.bottomText,
              selectedTab === "asistencia" && styles.activeText,
            ]}
          >
            Asistencia
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.bottomItem}
          onPress={() => setSelectedTab("configuracion")}
        >
          <Ionicons
            name="settings-outline"
            size={22}
            color={selectedTab === "configuracion" ? "#007AFF" : "#999"}
          />
          <Text
            style={[
              styles.bottomText,
              selectedTab === "configuracion" && styles.activeText,
            ]}
          >
            Configuración
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    flex: 1,
    backgroundColor: "#1E88E5",
    alignItems: "center",
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  companyText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  greeting: {
    color: "#fff",
    fontSize: 18,
    marginTop: 10,
  },
  timer: {
    color: "#fff",
    fontSize: 48,
    fontWeight: "bold",
    marginTop: 10,
  },
  date: {
    color: "#fff",
    marginTop: 10,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 20,
    padding: 15,
    borderRadius: 15,
    width: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  shiftText: {
    fontWeight: "600",
    color: "#007AFF",
  },
  shiftDetail: {
    color: "#555",
    marginTop: 5,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    marginVertical: 30,
  },
  entryButton: {
    backgroundColor: "#DAA520",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  entryText: {
    color: "#fff",
    fontWeight: "bold",
  },
  exitButton: {
    borderColor: "#DAA520",
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  exitText: {
    color: "#DAA520",
    fontWeight: "bold",
  },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
  },
  bottomItem: {
    alignItems: "center",
  },
  bottomText: {
    fontSize: 12,
    color: "#999",
  },
  activeText: {
    color: "#007AFF",
    fontWeight: "bold",
  },
});
