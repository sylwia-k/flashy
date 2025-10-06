import Link from "next/link";
import { ArrowUpRight, Check, BookOpen, Brain } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-indigo-50 opacity-70" />

      {/* Floating flashcard elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-16 h-10 bg-blue-100 rounded-lg shadow-sm transform rotate-12 opacity-60" />
        <div className="absolute top-40 right-20 w-20 h-12 bg-indigo-100 rounded-lg shadow-sm transform -rotate-6 opacity-50" />
        <div className="absolute bottom-40 left-20 w-14 h-9 bg-purple-100 rounded-lg shadow-sm transform rotate-45 opacity-40" />
        <div className="absolute bottom-20 right-10 w-18 h-11 bg-blue-200 rounded-lg shadow-sm transform -rotate-12 opacity-50" />
      </div>

      <div className="relative pt-24 pb-32 sm:pt-32 sm:pb-40">
        <div className="container mx-auto px-4">
          <div className="text-center max-w-4xl mx-auto">

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Ucz się skutecznie z <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Flashy</span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Szybka i efektywna nauka. Powtarzaj, zapamiętuj i osiągaj swoje cele!
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                Załóż konto
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="/sign-in"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                <BookOpen className="mr-2 w-5 h-5" />
                Zaloguj się
              </Link>
            </div>

            {/* Usunięto pasek z hasłami marketingowymi */}
          </div>
        </div>
      </div>
    </div>
  );
}
