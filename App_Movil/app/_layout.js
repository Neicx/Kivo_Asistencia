import { Slot } from "expo-router";
import { View,Text,StyleSheet } from "react-native";

export default function layout() {
    return (
        <View style={styles.container}>
            <Slot />
        </View>
    )}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },});