import { PricingTable } from "@clerk/react";
import { Variable } from "lucide-react";
import { element } from "prop-types";

export default function Pricing() {
	return (
		<main className="relative overflow-hidden px-6 py-16 md:px-12 lg:px-20">
			<div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,rgba(79,70,229,0.16),transparent_55%)]" />

			<section className="mx-auto max-w-3xl text-center">
				<p className="text-sm font-semibold tracking-wider text-indigo-300">PRICING</p>
				<h1 className="mt-3 text-4xl font-semibold text-white md:text-5xl">Pricing Plans</h1>
				<p className="mx-auto mt-4 max-w-2xl text-slate-400">
					Our Pricing Plans are simple, transparent and flexible. Choose the plan that best suits your needs.
				</p>
			</section>

			<section className="mx-auto mt-12 max-w-6xl">
<PricingTable
  appearance={{
    variables: {
      colorBackground: "transparent",
      colorPrimary: "#7c3aed",
      colorText: "#ffffff",
      colorTextSecondary: "#ffffff",
      colorNeutral: "#ffffff",
      colorForeground: "#ffffff",
      borderRadius: "16px",
      fontFamily: "Poppins, sans-serif",
    },
    elements: {
      pricingTable: "text-white",

      pricingTableTitle: "text-white",
      pricingTableSubtitle: "text-white",

      pricingTableCard:
        "bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white",

      pricingTableCardHeader:
        "bg-white/5 border-b border-white/10 text-white",

      pricingTableCardBody: "text-white",

      pricingTableCardPlan: "text-white font-semibold",

      pricingTableCardPrice: "text-white text-4xl font-bold",

      pricingTableCardPriceText: "text-white",

      pricingTableCardFeatureList: "text-white",

      pricingTableCardFeatureListItem: "text-white",

      pricingTableCardFeatureName: "text-white",

      pricingTableCardDescription: "text-white",

      pricingTableCardCta:
        "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-full",

      switchThumb: "bg-white",
    },
  }}
/>
			</section>

			<section className="mx-auto mt-8 max-w-6xl rounded-2xl border border-white/10 bg-white/[0.02] px-6 py-4 text-center">
				<p className="text-slate-300">
					Credit usage guide: <span className="font-medium text-white">Image generation uses 5 credits</span> and <span className="font-medium text-white">video generation uses 10 credits</span> per output.
				</p>
			</section>
		</main>
	);
}
