import { Smartphone, Star } from "lucide-react";

export default function DownloadAppSection() {
  return (
    <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-violet-500/20 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Smartphone className="h-5 w-5 text-violet-400" />
              <span className="text-violet-300 font-semibold">Download Our App</span>
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Book on the go with SalonHub App
            </h2>
            <p className="text-lg text-gray-300 mb-8">
              Get exclusive app-only deals, instant notifications, and seamless booking experience on your mobile device.
            </p>

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Easy Booking</h4>
                  <p className="text-gray-400 text-sm">Book appointments in just a few taps</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">Instant Notifications</h4>
                  <p className="text-gray-400 text-sm">Get reminders and exclusive offers</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-violet-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Star className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">App-Only Deals</h4>
                  <p className="text-gray-400 text-sm">Access exclusive discounts and offers</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#" className="inline-block">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/7/78/Google_Play_Store_badge_EN.svg" 
                  alt="Get it on Google Play" 
                  className="h-12"
                />
              </a>
              <a href="#" className="inline-block">
                <img 
                  src="https://upload.wikimedia.org/wikipedia/commons/3/3c/Download_on_the_App_Store_Badge.svg" 
                  alt="Download on the App Store" 
                  className="h-12"
                />
              </a>
            </div>
          </div>

          <div className="relative">
            <div className="relative z-10">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6 shadow-xl">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">SalonHub</h3>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600">4.8 • 50K+ Downloads</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="h-4 bg-gray-100 rounded"></div>
                    <div className="h-4 bg-gray-100 rounded w-3/4"></div>
                    <div className="h-32 bg-gradient-to-br from-violet-100 to-purple-100 rounded-xl"></div>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-3xl blur-3xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
