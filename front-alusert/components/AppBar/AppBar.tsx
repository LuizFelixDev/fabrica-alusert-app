import styles from "./AppBarStyles";
import { View, Text, Image, SafeAreaView } from "react-native";
import Logo from "../../assets/logo.png";
import colors from "../../constants/colors";

export default function AppBar() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerContent}>
          <Image source={Logo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.title}>
            Alu<Text style={styles.titleOrange}>sert</Text>
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
