import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from "react-native";
import { Feather, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import { useFonts, Montserrat_700Bold, Montserrat_600SemiBold, Montserrat_400Regular } from "@expo-google-fonts/montserrat";
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";

import styles from "./HomeStyles";
import AppBar from "../../components/AppBar/AppBar";
import colors from "../../constants/colors";

interface HomeProps {
  onNavigate?: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [activeTab, setActiveTab] = useState("inicio");

  // Load fonts
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const getFormattedDate = () => {
    const days = [
      "Domingo",
      "Segunda-Feira",
      "Terça-Feira",
      "Quarta-Feira",
      "Quinta-Feira",
      "Sexta-Feira",
      "Sábado",
    ];
    const months = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ];
    const now = new Date();
    const dayName = days[now.getDay()];
    const dayNum = now.getDate();
    const monthName = months[now.getMonth()];
    return `${dayName}, ${dayNum} De ${monthName}`;
  };

  // Mock Data
  const chartData = [
    { day: "Seg", value: 30, active: false },
    { day: "Ter", value: 45, active: false },
    { day: "Qua", value: 35, active: false },
    { day: "Qui", value: 75, active: false },
    { day: "Sex", value: 40, active: false },
    { day: "Sáb", value: 70, active: false },
    { day: "Dom", value: 85, active: true },
  ];

  const quickAccessItems = [
    {
      id: "1",
      title: "MATÉRIA\nPRIMA",
      icon: "hexagon",
      colorKey: "materiaPrima",
      iconType: "Feather",
    },
    {
      id: "2",
      title: "PRODUTOS",
      icon: "file-text",
      colorKey: "produtos",
      iconType: "Feather",
    },
    {
      id: "3",
      title: "VENDAS",
      icon: "star",
      colorKey: "vendas",
      iconType: "Feather",
    },
    {
      id: "4",
      title: "CLIENTES",
      icon: "user",
      colorKey: "clientes",
      iconType: "Feather",
    },
    {
      id: "5",
      title: "RELATÓRIOS",
      icon: "file-text",
      colorKey: "relatorios",
      iconType: "Feather",
    },
  ];

  const lastSales = [
    {
      id: "#1048",
      company: "Construtora Alfa",
      description: "Perfil T-60 · 120 kg",
      price: "R$ 2.640",
      status: "PAGO",
    },
    {
      id: "#1047",
      company: "Indústria Beta",
      description: "Tubo Redondo · 85 kg",
      price: "R$ 1.870",
      status: "PENDENTE",
    },
    {
      id: "#1046",
      company: "Serralheria Gama",
      description: "Chapa 2mm · 200 kg",
      price: "R$ 4.400",
      status: "PAGO",
    },
  ];

  const renderIcon = (name: string, type: string, color: string, size = 20) => {
    switch (type) {
      case "MaterialCommunityIcons":
        return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
      case "FontAwesome5":
        return <FontAwesome5 name={name} size={size} color={color} />;
      default:
        return <Feather name={name as any} size={size} color={color} />;
    }
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <AppBar />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title Section */}
        <View style={styles.headerTitleSection}>
          <Text style={styles.dateText}>{getFormattedDate()}</Text>
          <Text style={styles.mainTitle}>
            PAINEL DE <Text style={styles.highlightText}>CONTROLE</Text>
          </Text>
        </View>

        {/* Dashboard Cards Container */}
        <View style={styles.dashboardCardsRow}>
          {/* Card 1: Vendas Hoje */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardLabel}>VENDAS HOJE</Text>
            <Text style={styles.cardValue}>R$ 14.280</Text>
            <View style={styles.badgeSuccess}>
              <Feather name="arrow-up" size={10} color={colors.success.text} />
              <Text style={styles.badgeSuccessText}>+8,3%</Text>
            </View>
          </View>

          {/* Card 2: Estoque */}
          <View style={styles.dashboardCard}>
            <Text style={styles.cardLabel}>ESTOQUE (KG)</Text>
            <Text style={styles.cardValue}>3.640</Text>
            <View style={styles.badgeError}>
              <Feather name="arrow-down" size={10} color={colors.error.text} />
              <Text style={styles.badgeErrorText}>-2,1%</Text>
            </View>
          </View>
        </View>

        {/* Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>VENDAS — 7 DIAS</Text>
            <Text style={styles.chartSubtitle}>R$/dia</Text>
          </View>

          <View style={styles.chartContainer}>
            {chartData.map((data, index) => {
              const maxBarHeight = 80;
              const barHeight = (data.value / 100) * maxBarHeight;

              return (
                <View key={index} style={styles.chartBarWrapper}>
                  <View style={styles.chartBarBackground}>
                    <View
                      style={[
                        styles.chartBarValue,
                        { height: barHeight },
                        data.active && styles.chartBarActive,
                      ]}
                    />
                  </View>
                  <Text
                    style={[
                      styles.chartBarLabel,
                      data.active && styles.chartBarLabelActive,
                    ]}
                  >
                    {data.day}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* Quick Access */}
        <View style={styles.sectionHeaderContainer}>
          <Text style={styles.sectionTitle}>ACESSO RÁPIDO</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.quickAccessScroll}
          contentContainerStyle={styles.quickAccessContainer}
        >
          {quickAccessItems.map((item) => {
            const colorsSet = (colors.quickAccess as any)[item.colorKey];
            return (
              <TouchableOpacity 
                key={item.id} 
                style={styles.quickAccessItem}
                onPress={() => {
                  if (item.title.includes("PRODUTOS") && onNavigate) {
                    onNavigate("Produtos");
                  }
                }}
              >
                <View
                  style={[
                    styles.quickAccessIconContainer,
                    { backgroundColor: colorsSet?.bg || "#f3f4f6" },
                  ]}
                >
                  {renderIcon(item.icon, item.iconType, colorsSet?.icon || "#000", 22)}
                </View>
                <Text style={styles.quickAccessText}>{item.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Last Sales */}
        <View style={styles.sectionHeaderContainerWithLink}>
          <Text style={styles.sectionTitle}>ÚLTIMAS VENDAS</Text>
          <TouchableOpacity>
            <Text style={styles.sectionHeaderLink}>VER TODAS →</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.salesCard}>
          {lastSales.map((sale, index) => {
            const isLast = index === lastSales.length - 1;
            const isPago = sale.status === "PAGO";

            return (
              <View
                key={sale.id}
                style={[
                  styles.saleItem,
                  !isLast && styles.saleItemDivider,
                ]}
              >
                <View style={styles.saleInfo}>
                  <Text style={styles.saleCompany}>{sale.company}</Text>
                  <Text style={styles.saleDescription}>
                    {sale.id} · {sale.description}
                  </Text>
                </View>
                <View style={styles.saleStatusContainer}>
                  <Text style={styles.salePrice}>{sale.price}</Text>
                  <View
                    style={[
                      styles.statusBadge,
                      isPago ? styles.statusBadgePago : styles.statusBadgePendente,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        isPago
                          ? styles.statusBadgeTextPago
                          : styles.statusBadgeTextPendente,
                      ]}
                    >
                      {sale.status}
                    </Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Low Stock Alert Banner */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconContainer}>
            <Feather name="alert-triangle" size={18} color={colors.error.text} />
          </View>
          <View style={styles.alertTextContainer}>
            <Text style={styles.alertTitle}>ESTOQUE BAIXO</Text>
            <Text style={styles.alertDescription}>
              Alumínio bruto — <Text style={styles.alertHighlight}>40 kg restantes</Text> (mín. 100 kg)
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("inicio")}
        >
          <View
            style={[
              styles.tabIconWrapper,
              activeTab === "inicio" && styles.tabIconWrapperActive,
            ]}
          >
            <Feather
              name="home"
              size={20}
              color={activeTab === "inicio" ? colors.tabBar.active : colors.tabBar.inactive}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "inicio" && styles.tabLabelActive,
            ]}
          >
            INÍCIO
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("vendas")}
        >
          <View
            style={[
              styles.tabIconWrapper,
              activeTab === "vendas" && styles.tabIconWrapperActive,
            ]}
          >
            <Feather
              name="bar-chart-2"
              size={20}
              color={activeTab === "vendas" ? colors.tabBar.active : colors.tabBar.inactive}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "vendas" && styles.tabLabelActive,
            ]}
          >
            VENDAS
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("clientes")}
        >
          <View
            style={[
              styles.tabIconWrapper,
              activeTab === "clientes" && styles.tabIconWrapperActive,
            ]}
          >
            <Feather
              name="user-plus"
              size={20}
              color={activeTab === "clientes" ? colors.tabBar.active : colors.tabBar.inactive}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "clientes" && styles.tabLabelActive,
            ]}
          >
            CLIENTES
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.tabItem}
          onPress={() => setActiveTab("relatorios")}
        >
          <View
            style={[
              styles.tabIconWrapper,
              activeTab === "relatorios" && styles.tabIconWrapperActive,
            ]}
          >
            <Feather
              name="file-text"
              size={20}
              color={activeTab === "relatorios" ? colors.tabBar.active : colors.tabBar.inactive}
            />
          </View>
          <Text
            style={[
              styles.tabLabel,
              activeTab === "relatorios" && styles.tabLabelActive,
            ]}
          >
            RELATÓRIOS
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
