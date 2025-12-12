import { Search, Calendar, CheckCircle, Sparkles } from "lucide-react";

export default function HowItWorks() {
  const steps = [
    {
      icon: Search,
      title: "Search & Compare",
      description: "Browse verified salons, spas, and beauty professionals near you with ratings and reviews",
      color: "from-violet-500 to-purple-600",
    },
    {
      icon: Calendar,
      title: "Book Instantly",
      description: "Choose your preferred time slot and get instant confirmation - simple and secure",
      color: "from-pink-500 to-rose-600",
    },
    {
      icon: Sparkles,
      title: "Get Serviced",
      description: "Arrive at your appointment and enjoy premium beauty & wellness services",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
            How It Works
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Book your next beauty appointment in just 3 simple steps
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step, index) => (
            <div key={index} className="relative">
              <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow">
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center mb-4 relative`}>
                    <step.icon className="h-8 w-8 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-md">
                      <span className="text-sm font-bold text-gray-900">{index + 1}</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {step.description}
                  </p>
                </div>
              </div>
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                  <div className="w-8 h-0.5 bg-gradient-to-r from-violet-300 to-pink-300"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
