import { Star, MapPin, Award } from "lucide-react";
import { Link } from "wouter";

interface Professional {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  image: string;
  location: string;
  badge?: string;
}

const featuredProfessionals: Professional[] = [
  {
    id: 1,
    name: "Sarah Johnson",
    specialty: "Hair Stylist & Colorist",
    rating: 4.9,
    reviewCount: 342,
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=400&h=400&fit=crop",
    location: "Mumbai",
    badge: "Top Rated"
  },
  {
    id: 2,
    name: "Emma Davis",
    specialty: "Makeup Artist",
    rating: 5.0,
    reviewCount: 289,
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=400&fit=crop",
    location: "Delhi",
    badge: "Expert"
  },
  {
    id: 3,
    name: "Michael Brown",
    specialty: "Barber & Beard Specialist",
    rating: 4.8,
    reviewCount: 456,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    location: "Bangalore",
    badge: "Popular"
  },
  {
    id: 4,
    name: "Lisa Anderson",
    specialty: "Nail Artist",
    rating: 4.9,
    reviewCount: 198,
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    location: "Pune"
  },
  {
    id: 5,
    name: "David Wilson",
    specialty: "Spa Therapist",
    rating: 5.0,
    reviewCount: 267,
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
    location: "Hyderabad",
    badge: "Certified"
  },
  {
    id: 6,
    name: "Olivia Martinez",
    specialty: "Skin Care Expert",
    rating: 4.9,
    reviewCount: 312,
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop",
    location: "Chennai"
  }
];

export default function FeaturedProfessionals() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-purple-50/30">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Featured Professionals
            </h2>
            <p className="text-gray-600 text-lg">
              Top-rated beauty experts trusted by thousands
            </p>
          </div>
          <Link href="/professionals">
            <button className="hidden md:block text-purple-600 hover:text-purple-700 font-semibold text-lg hover:underline">
              View All
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {featuredProfessionals.map((professional) => (
            <div
              key={professional.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
            >
              <div className="relative">
                <img
                  src={professional.image}
                  alt={professional.name}
                  className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {professional.badge && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 shadow-lg">
                    <Award className="w-4 h-4" />
                    {professional.badge}
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-purple-600 transition-colors">
                  {professional.name}
                </h3>
                <p className="text-purple-600 font-medium mb-3">
                  {professional.specialty}
                </p>

                <div className="flex items-center gap-4 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    <span className="font-bold text-gray-900">{professional.rating}</span>
                    <span className="text-gray-500 text-sm">
                      ({professional.reviewCount})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span className="text-sm">{professional.location}</span>
                </div>

                <button className="w-full mt-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-semibold hover:from-purple-700 hover:to-pink-700 transition-all transform group-hover:scale-105 shadow-md">
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/professionals">
            <button className="text-purple-600 hover:text-purple-700 font-semibold text-lg hover:underline">
              View All Professionals →
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
