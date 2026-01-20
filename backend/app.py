import os
import math
import json
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from pymongo import MongoClient
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
# Allow CORS for all domains for now (or restrict to Vercel app in production)
CORS(app)

# Configure Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB Setup
MONGO_URI = os.getenv("MONGODB_URI") # Updated to MONGODB_URI to match existing env
client = MongoClient(MONGO_URI)
db = client.get_database("whichcharacter")

# Gemini API Setup
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-pro')

# Load Fallback Data
FALLBACK_DATA = {}
try:
    with open('fallback_data.json', 'r') as f:
        FALLBACK_DATA = json.load(f)
    logger.info("Fallback data loaded successfully.")
except Exception as e:
    logger.error(f"Error loading fallback data: {e}")

# Constants
TRAIT_NAMES = [
    "leader", "smart", "kind", "brave", "calm", 
    "funny", "loyal", "honest", "ambitious", "creative",
    "cunning", "optimism", "sarcasm", "responsibility", 
    "compassion", "introversion"
]

# --- Helper Functions ---

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

def map_entity_via_gemini(entity_name, category):
    """
    Map an entity (Song, Movie, Actor, Cricketer) to personality traits using 
    Gemini API with Fallback mechanism.
    """
    if not entity_name:
        return None

    entity_lower = entity_name.strip().lower()
    
    # 1. Check Database Cache
    cached = db.media_traits.find_one({'name': entity_lower, 'type': category})
    if cached:
        logger.info(f"Cache hit for {category}: {entity_name}")
        return {'name': entity_name, 'traits': cached['traits']}

    # 2. Check Local Fallback Data
    # Pluralize category for JSON keys (actor -> actors)
    fallback_key = category + "s" if not category.endswith("s") else category
    if category == "personality": fallback_key = "personalities"
    
    if fallback_key in FALLBACK_DATA:
        # Exact match check
        if entity_lower in FALLBACK_DATA[fallback_key]:
             logger.info(f"Fallback hit for {category}: {entity_name}")
             traits = FALLBACK_DATA[fallback_key][entity_lower]
             # Save to DB cache for future
             db.media_traits.insert_one({'name': entity_lower, 'type': category, 'traits': traits})
             return {'name': entity_name, 'traits': traits}
        # Fuzzy match (simple substring)
        for key in FALLBACK_DATA[fallback_key]:
            if key in entity_lower or entity_lower in key:
                 logger.info(f"Fallback fuzzy hit for {category}: {entity_name} -> {key}")
                 traits = FALLBACK_DATA[fallback_key][key]
                 db.media_traits.insert_one({'name': entity_lower, 'type': category, 'traits': traits})
                 return {'name': entity_name, 'traits': traits}

    # 3. Call Gemini API
    try:
        logger.info(f"Calling Gemini for {category}: {entity_name}")
        prompt = f"""
        Analyze the "{category}" named "{entity_name}".
        Provide a score between 0.0 and 1.0 for these exact personality traits based on their public persona or characters they play:
        {', '.join(TRAIT_NAMES)}.
        
        Return ONLY a JSON object with keys as the traits and float values.
        Example: {{"leader": 0.8, "smart": 0.5, ...}}
        If you don't know the entity, return valid JSON with all 0.5.
        """
        
        response = model.generate_content(prompt)
        text_response = response.text.strip()
        
        # Cleanup markdown formatting if present
        if text_response.startswith("```json"):
            text_response = text_response.replace("```json", "").replace("```", "")
        if text_response.startswith("```"):
             text_response = text_response.replace("```", "")
        
        traits = json.loads(text_response)
        
        # Validate keys
        clean_traits = {}
        for trait in TRAIT_NAMES:
            clean_traits[trait] = float(traits.get(trait, 0.5))
            
        # Cache successful result
        db.media_traits.insert_one({
            'name': entity_lower,
            'type': category,
            'traits': clean_traits
        })
        
        return {'name': entity_name, 'traits': clean_traits}
        
    except Exception as e:
        logger.error(f"Gemini API failed for {entity_name}: {e}")
        # Return neutral traits on failure but don't cache it (so we retry later)
        return {
            'name': entity_name, 
            'traits': {t: 0.5 for t in TRAIT_NAMES}
        }

