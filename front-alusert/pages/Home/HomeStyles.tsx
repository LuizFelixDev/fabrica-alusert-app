import { StyleSheet, Platform } from "react-native";
import colors from "../../constants/colors";

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#f4f6f9', // Light gray background matching mockup
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 90, // Leave enough space for bottom tab bar
  },

  // Title section
  headerTitleSection: {
    marginTop: 15,
    marginBottom: 20,
  },
  dateText: {
    fontSize: 12,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 24,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  highlightText: {
    color: colors.primary,
  },

  // Dashboard summary cards
  dashboardCardsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  dashboardCard: {
    width: "48.5%",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  cardLabel: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  cardValue: {
    fontSize: 22,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 8,
  },
  badgeSuccess: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success.bg,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeSuccessText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.success.text,
    marginLeft: 2,
  },
  badgeError: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.error.bg,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeErrorText: {
    fontSize: 10,
    fontWeight: "bold",
    color: colors.error.text,
    marginLeft: 2,
  },

  // Weekly Sales Chart
  chartCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  chartHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  chartSubtitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  chartContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 100,
    paddingTop: 10,
  },
  chartBarWrapper: {
    alignItems: "center",
    flex: 1,
  },
  chartBarBackground: {
    width: 32,
    height: 70,
    backgroundColor: "#f1f5f9",
    borderRadius: 6,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  chartBarValue: {
    width: "100%",
    backgroundColor: "#cbd5e1",
    borderRadius: 6,
  },
  chartBarActive: {
    backgroundColor: colors.primary,
  },
  chartBarLabel: {
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    marginTop: 6,
  },
  chartBarLabelActive: {
    color: colors.primary,
    fontWeight: "bold",
  },

  // Section Headers
  sectionHeaderContainer: {
    marginTop: 4,
    marginBottom: 12,
  },
  sectionHeaderContainerWithLink: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Poppins_600SemiBold",
    color: colors.textSecondary,
    letterSpacing: 0.5,
  },
  sectionHeaderLink: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.primary,
    letterSpacing: 0.5,
  },

  // Quick Access Scroll
  quickAccessScroll: {
    marginBottom: 16,
  },
  quickAccessContainer: {
    paddingRight: 16,
  },
  quickAccessItem: {
    width: 72,
    marginRight: 10,
    alignItems: "center",
  },
  quickAccessIconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  quickAccessText: {
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
    color: "#475569",
    textAlign: "center",
    lineHeight: 11,
  },

  // Recent Sales list card
  salesCard: {
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  saleItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
  },
  saleItemDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  saleInfo: {
    flex: 1,
  },
  saleCompany: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  saleDescription: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: colors.textSecondary,
  },
  saleStatusContainer: {
    alignItems: "flex-end",
  },
  salePrice: {
    fontSize: 14,
    fontFamily: "Montserrat_700Bold",
    fontWeight: "bold",
    color: colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusBadgePago: {
    backgroundColor: colors.success.bg,
  },
  statusBadgePendente: {
    backgroundColor: colors.warning.bg,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  statusBadgeTextPago: {
    color: colors.success.text,
  },
  statusBadgeTextPendente: {
    color: colors.warning.text,
  },

  // Low Stock Banner
  alertBanner: {
    flexDirection: "row",
    backgroundColor: colors.cardBackground,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fee2e2",
    marginBottom: 10,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#94a3b8",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  alertIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.error.bg,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alertTextContainer: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: colors.error.text,
    marginBottom: 2,
    letterSpacing: 0.5,
  },
  alertDescription: {
    fontSize: 10,
    fontFamily: "Poppins_400Regular",
    color: "#64748b",
    lineHeight: 14,
  },
  alertHighlight: {
    fontWeight: "bold",
    color: "#1e293b",
  },

  // Bottom Tab Bar
  tabBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 65,
    backgroundColor: colors.tabBar.bg,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#1e293b",
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
    backgroundColor: colors.tabBar.activeBg,
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
});

export default styles;