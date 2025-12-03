import { Clock, ArrowRight } from "lucide-react";
import { Link } from "wouter";

interface BlogPost {
  id: number;
  title: string;
  excerpt: string;
  image: string;
  category: string;
  readTime: string;
  date: string;
}

const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: "Winter Skincare Routine",
    excerpt: "Essential tips to keep your skin glowing and hydrated during winter months...",
    image: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=800&h=600&fit=crop",
    category: "Skincare",
    readTime: "5 min read",
    date: "Dec 1, 2024"
  },
  {
    id: 2,
    title: "Top Hair Colors 2025",
    excerpt: "Discover the trending hair colors that will dominate the beauty scene this year...",
    image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?w=800&h=600&fit=crop",
    category: "Hair",
    readTime: "4 min read",
    date: "Nov 28, 2024"
  },
  {
    id: 3,
    title: "Perfect Bridal Makeup Guide",
    excerpt: "Expert advice on achieving flawless wedding day makeup that lasts all day...",
    image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?w=800&h=600&fit=crop",
    category: "Makeup",
    readTime: "6 min read",
    date: "Nov 25, 2024"
  },
  {
    id: 4,
    title: "Nail Care Essentials",
    excerpt: "Professional tips for maintaining healthy, beautiful nails at home...",
    image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?w=800&h=600&fit=crop",
    category: "Nails",
    readTime: "3 min read",
    date: "Nov 22, 2024"
  }
];

export default function BeautyTips() {
  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-purple-50/20">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
              Beauty Tips & Trends
            </h2>
            <p className="text-gray-600 text-lg">
              Stay updated with the latest beauty insights and expert advice
            </p>
          </div>
          <Link href="/blog">
            <button className="hidden md:flex items-center gap-2 text-purple-600 hover:text-purple-700 font-semibold text-lg hover:underline">
              Read All
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {blogPosts.map((post) => (
            <article
              key={post.id}
              className="group bg-white rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer transform hover:-translate-y-2"
            >
              <div className="relative overflow-hidden">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {post.category}
                </div>
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                  <span>{post.date}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{post.readTime}</span>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>

                <p className="text-gray-600 mb-4 line-clamp-2">
                  {post.excerpt}
                </p>

                <button className="flex items-center gap-2 text-purple-600 font-semibold group-hover:gap-3 transition-all">
                  Read More
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 text-center md:hidden">
          <Link href="/blog">
            <button className="flex items-center gap-2 mx-auto text-purple-600 hover:text-purple-700 font-semibold text-lg hover:underline">
              Read All Articles
              <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
        </div>
      </div>
    </section>
  );
}
