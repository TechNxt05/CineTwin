import os
import json
import math
import requests
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from dotenv import load_dotenv
import google.generativeai as genai

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# MongoDB connection
client = MongoClient(os.getenv('MONGODB_URI', 'mongodb://localhost:27017/'))
db = client.whichcharacter

# Gemini API setup
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))
model = genai.GenerativeModel('gemini-pro')

# Configuration
ALPHA = float(os.getenv('ALPHA', 0.8))  # Weight for question vector vs media vector
ADMIN_TOKEN = os.getenv('ADMIN_TOKEN', 'admin123')

# Trait names for consistency
TRAIT_NAMES = [
    'introversion', 'humor', 'bravery', 'loyalty', 'ambition',
    'compassion', 'cunning', 'responsibility', 'sarcasm', 'optimism'
]

def cosine_similarity(vec1, vec2):
    """Calculate cosine similarity between two vectors"""
    if len(vec1) != len(vec2):
        return 0
    
    dot_product = sum(a * b for a, b in zip(vec1, vec2))
    magnitude1 = math.sqrt(sum(a * a for a in vec1))
    magnitude2 = math.sqrt(sum(a * a for a in vec2))
    
    if magnitude1 == 0 or magnitude2 == 0:
        return 0
    
    return dot_product / (magnitude1 * magnitude2)

def build_question_vector(answers):
    """Build trait vector from user answers"""
    trait_scores = {trait: [] for trait in TRAIT_NAMES}
    
    for answer in answers:
        question_id = answer['question_id']
        option_id = answer['option_id']
        
        # Find the question and option
        question = db.questions.find_one({'id': question_id})
        if not question:
            continue
            
        option = next((opt for opt in question['options'] if opt['id'] == option_id), None)
        if not option:
            continue
            
        trait = question['trait']
        trait_scores[trait].append(option['score'])
    
    # Average scores for each trait
    trait_vector = []
    for trait in TRAIT_NAMES:
        if trait_scores[trait]:
            trait_vector.append(sum(trait_scores[trait]) / len(trait_scores[trait]))
        else:
            trait_vector.append(0.5)  # Default neutral value
    
    return trait_vector

def build_media_vector(songs, movies):
    """Build trait vector from media preferences"""
    all_media = []
    
    # Get media traits from database or map via Gemini
    for song in songs:
        media_traits = get_or_map_media_traits(song, 'song')
        if media_traits:
            all_media.append(media_traits)
    
    for movie in movies:
        media_traits = get_or_map_media_traits(movie, 'movie')
        if media_traits:
            all_media.append(media_traits)
    
    if not all_media:
        return [0.5] * len(TRAIT_NAMES)  # Default neutral vector
    
    # Average all media trait vectors
    trait_vector = []
    for i, trait in enumerate(TRAIT_NAMES):
        trait_values = [media['traits'][trait] for media in all_media if trait in media['traits']]
        if trait_values:
            trait_vector.append(sum(trait_values) / len(trait_values))
        else:
            trait_vector.append(0.5)
    
    return trait_vector

def get_or_map_media_traits(title, media_type):
    """Get media traits from database or map via Gemini API"""
    # Check if already in database
    existing = db.media_traits.find_one({
        'canonical_title': title.lower().strip(),
        'type': media_type
    })
    
    if existing:
        return existing
    
    # Map via Gemini API
    try:
        mapped_traits = map_media_via_gemini(title, media_type)
        if mapped_traits:
            # Store in database
            db.media_traits.insert_one(mapped_traits)
            return mapped_traits
    except Exception as e:
        print(f"Error mapping media {title}: {e}")
    
    return None

