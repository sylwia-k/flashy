'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { BookOpen, Plus, Edit, Trash2, Upload, Download, Play, Calendar, Hash, Share2, Copy, ExternalLink } from 'lucide-react'
import { createClient } from '@/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface FlashcardSet {
  id: string
  name: string
  description?: string
  created_at: string
  card_count: number
  is_public: boolean
  share_code?: string
}

interface Flashcard {
  id: string
  term: string
  definition: string
}

export default function FlashcardsPage() {
  const [user, setUser] = useState<any>(null)
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [isCreatingSet, setIsCreatingSet] = useState(false)
  const [isEditingSet, setIsEditingSet] = useState(false)
  const [isAddingCard, setIsAddingCard] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    setName: '',
    setDescription: '',
    cardTerm: '',
    cardDefinition: ''
  })

  const supabase = createClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  useEffect(() => {
    loadUserAndSets()
  }, [])

  useEffect(() => {
    const setId = searchParams.get('set')
    if (setId && flashcardSets.length > 0) {
      const set = flashcardSets.find(s => s.id === setId)
      if (set) {
        setSelectedSet(set)
        loadFlashcards(set.id)
      }
    }
  }, [searchParams, flashcardSets])

  const loadUserAndSets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      setUser(user)
      
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

      await loadFlashcardSets(user.id)
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        title: "Error",
        description: "Failed to load flashcard sets",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFlashcardSets = async (userId: string) => {
    const { data: setsData } = await supabase
      .from('flashcard_sets')
      .select(`
        id,
        name,
        description,
        created_at,
        is_public,
        share_code,
        flashcards(count)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    const formattedSets = setsData?.map(set => ({
      id: set.id,
      name: set.name,
      description: set.description,
      created_at: set.created_at,
      card_count: set.flashcards?.[0]?.count || 0,
      is_public: set.is_public || false,
      share_code: set.share_code
    })) || []

    setFlashcardSets(formattedSets)
  }

  const loadFlashcards = async (setId: string) => {
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select('*')
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    setFlashcards(cardsData || [])
  }

  const generateShareCode = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  const createFlashcardSet = async () => {
    try {
      const shareCode = generateShareCode()
      const { data, error } = await supabase
        .from('flashcard_sets')
        .insert({
          user_id: user.id,
          name: formData.setName,
          description: formData.setDescription,
          share_code: shareCode,
          is_public: false
        })
        .select()
        .single()

      if (error) throw error

      await loadFlashcardSets(user.id)
      setIsCreatingSet(false)
      setFormData(prev => ({ ...prev, setName: '', setDescription: '' }))
      
      toast({
        title: "Success",
        description: "Flashcard set created successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create flashcard set",
        variant: "destructive"
      })
    }
  }

  const updateFlashcardSet = async () => {
    if (!selectedSet) return

    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .update({
          name: formData.setName,
          description: formData.setDescription,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedSet.id)

      if (error) throw error

      await loadFlashcardSets(user.id)
      setIsEditingSet(false)
      setSelectedSet(prev => prev ? { ...prev, name: formData.setName, description: formData.setDescription } : null)
      
      toast({
        title: "Success",
        description: "Flashcard set updated successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update flashcard set",
        variant: "destructive"
      })
    }
  }

  const deleteFlashcardSet = async (setId: string) => {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .delete()
        .eq('id', setId)

      if (error) throw error

      await loadFlashcardSets(user.id)
      if (selectedSet?.id === setId) {
        setSelectedSet(null)
        setFlashcards([])
      }
      
      toast({
        title: "Success",
        description: "Flashcard set deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete flashcard set",
        variant: "destructive"
      })
    }
  }

  const addFlashcard = async () => {
    if (!selectedSet) return

    try {
      const { error } = await supabase
        .from('flashcards')
        .insert({
          set_id: selectedSet.id,
          term: formData.cardTerm,
          definition: formData.cardDefinition
        })

      if (error) throw error

      await loadFlashcards(selectedSet.id)
      await loadFlashcardSets(user.id)
      setIsAddingCard(false)
      setFormData(prev => ({ ...prev, cardTerm: '', cardDefinition: '' }))
      
      toast({
        title: "Success",
        description: "Flashcard added successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add flashcard",
        variant: "destructive"
      })
    }
  }

  const deleteFlashcard = async (cardId: string) => {
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId)

      if (error) throw error

      if (selectedSet) {
        await loadFlashcards(selectedSet.id)
        await loadFlashcardSets(user.id)
      }
      
      toast({
        title: "Success",
        description: "Flashcard deleted successfully"
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete flashcard",
        variant: "destructive"
      })
    }
  }

  const toggleSetVisibility = async (setId: string, isPublic: boolean) => {
    try {
      const { error } = await supabase
        .from('flashcard_sets')
        .update({ is_public: isPublic })
        .eq('id', setId)

      if (error) throw error

      await loadFlashcardSets(user.id)
      
      toast({
        title: "Success",
        description: `Set is now ${isPublic ? 'public' : 'private'}`
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update set visibility",
        variant: "destructive"
      })
    }
  }

  const copyShareLink = (shareCode: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareCode}`
    navigator.clipboard.writeText(shareUrl)
    toast({
      title: "Link Copied!",
      description: "Share link copied to clipboard"
    })
  }

  const exportFlashcards = () => {
    if (!selectedSet || flashcards.length === 0) return

    const csvContent = [
      ['Term', 'Definition'],
      ...flashcards.map(card => [card.term, card.definition])
    ].map(row => row.map(field => `"${field.replace(/"/g, '""')}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${selectedSet.name.replace(/[^a-z0-9]/gi, '_')}_flashcards.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importFlashcards = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !selectedSet) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string
        let cards: { term: string; definition: string }[] = []

        if (file.name.endsWith('.json')) {
          const jsonData = JSON.parse(content)
          cards = Array.isArray(jsonData) ? jsonData.filter((c:any) => c.term && c.definition) : []
        } else if (file.name.endsWith('.csv')) {
          const lines = content.split(/\r?\n/).filter(line => line.trim())
          if (lines.length > 1) {
            const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim())
            const termIdx = headers.findIndex(h => /term/i.test(h))
            const defIdx = headers.findIndex(h => /(definition|answer)/i.test(h))
          
            for (let i = 1; i < lines.length; i++) {
              const values = lines[i].split(',').map(v => v.replace(/"/g, '').trim())
              const term = termIdx >= 0 ? values[termIdx] : values[0]
              const definition = defIdx >= 0 ? values[defIdx] : values[1]
              if (term && definition) {
                cards.push({ term, definition })
              }
            }
          }
        }

        if (cards.length > 0) {
          // De-duplicate by term within imported batch
          const seen = new Set<string>()
          const unique = cards.filter(c => {
            const key = c.term.toLowerCase().trim()
            if (seen.has(key)) return false
            seen.add(key)
            return true
          })
          const { error } = await supabase
            .from('flashcards')
            .insert(
              unique.map(card => ({
                set_id: selectedSet.id,
                term: card.term,
                definition: card.definition
              }))
            )

          if (error) throw error

          await loadFlashcards(selectedSet.id)
          await loadFlashcardSets(user.id)
          
          toast({
            title: "Success",
            description: `Imported ${unique.length} flashcards successfully`
          })
        }
      } catch (error: any) {
        toast({
          title: "Error",
          description: error.message || "Failed to import flashcards",
          variant: "destructive"
        })
      }
    }
    reader.readAsText(file)
    event.target.value = ''
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading flashcards...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50">
      {/* Navigation */}
      <nav className="w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">Flashy</span>
            </div>
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Home</Button>
              <Button variant="default" size="sm">Flashcards</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/games')}>Games</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>Profile</Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Flashcards</h1>
            <p className="text-gray-600 text-lg">Create and manage your flashcard sets</p>
          </div>
          <Dialog open={isCreatingSet} onOpenChange={setIsCreatingSet}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700 shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Create New Set
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white/95 backdrop-blur-sm">
              <DialogHeader>
                <DialogTitle>Create New Flashcard Set</DialogTitle>
                <DialogDescription>
                  Create a new set to organize your flashcards
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="set_name">Set Name</Label>
                  <Input
                    id="set_name"
                    value={formData.setName}
                    onChange={(e) => setFormData(prev => ({ ...prev, setName: e.target.value }))}
                    placeholder="e.g., Spanish Vocabulary"
                  />
                </div>
                <div>
                  <Label htmlFor="set_description">Description (Optional)</Label>
                  <Textarea
                    id="set_description"
                    value={formData.setDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, setDescription: e.target.value }))}
                    placeholder="Brief description of this flashcard set"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreatingSet(false)}>
                  Cancel
                </Button>
                <Button onClick={createFlashcardSet} disabled={!formData.setName.trim()} className="bg-purple-600 hover:bg-purple-700">
                  Create Set
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Flashcard Sets List */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle>Your Sets</CardTitle>
              </CardHeader>
              <CardContent>
                {flashcardSets.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No flashcard sets yet</p>
                    <Button onClick={() => setIsCreatingSet(true)} className="bg-purple-600 hover:bg-purple-700">
                      Create Your First Set
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {flashcardSets.map((set) => (
                      <div
                        key={set.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-all duration-300 ${
                          selectedSet?.id === set.id ? 'bg-purple-50 border-purple-200 shadow-md' : 'hover:bg-gray-50 hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedSet(set)
                          loadFlashcards(set.id)
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{set.name}</h4>
                            <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Hash className="w-3 h-3" />
                                {set.card_count} cards
                              </span>
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(set.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          {set.is_public && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Flashcards Content */}
          <div className="lg:col-span-2">
            {selectedSet ? (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-purple-600">{selectedSet.name}</CardTitle>
                      {selectedSet.description && (
                        <p className="text-gray-600 mt-1">{selectedSet.description}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {flashcards.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/games?set=${selectedSet.id}`)}
                          className="hover:bg-purple-50"
                        >
                          <Play className="w-4 h-4 mr-2" />
                          Play Games
                        </Button>
                      )}
                      
                      <Dialog open={isSharing} onOpenChange={setIsSharing}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-purple-50">
                            <Share2 className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>Share Flashcard Set</DialogTitle>
                            <DialogDescription>
                              Share "{selectedSet.name}" with friends
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm">Public Access</span>
                              <Button
                                variant={selectedSet.is_public ? "default" : "outline"}
                                size="sm"
                                onClick={() => toggleSetVisibility(selectedSet.id, !selectedSet.is_public)}
                              >
                                {selectedSet.is_public ? 'Public' : 'Private'}
                              </Button>
                            </div>
                            {selectedSet.share_code && (
                              <div className="space-y-2">
                                <Label>Share Link</Label>
                                <div className="flex gap-2">
                                  <Input
                                    value={`${window.location.origin}/shared/${selectedSet.share_code}`}
                                    readOnly
                                    className="flex-1"
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyShareLink(selectedSet.share_code!)}
                                  >
                                    <Copy className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsSharing(false)}>
                              Close
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>

                      <Dialog open={isEditingSet} onOpenChange={setIsEditingSet}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                setName: selectedSet.name,
                                setDescription: selectedSet.description || ''
                              }))
                            }}
                            className="hover:bg-purple-50"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>Edit Flashcard Set</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="edit_set_name">Set Name</Label>
                              <Input
                                id="edit_set_name"
                                value={formData.setName}
                                onChange={(e) => setFormData(prev => ({ ...prev, setName: e.target.value }))}
                              />
                            </div>
                            <div>
                              <Label htmlFor="edit_set_description">Description</Label>
                              <Textarea
                                id="edit_set_description"
                                value={formData.setDescription}
                                onChange={(e) => setFormData(prev => ({ ...prev, setDescription: e.target.value }))}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsEditingSet(false)}>
                              Cancel
                            </Button>
                            <Button onClick={updateFlashcardSet} className="bg-purple-600 hover:bg-purple-700">Save Changes</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="outline" size="sm" className="hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white/95 backdrop-blur-sm">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Flashcard Set</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete "{selectedSet.name}" and all its flashcards. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteFlashcardSet(selectedSet.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete Set
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold">
                      Flashcards ({flashcards.length})
                    </h3>
                    <div className="flex gap-2">
                      <input
                        type="file"
                        accept=".csv,.json"
                        onChange={importFlashcards}
                        className="hidden"
                        id="import-file"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('import-file')?.click()}
                        className="hover:bg-purple-50"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Import
                      </Button>
                      {flashcards.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportFlashcards} className="hover:bg-purple-50">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      )}
                      <Dialog open={isAddingCard} onOpenChange={setIsAddingCard}>
                        <DialogTrigger asChild>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Card
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-white/95 backdrop-blur-sm">
                          <DialogHeader>
                            <DialogTitle>Add New Flashcard</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <Label htmlFor="card_term">Term</Label>
                              <Input
                                id="card_term"
                                value={formData.cardTerm}
                                onChange={(e) => setFormData(prev => ({ ...prev, cardTerm: e.target.value }))}
                                placeholder="e.g., Hola"
                              />
                            </div>
                            <div>
                              <Label htmlFor="card_definition">Definition</Label>
                              <Textarea
                                id="card_definition"
                                value={formData.cardDefinition}
                                onChange={(e) => setFormData(prev => ({ ...prev, cardDefinition: e.target.value }))}
                                placeholder="e.g., Hello (Spanish greeting)"
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsAddingCard(false)}>
                              Cancel
                            </Button>
                            <Button 
                              onClick={addFlashcard}
                              disabled={!formData.cardTerm.trim() || !formData.cardDefinition.trim()}
                              className="bg-purple-600 hover:bg-purple-700"
                            >
                              Add Card
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>

                  {flashcards.length === 0 ? (
                    <div className="text-center py-12">
                      <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 mb-4">No flashcards in this set yet</p>
                      <Button onClick={() => setIsAddingCard(true)} className="bg-purple-600 hover:bg-purple-700">
                        Add Your First Card
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {flashcards.map((card) => (
                        <div key={card.id} className="border rounded-lg p-4 hover:shadow-md transition-all duration-300 bg-white/50 backdrop-blur-sm">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900">{card.term}</h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteFlashcard(card.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                          <p className="text-gray-600 text-sm">{card.definition}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="text-center py-12">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Select a Flashcard Set</h3>
                  <p className="text-gray-600">Choose a set from the left to view and manage your flashcards</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}