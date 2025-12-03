import { motion } from "framer-motion";
import { Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  text: string;
  rating: number;
  timeAgo: string;
}

export default function TestimonialChips() {
  const testimonials: Testimonial[] = [
    {
      id: "1",
      name: "Sarah M.",
      text: "Booked in 30 seconds!",
      rating: 5,
      timeAgo: "2 mins ago"
    },
    {
      id: "2",
      name: "Priya K.",
      text: "Best salon discovery app",
      rating: 5,
      timeAgo: "5 mins ago"
    },
    {
      id: "3",
      name: "Amit S.",
      text: "Found my perfect barber",
      rating: 5,
      timeAgo: "12 mins ago"
    },
    {
      id: "4",
      name: "Neha R.",
      text: "Love the AI recommendations",
      rating: 5,
      timeAgo: "18 mins ago"
    }
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
      {testimonials.map((testimonial, index) => (
        <motion.div
          key={testimonial.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: 0.5 + index * 0.1,
            duration: 0.4
          }}
          className="group relative"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 bg-white/95 backdrop-blur-md rounded-full shadow-lg border border-violet-100 hover:border-violet-300 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            {/* Avatar Placeholder */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold">
              {testimonial.name.charAt(0)}
            </div>

            {/* Testimonial Text */}
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-900">
                  {testimonial.name}
                </span>
                <div className="flex items-center gap-0.5">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star
                      key={i}
                      className="w-3 h-3 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
              </div>
              <p className="text-xs text-gray-600 font-medium">
                {testimonial.text}
              </p>
            </div>

            {/* Time Badge */}
            <div className="ml-1 px-2 py-0.5 bg-violet-100 rounded-full">
              <span className="text-xs font-medium text-violet-700">
                {testimonial.timeAgo}
              </span>
            </div>
          </div>

          {/* Pulse Animation */}
          <div className="absolute inset-0 rounded-full bg-violet-400/20 animate-ping opacity-0 group-hover:opacity-100 -z-10" />
        </motion.div>
      ))}
    </div>
  );
}
