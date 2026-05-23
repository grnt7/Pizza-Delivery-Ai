import { useSignUp } from "@clerk/expo";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import LoadingScreen from "@/components/loading-screen";

function formatClerkError(err: unknown): string | null {
  if (err == null) return null;
  if (typeof err === "object" && "message" in err) {
    const m = (err as { message?: unknown }).message;
    if (typeof m === "string") return m;
  }
  return String(err);
}

export default function VerifyEmailScreen() {
  const { signUp, fetchStatus } = useSignUp();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!signUp || fetchStatus === "fetching") {
    return (
      <LoadingScreen message="Preparing verification… Go back if you skipped sign-up." />
    );
  }

  async function verify() {
    setError(null);
    if (!code.trim()) {
      setError("Enter the code from your email.");
      return;
    }
    setBusy(true);
    try {
      const v = await signUp.verifications.verifyEmailCode({
        code: code.trim(),
      });
      const vErr = formatClerkError(v.error);
      if (vErr) {
        setError(vErr);
        return;
      }

      if (signUp.status !== "complete" || !signUp.createdSessionId) {
        setError(
          `Verification incomplete (status: ${signUp.status}). Try again.`,
        );
        return;
      }

      const fin = await signUp.finalize();
      const finErr = formatClerkError(fin.error);
      if (finErr) {
        setError(finErr);
        return;
      }

      router.replace("/(tabs)");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.keyboard}
      >
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          Enter the code Clerk sent you (check spam).
        </Text>

        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          autoCapitalize="none"
          placeholder="123456"
          value={code}
          onChangeText={setCode}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.cta, busy && styles.ctaDisabled]}
          disabled={busy}
          onPress={() => void verify()}
        >
          <Text style={styles.ctaLabel}>{busy ? "Verifying…" : "Finish sign-up"}</Text>
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fff" },
  keyboard: { flex: 1, padding: 24, justifyContent: "center", gap: 12 },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#171717",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    marginBottom: 16,
    textAlign: "center",
    color: "#737373",
  },
  input: {
    borderWidth: 1,
    borderColor: "#e5e5e5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 2,
    textAlign: "center",
  },
  error: { color: "#b91c1c" },
  cta: {
    marginTop: 8,
    backgroundColor: "#b91c1c",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.65 },
  ctaLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
