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
            <div className="flex justify-center mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-blue-700 text-sm font-medium">
                <Brain className="w-4 h-4" />
                <span>AI-Powered Learning Platform</span>
              </div>
            </div>

            <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-8 tracking-tight">
              Master Any Subject with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Smart Flashcards
              </span>
            </h1>

            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto leading-relaxed">
              Transform your learning experience with our intelligent flashcard
              system. Study smarter, retain more, and achieve your goals faster
              than ever before.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link
                href="/sign-up"
                className="inline-flex items-center px-8 py-4 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
              >
                Start Learning Free
                <ArrowUpRight className="ml-2 w-5 h-5" />
              </Link>

              <Link
                href="/sign-in"
                className="inline-flex items-center px-8 py-4 text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                <BookOpen className="mr-2 w-5 h-5" />
                Sign In
              </Link>
            </div>

            <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Start studying in 30 seconds</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
