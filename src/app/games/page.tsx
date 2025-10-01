'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Play, Trophy, Clock, Target, Zap, ArrowRight, RotateCcw, Gamepad2 } from 'lucide-react'
import { createClient } from '@/supabase/client'
import { scheduleNextReview, selectSessionCards } from '@/lib/utils'
import { useRouter, useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/use-toast'

interface FlashcardSet {
  id: string
  name: string
  description?: string
}

interface Flashcard {
  id: string
  term: string
  definition: string
}

type CardStatus = 'learn' | 'recognize' | 'know'

interface GameStats {
  correct: number
  incorrect: number
  streak: number
  totalTime: number
}

type GameMode = 'select' | 'falling-blocks' | 'runner' | 'quick-quiz'

export default function GamesPage() {
  const [user, setUser] = useState<any>(null)
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>([])
  const [selectedSet, setSelectedSet] = useState<FlashcardSet | null>(null)
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [gameCards, setGameCards] = useState<Flashcard[]>([])
  const [gameMode, setGameMode] = useState<GameMode>('select')
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [gameStats, setGameStats] = useState<GameStats>({ correct: 0, incorrect: 0, streak: 0, totalTime: 0 })
  const [gameStartTime, setGameStartTime] = useState<number>(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [showAnswer, setShowAnswer] = useState(false)
  const [gameActive, setGameActive] = useState(false)
  const [loading, setLoading] = useState(true)
  const [awaitingNext, setAwaitingNext] = useState(false)
  
  // Falling Blocks Game State
  const [blockPosition, setBlockPosition] = useState({ x: 50, y: 0 })
  const [blockSpeed, setBlockSpeed] = useState(2)
  const [gameScore, setGameScore] = useState(0)
  const [blockAnimation, setBlockAnimation] = useState(false)
  
  // Runner Game State
  const [runnerPosition, setRunnerPosition] = useState(50)
  const [obstacles, setObstacles] = useState<{ x: number; y: number }[]>([])
  const [runnerSpeed, setRunnerSpeed] = useState(3)
  const [runnerAnimation, setRunnerAnimation] = useState(false)
  
  // Quick Quiz State
  const [quizOptions, setQuizOptions] = useState<string[]>([])
  const [correctAnswer, setCorrectAnswer] = useState('')
  const [timeLeft, setTimeLeft] = useState(30)
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [confidence, setConfidence] = useState<number | null>(null)
  const [cardShownAt, setCardShownAt] = useState<number>(0)

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
        loadFlashcards(setId)
      }
    }
  }, [searchParams, flashcardSets])

  // Game animations
  useEffect(() => {
    if (gameActive && gameMode === 'falling-blocks') {
      const interval = setInterval(() => {
        setBlockAnimation(prev => !prev)
        setBlockPosition(prev => ({
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 20
        }))
      }, 2000)
      return () => clearInterval(interval)
    }
  }, [gameActive, gameMode])

  useEffect(() => {
    if (gameActive && gameMode === 'runner') {
      const interval = setInterval(() => {
        setRunnerAnimation(prev => !prev)
        setObstacles(prev => [
          ...prev.slice(-2),
          { x: Math.random() * 80 + 10, y: 0 }
        ])
      }, 1500)
      return () => clearInterval(interval)
    }
  }, [gameActive, gameMode])

  useEffect(() => {
    if (gameActive && gameMode === 'quick-quiz' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(prev => prev - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && gameActive) {
      handleAnswer(false)
    }
  }, [timeLeft, gameActive, gameMode])
  useEffect(() => {
    if (gameActive && gameCards[currentCardIndex]) {
      setCardShownAt(Date.now())
      setConfidence(null)
    }
  }, [gameActive, currentCardIndex, gameCards])

  // Keep quiz options synced with current card
  useEffect(() => {
    if (gameActive && gameMode === 'quick-quiz') {
      generateQuizOptions()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameActive, gameMode, currentCardIndex, gameCards])

  const loadUserAndSets = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/sign-in')
        return
      }

      setUser(user)

      const { data: setsData } = await supabase
        .from('flashcard_sets')
        .select('id, name, description')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      setFlashcardSets(setsData || [])
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

  const loadFlashcards = async (setId: string) => {
    const { data: cardsData } = await supabase
      .from('flashcards')
      .select(`
        id,
        term,
        definition,
        progress:flashcard_progress(status, due_at, ease_factor, repetitions, interval_minutes)
      `)
      .eq('set_id', setId)
      .order('created_at', { ascending: true })

    const mapped = (cardsData || []).map((c: any) => ({
      id: c.id,
      term: c.term,
      definition: c.definition,
      progress_status: c.progress?.[0]?.status as CardStatus | undefined,
      due_at: c.progress?.[0]?.due_at as string | undefined
    }))

    setFlashcards(mapped as any)
  }

  const shuffleArray = (arr: Flashcard[]) => {
    const copy = [...arr]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy
  }

  const startGame = (mode: GameMode) => {
    if (!selectedSet || flashcards.length === 0) return

    setGameMode(mode)
    setGameActive(true)
    setGameStartTime(Date.now())
    // Prioritize learn -> recognize -> know
    const learn: Flashcard[] = []
    const recognize: Flashcard[] = []
    const know: Flashcard[] = []
    flashcards.forEach((c: any) => {
      const status: CardStatus = c.progress_status || 'learn'
      if (status === 'learn') learn.push(c)
      else if (status === 'recognize') recognize.push(c)
      else know.push(c)
    })
    // Sort due soonest first within each bucket if due_at exists
    const byDue = (a: any, b: any) => {
      const da = a.due_at ? new Date(a.due_at).getTime() : Infinity
      const db = b.due_at ? new Date(b.due_at).getTime() : Infinity
      return da - db
    }
    learn.sort(byDue)
    recognize.sort(byDue)
    know.sort(byDue)
    const ordered = [...learn, ...recognize, ...know]
    // Apply session selection with daily cap
    const dailyCap = 20
    const session = selectSessionCards(ordered as any, dailyCap) as any
    setGameCards(session)
    setCurrentCardIndex(0)
    setGameStats({ correct: 0, incorrect: 0, streak: 0, totalTime: 0 })
    setUserAnswer('')
    setShowAnswer(false)
    setSelectedOption(null)

    if (mode === 'quick-quiz') {
      setTimeLeft(30)
    }
  }

  const generateQuizOptions = () => {
    if (gameCards.length === 0 || !gameCards[currentCardIndex]) return

    const currentCard = gameCards[currentCardIndex]
    const wrongAnswers = gameCards
      .filter(card => card.id !== currentCard.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map(card => card.definition)

    const allOptions = [currentCard.definition, ...wrongAnswers].sort(() => Math.random() - 0.5)
    setQuizOptions(allOptions)
    setCorrectAnswer(currentCard.definition)
  }

  const handleAnswer = async (isCorrect: boolean) => {
    if (awaitingNext) return
    setAwaitingNext(true)
    const newStats = { ...gameStats }
    
    if (isCorrect) {
      newStats.correct++
      newStats.streak++
      toast({
        title: "Correct! 🎉",
        description: "Great job!",
      })
    } else {
      newStats.incorrect++
      newStats.streak = 0
      toast({
        title: "Incorrect 😔",
        description: `The correct answer was: ${gameCards[currentCardIndex].definition}`,
        variant: "destructive"
      })
    }

    setGameStats(newStats)

    // Update scheduling for this card
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user && gameCards[currentCardIndex]) {
        const now = new Date()
        const elapsed = Math.max(0, Date.now() - (cardShownAt || Date.now()))
        const confidenceAdj = confidence ?? (isCorrect ? 0.7 : 0.3)
        const grade = isCorrect ? (confidenceAdj > 0.8 ? 5 : 4) : 2
        const outcome = { grade: grade as 0|1|2|3|4|5, responseMs: elapsed, confidence: confidenceAdj }
        const sched = scheduleNextReview(now, undefined, outcome)
        await supabase.from('flashcard_progress').upsert({
          user_id: user.id,
          set_id: selectedSet?.id,
          card_id: gameCards[currentCardIndex].id,
          status: isCorrect ? 'recognize' : 'learn',
          ease_factor: sched.easeFactor,
          repetitions: sched.repetitions,
          interval_minutes: sched.intervalMinutes,
          last_grade: grade,
          last_response_ms: outcome.responseMs,
          response_ms_avg: sched.responseMsAvg,
          confidence_avg: sched.confidenceAvg,
          last_reviewed: now.toISOString(),
          due_at: sched.nextDueAtISO,
          first_reviewed_at: now.toISOString(),
        })
      }
    } catch {}
    
    // Move to next card
    setTimeout(() => {
      if (currentCardIndex < gameCards.length - 1) {
        setCurrentCardIndex(prev => prev + 1)
        setUserAnswer('')
        setShowAnswer(false)
        setSelectedOption(null)
        if (gameMode === 'quick-quiz') {
          setTimeLeft(30)
        }
      } else {
        endGame()
      }
      setAwaitingNext(false)
    }, 1500)
  }

  const endGame = () => {
    const totalTime = (Date.now() - gameStartTime) / 1000
    setGameStats(prev => ({ ...prev, totalTime }))
    setGameActive(false)
    
    toast({
      title: "Game Complete! 🏆",
      description: `Score: ${gameStats.correct}/${gameCards.length} correct`,
    })
  }

  const resetGame = () => {
    setGameMode('select')
    setGameActive(false)
    setCurrentCardIndex(0)
    setGameStats({ correct: 0, incorrect: 0, streak: 0, totalTime: 0 })
    setUserAnswer('')
    setShowAnswer(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading games...</p>
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
              <Gamepad2 className="w-6 h-6 text-purple-600" />
              <span className="text-xl font-bold text-purple-600">Flashy</span>
            </div>
            <div className="hidden md:flex gap-4">
              <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard')}>Home</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/flashcards')}>Flashcards</Button>
              <Button variant="default" size="sm">Games</Button>
              <Button variant="ghost" size="sm" onClick={() => router.push('/profile')}>Profile</Button>
            </div>
          </div>
          <Button variant="outline" onClick={() => supabase.auth.signOut()}>
            Logout
          </Button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {gameMode === 'select' ? (
          <>
            {/* Game Selection */}
            <div className="mb-8 text-center">
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Learning Games</h1>
              <p className="text-gray-600 text-lg">Make learning fun with interactive games</p>
            </div>

            {/* Set Selection */}
            <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Choose a Flashcard Set
                </CardTitle>
              </CardHeader>
              <CardContent>
                {flashcardSets.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No flashcard sets available</p>
                    <Button onClick={() => router.push('/flashcards')} className="bg-purple-600 hover:bg-purple-700">
                      Create Your First Set
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {flashcardSets.map((set) => (
                      <div
                        key={set.id}
                        className={`p-4 border rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                          selectedSet?.id === set.id ? 'bg-purple-50 border-purple-200 shadow-md' : 'hover:bg-gray-50 hover:shadow-md'
                        }`}
                        onClick={() => {
                          setSelectedSet(set)
                          loadFlashcards(set.id)
                        }}
                      >
                        <h4 className="font-medium text-gray-900">{set.name}</h4>
                        {set.description && (
                          <p className="text-sm text-gray-600 mt-1">{set.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Modes */}
            {selectedSet && flashcards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-purple-100 to-purple-200" onClick={() => startGame('falling-blocks')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-600" />
                      Falling Blocks
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Fit blocks together while answering flashcard questions at checkpoints.
                    </p>
                    <Button className="w-full bg-purple-600 hover:bg-purple-700">
                      <Play className="w-4 h-4 mr-2" />
                      Play Now
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-green-100 to-green-200" onClick={() => startGame('runner')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-green-600" />
                      Runner Challenge
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Run and avoid obstacles while answering questions to continue.
                    </p>
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Running
                    </Button>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 border-0 bg-gradient-to-br from-blue-100 to-blue-200" onClick={() => startGame('quick-quiz')}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      Quick Quiz
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-4">
                      Rapid-fire multiple choice questions to test your knowledge.
                    </p>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700">
                      <Play className="w-4 h-4 mr-2" />
                      Start Quiz
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Game Interface */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                    {gameMode === 'falling-blocks' && 'Falling Blocks'}
                    {gameMode === 'runner' && 'Runner Challenge'}
                    {gameMode === 'quick-quiz' && 'Quick Quiz'}
                  </h1>
                  <p className="text-gray-600">{selectedSet?.name}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={resetGame}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Back to Games
                  </Button>
                </div>
              </div>

              {/* Game Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{gameStats.correct}</div>
                    <div className="text-sm text-gray-600">Correct</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-red-600">{gameStats.incorrect}</div>
                    <div className="text-sm text-gray-600">Incorrect</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{gameStats.streak}</div>
                    <div className="text-sm text-gray-600">Streak</div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {currentCardIndex + 1}/{flashcards.length}
                    </div>
                    <div className="text-sm text-gray-600">Progress</div>
                  </CardContent>
                </Card>
              </div>

              <Progress value={(gameCards.length ? (currentCardIndex / gameCards.length) * 100 : 0)} className="mb-6 h-3" />
            </div>

            {/* Game Content */}
            {gameActive && gameCards[currentCardIndex] && (
              <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8">
                  {gameMode === 'falling-blocks' && (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="w-full h-32 bg-gradient-to-b from-purple-100 to-purple-200 rounded-lg relative mb-4 overflow-hidden">
                          <div 
                            className={`absolute w-8 h-8 bg-purple-600 rounded transition-all duration-500 ${blockAnimation ? 'animate-bounce' : ''}`}
                            style={{ 
                              left: `${blockPosition.x}%`, 
                              top: `${blockPosition.y}%`,
                              transform: 'translate(-50%, -50%)'
                            }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Block cleared! Answer the question to continue:</p>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-purple-600">{gameCards[currentCardIndex].term}</h3>
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="mb-4 text-center text-lg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const isCorrect = userAnswer.toLowerCase().trim() === gameCards[currentCardIndex].definition.toLowerCase().trim()
                            handleAnswer(isCorrect)
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-center mb-4">
                        <Button variant={confidence===0.3? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.3)}>Low</Button>
                        <Button variant={confidence===0.6? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.6)}>Med</Button>
                        <Button variant={confidence===0.9? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.9)}>High</Button>
                      </div>
                      <Button 
                        onClick={() => {
                          const isCorrect = userAnswer.toLowerCase().trim() === gameCards[currentCardIndex].definition.toLowerCase().trim()
                          handleAnswer(isCorrect)
                        }}
                        disabled={!userAnswer.trim()}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        Submit Answer
                      </Button>
                    </div>
                  )}

                  {gameMode === 'runner' && (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="w-full h-32 bg-gradient-to-r from-green-100 to-green-200 rounded-lg relative mb-4 overflow-hidden">
                          <div 
                            className={`absolute bottom-2 w-6 h-6 bg-green-600 rounded-full transition-all duration-300 ${runnerAnimation ? 'animate-pulse' : ''}`}
                            style={{ left: `${runnerPosition}%`, transform: 'translateX(-50%)' }}
                          />
                          {obstacles.map((obstacle, index) => (
                            <div
                              key={index}
                              className="absolute w-4 h-8 bg-red-500 rounded animate-pulse"
                              style={{ 
                                left: `${obstacle.x}%`, 
                                bottom: '8px',
                                transform: 'translateX(-50%)'
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-sm text-gray-600 mb-4">Checkpoint reached! Answer to continue running:</p>
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-4 text-green-600">{gameCards[currentCardIndex].term}</h3>
                      <Input
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Type your answer..."
                        className="mb-4 text-center text-lg"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            const isCorrect = userAnswer.toLowerCase().trim() === gameCards[currentCardIndex].definition.toLowerCase().trim()
                            handleAnswer(isCorrect)
                          }
                        }}
                      />
                      <div className="flex gap-2 justify-center mb-4">
                        <Button variant={confidence===0.3? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.3)}>Low</Button>
                        <Button variant={confidence===0.6? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.6)}>Med</Button>
                        <Button variant={confidence===0.9? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.9)}>High</Button>
                      </div>
                      <Button 
                        onClick={() => {
                          const isCorrect = userAnswer.toLowerCase().trim() === gameCards[currentCardIndex].definition.toLowerCase().trim()
                          handleAnswer(isCorrect)
                        }}
                        disabled={!userAnswer.trim()}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Continue Running
                      </Button>
                    </div>
                  )}

                  {gameMode === 'quick-quiz' && (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="text-4xl font-bold text-blue-600 mb-2">{timeLeft}s</div>
                        <Progress value={(timeLeft / 30) * 100} className="mb-4 h-3" />
                      </div>
                      
                      <h3 className="text-2xl font-bold mb-6 text-blue-600">{gameCards[currentCardIndex].term}</h3>
                      <div className="grid grid-cols-1 gap-3">
                        {quizOptions.map((option, index) => (
                          <Button
                            key={index}
                            variant={selectedOption === option ? "default" : "outline"}
                            className={`p-4 text-left justify-start transition-all duration-300 ${
                              selectedOption === option ? 'bg-blue-600 text-white' : 'hover:bg-blue-50'
                            }`}
                            onClick={() => {
                              setSelectedOption(option)
                              handleAnswer(option === correctAnswer)
                            }}
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                      <div className="flex gap-2 justify-center mt-4">
                        <Button variant={confidence===0.3? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.3)}>Low</Button>
                        <Button variant={confidence===0.6? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.6)}>Med</Button>
                        <Button variant={confidence===0.9? 'default':'outline'} size="sm" onClick={()=>setConfidence(0.9)}>High</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Game Over Screen */}
            {!gameActive && gameStats.totalTime > 0 && (
              <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-white/90 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                  <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">Game Complete!</h2>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{gameStats.correct}</div>
                      <div className="text-sm text-gray-600">Correct Answers</div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">
                        {gameCards.length ? Math.round((gameStats.correct / gameCards.length) * 100) : 0}%
                      </div>
                      <div className="text-sm text-gray-600">Accuracy</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-4 justify-center">
                    <Button onClick={() => startGame(gameMode)} className="bg-purple-600 hover:bg-purple-700">
                      <Play className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                    <Button variant="outline" onClick={resetGame}>
                      Choose Different Game
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}