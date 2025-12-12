import { Sparkles, MapPin, Shield, Gift } from "lucide-react";
import { motion } from "framer-motion";

export default function USPStrip() {
  const usps = [
    {
      icon: Sparkles,
      text: "AI-Powered Look Advisor",
      gradient: "from-violet-600 to-purple-600"
    },
    {
      icon: MapPin,
      text: "Map + Grid Unified Search",
      gradient: "from-fuchsia-600 to-pink-600"
    },
    {
      icon: Shield,
      text: "100% Verified Professionals",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: Gift,
      text: "Loyalty Rewards Program",
      gradient: "from-rose-600 to-orange-600"
    }
  ];

  return (
    <div className="relative w-full py-4 sm:py-6 backdrop-blur-sm border-y border-gray-200/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {usps.map((usp, index) => {
            const Icon = usp.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                className="flex items-center justify-center gap-2 sm:gap-3 group cursor-pointer"
              >
                <div className={`p-2 rounded-lg bg-gradient-to-br ${usp.gradient} shadow-md group-hover:shadow-lg transition-all duration-300 group-hover:scale-110`}>
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <p className="text-xs sm:text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">
                  {usp.text}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
