import { Scissors, Calendar, ShoppingBag, Gift } from "lucide-react";
import { Link } from "wouter";

export default function ServiceCategories() {
  const categories = [
    {
      icon: Scissors,
      title: "Salon Services",
      description: "Hair, nails, makeup, and beauty treatments",
      color: "from-violet-500 to-purple-600",
      bgColor: "bg-violet-50",
      href: "/",
    },
    {
      icon: Calendar,
      title: "Events",
      description: "Bridal packages, party bookings, special occasions",
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50",
      href: "/events",
    },
    {
      icon: ShoppingBag,
      title: "Shop",
      description: "Beauty products, gift cards, and more",
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50",
      href: "/shop",
    },
    {
      icon: Gift,
      title: "Offers",
      description: "Exclusive deals, discounts, and packages",
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50",
      href: "/offers",
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            All Your Beauty & Wellness Needs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            From salon services to events, shopping to exclusive offers - everything in one place
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <Link key={index} href={category.href}>
              <div className={`${category.bgColor} rounded-2xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer group border border-gray-100 hover:scale-105`}>
                <div className={`w-14 h-14 bg-gradient-to-br ${category.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  {category.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {category.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
