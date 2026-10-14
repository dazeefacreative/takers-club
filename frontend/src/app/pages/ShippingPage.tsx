import { StaticInfoPage } from "@/app/components/layout/StaticInfoPage";

export default function ShippingPage() {
  return (
    <StaticInfoPage
      title="Shipping"
      intro="How and when your order reaches you."
      description="Shipping rates, delivery times, and coverage for Takers Club orders across Nigeria."
      sections={[
        {
          heading: "Delivery Areas",
          body: <p>We currently ship to addresses across Nigeria. International shipping isn't available yet, but we're working on it.</p>,
        },
        {
          heading: "Delivery Times",
          body: (
            <>
              <p>Lagos: 1–3 business days after your order is confirmed.</p>
              <p>Other states: 3–7 business days, depending on location.</p>
              <p>Orders are processed within 24 hours on business days. You'll receive an email once your order ships.</p>
            </>
          ),
        },
        {
          heading: "Shipping Fees",
          body: (
            <>
              <p>A flat shipping fee of ₦2,500 applies to all orders.</p>
              <p>Orders over ₦250,000 ship free, automatically applied at checkout.</p>
            </>
          ),
        },
        {
          heading: "Order Tracking",
          body: <p>Once your order ships, we'll email tracking details to the address you used at checkout.</p>,
        },
      ]}
    />
  );
}
