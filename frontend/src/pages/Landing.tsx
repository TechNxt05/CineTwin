import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Sparkles, Play } from 'lucide-react'

const UNIVERSES = [
  'Stranger Things',
  'Squid Game',
  'Marvel',
  'DC',
  'Harry Potter',
  'Doraemon',
  'Shinchan',
  'Death Note',
  'Panchayat',
  'Young Sheldon',
  'Modern Family'
]

export default function Landing() {
  const [name, setName] = useState('')
  const [selectedUniverses, setSelectedUniverses] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleUniverseToggle = (universe: string) => {
    if (universe === 'All') {
      setSelectedUniverses(UNIVERSES)
    } else {
      setSelectedUniverses(prev => {
        if (prev.includes(universe)) {
          return prev.filter(u => u !== universe)
        } else {
          return [...prev, universe]
        }
      })
    }
  }

  const handleStart = async () => {
    if (!name.trim()) {
      toast.error('Please enter your name')
      return
    }

    if (selectedUniverses.length === 0) {
      toast.error('Please select at least one universe')
      return
    }

    setLoading(true)
    try {
      const quizData = {
        name: name.trim(),
        universes: selectedUniverses,
        answers: [],
        songs: [],
        movies: []
      }
      localStorage.setItem('quizData', JSON.stringify(quizData))

      // Artificial delay for effect
      await new Promise(resolve => setTimeout(resolve, 800))

      navigate('/quiz')
    } catch (error) {
      toast.error('Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl -z-10 animate-pulse" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl -z-10 animate-pulse delay-1000" />

      <div className="max-w-2xl w-full z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center justify-center p-3 mb-4 rounded-full bg-slate-800/50 backdrop-blur border border-slate-700">
            <Sparkles className="w-5 h-5 text-yellow-400 mr-2" />
            <span className="text-yellow-100 font-medium">AI-Powered Personality Match</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient drop-shadow-lg">
            Which Character <br /> Are You?
          </h1>
          <p className="text-lg text-slate-300 max-w-lg mx-auto leading-relaxed">
            Discover which fictional character matches your soul through our advanced psychological quiz and media analysis.
          </p>
        </motion.div>

        <Card className="border-t border-white/20">
          <div className="space-y-8">
            {/* Name Input */}
            <div className="space-y-2">
              <label htmlFor="name" className="block text-sm font-medium text-slate-300 ml-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950/50 border border-slate-700 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-white placeholder-slate-500 transition-all"
                placeholder="Enter your name..."
                maxLength={50}
              />
            </div>

            {/* Universe Selection */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-slate-300 ml-1">
                Select Universes
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {UNIVERSES.map((universe) => (
                  <motion.button
                    key={universe}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleUniverseToggle(universe)}
                    className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedUniverses.includes(universe)
                        ? 'bg-primary/20 border-primary text-primary-200 shadow-[0_0_15px_rgba(56,189,248,0.3)]'
                        : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                      }`}
                  >
                    {universe}
                  </motion.button>
                ))}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedUniverses(UNIVERSES)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 border ${selectedUniverses.length === UNIVERSES.length
                      ? 'bg-purple-500/20 border-purple-500 text-purple-200 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
                      : 'bg-slate-900/40 border-slate-700 text-slate-400 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                >
                  Select All
                </motion.button>
              </div>
            </div>

            {/* Start Button */}
            <Button
              onClick={handleStart}
              disabled={loading || !name.trim() || selectedUniverses.length === 0}
              className="w-full text-lg shadow-xl shadow-blue-500/20"
              size="lg"
              isLoading={loading}
            >
              Start Adventure
              {!loading && <Play className="w-5 h-5 ml-2 fill-current" />}
            </Button>
          </div>
        </Card>

        <div className="text-center mt-8 text-sm text-slate-500 font-medium">
          <p>Powered by Google Gemini AI • 15+ Universes Support</p>
        </div>
      </div>
    </div>
  )
}
