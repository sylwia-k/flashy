import Link from "next/link";
import { Button } from "./ui/button";
import { BookOpen } from "lucide-react";

interface DashboardNavbarProps {
  user?: any;
}

export default function DashboardNavbar({ user }: DashboardNavbarProps) {
  return (
    <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm py-4">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-purple-600" />
          <span className="text-xl font-bold text-purple-600">Flashy</span>
        </Link>
        <div className="flex gap-4 items-center">
          <div className="hidden md:flex gap-4">
            <Link href="/dashboard">
              <Button variant="default" size="sm">Home</Button>
            </Link>
            <Link href="/flashcards">
              <Button variant="ghost" size="sm">Flashcards</Button>
            </Link>
            <Link href="/games">
              <Button variant="ghost" size="sm">Games</Button>
            </Link>
            <Link href="/profile">
              <Button variant="ghost" size="sm">Profile</Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}