def map_media_via_gemini(title, media_type):
    """Map media title to traits using Gemini API"""
    system_prompt = """You are an assistant that maps a song or movie title to a numeric personality trait vector.
Return ONLY valid JSON (no extra text). Must follow the schema exactly.
If the input is ambiguous or unknown, return 'confidence' < 0.7 and put "notes"."""

    user_prompt = f"""Title: "{title}"
Type: "{media_type}"

Task:
1) Identify the canonical title and year if possible.
2) Based on the content, theme, mood, lyrics/plot, protagonists and tone of the title, map it to the following trait keys with numeric values between 0.0 and 1.0 (float with 2 decimal places):
   introversion, humor, bravery, loyalty, ambition, compassion, cunning, responsibility, sarcasm, optimism

Rules:
- Output EXACTLY one JSON object (no markdown, no commentary) with keys:
  {{
   "input": "<the exact user string>",
   "canonical_title": "<canonical title or empty string>",
   "type": "<song|movie>",
   "confidence": 0.00,
   "traits": {{
     "introversion": 0.00,
     "humor": 0.00,
     "bravery": 0.00,
     "loyalty": 0.00,
     "ambition": 0.00,
     "compassion": 0.00,
     "cunning": 0.00,
     "responsibility": 0.00,
     "sarcasm": 0.00,
     "optimism": 0.00
   }},
   "notes": "<short reason or empty string>"
  }}

- Confidence is a float 0.00–1.00 (0.00 unknown / 1.00 exact).
- Values must be between 0.00 and 1.00, two decimal places.
- If the model is uncertain about the title mapping, set confidence low and fill canonical_title if possible; keep notes explaining.
- Keep "notes" short (1-2 sentences)."""

    try:
        response = model.generate_content(f"{system_prompt}\n\n{user_prompt}")
        result = json.loads(response.text.strip())
        
        # Validate the response
        if 'traits' in result and all(trait in result['traits'] for trait in TRAIT_NAMES):
            result['source'] = 'gemini'
            result['createdAt'] = datetime.utcnow()
            return result
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
    
    return None

def find_top_matches(final_vector, universes):
    """Find top 3 character matches per universe"""
    top_matches = {}
    
    for universe in universes:
        characters = list(db.characters.find({'universe': universe}))
        
        similarities = []
        for char in characters:
            char_vector = [char['traits'][trait] for trait in TRAIT_NAMES]
            similarity = cosine_similarity(final_vector, char_vector)
            similarities.append({
                'character': char,
                'similarity': similarity
            })
        
        # Sort by similarity and take top 3
        similarities.sort(key=lambda x: x['similarity'], reverse=True)
        top_matches[universe] = similarities[:3]
    
    return top_matches

# API Routes

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get all questions"""
    questions = list(db.questions.find({}, {'_id': 0}))
    return jsonify(questions)

@app.route('/api/characters', methods=['GET'])
def get_characters():
    """Get characters filtered by universe"""
    universe = request.args.get('universe')
    limit = int(request.args.get('limit', 10))
    
    query = {}
    if universe and universe != 'All':
        query['universe'] = universe
    
    characters = list(db.characters.find(query, {'_id': 0}).limit(limit))
    return jsonify(characters)

@app.route('/api/score', methods=['POST'])
def calculate_score():
    """Calculate character matches based on user input"""
    data = request.get_json()
    
    name = data.get('name')
    universes = data.get('universe', [])
    answers = data.get('answers', [])
    songs = data.get('songs', [])
    movies = data.get('movies', [])
    
    if not name or not universes or not answers:
        return jsonify({'error': 'Missing required fields'}), 400
    
    # Build vectors
    q_vector = build_question_vector(answers)
    m_vector = build_media_vector(songs, movies)
    
    # Adaptive Alpha Logic
    # If no media is provided, rely 100% on the quiz (alpha = 1.0)
    # If media IS provided, give it significant weight (e.g., 40% quiz, 60% media) to let taste influence the match
    has_media = bool(songs or movies)
    
    if not has_media:
        current_alpha = 1.0
    else:
        # If user provides media, we want it to count. 
        # Using 0.6 means 60% question, 40% media - balanced approach.
        # Or you requested "better logic" - often media is more honest than self-reporting.
        current_alpha = 0.6

    # Combine vectors
    final_vector = []
    for i in range(len(TRAIT_NAMES)):
        final_vector.append(current_alpha * q_vector[i] + (1 - current_alpha) * m_vector[i])
    
    # Find top matches
    top_matches = find_top_matches(final_vector, universes)
    
    # Store result
    result = {
        'name': name,
        'universes': universes,
        'answers': answers,
        'songs': songs,
        'movies': movies,
        'q_vec': q_vector,
        'm_vec': m_vector,
        'final_vec': final_vector,
        'topMatches': top_matches,
        'createdAt': datetime.utcnow()
    }
    
    db.results.insert_one(result)
    
    return jsonify({
        'topMatches': top_matches,
        'finalVector': final_vector
    })

@app.route('/api/feedback/amritanshu', methods=['POST'])
def submit_amritanshu_feedback():
    """Submit feedback for Amritanshu's character traits"""
    data = request.get_json()
    
    name = data.get('name')
    selected_trait = data.get('selected_trait')
    note = data.get('note', '')
    consent = data.get('consent', False)
    
    if not name or not selected_trait or not consent:
        return jsonify({'error': 'Missing required fields'}), 400
    
    feedback = {
        'name': name,
        'selected_trait': selected_trait,
        'note': note,
        'consent': consent,
        'createdAt': datetime.utcnow(),
        'ip': request.remote_addr
    }
    
    db.amritanshu_feedback.insert_one(feedback)
    
    return jsonify({'success': True, 'message': 'Feedback submitted successfully'})

