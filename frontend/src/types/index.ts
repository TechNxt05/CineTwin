export interface Question {
  id: number
  question: string
  trait: string
  options: {
    id: string
    text: string
    score: number
  }[]
}

export interface Character {
  name: string
  alias?: string
  universe: string
  series: string
  image_url: string
  bio: string
  traits: {
    introversion: number
    humor: number
    bravery: number
    loyalty: number
    ambition: number
    compassion: number
    cunning: number
    responsibility: number
    sarcasm: number
    optimism: number
  }
}

export interface Answer {
  question_id: number
  option_id: string
}

export interface QuizData {
  name: string
  universe: string[]
  answers: Answer[]
  songs: string[]
  movies: string[]
}

export interface CharacterMatch {
  character: Character
  similarity: number
}

export interface TopMatches {
  [universe: string]: CharacterMatch[]
}

export interface QuizResult {
  topMatches: TopMatches
  finalVector: number[]
}

export interface AmritanshuFeedback {
  name: string
  selected_trait: string
  note: string
  consent: boolean
}

export interface MediaTraits {
  input: string
  canonical_title: string
  type: 'song' | 'movie'
  confidence: number
  traits: {
    introversion: number
    humor: number
    bravery: number
    loyalty: number
    ambition: number
    compassion: number
    cunning: number
    responsibility: number
    sarcasm: number
    optimism: number
  }
  notes: string
  source: 'gemini' | 'curated'
  createdAt: string
}
