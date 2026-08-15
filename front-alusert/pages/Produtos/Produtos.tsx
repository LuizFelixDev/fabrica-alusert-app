import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFonts, Montserrat_700Bold, Montserrat_600SemiBold, Montserrat_400Regular } from "@expo-google-fonts/montserrat";
import { Poppins_400Regular, Poppins_600SemiBold, Poppins_700Bold } from "@expo-google-fonts/poppins";

import styles from "./ProdutosStyles";
import colors from "../../constants/colors";
import { ENDPOINTS } from "../../constants/api";

// Backend Product Interface
interface BackendProduct {
  id: number;
  codigo_barras: string | null;
  nome: string;
  descricao: string | null;
  categoria: string | null;
  tamanho_numero: number | null;
  unidade_medida: string | null;
  quantidade_estoque: number;
  estoque_minimo: number;
  peso_kg: number | null;
  preco_custo: number | string | null;
  preco_venda: number | string | null;
  status: boolean;
  data_cadastro?: string;
  data_atualizacao?: string;
}

interface ProdutosProps {
  onBack?: () => void;
  onNavigate?: (page: string) => void;
}

export default function Produtos({ onBack, onNavigate }: ProdutosProps) {
  // Load fonts
  const [fontsLoaded] = useFonts({
    Montserrat_400Regular,
    Montserrat_600SemiBold,
    Montserrat_700Bold,
    Poppins_400Regular,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  // State Management
  const [products, setProducts] = useState<BackendProduct[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<string>("TODOS");
  const [filters, setFilters] = useState<string[]>(["TODOS"]);

  // Modal State
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [formNome, setFormNome] = useState("");
  const [formCategoria, setFormCategoria] = useState("");
  const [formEstoque, setFormEstoque] = useState("");
  const [formUnidade, setFormUnidade] = useState("kg");
  const [formPrecoCusto, setFormPrecoCusto] = useState("");
  const [formPrecoVenda, setFormPrecoVenda] = useState("");
  const [formCodigoBarras, setFormCodigoBarras] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formTamanhoNumero, setFormTamanhoNumero] = useState("");
  const [formEstoqueMinimo, setFormEstoqueMinimo] = useState("");
  const [formPesoKg, setFormPesoKg] = useState("");
  const [formStatus, setFormStatus] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Fetch products from backend
  const fetchProducts = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 seconds timeout

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(ENDPOINTS.produtos, {
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Erro HTTP: ${response.status}`);
      }
      
      const data: BackendProduct[] = await response.json();
      setProducts(data);

      // Extract unique categories dynamically from database rows
      const extractedCategories = data
        .map(p => p.categoria?.trim() || "")
        .filter(Boolean)
        .map(cat => cat.toUpperCase());
      
      // Remove duplicates and combine with "TODOS"
      const uniqueCats = ["TODOS", ...Array.from(new Set(extractedCategories))];
      setFilters(uniqueCats);
      
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Erro ao buscar produtos do backend:", err);
      if (err.name === "AbortError") {
        setError("Tempo limite de conexão esgotado. Verifique se o backend está ativo no IP correto.");
      } else {
        setError("Não foi possível carregar os produtos do servidor. Verifique se o backend está ativo.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Form submission handler
  const handleCreateProduct = async () => {
    if (!formNome.trim()) {
      setFormError("O nome do produto é obrigatório.");
      return;
    }
    if (!formCategoria.trim()) {
      setFormError("A categoria é obrigatória.");
      return;
    }
    if (!formPrecoVenda.trim()) {
      setFormError("O preço de venda é obrigatório.");
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      const payload = {
        nome: formNome.trim(),
        categoria: formCategoria.trim(),
        quantidade_estoque: formEstoque ? parseFloat(formEstoque) : 0,
        unidade_medida: formUnidade.trim(),
        preco_custo: formPrecoCusto ? parseFloat(formPrecoCusto) : null,
        preco_venda: parseFloat(formPrecoVenda),
        codigo_barras: formCodigoBarras.trim() || null,
        descricao: formDescricao.trim() || null,
        tamanho_numero: formTamanhoNumero ? parseFloat(formTamanhoNumero) : null,
        estoque_minimo: formEstoqueMinimo ? parseInt(formEstoqueMinimo, 10) : 0,
        peso_kg: formPesoKg ? parseFloat(formPesoKg) : null,
        status: formStatus,
      };

      const response = await fetch(ENDPOINTS.produtos, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
      }

      // Reset form & reload
      setFormNome("");
      setFormCategoria("");
      setFormEstoque("");
      setFormUnidade("kg");
      setFormPrecoCusto("");
      setFormPrecoVenda("");
      setFormCodigoBarras("");
      setFormDescricao("");
      setFormTamanhoNumero("");
      setFormEstoqueMinimo("");
      setFormPesoKg("");
      setFormStatus(true);
      setModalVisible(false);
      
      // Reload products list
      fetchProducts();
    } catch (err: any) {
      console.error("Erro ao salvar produto:", err);
      setFormError(err.message || "Ocorreu um erro ao salvar o produto.");
    } finally {
      setSubmitting(false);
    }
  };

  // Helper function to format price values
  const formatPrice = (priceVal?: string | number | null) => {
    if (priceVal === undefined || priceVal === null) return "R$ 0.00";
    const num = Number(priceVal);
    return isNaN(num) ? "R$ 0.00" : `R$ ${num.toFixed(2)}`;
  };

  // Helper function to calculate profit margins dynamically
  const calculateMargin = (costVal?: string | number | null, sellVal?: string | number | null) => {
    const cost = costVal ? Number(costVal) : 0;
    const sell = sellVal ? Number(sellVal) : 0;
    if (!cost || !sell || isNaN(cost) || isNaN(sell) || sell === 0) return "N/A";
    const margin = ((sell - cost) / sell) * 100;
    return `${Math.round(margin)}%`;
  };

  // Color mapping for tags to match the premium theme dynamically
  const getTagStyle = (category?: string | null) => {
    const clean = (category || "").toUpperCase().trim();
    if (clean.includes("PERFIL")) return { bg: "#eff6ff", text: "#2563eb" };      // Indigo
    if (clean.includes("TUBO")) return { bg: "#ecfeff", text: "#0891b2" };        // Cyan
    if (clean.includes("CHAPA")) return { bg: "#f5f3ff", text: "#7c3aed" };       // Purple
    if (clean.includes("CANTONEIRA")) return { bg: "#f0fdf4", text: "#16a34a" };  // Green
    if (clean.includes("BARRA")) return { bg: "#fff7ed", text: "#ea580c" };       // Orange
    if (clean.includes("CUSCUZEIRA")) return { bg: "#fdf2f8", text: "#db2777" };  // Pink
    if (clean.includes("CAFETEIRA")) return { bg: "#f5f5f4", text: "#78716c" };   // Stone/Gray
    return { bg: "#f1f5f9", text: "#475569" }; // Slate default
  };

  // Filter products list based on category selection
  const filteredProducts = selectedFilter === "TODOS"
    ? products
    : products.filter(p => p.categoria?.toUpperCase().trim() === selectedFilter);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={onBack}
            activeOpacity={0.7}
          >
            <Feather name="chevron-left" size={24} color="#64748b" />
          </TouchableOpacity>
          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>PRODUTOS</Text>
            <Text style={styles.headerSubtitle}>
              {loading ? "Carregando..." : `${products.length} produtos`}
            </Text>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.newButton}
          activeOpacity={0.8}
          onPress={() => {
            setFormError(null);
            setModalVisible(true);
          }}
        >
          <Text style={styles.newButtonText}>+ NOVO</Text>
        </TouchableOpacity>
      </View>

      {/* Category filters bar (only show if loading completed successfully) */}
      {!loading && !error && (
        <View style={styles.filtersContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filtersScrollContent}
          >
            {filters.map((filter) => {
              const isActive = selectedFilter === filter;
              return (
                <TouchableOpacity
                  key={filter}
                  style={[
                    styles.filterChip,
                    isActive && styles.filterChipActive
                  ]}
                  onPress={() => setSelectedFilter(filter)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive
                    ]}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Loader, Error, or Product List Content */}
      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.counterText, { marginTop: 10 }]}>Carregando produtos...</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Feather name="wifi-off" size={48} color={colors.error.text} style={{ marginBottom: 12 }} />
          <Text style={styles.errorMsgText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchProducts}>
            <Text style={styles.retryButtonText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Item count */}
          <View style={styles.counterContainer}>
            <Text style={styles.counterText}>
              {filteredProducts.length} {filteredProducts.length === 1 ? "ITEM" : "ITENS"}
            </Text>
          </View>

          {/* Cards List */}
          {filteredProducts.length === 0 ? (
            <View style={styles.centerContainer}>
              <Feather name="package" size={40} color={colors.textSecondary} style={{ marginBottom: 8 }} />
              <Text style={styles.counterText}>Nenhum produto cadastrado nesta categoria.</Text>
            </View>
          ) : (
            <View style={styles.productsCard}>
              {filteredProducts.map((product, index) => {
                const isLast = index === filteredProducts.length - 1;
                const tagColors = getTagStyle(product.categoria);

                return (
                  <View
                    key={product.id}
                    style={[
                      styles.productItem,
                      !isLast && styles.productItemDivider
                    ]}
                  >
                    {/* Left detailed section */}
                    <View style={styles.productDetails}>
                      <Text style={styles.productName}>{product.nome}</Text>
                      
                      {/* Badge category tag */}
                      <View style={[styles.tag, { backgroundColor: tagColors.bg }]}>
                        <Text style={[styles.tagText, { color: tagColors.text }]}>
                          {product.categoria || "PRODUTO"}
                        </Text>
                      </View>

                      {/* Stock & calculated margin */}
                      <View style={styles.metaRow}>
                        <Text style={styles.metaText}>
                          Estoque:{" "}
                          <Text style={styles.metaValue}>
                            {product.quantidade_estoque} {product.unidade_medida || "kg"}
                          </Text>
                        </Text>
                        <Text style={styles.marginText}>
                          Margem:{" "}
                          <Text style={styles.marginValue}>
                            {calculateMargin(product.preco_custo, product.preco_venda)}
                          </Text>
                        </Text>
                      </View>
                    </View>

                    {/* Right pricing section */}
                    <View style={styles.priceContainer}>
                      <Text style={styles.priceValue}>
                        {formatPrice(product.preco_venda)}
                      </Text>
                      <Text style={styles.priceUnit}>
                        /{product.unidade_medida || "kg"}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>
      )}

      {/* Creation Modal Form */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Produto</Text>
            
            <ScrollView showsVerticalScrollIndicator={false} style={styles.formScroll}>
              <Text style={styles.inputLabel}>NOME DO PRODUTO *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Cuscuzeira 22 ou Tubo Redondo Ø70"
                placeholderTextColor={colors.textSecondary}
                value={formNome}
                onChangeText={setFormNome}
              />

              <Text style={styles.inputLabel}>CÓDIGO DE BARRAS</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: CUSC16-020826-001"
                placeholderTextColor={colors.textSecondary}
                value={formCodigoBarras}
                onChangeText={setFormCodigoBarras}
              />

              <Text style={styles.inputLabel}>DESCRIÇÃO</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: "top", paddingTop: 10 }]}
                placeholder="Descrição detalhada do produto..."
                placeholderTextColor={colors.textSecondary}
                multiline={true}
                numberOfLines={3}
                value={formDescricao}
                onChangeText={setFormDescricao}
              />

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>CATEGORIA *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: Cuscuzeira"
                    placeholderTextColor={colors.textSecondary}
                    value={formCategoria}
                    onChangeText={setFormCategoria}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>UNIDADE DE MEDIDA</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: kg, un, cm, L"
                    placeholderTextColor={colors.textSecondary}
                    value={formUnidade}
                    onChangeText={setFormUnidade}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>TAMANHO / NÚMERO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 16.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formTamanhoNumero}
                    onChangeText={setFormTamanhoNumero}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>PESO (KG)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 0.450"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formPesoKg}
                    onChangeText={setFormPesoKg}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>ESTOQUE INICIAL</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 100"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formEstoque}
                    onChangeText={setFormEstoque}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>ESTOQUE MÍNIMO</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 20"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formEstoqueMinimo}
                    onChangeText={setFormEstoqueMinimo}
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>PREÇO DE CUSTO (R$)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 15.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formPrecoCusto}
                    onChangeText={setFormPrecoCusto}
                  />
                </View>
                <View style={styles.halfInputContainer}>
                  <Text style={styles.inputLabel}>PREÇO DE VENDA (R$) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ex: 30.00"
                    placeholderTextColor={colors.textSecondary}
                    keyboardType="numeric"
                    value={formPrecoVenda}
                    onChangeText={setFormPrecoVenda}
                  />
                </View>
              </View>

              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16, paddingVertical: 4 }}>
                <Text style={{ fontSize: 13, fontFamily: "Poppins_600SemiBold", color: colors.textPrimary }}>PRODUTO ATIVO NO SISTEMA</Text>
                <Switch
                  value={formStatus}
                  onValueChange={setFormStatus}
                  trackColor={{ false: "#cbd5e1", true: colors.primary + "80" }}
                  thumbColor={formStatus ? colors.primary : "#94a3b8"}
                />
              </View>

              {formError && (
                <Text style={styles.formErrorText}>{formError}</Text>
              )}
            </ScrollView>

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
                disabled={submitting}
              >
                <Text style={styles.cancelButtonText}>CANCELAR</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.submitButton} 
                onPress={handleCreateProduct}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.submitButtonText}>CADASTRAR</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
