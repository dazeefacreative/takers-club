import { StaticInfoPage } from "@/app/components/layout/StaticInfoPage";

export default function ReturnsPage() {
  return (
    <StaticInfoPage
      title="Returns"
      intro="Not the right fit? We'll make it easy."
      description="Takers Club's 30-day return policy: eligibility, process, and refunds."
      sections={[
        {
          heading: "Return Window",
          body: <p>You have 30 days from the delivery date to return an item for a refund or exchange.</p>,
        },
        {
          heading: "Eligibility",
          body: (
            <>
              <p>Items must be unworn, unwashed, and in their original condition with tags attached.</p>
              <p>Items marked "Sale" are final sale and not eligible for return unless faulty.</p>
            </>
          ),
        },
        {
          heading: "How to Start a Return",
          body: (
            <>
              <p>Contact us with your order number and the item(s) you'd like to return, and we'll send you instructions.</p>
              <p>Once we receive and inspect your return, refunds are processed to your original payment method within 5–7 business days.</p>
            </>
          ),
        },
        {
          heading: "Faulty or Incorrect Items",
          body: <p>If your order arrives damaged or incorrect, contact us within 7 days of delivery and we'll cover the cost of return shipping.</p>,
        },
      ]}
    />
  );
}
