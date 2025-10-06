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
import { createClient } from "@/supabase/server";

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
              Opanuj dowolny przedmiot z inteligentnymi fiszkami
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Nasz inteligentny system fiszek dostosowuje się do Twojego stylu nauki,
              pomagając szybciej i skuteczniej zapamiętywać informacje.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: <Brain className="w-6 h-6" />,
                title: "Inteligentna nauka",
                description: "Algorytm powtórek oparty na AI",
              },
              {
                icon: <Clock className="w-6 h-6" />,
                title: "Oszczędność czasu",
                description: "Ucz się 3x szybciej dzięki zoptymalizowanym sesjom",
              },
              {
                icon: <Trophy className="w-6 h-6" />,
                title: "Grywalizacja",
                description:
                  "Gry i wyzwania motywujące do nauki",
              },
              {
                icon: <BookOpen className="w-6 h-6" />,
                title: "Bogata biblioteka",
                description: "Dostęp do tysięcy gotowych zestawów fiszek",
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


      {/* How It Works Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Jak działa Flashy</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Prosta, skuteczna i naukowo potwierdzona metoda nauki
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                title: "Stwórz lub wybierz",
                description:
                  "Twórz własne zestawy fiszek lub przeglądaj naszą bibliotekę gotowych talii",
              },
              {
                step: "02",
                title: "Ucz się mądrze",
                description:
                  "Nasz algorytm AI podpowiada fiszki w optymalnych odstępach dla maksymalnej skuteczności",
              },
              {
                step: "03",
                title: "Śledź postępy",
                description:
                  "Monitoruj swoją naukę dzięki szczegółowym statystykom i analizom",
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
            Zacznij naukę już dziś
          </h2>
          <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
            Dołącz do tysięcy uczniów i studentów, którzy uczą się z Flashy.
          </p>
          {user ? (
            <a
              href="/dashboard"
              className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              Przejdź do panelu
              <ArrowUpRight className="ml-2 w-5 h-5" />
            </a>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                Rozpocznij za darmo
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </a>
              <a
                href="/sign-in"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors text-lg font-medium"
              >
                Zaloguj się
              </a>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
