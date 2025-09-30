import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, UserCircle, BookOpen, Play, Trophy, Plus, Calendar, Hash } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Create user profile if it doesn't exist
  const { data: existingProfile } = await supabase
    .from('user_profiles')
    .select('id')
    .eq('id', user.id)
    .single()

  if (!existingProfile) {
    await supabase.from('user_profiles').insert({
      id: user.id,
      username: user.email?.split('@')[0] || '',
      full_name: user.user_metadata?.full_name || '',
      avatar_url: user.user_metadata?.avatar_url || ''
    })
  }

  // Load user's flashcard sets
  const { data: flashcardSets } = await supabase
    .from('flashcard_sets')
    .select(`
      id,
      name,
      description,
      created_at,
      flashcards(count)
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(3);

  const formattedSets = flashcardSets?.map(set => ({
    id: set.id,
    name: set.name,
    description: set.description,
    created_at: set.created_at,
    card_count: set.flashcards?.[0]?.count || 0
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      <DashboardNavbar />
      <main className="w-full">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col gap-4 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Welcome back!</h1>
            <p className="text-gray-600 text-lg">Ready to continue your learning journey?</p>
          </header>

          {/* Quick Actions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/flashcards">
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-blue-100 to-blue-200">
                <CardContent className="p-6 text-center">
                  <BookOpen className="w-12 h-12 text-blue-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Manage Flashcards</h3>
                  <p className="text-gray-600 text-sm">Create and organize your flashcard sets</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/games">
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-green-100 to-green-200">
                <CardContent className="p-6 text-center">
                  <Play className="w-12 h-12 text-green-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Play Games</h3>
                  <p className="text-gray-600 text-sm">Learn through interactive games</p>
                </CardContent>
              </Card>
            </Link>

            <Link href="/profile">
              <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-purple-100 to-purple-200">
                <CardContent className="p-6 text-center">
                  <UserCircle className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Profile</h3>
                  <p className="text-gray-600 text-sm">Manage your account settings</p>
                </CardContent>
              </Card>
            </Link>
          </section>

          {/* Recent Flashcard Sets */}
          <section className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-0 shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-purple-600">Recent Flashcard Sets</h2>
              <Link href="/flashcards">
                <Button variant="outline" size="sm" className="hover:bg-purple-50">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Set
                </Button>
              </Link>
            </div>

            {formattedSets.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No flashcard sets yet</h3>
                <p className="text-gray-600 mb-4">Create your first flashcard set to get started</p>
                <Link href="/flashcards">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Set
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {formattedSets.map((set) => (
                  <Card key={set.id} className="hover:shadow-md transition-all duration-300 border-0 bg-white/50 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-2">{set.name}</h3>
                      {set.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{set.description}</p>
                      )}
                      <div className="flex items-center gap-4 mb-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          {set.card_count} cards
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(set.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Link href={`/flashcards?set=${set.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full hover:bg-purple-50">
                            <BookOpen className="w-4 h-4 mr-2" />
                            Study
                          </Button>
                        </Link>
                        <Link href={`/games?set=${set.id}`}>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Play className="w-4 h-4 mr-2" />
                            Play
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {formattedSets.length > 0 && (
              <div className="text-center mt-6">
                <Link href="/flashcards">
                  <Button variant="outline" className="hover:bg-purple-50">View All Sets</Button>
                </Link>
              </div>
            )}
          </section>

          {/* Learning Stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sets</CardTitle>
                <BookOpen className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{flashcardSets?.length || 0}</div>
                <p className="text-xs text-gray-600">Flashcard sets created</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cards</CardTitle>
                <Hash className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formattedSets.reduce((total, set) => total + set.card_count, 0)}
                </div>
                <p className="text-xs text-gray-600">Flashcards created</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Games Played</CardTitle>
                <Trophy className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-gray-600">Learning games completed</p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                <Calendar className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
                <p className="text-xs text-gray-600">Days in a row</p>
              </CardContent>
            </Card>
          </section>

          {/* User Profile Section */}
          <section className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border-0 shadow-lg">
            <div className="flex items-center gap-4 mb-6">
              <UserCircle size={48} className="text-purple-600" />
              <div>
                <h2 className="font-semibold text-xl">User Profile</h2>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
              <pre className="text-xs font-mono max-h-48 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}