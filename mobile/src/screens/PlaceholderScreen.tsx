import { StyleSheet, Text, View } from "react-native";

type Props = {
  title: string;
  note?: string;
};

// Stand-in for screens until the design handoff lands. Swap each usage
// out for the real screen component as designs come in — see
// navigation/AppNavigator.tsx for the full screen list (PRD §4.4).
export default function PlaceholderScreen({ title, note }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "600",
  },
  note: {
    marginTop: 8,
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
