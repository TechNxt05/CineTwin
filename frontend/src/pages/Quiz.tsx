import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import { ArrowLeft, ArrowRight, Music, Film } from 'lucide-react'
import { apiService } from '../services/api'
import { Question, Answer } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

export default function Quiz() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [songs, setSongs] = useState<string[]>(['', '', ''])
  const [movies, setMovies] = useState<string[]>(['', '', ''])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showMediaInput, setShowMediaInput] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadQuestions()
    loadQuizData()
  }, [])

  const loadQuestions = async () => {
    try {
      const questionsData = await apiService.getQuestions()
      setQuestions(questionsData)
    } catch (error) {
      toast.error('Failed to load questions')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const loadQuizData = () => {
    const stored = localStorage.getItem('quizData')
    if (stored) {
      const data = JSON.parse(stored)
      setAnswers(data.answers || [])
      setSongs(data.songs || ['', '', ''])
      setMovies(data.movies || ['', '', ''])
    }
  }

  const saveQuizData = () => {
    const stored = localStorage.getItem('quizData')
    if (stored) {
      const data = JSON.parse(stored)
      data.answers = answers
      data.songs = songs.filter(s => s.trim())
      data.movies = movies.filter(m => m.trim())
      localStorage.setItem('quizData', JSON.stringify(data))
    }
  }

  const handleAnswer = (questionId: number, optionId: string) => {
    const newAnswers = answers.filter(a => a.question_id !== questionId)
    newAnswers.push({ question_id: questionId, option_id: optionId })
    setAnswers(newAnswers)
    saveQuizData()
    // Auto advance for smoother flow
    setTimeout(handleNext, 250)
  }

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    } else {
      setShowMediaInput(true)
    }
  }

  const handlePrevious = () => {
    if (showMediaInput) {
      setShowMediaInput(false)
    } else if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
  }

  const handleSongChange = (index: number, value: string) => {
    const newSongs = [...songs]
    newSongs[index] = value
    setSongs(newSongs)
  }

  const handleMovieChange = (index: number, value: string) => {
    const newMovies = [...movies]
    newMovies[index] = value
    setMovies(newMovies)
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
      const result = await apiService.submitQuiz({
        name: data.name,
        universe: data.universes,
        answers,
        songs: songs.filter(s => s.trim()),
        movies: movies.filter(m => m.trim())
      })

      localStorage.setItem('quizResult', JSON.stringify(result))
      navigate('/results')
    } catch (error) {
      toast.error('Failed to submit quiz')
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

  const currentQuestion = questions[currentQuestionIndex]
  const currentAnswer = answers.find(a => a.question_id === currentQuestion.id)
  const progress = showMediaInput ? 100 : ((currentQuestionIndex + 1) / questions.length) * 100

  return (
    <div className="min-h-screen p-4 flex flex-col items-center justify-center bg-slate-950">
      <div className="max-w-3xl w-full">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 text-slate-400">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0 && !showMediaInput}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="text-sm font-medium">
              {showMediaInput ? 'Final Step' : `Question ${currentQuestionIndex + 1} / ${questions.length}`}
            </div>
            <div className="w-20"></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
              className="bg-gradient-to-r from-primary to-purple-500 h-full rounded-full"
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {!showMediaInput ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card>
                <h2 className="text-3xl font-bold text-white mb-8 leading-tight">
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
                      className={`w-full p-5 text-left rounded-xl border-2 transition-all duration-200 group ${currentAnswer?.option_id === option.id
                          ? 'border-primary bg-primary/10 text-primary-200'
                          : 'border-slate-800 bg-slate-900/50 text-slate-300 hover:border-slate-600 hover:bg-slate-800'
                        }`}
                    >
                      <span className="font-medium text-lg">{option.text}</span>
                    </motion.button>
                  ))}
                </div>
              </Card>
            </motion.div>
          ) : (
            <motion.div
              key="media-input"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <Card>
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white mb-2">
                    Refine Your Match
                  </h2>
                  <p className="text-slate-400">
                    Tell us your favorites to help the AI understand your vibe. (Optional)
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-8">
                  <div className="space-y-4">
                    <div className="flex items-center text-primary-400 mb-2">
                      <Music className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold">Top Songs</h3>
                    </div>
                    {songs.map((song, index) => (
                      <input
                        key={index}
                        type="text"
                        value={song}
                        onChange={(e) => handleSongChange(index, e.target.value)}
                        className="input-field w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-primary focus:ring-1 focus:ring-primary"
                        placeholder={`Song title #${index + 1}`}
                      />
                    ))}
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center text-purple-400 mb-2">
                      <Film className="w-5 h-5 mr-2" />
                      <h3 className="font-semibold">Top Movies</h3>
                    </div>
                    {movies.map((movie, index) => (
                      <input
                        key={index}
                        type="text"
                        value={movie}
                        onChange={(e) => handleMovieChange(index, e.target.value)}
                        className="input-field w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg text-white placeholder-slate-600 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                        placeholder={`Movie title #${index + 1}`}
                      />
                    ))}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-800">
                  <Button
                    onClick={handleSubmit}
                    disabled={submitting}
                    size="lg"
                    isLoading={submitting}
                    className="w-full md:w-auto"
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
