'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Hash, Calendar, Play, Trophy, User, Gamepad2 } from 'lucide-react'
import { createClient } from '@/supabase/client'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface FlashcardSet {
  id: string
  name: string
  description?: string
  created_at: string
  card_count: number
}

interface SharedFlashcardSetClientProps {
  shareCode: string
}

function SharedFlashcardSetClient({ shareCode }: SharedFlashcardSetClientProps) {
  const [flashcardSet, setFlashcardSet] = useState<FlashcardSet | null>(null)
  const [flashcards, setFlashcards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    loadSharedSet()
  }, [shareCode])

  const loadSharedSet = async () => {
    if (!shareCode) return;
    try {
      // Load the shared flashcard set
      const { data: setData, error: fetchError } = await supabase
        .from('flashcard_sets')
        .select(`
          id,
          name,
          description,
          created_at,
          flashcards(count)
        `)
        .eq('share_code', shareCode)
        .single()

      if (fetchError || !setData) {
        setError('Flashcard set not found')
        return
      }

      const formattedSet = {
        id: setData.id,
        name: setData.name,
        description: setData.description,
        created_at: setData.created_at,
        card_count: setData.flashcards?.[0]?.count || 0
      }

      setFlashcardSet(formattedSet)

      // Load the flashcards
      const { data: cardsData } = await supabase
        .from('flashcards')
        .select('*')
        .eq('set_id', setData.id)
        .order('created_at', { ascending: true })

      setFlashcards(cardsData || [])
    } catch (error) {
      console.error('Error loading shared set:', error)
      setError('Failed to load flashcard set')
    } finally {
      setLoading(false)
    }
  }

  const copySet = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast({
          title: "Sign in required",
          description: "Please sign in to copy this flashcard set",
          variant: "destructive"
        })
        router.push('/sign-in')
        return
      }

      if (!flashcardSet) return

      // Generate a new share code for the copied set
      const generateShareCode = () => {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
      }

      // Create a copy of the set for the user
      const { data: newSet, error: insertError } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: user.id,
          name: `${flashcardSet.name} (Copy)`,
          description: flashcardSet.description,
          share_code: generateShareCode()
        })
        .select()
        .single()

      if (insertError) throw insertError

      // Copy all flashcards
      if (flashcards.length > 0) {
        const { error: cardsError } = await supabase
          .from('flashcards')
          .insert(
            flashcards.map(card => ({
              set_id: newSet.id,
              term: card.term,
              definition: card.definition
            }))
          )

        if (cardsError) throw cardsError
      }

      toast({
        title: "Success!",
        description: "Flashcard set copied to your account"
      })

      router.push('/flashcards')
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to copy flashcard set",
        variant: "destructive"
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcard set...</p>
        </div>
      </div>
    )
  }

  if (error || !flashcardSet) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <Card className="max-w-md mx-auto border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Set Not Found</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => router.push('/')} className="bg-purple-600 hover:bg-purple-700">
              Go Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-purple-600" />
            <span className="text-xl font-bold text-purple-600">Flashy</span>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => router.push('/sign-in')}>
              Sign In
            </Button>
            <Button onClick={() => router.push('/sign-up')} className="bg-purple-600 hover:bg-purple-700">
              Sign Up
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Shared Flashcard Set
          </h1>
          <p className="text-gray-600 text-lg">Study this shared flashcard set</p>
        </div>

        {/* Set Info */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl text-purple-600">{flashcardSet.name}</CardTitle>
                {flashcardSet.description && (
                  <p className="text-gray-600 mt-2">{flashcardSet.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Hash className="w-4 h-4" />
                    {flashcardSet.card_count} cards
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    {new Date(flashcardSet.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={copySet} className="bg-purple-600 hover:bg-purple-700">
                  Copy to My Account
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Flashcards */}
        <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Flashcards</CardTitle>
          </CardHeader>
          <CardContent>
            {flashcards.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No flashcards in this set</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {flashcards.map((card) => (
                  <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
                    <h4 className="font-medium text-gray-900 mb-2">{card.term}</h4>
                    <p className="text-gray-600 text-sm">{card.definition}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Call to Action */}
        <div className="text-center mt-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <CardContent className="py-8">
              <h3 className="text-xl font-semibold mb-4">Want to create your own flashcard sets?</h3>
              <p className="text-gray-600 mb-6">Join Flashy to create, share, and study with interactive flashcard games!</p>
              <div className="flex gap-4 justify-center">
                <Button onClick={() => router.push('/sign-up')} className="bg-purple-600 hover:bg-purple-700">
                  Sign Up Free
                </Button>
                <Button variant="outline" onClick={() => router.push('/sign-in')}>
                  Sign In
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default async function SharedFlashcardSetPage({
  params,
}: {
  params: Promise<{ shareCode: string }>;
}) {
  const { shareCode } = await params;
  return <SharedFlashcardSetClient shareCode={shareCode} />
}