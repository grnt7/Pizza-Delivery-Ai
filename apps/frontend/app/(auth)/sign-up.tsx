import { useSignUp } from "@clerk/expo";
import { Link, router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
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

export default function SignUpScreen() {
  const { signUp, fetchStatus } = useSignUp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!signUp || fetchStatus === "fetching") {
    return <LoadingScreen message="Connecting to Clerk…" />;
  }

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || !password || password.length < 8) {
      setError("Use a valid email and a password with at least 8 characters.");
      return;
    }
    setBusy(true);
    try {
      const createRes = await signUp.create({
        emailAddress: email.trim(),
        password,
      });
      const createErrMsg = formatClerkError(createRes.error);
      if (createErrMsg) {
        setError(createErrMsg);
        return;
      }

      if (signUp.status === "complete" && signUp.createdSessionId) {
        const fin = await signUp.finalize();
        const finErr = formatClerkError(fin.error);
        if (finErr) {
          setError(finErr);
          return;
        }
        router.replace("/(tabs)");
        return;
      }

      const send = await signUp.verifications.sendEmailCode();
      const sendErr = formatClerkError(send.error);
      if (sendErr) {
        setError(sendErr);
        return;
      }
      router.push("/(auth)/verify-email");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Sign-up failed.");
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
        <Text style={styles.title}>Create your account</Text>
        <Text style={styles.subtitle}>
          We&apos;ll email you a code if verification is enabled in Clerk.
        </Text>

        <TextInput
          style={styles.input}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          secureTextEntry
          autoCapitalize="none"
          placeholder="Password (8+ chars)"
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.cta, busy && styles.ctaDisabled]}
          disabled={busy}
          onPress={() => void handleSignUp()}
        >
          <Text style={styles.ctaLabel}>{busy ? "Please wait…" : "Continue"}</Text>
        </Pressable>

        <View style={styles.footer}>
          <Text style={styles.muted}>Already have an account? </Text>
          <Link href="/(auth)/sign-in">
            <Text style={styles.link}>Sign in</Text>
          </Link>
        </View>
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
    marginBottom: 4,
    color: "#171717",
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
    fontSize: 16,
  },
  error: { color: "#b91c1c", marginTop: -4 },
  cta: {
    marginTop: 8,
    backgroundColor: "#171717",
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  ctaDisabled: { opacity: 0.65 },
  ctaLabel: { color: "#fff", fontWeight: "700", fontSize: 16 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
    marginTop: 16,
    gap: 4,
  },
  muted: { color: "#737373", fontSize: 15 },
  link: {
    fontSize: 15,
    color: "#b91c1c",
    fontWeight: "700",
  },
});
