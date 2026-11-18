import SSLCommerzPayment from "sslcommerz-lts";
import crypto from "node:crypto";

// Exported as a plain object (not individual named exports) so tests can
// `t.mock.method(sslcommerzService, "initSslcommerzSession", ...)` — an ES
// module namespace object's bindings aren't configurable, so mock.method
// can't patch those directly; a plain object's properties can be.
export const sslcommerzService = {
  async initSslcommerzSession({ order, customer }) {
    const tranId = `tt-${order.id}-${crypto.randomBytes(4).toString("hex")}`;
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.SSLCOMMERZ_IS_LIVE === "true"
    );
    const baseUrl = process.env.API_BASE_URL || "http://localhost:3001";
    const callbackUrl = `${baseUrl}/payments/sslcommerz/callback`;

    const data = {
      total_amount: order.advance_required,
      currency: "BDT",
      tran_id: tranId,
      success_url: callbackUrl,
      fail_url: callbackUrl,
      cancel_url: callbackUrl,
      ipn_url: callbackUrl,
      shipping_method: "NO",
      product_name: `Order #${order.id} advance payment`,
      product_category: "Tailoring",
      product_profile: "general",
      cus_name: customer?.name ?? "Customer",
      cus_email: customer?.email ?? "customer@example.com",
      cus_add1: "Dhaka",
      cus_city: "Dhaka",
      cus_postcode: "1000",
      cus_country: "Bangladesh",
      cus_phone: customer?.phone_number ?? "00000000000",
    };

    const apiResponse = await sslcz.init(data);
    return { gatewayUrl: apiResponse.GatewayPageURL, tranId };
  },

  async validateSslcommerzTransaction({ valId }) {
    const sslcz = new SSLCommerzPayment(
      process.env.SSLCOMMERZ_STORE_ID,
      process.env.SSLCOMMERZ_STORE_PASSWORD,
      process.env.SSLCOMMERZ_IS_LIVE === "true"
    );
    const result = await sslcz.validate({ val_id: valId });
    return {
      valid: result.status === "VALID" || result.status === "VALIDATED",
      amount: Number(result.amount),
    };
  },
};
