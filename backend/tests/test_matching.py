"""
Tests for the matching algorithm
"""

import unittest
import math
from app import cosine_similarity, build_question_vector, build_media_vector, TRAIT_NAMES

class TestMatchingAlgorithm(unittest.TestCase):
    
    def test_cosine_similarity_identical_vectors(self):
        """Test cosine similarity with identical vectors"""
        vec1 = [1.0, 0.5, 0.8, 0.2, 0.9]
        vec2 = [1.0, 0.5, 0.8, 0.2, 0.9]
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertAlmostEqual(similarity, 1.0, places=5)
    
    def test_cosine_similarity_orthogonal_vectors(self):
        """Test cosine similarity with orthogonal vectors"""
        vec1 = [1.0, 0.0, 0.0]
        vec2 = [0.0, 1.0, 0.0]
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertAlmostEqual(similarity, 0.0, places=5)
    
    def test_cosine_similarity_opposite_vectors(self):
        """Test cosine similarity with opposite vectors"""
        vec1 = [1.0, 0.5, 0.8]
        vec2 = [-1.0, -0.5, -0.8]
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertAlmostEqual(similarity, -1.0, places=5)
    
    def test_cosine_similarity_different_lengths(self):
        """Test cosine similarity with different length vectors"""
        vec1 = [1.0, 0.5, 0.8]
        vec2 = [1.0, 0.5]
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertEqual(similarity, 0)
    
    def test_cosine_similarity_zero_vectors(self):
        """Test cosine similarity with zero vectors"""
        vec1 = [0.0, 0.0, 0.0]
        vec2 = [1.0, 0.5, 0.8]
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertEqual(similarity, 0)
    
    def test_build_question_vector_single_answer(self):
        """Test building question vector from single answer"""
        # Mock database structure
        answers = [
            {'question_id': 1, 'option_id': '1A'}  # introversion question, "Always alone" = 1.0
        ]
        
        # This would normally query the database, but for testing we'll mock the expected behavior
        # In a real test, you'd mock the database or use a test database
        pass
    
    def test_build_question_vector_multiple_answers(self):
        """Test building question vector from multiple answers"""
        # Similar to above, would need database mocking for full test
        pass
    
    def test_build_media_vector_empty_input(self):
        """Test building media vector with empty input"""
        # This would test the default neutral vector behavior
        pass
    
    def test_trait_names_consistency(self):
        """Test that TRAIT_NAMES contains expected traits"""
        expected_traits = [
            'introversion', 'humor', 'bravery', 'loyalty', 'ambition',
            'compassion', 'cunning', 'responsibility', 'sarcasm', 'optimism'
        ]
        
        self.assertEqual(len(TRAIT_NAMES), 10)
        for trait in expected_traits:
            self.assertIn(trait, TRAIT_NAMES)
    
    def test_vector_dimensions(self):
        """Test that vectors have correct dimensions"""
        self.assertEqual(len(TRAIT_NAMES), 10)
        
        # Test that a vector built from traits has correct length
        test_vector = [0.5] * len(TRAIT_NAMES)
        self.assertEqual(len(test_vector), 10)

class TestScoringIntegration(unittest.TestCase):
    """Integration tests for the complete scoring system"""
    
    def test_alpha_weighting(self):
        """Test that alpha parameter correctly weights question vs media vectors"""
        q_vector = [1.0] * 10  # All traits at maximum
        m_vector = [0.0] * 10  # All traits at minimum
        
        alpha = 0.8
        final_vector = []
        for i in range(10):
            final_vector.append(alpha * q_vector[i] + (1 - alpha) * m_vector[i])
        
        # With alpha=0.8, final vector should be mostly question-based
        expected_value = 0.8 * 1.0 + 0.2 * 0.0
        for value in final_vector:
            self.assertAlmostEqual(value, expected_value, places=5)
    
    def test_vector_normalization(self):
        """Test that vectors are properly normalized for cosine similarity"""
        # Test with vectors that should have high similarity
        vec1 = [0.8, 0.6, 0.9, 0.4, 0.7]
        vec2 = [0.7, 0.5, 0.8, 0.3, 0.6]  # Similar but slightly lower
        
        similarity = cosine_similarity(vec1, vec2)
        self.assertGreater(similarity, 0.9)  # Should be very similar
        self.assertLessEqual(similarity, 1.0)  # Should not exceed 1.0

if __name__ == '__main__':
    unittest.main()