def build_preference_vector(songs, movies, actors, cricketer, personality):
    """Build trait vector from all user preferences"""
    all_traits_list = []
    
    # Process all categories
    preference_map = [
        (songs, 'song'),
        (movies, 'movie'),
        (actors, 'actor'),
        ([cricketer] if cricketer else [], 'cricketer'),
        ([personality] if personality else [], 'personality')
    ]

    for items, category in preference_map:
        for item in items:
            if item and item.strip():
                result = map_entity_via_gemini(item, category)
                if result:
                    all_traits_list.append(result['traits'])
    
    if not all_traits_list:
        return [0.5] * len(TRAIT_NAMES)  # Neutral if no data
    
    # Average all preference trait vectors
    trait_vector = []
    for i, trait in enumerate(TRAIT_NAMES):
        values = [t[trait] for t in all_traits_list if trait in t]
        if values:
            trait_vector.append(sum(values) / len(values))
        else:
            trait_vector.append(0.5)
            
    return trait_vector

# --- Routes ---

@app.route('/')
def home():
    return "Movie Match Backend is Running!"

@app.route('/api/questions', methods=['GET'])
def get_questions():
    """Get random subset of quiz questions"""
    try:
        count = int(request.args.get('count', 20))
        # Clamp between 5 and 50 to be safe
        count = max(5, min(count, 50))
        
        all_questions = list(db.questions.find({}, {'_id': 0}))
        
        # Random sampling
        import random
        if len(all_questions) > count:
            selected_questions = random.sample(all_questions, count)
        else:
            selected_questions = all_questions
            
        return jsonify(selected_questions)
    except Exception as e:
        logger.error(f"Error fetching questions: {e}")
        return jsonify([]), 500

@app.route('/api/characters', methods=['GET'])
def get_characters():
    """Get characters (optionally filtered by universes)"""
    universes = request.args.getlist('universe')
    query = {}
    if universes:
        query['universe'] = {'$in': universes}
    
    characters = list(db.characters.find(query, {'_id': 0}))
    return jsonify(characters)

