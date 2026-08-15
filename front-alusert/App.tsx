import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Home from "./pages/Home/Home";
import Produtos from "./pages/Produtos/Produtos";

export default function App() {
  const [currentPage, setCurrentPage] = useState<string>("Home");

  return (
    <View style={styles.container}>
      {currentPage === "Home" ? (
        <Home onNavigate={(page) => setCurrentPage(page)} />
      ) : (
        <Produtos onBack={() => setCurrentPage("Home")} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4f6f9',
  },
});

