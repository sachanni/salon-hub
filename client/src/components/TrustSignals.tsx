import { Shield, BadgeCheck, CreditCard, Clock, Tag, TrendingUp, Users, MapPin, Star } from "lucide-react";

export default function TrustSignals() {
  const signals = [
    {
      icon: BadgeCheck,
      title: "Verified Professionals",
      description: "All professionals are background-checked and certified",
    },
    {
      icon: Shield,
      title: "Secure Payments",
      description: "Safe and encrypted payment processing via Razorpay",
    },
    {
      icon: Clock,
      title: "Instant Booking",
      description: "Book 24/7 with instant confirmation - no waiting",
    },
    {
      icon: Tag,
      title: "Best Price Guarantee",
      description: "Competitive pricing with exclusive deals and offers",
    },
    {
      icon: CreditCard,
      title: "Free Cancellation",
      description: "Cancel or reschedule anytime with full refund",
    },
    {
      icon: TrendingUp,
      title: "Loyalty Rewards",
      description: "Earn points on every booking and unlock exclusive perks",
    },
  ];

  const stats = [
    {
      icon: Users,
      value: "250K+",
      label: "Verified Professionals"
    },
    {
      icon: MapPin,
      value: "120+",
      label: "Cities Covered"
    },
    {
      icon: Star,
      value: "5M+",
      label: "Happy Bookings"
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            Why Choose SalonHub?
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trusted by thousands of customers for safe, reliable, and convenient beauty bookings
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mb-16">
          {signals.map((signal, index) => (
            <div key={index} className="flex items-start gap-4 p-6 rounded-xl bg-gradient-to-br from-gray-50 to-white border border-gray-100 hover:shadow-lg transition-all hover:border-purple-200 group">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                  <signal.icon className="h-6 w-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {signal.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {signal.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-gradient-to-r from-violet-50 via-white to-rose-50 rounded-3xl p-8 md:p-12 border border-violet-100/50 shadow-lg">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8 bg-gradient-to-r from-violet-700 via-fuchsia-600 to-rose-600 bg-clip-text text-transparent">
            Trusted by Millions Across India
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-fuchsia-500 backdrop-blur-sm rounded-full mb-4 shadow-lg shadow-violet-200/50">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl md:text-5xl font-bold mb-2 bg-gradient-to-r from-violet-700 to-fuchsia-600 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-gray-600 text-lg font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
