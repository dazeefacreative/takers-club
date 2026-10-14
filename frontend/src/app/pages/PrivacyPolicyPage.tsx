import { StaticInfoPage } from "@/app/components/layout/StaticInfoPage";

export default function PrivacyPolicyPage() {
  return (
    <StaticInfoPage
      title="Privacy Policy"
      description="How Takers Club collects, uses, and protects your personal information."
      sections={[
        {
          heading: "Information We Collect",
          body: (
            <>
              <p>When you place an order or contact us, we collect information like your name, email, phone number, and shipping address.</p>
              <p>We don't store your card details. Payments are processed securely by Paystack, and we never see or save your card number.</p>
            </>
          ),
        },
        {
          heading: "How We Use Your Information",
          body: (
            <>
              <p>To process and deliver your orders, communicate with you about your orders, and improve our products and service.</p>
            </>
          ),
        },
        {
          heading: "Sharing Your Information",
          body: <p>We don't sell your personal information. We only share what's necessary with service providers who help us operate: payment processing (Paystack) and order fulfillment.</p>,
        },
        {
          heading: "Your Rights",
          body: <p>We don't require an account to shop. To update or delete the details attached to your orders, contact us and we'll take care of it.</p>,
        },
        {
          heading: "Contact",
          body: <p>Questions about this policy? Reach us at <a href="mailto:hello@takersclub.store" className="underline underline-offset-2">hello@takersclub.store</a>.</p>,
        },
      ]}
    />
  );
}
