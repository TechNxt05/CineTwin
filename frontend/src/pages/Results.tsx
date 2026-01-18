import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Heart, Shield, Crown, Users, Brain, CheckCircle, Sun, Printer, RefreshCw } from 'lucide-react'
import { apiService } from '../services/api'
import { QuizResult, CharacterMatch, AmritanshuFeedback } from '../types'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'

const TRAIT_ICONS = {
  introversion: Users,
  humor: Heart,
  bravery: Shield,
  loyalty: Heart,
  ambition: Crown,
  compassion: Heart,
  cunning: Brain,
  responsibility: CheckCircle,
  sarcasm: Brain,
  optimism: Sun
}

const TRAIT_LABELS = {
  introversion: 'Introversion',
  humor: 'Humor',
  bravery: 'Bravery',
  loyalty: 'Loyalty',
  ambition: 'Ambition',
  compassion: 'Compassion',
  cunning: 'Cunning',
  responsibility: 'Responsibility',
  sarcasm: 'Sarcasm',
  optimism: 'Optimism'
}

export default function Results() {
  const [result, setResult] = useState<QuizResult | null>(null)
  const [feedback, setFeedback] = useState<AmritanshuFeedback>({
    name: '',
    selected_trait: '',
    note: '',
    consent: false
  })
  const [submittingFeedback, setSubmittingFeedback] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    loadResults()
  }, [])

  const loadResults = () => {
    const stored = localStorage.getItem('quizResult')
    if (stored) {
      setResult(JSON.parse(stored))
    } else {
      navigate('/')
    }

    const quizData = localStorage.getItem('quizData')
    if (quizData) {
      const data = JSON.parse(quizData)
      setFeedback(prev => ({ ...prev, name: data.name }))
    }
  }

  const handleFeedbackSubmit = async () => {
    if (!feedback.selected_trait || !feedback.consent) {
      toast.error('Please select a trait and provide consent')
      return
    }

    setSubmittingFeedback(true)
    try {
      await apiService.submitAmritanshuFeedback(feedback)
      toast.success('Thank you for your feedback!')
      setFeedback(prev => ({ ...prev, selected_trait: '', note: '', consent: false }))
    } catch (error) {
      toast.error('Failed to submit feedback')
    } finally {
      setSubmittingFeedback(false)
    }
  }

  const getTopTraits = (character: any) => {
    const traits = character.traits
    return Object.entries(traits)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 3)
      .map(([trait, value]) => ({ trait, value: value as number }))
  }

  if (!result) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-200">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold mb-4 text-white">
            Based on your answers, you are...
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Our AI analysis matches you with these characters across different universes.
          </p>
        </motion.div>

        {/* Results by Universe */}
        <div className="space-y-12 mb-16">
          {Object.entries(result.topMatches).map(([universe, matches], universeIndex) => (
            <motion.div
              key={universe}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: universeIndex * 0.1 }}
            >
              <div className="flex items-center mb-6">
                <div className="h-px bg-slate-800 flex-1"></div>
                <h2 className="px-4 text-2xl font-bold text-primary-300 uppercase tracking-widest">
                  {universe}
                </h2>
                <div className="h-px bg-slate-800 flex-1"></div>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {matches.map((match: CharacterMatch, index) => (
                  <Card key={match.character.name} hoverEffect className="relative overflow-hidden group">
                    {/* Rank Badge */}
                    <div className="absolute top-0 right-0 bg-gradient-to-bl from-primary to-blue-600 text-white w-12 h-12 flex items-center justify-center font-bold text-lg rounded-bl-2xl shadow-lg z-10">
                      #{index + 1}
                    </div>

                    <div className="pt-2 text-center relative z-0">
                      <div className="mb-4 relative inline-block">
                        <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-primary/30 flex items-center justify-center mx-auto overflow-hidden">
                          {match.character.image_url ? (
                            <img src={match.character.image_url} alt={match.character.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-3xl font-bold text-primary-500">{match.character.name[0]}</span>
                          )}
                        </div>
                        <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-full px-3 py-1">
                          <span className="text-xs font-bold text-primary-400">{Math.round(match.similarity * 100)}% Match</span>
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-white mb-1 group-hover:text-primary-400 transition-colors">
                        {match.character.name}
                      </h3>
                      {match.character.alias && (
                        <p className="text-sm text-slate-400 italic mb-3">"{match.character.alias}"</p>
                      )}

                      <p className="text-sm text-slate-400 mb-6 leading-relaxed min-h-[60px]">
                        {match.character.bio}
                      </p>

                      <div className="space-y-3 bg-slate-900/50 rounded-lg p-3">
                        {getTopTraits(match.character).map(({ trait, value }) => {
                          const Icon = TRAIT_ICONS[trait as keyof typeof TRAIT_ICONS]
                          return (
                            <div key={trait} className="flex items-center justify-between text-sm">
                              <div className="flex items-center text-slate-300">
                                <Icon className="w-4 h-4 mr-2 text-primary-500" />
                                <span>{TRAIT_LABELS[trait as keyof typeof TRAIT_LABELS]}</span>
                              </div>
                              <div className="flex items-center">
                                <div className="w-16 h-1.5 bg-slate-700 rounded-full mr-2 overflow-hidden">
                                  <div className="bg-primary h-full rounded-full" style={{ width: `${value * 100}%` }}></div>
                                </div>
                                <span className="font-medium text-white">{Math.round(value * 100)}%</span>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Feedback Section */}
        <Card className="mb-12 border-primary/20 bg-primary/5">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-white mb-2">
              Help Refine the AI Core
            </h2>
            <p className="text-slate-400">
              Contribute to Amritanshu's digital clone training by providing your feedback.
            </p>
          </div>

          <div className="max-w-2xl mx-auto space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Which trait best describes Amritanshu?
              </label>
              <select
                value={feedback.selected_trait}
                onChange={(e) => setFeedback(prev => ({ ...prev, selected_trait: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-primary"
              >
                <option value="">Select a trait...</option>
                {Object.entries(TRAIT_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Additional thoughts (optional)
              </label>
              <textarea
                value={feedback.note}
                onChange={(e) => setFeedback(prev => ({ ...prev, note: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-primary"
                rows={3}
                placeholder="Any specific observations..."
              />
            </div>

            <div className="flex items-start bg-slate-900/50 p-4 rounded-lg border border-slate-700">
              <input
                type="checkbox"
                id="consent"
                checked={feedback.consent}
                onChange={(e) => setFeedback(prev => ({ ...prev, consent: e.target.checked }))}
                className="mt-1 mr-3 rounded border-slate-600 bg-slate-800 text-primary focus:ring-primary"
              />
              <label htmlFor="consent" className="text-sm text-slate-400">
                I consent to providing this feedback for the purpose of training Amritanshu's AI model.
              </label>
            </div>

            <Button
              onClick={handleFeedbackSubmit}
              disabled={submittingFeedback || !feedback.selected_trait || !feedback.consent}
              className="w-full"
              isLoading={submittingFeedback}
            >
              Submit Training Data
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Button variant="secondary" onClick={() => navigate('/')}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Restart Quiz
          </Button>
          <Button variant="primary" onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" />
            Print Results
          </Button>
        </div>
      </div>
    </div>
  )
}
