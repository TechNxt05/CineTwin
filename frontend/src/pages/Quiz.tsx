import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Music, Film, Star, User, Trophy, Crown } from 'lucide-react'
import { apiService } from '../services/api'
import { Question, Answer } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])

  // Media Preferences
  const [songs, setSongs] = useState<string[]>(['', '', ''])
  const [movies, setMovies] = useState<string[]>(['', '', ''])

  // New Preferences
  const [favBollywood, setFavBollywood] = useState('')
  const [favHollywood, setFavHollywood] = useState('')
  const [favCricketer, setFavCricketer] = useState('')
  const [favPersonality, setFavPersonality] = useState('')

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [step, setStep] = useState<'quiz' | 'favorites'>('quiz')
  const navigate = useNavigate()

  useEffect(() => {
    // 1. Load preference first
    const stored = localStorage.getItem('quizData')
    let count = 20
    if (stored) {
      const data = JSON.parse(stored)
      count = data.questionCount || 20

      // Load other data
      setAnswers(data.answers || [])
      setSongs(data.songs || ['', '', ''])
      setMovies(data.movies || ['', '', ''])
      setFavBollywood(data.favBollywood || '')
      setFavHollywood(data.favHollywood || '')
      setFavCricketer(data.favCricketer || '')
      setFavPersonality(data.favPersonality || '')
    }

    // 2. Load questions with count
    loadQuestions(count)
    // Removed loadQuizData call as we did it inline
  }, [])

  const loadQuestions = async (count: number) => {
    try {
      const questionsData = await apiService.getQuestions(count)
      setQuestions(questionsData)
    } catch (error) {
      toast.error('Failed to load questions')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const saveQuizData = () => {
    const stored = localStorage.getItem('quizData')
    if (stored) {
      const data = JSON.parse(stored)
      data.answers = answers
      data.songs = songs
      data.movies = movies
      data.favBollywood = favBollywood
      data.favHollywood = favHollywood
      data.favCricketer = favCricketer
      data.favPersonality = favPersonality
      localStorage.setItem('quizData', JSON.stringify(data))
    }
  }

  const handleAnswer = (questionId: number, optionId: string) => {
    const newAnswers = answers.filter(a => a.question_id !== questionId)
    newAnswers.push({ question_id: questionId, option_id: optionId })
    setAnswers(newAnswers)
    saveQuizData()
    // Auto advance
    setTimeout(handleNext, 250)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setStep('favorites')
    }
  }

  const handlePrevious = () => {
    if (step === 'favorites') {
      setStep('quiz')
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSongChange = (index: number, value: string) => {
    const newSongs = [...songs]
    newSongs[index] = value
    setSongs(newSongs)
    saveQuizData()
  }

  const handleMovieChange = (index: number, value: string) => {
    const newMovies = [...movies]
    newMovies[index] = value
    setMovies(newMovies)
    saveQuizData()
  }

  const handleSubmit = async () => {
    const stored = localStorage.getItem('quizData')
    if (!stored) {
      toast.error('Quiz data not found')
      navigate('/')
      return
    }

    const data = JSON.parse(stored)
    if (answers.length < questions.length) {
      toast.error('Please answer all questions')
      return
    }

    setSubmitting(true)
    try {
      // Combine actors into one array for API
      const favorite_actors = [favBollywood, favHollywood].filter(s => s.trim())

      const result = await apiService.submitQuiz({
        name: data.name,
        universes: data.universes,
        answers,
        songs: songs.filter(s => s.trim()),
        movies: movies.filter(m => m.trim()),
        favorite_actors,
        favorite_cricketer: favCricketer,
        favorite_personality: favPersonality
      })

      localStorage.setItem('quizResult', JSON.stringify(result))
      navigate('/results')
    } catch (error) {
      toast.error('Failed to submit quiz')
      console.error(error)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-slate-400">Summoning questions...</p>
        </div>
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
        <div className="text-center max-w-md">
          <h2 className="text-xl font-bold text-red-400 mb-2">No Questions Found</h2>
          <p className="text-slate-400 mb-6">
            The quiz questions couldn't be loaded. Please ensure the backend is running and the database is seeded.
          </p>
          <Button onClick={() => navigate('/')} variant="secondary">
            Return Home
          </Button>
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.question_id === currentQuestion.id)
  const isFavorites = step === 'favorites'
  const progress = isFavorites ? 100 : ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 text-slate-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 && !isFavorites}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-sm font-medium">
              {isFavorites ? 'Final Step' : `Question ${currentQuestionIndex + 1} / ${questions.length}`}
            </div>
            <div className="w-20"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden shadow-inner">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!isFavorites ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="backdrop-blur-xl bg-slate-900/60 border-slate-700/50 shadow-2xl">
                <h2 className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-8 leading-tight">
                  {currentQuestion.question}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option, idx) => (
                    <motion.button
                      key={option.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      onClick={() => handleAnswer(currentQuestion.id, option.id)}
                      className={`w-full p-4 md:p-5 text-left rounded-xl border transition-all duration-300 group relative overflow-hidden ${currentAnswer?.option_id === option.id
                        ? 'border-primary/50 bg-primary/10 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80'
                        }`}
                    >
                      <div className={`absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent opacity-0 transition-opacity duration-300 ${currentAnswer?.option_id === option.id ? 'opacity-100' : 'group-hover:opacity-100'}`} />
                      <span className="font-medium text-lg relative z-10">{option.text}</span>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="favorites-input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card className="backdrop-blur-xl bg-slate-900/60 border-slate-700/50 shadow-2xl">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold text-white mb-2 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    The Final Touch
                  </h2>
                  <p className="text-slate-400">
                    Your favorites help the AI understand your true vibe.
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  {/* Media Column */}
                  <div className="space-y-6">
                    <div className="flex items-center text-blue-400 mb-4 border-b border-white/10 pb-2">
                      <Music className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold text-lg">Soundtrack of Life</h3>
                    </div>

                    <div className="space-y-3">
                      {songs.map((song, index) => (
                        <input
                          key={`song-${index}`}
                          type="text"
                          value={song}
                          onChange={(e) => handleSongChange(index, e.target.value)}
                          className="input-field w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all hover:border-slate-600"
                          placeholder={`Favorite Song #${index + 1}`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center text-purple-400 mb-4 border-b border-white/10 pb-2 pt-2">
                      <Film className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold text-lg">Cinematic Taste</h3>
                    </div>

                    <div className="space-y-3">
                      {movies.map((movie, index) => (
                        <input
                          key={`movie-${index}`}
                          type="text"
                          value={movie}
                          onChange={(e) => handleMovieChange(index, e.target.value)}
                          className="input-field w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all hover:border-slate-600"
                          placeholder={`Favorite Movie #${index + 1}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* People Column */}
                  <div className="space-y-6">
                    <div className="flex items-center text-yellow-400 mb-4 border-b border-white/10 pb-2">
                      <Star className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold text-lg">Icons & Idols</h3>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-slate-400 mb-1 ml-1">Bollywood Favorite</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={favBollywood}
                            onChange={(e) => {
                              setFavBollywood(e.target.value)
                              saveQuizData()
                            }}
                            className="input-field w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            placeholder="e.g. Shah Rukh Khan"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-1 ml-1">Hollywood Favorite</label>
                        <div className="relative">
                          <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={favHollywood}
                            onChange={(e) => {
                              setFavHollywood(e.target.value)
                              saveQuizData()
                            }}
                            className="input-field w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500"
                            placeholder="e.g. Leonardo DiCaprio"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-1 ml-1">Cricket Legend</label>
                        <div className="relative">
                          <Trophy className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={favCricketer}
                            onChange={(e) => {
                              setFavCricketer(e.target.value)
                              saveQuizData()
                            }}
                            className="input-field w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-blue-400 focus:ring-1 focus:ring-blue-400"
                            placeholder="e.g. MS Dhoni"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm text-slate-400 mb-1 ml-1">Role Model / Personality</label>
                        <div className="relative">
                          <Crown className="absolute left-3 top-3.5 w-4 h-4 text-slate-500" />
                          <input
                            type="text"
                            value={favPersonality}
                            onChange={(e) => {
                              setFavPersonality(e.target.value)
                              saveQuizData()
                            }}
                            className="input-field w-full pl-10 pr-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-green-400 focus:ring-1 focus:ring-green-400"
                            placeholder="e.g. Elon Musk"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-6 border-t border-slate-800">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="lg"
                    isLoading={submitting}
                    className="w-full md:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 border-0 shadow-lg shadow-blue-500/20"
                  >
                    Reveal My Character
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
