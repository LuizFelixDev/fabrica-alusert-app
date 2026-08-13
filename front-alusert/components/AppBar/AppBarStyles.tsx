import { StyleSheet, Platform, StatusBar } from "react-native";
import colors from "../../constants/colors";

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.cardBackground,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  container: {
    backgroundColor: colors.cardBackground,
    height: 30,
    width: '100%',
    flexDirection: "row",
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    marginTop: -30,
    height: 300,
    width: 300,
    marginLeft: -360
  },
  title: {
    marginTop: -30,
    fontSize: 22,
    fontFamily: 'Montserrat_700Bold',
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginLeft: -110
  },
  titleOrange: {
    color: colors.primary,
  }
});

export default styles;