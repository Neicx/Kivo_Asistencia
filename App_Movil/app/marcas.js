// marcas.js
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 👇 Ajusta esta URL según tu backend (sin /marcar/)
const API_URL = "http://192.168.56.1:8000/api/asistencias/marcar/";

export default function Marcas() {
  const [timeSeconds, setTimeSeconds] = useState(0);
  const [selectedTab, setSelectedTab] = useState("asistencia");
  const [tieneEntradaActiva, setTieneEntradaActiva] = useState(false);
  const [nombre, setNombre] = useState("Usuario");
  const [empresa, setEmpresa] = useState("TU EMPRESA");
  const [turnoTexto, setTurnoTexto] = useState("");
  const [fechaTexto, setFechaTexto] = useState("");
  const intervalRef = useRef(null);

  const formatTime = (totalSegundos) => {
    const horas = Math.floor(totalSegundos / 3600);
    const minutos = Math.floor((totalSegundos % 3600) / 60);
    const segundos = totalSegundos % 60;
    const pad = (n) => n.toString().padStart(2, "0");
    return `${pad(horas)}:${pad(minutos)}:${pad(segundos)}`;
  };

  // Inicialización: fecha + estado desde backend
  useEffect(() => {
    const init = async () => {
      // Fecha en español
      const hoy = new Date();
      const opciones = {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
      };
      const fechaLocal = hoy.toLocaleDateString("es-CL", opciones);
      setFechaTexto(
        fechaLocal.charAt(0).toUpperCase() + fechaLocal.slice(1)
      );

      // Traer estado inicial desde el backend
      await fetchEstado();
    };

    init();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Countdown basado en timeSeconds que viene del servidor
  useEffect(() => {
    // Limpia cualquier intervalo previo
    if (intervalRef.current) clearInterval(intervalRef.current);

    // Solo corre si hay entrada activa y todavía queda tiempo
    if (tieneEntradaActiva && timeSeconds > 0) {
      intervalRef.current = setInterval(() => {
        setTimeSeconds((prev) => {
          if (prev <= 1) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Limpieza cuando cambian las deps o se desmonta
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tieneEntradaActiva, timeSeconds]);

  const fetchEstado = async () => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("No hay token, no se puede llamar al backend.");
        return;
      }

      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();
      console.log("GET estado:", data);

      if (!res.ok) {
        console.log("Error al obtener estado:", data);
        return;
      }

      // Estado de entrada activa
      setTieneEntradaActiva(data.tiene_entrada_activa);
      // Segundos restantes calculados en el servidor
      setTimeSeconds(data.segundos_restantes || 0);

      // Nombre del trabajador desde el backend
      if (data.trabajador) {
        const nom = data.trabajador.nombre || "";
        const ape = data.trabajador.apellidos || "";
        const nombreCompleto = `${nom} ${ape}`.trim();
        setNombre(nombreCompleto || "Usuario");
      }
      if (data.empresa) {
        const emp = data.empresa.nombre || "TU EMPRESA";
        setEmpresa(emp);
      }
      // Turno
      if (data.turno && data.turno.hora_entrada && data.turno.hora_salida) {
        setTurnoTexto(
          `${data.turno.hora_entrada} - ${data.turno.hora_salida}`
        );
      } else {
        setTurnoTexto("");
      }
    } catch (e) {
      console.log("Error en fetchEstado:", e);
    }
  };

  const marcar = async (tipo_marca) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        Alert.alert("Atención", "No hay token, vuelve a iniciar sesión.");
        return;
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tipo_marca }),
      });

      const data = await res.json();
      console.log("POST marcar:", data);

      if (!res.ok) {
        Alert.alert("Atención", data.detail || "Error al registrar marca");
        return;
      }

      // Refrescamos el estado desde el servidor (tiene_entrada_activa y segundos_restantes)
      await fetchEstado();

      Alert.alert("OK", `Marca de ${tipo_marca} registrada`);
    } catch (e) {
      console.log("Error en marcar:", e);
      Alert.alert("Error", "No se pudo registrar la marca.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.companyText}>{empresa}</Text>
        <Text style={styles.greeting}>Hola, {nombre}</Text>

        <Text style={styles.timerLabel}>Tiempo restante de jornada</Text>
        <Text style={styles.timer}>{formatTime(timeSeconds)}</Text>

        <Text style={styles.date}>{fechaTexto}</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons name="calendar-outline" size={20} color="#007AFF" />
            <Text style={styles.shiftText}> Turno</Text>
          </View>
          <Text style={styles.shiftDetail}>
            {turnoTexto || "Sin turno asignado"}
          </Text>
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.entryButton,
            tieneEntradaActiva && { opacity: 0.5 },
          ]}
          disabled={tieneEntradaActiva}
          onPress={() => marcar("entrada")}
        >
          <Text style={styles.entryText}>ENTRADA</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.exitButton,
            !tieneEntradaActiva && { opacity: 0.5 },
          ]}
          disabled={!tieneEntradaActiva}
          onPress={() => marcar("salida")}
        >
          <Text style={styles.exitText}>SALIDA</Text>
        </TouchableOpacity>
      </View>

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
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flex: 1,
    backgroundColor: "#1E88E5",
    alignItems: "center",
    paddingTop: 40,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  companyText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  greeting: { color: "#fff", fontSize: 18, marginTop: 10 },
  timerLabel: { color: "#fff", marginTop: 10, fontSize: 14 },
  timer: { color: "#fff", fontSize: 48, fontWeight: "bold", marginTop: 5 },
  date: { color: "#fff", marginTop: 10 },
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
  row: { flexDirection: "row", alignItems: "center" },
  shiftText: { fontWeight: "600", color: "#007AFF" },
  shiftDetail: { color: "#555", marginTop: 5 },
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
  entryText: { color: "#fff", fontWeight: "bold" },
  exitButton: {
    borderColor: "#DAA520",
    borderWidth: 1,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
  },
  exitText: { color: "#DAA520", fontWeight: "bold" },
  bottomBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    borderTopWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 10,
  },
  bottomItem: { alignItems: "center" },
  bottomText: { fontSize: 12, color: "#999" },
  activeText: { color: "#007AFF", fontWeight: "bold" },
});
