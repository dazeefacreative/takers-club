import { StaticInfoPage } from "@/app/components/layout/StaticInfoPage";

export default function TermsPage() {
  return (
    <StaticInfoPage
      title="Terms of Service"
      description="The terms that govern your use of the Takers Club website and your orders."
      sections={[
        {
          heading: "Orders & Payment",
          body: (
            <>
              <p>By placing an order, you confirm the details provided are accurate. Payments are processed securely through Paystack at checkout.</p>
              <p>We reserve the right to cancel or refuse any order, including in cases of suspected fraud or pricing errors.</p>
            </>
          ),
        },
        {
          heading: "Pricing & Availability",
          body: <p>Prices are listed in Nigerian Naira (₦) and may change without notice. Product availability isn't guaranteed until your order is confirmed.</p>,
        },
        {
          heading: "Order Details",
          body: <p>You're responsible for providing an accurate email, phone number and delivery address at checkout. We can't be held responsible for delays caused by incorrect details.</p>,
        },
        {
          heading: "Intellectual Property",
          body: <p>All content on this site, including product photography, copy, and the Takers Club name and logo, belongs to Takers Club and may not be used without permission.</p>,
        },
        {
          heading: "Limitation of Liability",
          body: <p>Takers Club isn't liable for indirect or incidental damages arising from use of this site or its products, to the extent permitted by law.</p>,
        },
        {
          heading: "Governing Law",
          body: <p>These terms are governed by the laws of the Federal Republic of Nigeria.</p>,
        },
      ]}
    />
  );
}