@app.route('/api/media/map', methods=['POST'])
def map_media():
    """Internal endpoint to map media to traits"""
    data = request.get_json()
    title = data.get('title')
    media_type = data.get('type')
    
    if not title or not media_type:
        return jsonify({'error': 'Missing title or type'}), 400
    
    if media_type not in ['song', 'movie']:
        return jsonify({'error': 'Type must be song or movie'}), 400
    
    mapped_traits = map_media_via_gemini(title, media_type)
    
    if mapped_traits:
        # Store in database
        db.media_traits.insert_one(mapped_traits)
        return jsonify(mapped_traits)
    else:
        return jsonify({'error': 'Failed to map media'}), 500

# Admin routes
@app.route('/admin/results', methods=['GET'])
def admin_get_results():
    """Get recent results (admin only)"""
    token = request.headers.get('Authorization')
    if token != f'Bearer {ADMIN_TOKEN}':
        return jsonify({'error': 'Unauthorized'}), 401
    
    limit = int(request.args.get('limit', 50))
    results = list(db.results.find({}, {'_id': 0}).sort('createdAt', -1).limit(limit))
    return jsonify(results)

@app.route('/admin/feedback', methods=['GET'])
def admin_get_feedback():
    """Get Amritanshu feedback (admin only)"""
    token = request.headers.get('Authorization')
    if token != f'Bearer {ADMIN_TOKEN}':
        return jsonify({'error': 'Unauthorized'}), 401
    
    limit = int(request.args.get('limit', 50))
    feedback = list(db.amritanshu_feedback.find({}, {'_id': 0}).sort('createdAt', -1).limit(limit))
    return jsonify(feedback)

@app.route('/admin/media-mapping', methods=['POST'])
def admin_remap_media():
    """Re-run media mapping for missing items (admin only)"""
    token = request.headers.get('Authorization')
    if token != f'Bearer {ADMIN_TOKEN}':
        return jsonify({'error': 'Unauthorized'}), 401
    
    data = request.get_json()
    title = data.get('title')
    media_type = data.get('type')
    
    if not title or not media_type:
        return jsonify({'error': 'Missing title or type'}), 400
    
    # Remove existing mapping
    db.media_traits.delete_many({
        'canonical_title': title.lower().strip(),
        'type': media_type
    })
    
    # Re-map
    mapped_traits = map_media_via_gemini(title, media_type)
    
    if mapped_traits:
        db.media_traits.insert_one(mapped_traits)
        return jsonify({'success': True, 'mapping': mapped_traits})
    else:
        return jsonify({'error': 'Failed to map media'}), 500

@app.route('/admin/stats', methods=['GET'])
def admin_get_stats():
    """Get application statistics (admin only)"""
    token = request.headers.get('Authorization')
    if token != f'Bearer {ADMIN_TOKEN}':
        return jsonify({'error': 'Unauthorized'}), 401
    
    stats = {
        'total_results': db.results.count_documents({}),
        'total_feedback': db.amritanshu_feedback.count_documents({}),
        'total_media_mappings': db.media_traits.count_documents({}),
        'total_characters': db.characters.count_documents({}),
        'total_questions': db.questions.count_documents({}),
        'universes': list(db.characters.distinct('universe'))
    }
    
    return jsonify(stats)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
