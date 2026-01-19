import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'
import { Heart, Shield, Crown, Users, Brain, CheckCircle, Sun, Printer, RefreshCw, Trophy } from 'lucide-react'
import { apiService } from '../services/api'
import { CharacterMatch, AmritanshuFeedback } from '../types'
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
  const [result, setResult] = useState<any>(null) // Relaxed type for new structure
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

  // Handle both old and new response structures
  // Old: result.topMatches (Map)
  // New: result.matches (List)
  const isGlobalMatch = Array.isArray(result.matches);
  const matchesList = isGlobalMatch ? result.matches : [];

  // For non-global (map/grouped) view
  const matchesMap = !isGlobalMatch ? result.topMatches : {};

  return (
    <div className="min-h-screen p-4 md:p-8 bg-slate-950 text-slate-200 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center p-3 mb-6 rounded-full bg-yellow-500/10 border border-yellow-500/30">
            <Crown className="w-6 h-6 text-yellow-400 mr-2" />
            <span className="text-yellow-200 font-bold uppercase tracking-wider">Identity Confirmed</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-purple-300 drop-shadow-lg">
            Your Multiverse Soul
          </h1>
          <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
            The AI has analyzed your psyche across {isGlobalMatch ? matchesList.length + " potential candidates" : "the selected universes"}.
          </p>
        </motion.div>

        {/* Global Match Hero View */}
        {isGlobalMatch && matchesList.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="mb-20 relative"
          >
            {/* Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-full blur-[100px] -z-10" />

            <div className="flex flex-col md:flex-row items-center justify-center gap-12">
              {/* Use the top match as the hero */}
              {(() => {
                const topMatch = matchesList[0];
                const MatchIcon = TRAIT_ICONS[Object.keys(topMatch.character.traits).reduce((a, b) => topMatch.character.traits[a] > topMatch.character.traits[b] ? a : b) as keyof typeof TRAIT_ICONS];

                return (
                  <Card className="max-w-4xl w-full border-primary/30 bg-slate-900/80 backdrop-blur-xl shadow-2xl overflow-hidden relative border-2">
                    <div className="absolute top-0 right-0 p-6 bg-yellow-500 text-slate-950 font-black text-xl z-20 rounded-bl-3xl shadow-lg">
                      #1 MATCH
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 p-2">
                      <div className="relative group">
                        <div className="aspect-[3/4] rounded-xl overflow-hidden shadow-2xl">
                          {topMatch.character.image_url ? (
                            <img src={topMatch.character.image_url} alt={topMatch.character.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                          ) : (
                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-8xl">
                              {topMatch.character.name[0]}
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-4 left-4 right-4 bg-slate-950/90 backdrop-blur-md rounded-lg p-3 border border-slate-700 text-center">
                          <span className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                            {Math.round(topMatch.score * 100)}% Match
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col justify-center space-y-6 md:pr-6">
                        <div>
                          <h2 className="text-4xl font-bold text-white mb-2">{topMatch.character.name}</h2>
                          <span className="inline-block px-3 py-1 rounded-full bg-slate-800 border border-slate-600 text-slate-300 text-sm font-medium">
                            {topMatch.character.universe}
                          </span>
                        </div>

                        <p className="text-lg text-slate-300 leading-relaxed italic border-l-4 border-primary pl-4">
                          "{topMatch.character.bio}"
                        </p>

                        <div className="space-y-4">
                          <h3 className="font-semibold text-slate-400 uppercase tracking-widest text-sm flex items-center">
                            <MatchIcon className="w-4 h-4 mr-2" />
                            Dominant Traits
                          </h3>
                          <div className="space-y-3">
                            {getTopTraits(topMatch.character).map(({ trait, value }) => (
                              <div key={trait}>
                                <div className="flex justify-between text-sm mb-1">
                                  <span className="text-white font-medium capitalize">{trait}</span>
                                  <span className="text-primary-400">{Math.round(value * 100)}%</span>
                                </div>
                                <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${value * 100}%` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                )
              })()}
            </div>
          </motion.div>
        )}

        {/* Global Leaderboard (Grid) */}
        {isGlobalMatch && matchesList.length > 1 && (
          <div className="mb-20">
            <h3 className="text-2xl font-bold text-white mb-8 flex items-center">
              <Trophy className="w-6 h-6 text-yellow-500 mr-3" />
              The Runner Ups
            </h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {matchesList.slice(1, 9).map((match: any, idx: number) => (
                <motion.div
                  key={match.character._id || match.character.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="h-full hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 hover:-translate-y-1">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="h-16 w-16 rounded-full bg-slate-800 overflow-hidden border border-slate-700 shrink-0">
                        {match.character.image_url && <img src={match.character.image_url} className="w-full h-full object-cover" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-lg text-white leading-tight">{match.character.name}</h4>
                        <span className="text-xs text-slate-400">{match.character.universe}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center bg-slate-900/50 p-2 rounded-lg">
                      <span className="text-sm text-slate-500">Match Score</span>
                      <span className="font-bold text-primary">{Math.round(match.score * 100)}%</span>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Categories View (Old Logic fallback or if Map used) */}
        {!isGlobalMatch && (
          <div className="space-y-12 mb-16">
            {Object.entries(matchesMap).map(([universe, matches]: [string, any], universeIndex: number) => (
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
                  {matches.map((match: CharacterMatch, index: number) => (
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
        )}

        {/* Feedback Section */}
        <Card className="mb-12 border-primary/20 bg-primary/5 backdrop-blur-xl">
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
              className="w-full shadow-lg shadow-primary/20"
              isLoading={submittingFeedback}
            >
              Submit Training Data
            </Button>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-20">
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