@app.route('/api/score', methods=['POST'])
def calculate_score():
    """Calculate character match based on quiz and preferences"""
    data = request.json
    
    # 1. Extract inputs
    user_name = data.get('name', 'Anonymous')
    answers = data.get('answers', [])
    selected_universes = data.get('universes', [])
    
    # Preferences
    songs = data.get('songs', [])
    movies = data.get('movies', [])
    favorite_actors = data.get('favorite_actors', [])
    favorite_cricketer = data.get('favorite_cricketer', '')
    favorite_personality = data.get('favorite_personality', '')
    
    # 2. Build Vectors
    question_vector = build_question_vector(answers)
    preference_vector = build_preference_vector(
        songs, movies, favorite_actors, favorite_cricketer, favorite_personality
    )
    
    # 3. Determine Weighting (Alpha)
    has_preferences = (
        len(songs) > 0 or len(movies) > 0 or 
        len(favorite_actors) > 0 or 
        bool(favorite_cricketer) or bool(favorite_personality)
    )
    
    alpha = 0.5 if has_preferences else 1.0
    
    # Combined Vector
    final_user_vector = []
    for q_val, p_val in zip(question_vector, preference_vector):
        final_user_vector.append(alpha * q_val + (1 - alpha) * p_val)
        
    # 4. Find Character Matches
    # Handle "Select All" or empty universes by fetching all characters
    query = {}
    if selected_universes and "Select All" not in selected_universes:
        query['universe'] = {'$in': selected_universes}
    
    characters = list(db.characters.find(query, {'_id': 0}))
    matches = []
    
    for char in characters:
        char_vector = [char['traits'].get(t, 0.5) for t in TRAIT_NAMES]
        similarity = cosine_similarity(final_user_vector, char_vector)
        matches.append({
            'character': char,
            'score': similarity,
            'percentage': round(similarity * 100)
        })
    
    # Sort by score descending
    matches.sort(key=lambda x: x['score'], reverse=True)
    
    # Top 5
    top_matches = matches[:5]
    top_match = top_matches[0] if top_matches else None
    
    # 5. Enhanced Logging (Questions + Answers + Results)
    # Reconstruct the Q&A log for the DB
    qa_log = []
    for ans in answers:
        q = db.questions.find_one({'id': ans['question_id']})
        if q:
            opt = next((o for o in q['options'] if o['id'] == ans['option_id']), None)
            qa_log.append({
                'question': q['question'],
                'selected_option': opt['text'] if opt else 'Unknown',
                'trait': q['trait']
            })

    result_doc = {
        'name': user_name,
        'universes': selected_universes,
        # 'answers': answers, # Raw IDs
        'qa_log': qa_log,     # Readable Log
        'songs': songs,
        'movies': movies,
        'favorite_actors': favorite_actors,
        'favorite_cricketer': favorite_cricketer,
        'favorite_personality': favorite_personality,
        'top_matches': [m['character']['name'] for m in top_matches],
        'best_match_score': top_match['percentage'] if top_match else 0
    }
    # Calculate Universe Breakdown (Best per Universe)
    universe_breakdown = []
    if selected_universes and "Select All" in selected_universes:
        # Group matches by universe
        universe_map = {}
        for m in matches:
            univ = m['character']['universe']
            if univ not in universe_map:
                universe_map[univ] = m # First one is best because matches is sorted
        
        # Convert to list
        for univ, m in universe_map.items():
            universe_breakdown.append({
                'universe': univ,
                'character': m['character'],
                'score': m['score'],
                'percentage': m['percentage']
            })
            
    db.quiz_results.insert_one(result_doc)
    
    return jsonify({
        'matches': top_matches, 
        'user_vector': final_user_vector,
        'universe_breakdown': universe_breakdown
    })

@app.route('/api/feedback', methods=['POST'])
def submit_feedback():
    data = request.json
    db.feedback.insert_one(data)
    return jsonify({'success': True})

@app.route('/api/feedback/amritanshu', methods=['POST'])
def submit_amritanshu_feedback():
    """Specific feedback route for Amritanshu form"""
    data = request.json
    data['type'] = 'amritanshu_feedback' # Tag it
    db.feedback.insert_one(data)
    return jsonify({'success': True})

# --- Admin Routes ---
@app.route('/api/admin/stats', methods=['GET'])
def get_stats():
    token = request.headers.get('Authorization')
    if token != os.getenv("ADMIN_TOKEN"):
        return jsonify({'error': 'Unauthorized'}), 401
        
    stats = {
        'total_results': db.quiz_results.count_documents({}),
        'total_feedback': db.feedback.count_documents({}),
        'total_media_mappings': db.media_traits.count_documents({}),
        'total_characters': db.characters.count_documents({}),
        'total_questions': db.questions.count_documents({}),
        'universes': db.characters.distinct('universe')
    }
    return jsonify(stats)

@app.route('/api/admin/results', methods=['GET'])
def get_results():
    token = request.headers.get('Authorization')
    if token != os.getenv("ADMIN_TOKEN"):
        return jsonify({'error': 'Unauthorized'}), 401
    
    limit = int(request.args.get('limit', 50))
    results = list(db.quiz_results.find({}, {'_id': 0}).sort('_id', -1).limit(limit))
    return jsonify(results)

@app.route('/api/admin/feedback', methods=['GET'])
def get_feedback():
    token = request.headers.get('Authorization')
    if token != os.getenv("ADMIN_TOKEN"):
        return jsonify({'error': 'Unauthorized'}), 401
        
    limit = int(request.args.get('limit', 50))
    feedback = list(db.feedback.find({}, {'_id': 0}).sort('_id', -1).limit(limit))
    return jsonify(feedback)

if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port)
