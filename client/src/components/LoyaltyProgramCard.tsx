import { Crown, Gift, Star, Zap, ArrowRight } from "lucide-react";

export default function LoyaltyProgramCard() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-pink-600 rounded-3xl p-8 md:p-12 shadow-2xl overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-pink-500/20 rounded-full translate-y-32 -translate-x-32 blur-3xl"></div>
          
          <div className="relative z-10 grid md:grid-cols-2 gap-8 items-center">
            {/* Left side - Content */}
            <div className="text-white">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
                <Crown className="w-5 h-5 text-yellow-300" />
                <span className="font-semibold">Premium Membership</span>
              </div>

              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Join Loyalty Program
              </h2>
              
              <p className="text-purple-100 text-lg mb-6">
                Earn points with every booking and unlock exclusive discounts, special perks, and priority booking!
              </p>

              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                    <Gift className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="text-purple-100">Unlock exclusive deals & offers</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                    <Star className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="text-purple-100">Earn points on every service</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
                    <Zap className="w-5 h-5 text-yellow-300" />
                  </div>
                  <span className="text-purple-100">Get priority bookings</span>
                </div>
              </div>

              <button className="group bg-white text-purple-600 px-8 py-4 rounded-xl font-bold text-lg hover:bg-purple-50 transition-all transform hover:scale-105 shadow-xl flex items-center gap-2">
                Learn More
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            {/* Right side - Visual benefits */}
            <div className="hidden md:block">
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-lg">Your Rewards</span>
                    <Crown className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="text-4xl font-bold text-white mb-1">2,450</div>
                  <div className="text-purple-200 text-sm">Points Earned</div>
                </div>

                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 transform hover:scale-105 transition-transform">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-semibold text-lg">Next Reward</span>
                    <Gift className="w-6 h-6 text-yellow-300" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">₹500 OFF</div>
                  <div className="text-purple-200 text-sm">550 points away</div>
                  <div className="mt-3 bg-white/20 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-yellow-300 to-yellow-500 h-full rounded-full" style={{ width: '75%' }}></div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-yellow-400/20 to-yellow-600/20 backdrop-blur-md rounded-2xl p-4 border border-yellow-400/30">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center">
                      <Zap className="w-6 h-6 text-purple-900" />
                    </div>
                    <div>
                      <div className="text-white font-bold">Gold Member</div>
                      <div className="text-yellow-100 text-sm">5% cashback on all services</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
