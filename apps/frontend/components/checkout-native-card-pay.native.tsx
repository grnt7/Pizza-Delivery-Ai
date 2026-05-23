import * as React from "react";

import * as Haptics from "expo-haptics";
import { useStripe } from "@stripe/stripe-react-native";
import { useAction } from "convex/react";
import {
  Alert,
  Pressable,
  StyleSheet,
  Text,
} from "react-native";

import type { CheckoutConvexCartPayload } from "@/components/checkout-cart-types";
import { api } from "@/lib/convex-api";
import { palette, radii } from "@/theme";

type Props = {
  cart: CheckoutConvexCartPayload;
  disabled: boolean;
  onPaid?: (payload: { orderId: string; totalCents: number }) => void;
};

export function CheckoutNativeCardPay({ cart, disabled, onPaid }: Props) {
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const createPaymentIntent = useAction(
    api.stripeCheckout.createPaymentIntentForCheckout,
  );
  const finalizePaidOrder = useAction(api.stripeCheckout.finalizeNativePaidOrder);
  const [busy, setBusy] = React.useState(false);

  const canTap = !disabled && !busy;

  async function onPay() {
    setBusy(true);
    try {
      const { clientSecret, paymentIntentId } = await createPaymentIntent(cart);

      await initPaymentSheet({
        merchantDisplayName: "Pinnochio's Pizza",
        paymentIntentClientSecret: clientSecret,
      });

      const { error } = await presentPaymentSheet();
      if (error) {
        if (error.code !== "Canceled") {
          Alert.alert("Payment canceled", error.message);
        }
        return;
      }

      const result = await finalizePaidOrder({
        paymentIntentId,
        cart,
      });

      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onPaid?.(result);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Payment failed";
      Alert.alert("Payment failed", msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !canTap }}
      disabled={!canTap}
      style={[styles.primary, !canTap && styles.primaryDisabled]}
      onPress={() => void onPay()}
    >
      <Text style={styles.primaryText}>
        {busy ? "Processing…" : "Pay now"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  primary: {
    marginTop: 12,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: palette.primary,
    paddingVertical: 16,
    borderRadius: radii.md,
  },
  primaryDisabled: { opacity: 0.65 },
  primaryText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 17,
  },
});
