#!/usr/bin/env python3
"""
Script to seed MongoDB with characters and questions data
"""

import os
import json
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def connect_to_mongodb():
    """Connect to MongoDB"""
    uri = os.getenv('MONGODB_URI', 'mongodb://localhost:27017/')
    client = MongoClient(uri)
    return client.whichcharacter

def seed_characters(db, characters_file):
    """Seed characters collection"""
    print("Seeding characters...")
    
    with open(characters_file, 'r', encoding='utf-8') as f:
        characters = json.load(f)
    
    # Clear existing characters
    db.characters.delete_many({})
    
    # Insert new characters
    result = db.characters.insert_many(characters)
    print(f"Inserted {len(result.inserted_ids)} characters")
    
    # Create index on universe
    db.characters.create_index("universe")
    print("Created index on universe field")

def seed_questions(db, questions_file):
    """Seed questions collection"""
    print("Seeding questions...")
    
    with open(questions_file, 'r', encoding='utf-8') as f:
        questions = json.load(f)
    
    # Clear existing questions
    db.questions.delete_many({})
    
    # Insert new questions
    result = db.questions.insert_many(questions)
    print(f"Inserted {len(result.inserted_ids)} questions")
    
    # Create index on id
    db.questions.create_index("id")
    print("Created index on id field")

def create_collections(db):
    """Create other collections with proper indexes"""
    print("Creating collections and indexes...")
    
    # Results collection
    db.results.create_index("createdAt")
    db.results.create_index("name")
    
    # Amritanshu feedback collection
    db.amritanshu_feedback.create_index("createdAt")
    db.amritanshu_feedback.create_index("name")
    
    # Media traits collection
    db.media_traits.create_index([("type", 1), ("canonical_title", 1)])
    db.media_traits.create_index("createdAt")
    
    print("Created all collections and indexes")

def main():
    """Main seeding function"""
    if len(sys.argv) != 3:
        print("Usage: python seed_mongo.py <characters.json> <questions.json>")
        sys.exit(1)
    
    characters_file = sys.argv[1]
    questions_file = sys.argv[2]
    
    if not os.path.exists(characters_file):
        print(f"Error: {characters_file} not found")
        sys.exit(1)
    
    if not os.path.exists(questions_file):
        print(f"Error: {questions_file} not found")
        sys.exit(1)
    
    try:
        # Connect to database
        db = connect_to_mongodb()
        print(f"Connected to MongoDB: {db.name}")
        
        # Seed data
        seed_characters(db, characters_file)
        seed_questions(db, questions_file)
        create_collections(db)
        
        print("\nSeeding completed successfully!")
        
        # Print summary
        print(f"\nDatabase summary:")
        print(f"- Characters: {db.characters.count_documents({})}")
        print(f"- Questions: {db.questions.count_documents({})}")
        print(f"- Universes: {list(db.characters.distinct('universe'))}")
        
    except Exception as e:
        print(f"Error during seeding: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
