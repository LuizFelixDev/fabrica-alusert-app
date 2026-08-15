import { StyleSheet, Platform } from "react-native";
import colors from "../../constants/colors";

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f4f6f9', // Light gray background matching Home
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 90, // Leave enough space for tab bar or bottom navigation
  },

  // Custom Header
  headerContainer: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "ios" ? 10 : 15,
    paddingBottom: 15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  titleContainer: {
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 2,
  },
  newButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    elevation: 1,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  newButtonText: {
    color: "#ffffff",
    fontSize: 11,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Categories Horizontal Filter
  filtersContainer: {
    paddingVertical: 14,
  },
  filtersScrollContent: {
    paddingHorizontal: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 10,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  filterChipTextActive: {
    color: "#ffffff",
  },

  // Counter Text
  counterContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  counterText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },

  // Products Card Wrapper
  productsCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    marginHorizontal: 16,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    overflow: "hidden",
  },

  // Product List Item
  productItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  productItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  productDetails: {
    flex: 1,
    paddingRight: 10,
  },
  productName: {
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
  },

  // Category Tag
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  tagText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  // Stock and Margin row
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  metaText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginRight: 12,
  },
  metaValue: {
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  marginText: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
  },
  marginValue: {
    fontWeight: "bold",
    color: colors.success.text,
  },

  // Price layout on the right
  priceContainer: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  priceValue: {
    fontSize: 16,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
  },
  priceUnit: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Bottom Tab Bar (replicated from Home for consistency)
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: colors.cardBackground,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#b6babfff",
    paddingBottom: Platform.OS === "ios" ? 15 : 5,
  },
  tabItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingTop: 5,
  },
  tabIconWrapper: {
    width: 44,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 3,
  },
  tabIconWrapperActive: {
    backgroundColor: "#ffffff",
  },
  tabLabel: {
    fontSize: 8,
    fontFamily: "Poppins_600SemiBold",
    color: colors.tabBar.inactive,
    letterSpacing: 0.5,
  },
  tabLabelActive: {
    color: colors.tabBar.active,
  },

  // Loader and center messages
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    marginTop: 50,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  retryButton: {
    marginTop: 15,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#ffffff",
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
  },
  errorMsgText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: colors.error.text,
    textAlign: "center",
  },

  // Modal Creation Form
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(10, 10, 10, 0.4)", // Dim background matching modern style
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "Montserrat_700Bold",
    color: colors.textPrimary,
    marginBottom: 10,
  },
  formScroll: {
    maxHeight: 400, // Make sure it's scrollable if keyboard appears
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    marginTop: 12,
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    height: 46,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: colors.textPrimary,
    backgroundColor: "#f8fafc",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfInputContainer: {
    width: "48%",
  },
  formErrorText: {
    color: colors.error.text,
    fontSize: 11,
    fontFamily: "Poppins_400Regular",
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
  },
  submitButtonText: {
    color: "#ffffff",
    fontFamily: "Montserrat_700Bold",
    fontSize: 12,
  },
});

export default styles;
