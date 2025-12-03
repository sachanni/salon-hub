import { Tag, ArrowRight } from "lucide-react";
import { Link } from "wouter";

export default function SpecialOffersBanner() {
  const offers = [
    {
      title: "First Booking Discount",
      discount: "20% OFF",
      description: "Get 20% off on your first salon booking",
      color: "from-violet-500 to-purple-600",
    },
    {
      title: "Bridal Package Deal",
      discount: "SAVE ₹5000",
      description: "Complete bridal package at special prices",
      color: "from-pink-500 to-rose-600",
    },
    {
      title: "Refer & Earn",
      discount: "₹500 Each",
      description: "Get ₹500 when you refer a friend",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Tag className="h-5 w-5 text-white" />
            <span className="text-white font-semibold">Limited Time Offers</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
            Special Deals Just for You
          </h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto">
            Save big on your favorite beauty and wellness services
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {offers.map((offer, index) => (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-shadow">
              <div className={`inline-block bg-gradient-to-br ${offer.color} text-white px-4 py-2 rounded-lg text-xl font-bold mb-3`}>
                {offer.discount}
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {offer.title}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {offer.description}
              </p>
              <Link href="/offers">
                <button className="text-purple-600 font-semibold flex items-center gap-1 hover:gap-2 transition-all">
                  View Details <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          ))}
        </div>

        <div className="text-center">
          <Link href="/offers">
            <button className="bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors shadow-lg">
              View All Offers
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
