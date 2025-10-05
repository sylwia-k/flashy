import Footer from "@/components/footer";
import Hero from "@/components/hero";
import Navbar from "@/components/navbar";
import {
  ArrowUpRight,
  Brain,
  Clock,
  Trophy,
  Users,
  Zap,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/supabase/client";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navbar />
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              Master Any Subject with Smart Flashcards
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Our intelligent flashcard system adapts to your learning style,
              helping you retain information faster and more effectively.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Smart Learning",
                description: "AI-powered spaced repetition algorithm",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Time Efficient",
                description: "Learn 3x faster with optimized study sessions",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Gamified Experience",
                description:
                  "Engaging games and challenges to boost motivation",
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Comprehensive Library",
                description: "Access thousands of pre-made flashcard sets",
              },
            ].map((feature, index) => (
              <div
                key={index}
                className="p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-blue-600 text-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">50K+</div>
              <div className="text-blue-100">Active Learners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">1M+</div>
              <div className="text-blue-100">Flashcards Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">95%</div>
              <div className="text-blue-100">Improved Test Scores</div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How FlashLearn Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Simple, effective, and scientifically proven learning method
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Create or Choose",
                description:
                  "Build your own flashcard sets or browse our extensive library of pre-made decks",
              },
              {
                step: "02",
                title: "Study Smart",
                description:
                  "Our AI algorithm presents cards at optimal intervals for maximum retention",
              },
              {
                step: "03",
                title: "Track Progress",
                description:
                  "Monitor your learning journey with detailed analytics and performance insights",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Start Learning Smarter Today
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of students and professionals who have transformed
            their learning with FlashLearn.
          </p>
          {user ? (
            <a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Go to Dashboard
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </a>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Start Free Trial
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </a>
              <a
                href="/sign-in"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                Sign In
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
