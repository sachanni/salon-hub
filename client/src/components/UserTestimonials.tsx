import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: number;
  name: string;
  role: string;
  image: string;
  rating: 5;
  text: string;
  service: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    name: "Jessica Miller",
    role: "Regular Customer",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
    rating: 5,
    text: "Amazing experience! Finding and booking salon near me was so easy. The stylist was incredibly talented!",
    service: "Hair Styling"
  },
  {
    id: 2,
    name: "Priya Sharma",
    role: "Verified User",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=200&h=200&fit=crop",
    rating: 5,
    text: "I found the perfect makeup artist for my wedding through SalonHub. The booking process was seamless and secure!",
    service: "Bridal Makeup"
  },
  {
    id: 3,
    name: "Raj Patel",
    role: "Business Professional",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop",
    rating: 5,
    text: "Best salon booking platform! I can schedule appointments 24/7 and get instant confirmation. Highly recommend!",
    service: "Haircut & Grooming"
  },
  {
    id: 4,
    name: "Anita Desai",
    role: "Happy Client",
    image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=200&h=200&fit=crop",
    rating: 5,
    text: "The loyalty rewards program is fantastic! I've saved so much money on my regular spa treatments. Love this platform!",
    service: "Spa Services"
  }
];

export default function UserTestimonials() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            What Our Users Say
          </h2>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Join thousands of satisfied customers who trust SalonHub for their beauty and wellness needs
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.id}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-md hover:shadow-xl transition-all duration-300 border border-purple-100 relative"
            >
              <Quote className="absolute top-6 right-6 w-12 h-12 text-purple-200" />
              
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <img
                  src={testimonial.image}
                  alt={testimonial.name}
                  className="w-16 h-16 rounded-full object-cover ring-4 ring-white shadow-md"
                />
                <div>
                  <h4 className="font-bold text-gray-900 text-lg">
                    {testimonial.name}
                  </h4>
                  <p className="text-purple-600 text-sm font-medium">
                    {testimonial.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-1 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-4 italic">
                "{testimonial.text}"
              </p>

              <div className="inline-block bg-white px-4 py-2 rounded-full text-sm font-medium text-purple-600 border border-purple-200">
                {testimonial.service}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-gray-600 text-lg mb-4">
            Over <span className="font-bold text-purple-600">50,000+</span> 5-star reviews
          </p>
          <div className="flex justify-center gap-2">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className="w-8 h-8 fill-yellow-400 text-yellow-400"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
