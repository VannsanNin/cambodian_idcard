#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cambodian National ID Card Management System
ប្រព័ន្ធគ្រប់គ្រងអត្តសញ្ញាណបណ្ណសញ្ជាតិខ្មែរ
"""

from flask import Flask, request, jsonify, render_template
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///id_cards.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False  # Support Unicode (Khmer text)

# Enable CORS
db = SQLAlchemy(app)
CORS(app)

# Database Model for ID Card
class IDCard(db.Model):
    __tablename__ = 'id_cards'
    
    id = db.Column(db.Integer, primary_key=True)
    id_number = db.Column(db.String(20), unique=True, nullable=False)
    khmer_name = db.Column(db.String(100), nullable=False)
    latin_name = db.Column(db.String(100), nullable=False)
    date_of_birth = db.Column(db.Date, nullable=False)
    gender = db.Column(db.String(10), nullable=False)
    nationality = db.Column(db.String(50), default='ខ្មែរ')
    place_of_birth = db.Column(db.String(200), nullable=False)
    place_of_birth_province = db.Column(db.String(100), nullable=True)
    current_address = db.Column(db.String(300), nullable=False)
    current_address_province = db.Column(db.String(100), nullable=True)
    father_name = db.Column(db.String(100), nullable=False)
    mother_name = db.Column(db.String(100), nullable=False)
    issue_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=False)
    photo_url = db.Column(db.String(500), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'id_number': self.id_number,
            'khmer_name': self.khmer_name,
            'latin_name': self.latin_name,
            'date_of_birth': self.date_of_birth.strftime('%Y-%m-%d') if self.date_of_birth else None,
            'gender': self.gender,
            'nationality': self.nationality,
            'place_of_birth': self.place_of_birth,
            'place_of_birth_province': self.place_of_birth_province,
            'current_address': self.current_address,
            'current_address_province': self.current_address_province,
            'father_name': self.father_name,
            'mother_name': self.mother_name,
            'issue_date': self.issue_date.strftime('%Y-%m-%d') if self.issue_date else None,
            'expiry_date': self.expiry_date.strftime('%Y-%m-%d') if self.expiry_date else None,
            'photo_url': self.photo_url,
            'created_at': self.created_at.strftime('%Y-%m-%d %H:%M:%S') if self.created_at else None,
            'updated_at': self.updated_at.strftime('%Y-%m-%d %H:%M:%S') if self.updated_at else None
        }

# Create database tables and handle migrations
with app.app_context():
    db.create_all()
    
    # Simple migration: check if columns exist and add them if missing
    # (SQLite doesn't support IF NOT EXISTS in ALTER TABLE for columns)
    try:
        from sqlalchemy import text
        with db.engine.connect() as conn:
            # Check for place_of_birth_province
            result = conn.execute(text("PRAGMA table_info(id_cards)"))
            columns = [row[1] for row in result]
            
            if 'place_of_birth_province' not in columns:
                conn.execute(text("ALTER TABLE id_cards ADD COLUMN place_of_birth_province VARCHAR(100)"))
                conn.commit()
                print("✨ Added column: place_of_birth_province")
            
            if 'current_address_province' not in columns:
                conn.execute(text("ALTER TABLE id_cards ADD COLUMN current_address_province VARCHAR(100)"))
                conn.commit()
                print("✨ Added column: current_address_province")
                
    except Exception as e:
        print(f"⚠️ Migration note: {e}")
        
    print("✅ Database initialized and synchronized!")

# ============================================
# FRONTEND ROUTES
# ============================================

@app.route('/')
def index():
    """Main page - User Interface"""
    return render_template('index.html')

# ============================================
# API ENDPOINTS - CRUD OPERATIONS
# ============================================

# 1. CREATE - Register new ID Card
@app.route('/api/id-cards', methods=['POST'])
def create_id_card():
    """
    Create new ID Card
    POST /api/id-cards
    """
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['id_number', 'khmer_name', 'latin_name', 'date_of_birth', 
                          'gender', 'place_of_birth', 'current_address', 
                          'father_name', 'mother_name', 'issue_date', 'expiry_date']
        
        for field in required_fields:
            if not data.get(field):
                return jsonify({
                    'success': False,
                    'message': f'Field {field} is required'
                }), 400
        
        # Check if ID number already exists
        existing = IDCard.query.filter_by(id_number=data['id_number']).first()
        if existing:
            return jsonify({
                'success': False,
                'message': 'ID number already exists'
            }), 409
        
        # Create new ID card
        new_card = IDCard(
            id_number=data['id_number'],
            khmer_name=data['khmer_name'],
            latin_name=data['latin_name'],
            date_of_birth=datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date(),
            gender=data['gender'],
            nationality=data.get('nationality', 'ខ្មែរ'),
            place_of_birth=data['place_of_birth'],
            place_of_birth_province=data.get('place_of_birth_province', ''),
            current_address=data['current_address'],
            current_address_province=data.get('current_address_province', ''),
            father_name=data['father_name'],
            mother_name=data['mother_name'],
            issue_date=datetime.strptime(data['issue_date'], '%Y-%m-%d').date(),
            expiry_date=datetime.strptime(data['expiry_date'], '%Y-%m-%d').date(),
            photo_url=data.get('photo_url', '')
        )
        
        db.session.add(new_card)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ID Card created successfully',
            'data': new_card.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating ID card: {str(e)}'
        }), 500

# 2. READ ALL - Get all ID Cards
@app.route('/api/id-cards', methods=['GET'])
def get_all_id_cards():
    """
    Get all ID Cards
    GET /api/id-cards
    """
    try:
        cards = IDCard.query.all()
        return jsonify({
            'success': True,
            'count': len(cards),
            'data': [card.to_dict() for card in cards]
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching ID cards: {str(e)}'
        }), 500

# 3. READ ONE - Get single ID Card by ID
@app.route('/api/id-cards/<int:card_id>', methods=['GET'])
def get_id_card(card_id):
    """
    Get ID Card by ID
    GET /api/id-cards/{id}
    """
    try:
        card = IDCard.query.get(card_id)
        if not card:
            return jsonify({
                'success': False,
                'message': 'ID Card not found'
            }), 404
        
        return jsonify({
            'success': True,
            'data': card.to_dict()
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching ID card: {str(e)}'
        }), 500

# 4. SEARCH - Search ID Cards by various criteria
@app.route('/api/id-cards/search', methods=['GET'])
def search_id_cards():
    """
    Search ID Cards
    GET /api/id-cards/search?q={search_term}
    """
    try:
        search_term = request.args.get('q', '')
        
        if not search_term:
            return jsonify({
                'success': False,
                'message': 'Search query is required'
            }), 400
        
        # Search in multiple fields
        cards = IDCard.query.filter(
            db.or_(
                IDCard.id_number.contains(search_term),
                IDCard.khmer_name.contains(search_term),
                IDCard.latin_name.contains(search_term),
                IDCard.place_of_birth.contains(search_term),
                IDCard.current_address.contains(search_term)
            )
        ).all()
        
        return jsonify({
            'success': True,
            'count': len(cards),
            'data': [card.to_dict() for card in cards]
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error searching ID cards: {str(e)}'
        }), 500

# 5. UPDATE - Update ID Card
@app.route('/api/id-cards/<int:card_id>', methods=['PUT'])
def update_id_card(card_id):
    """
    Update ID Card
    PUT /api/id-cards/{id}
    """
    try:
        card = IDCard.query.get(card_id)
        if not card:
            return jsonify({
                'success': False,
                'message': 'ID Card not found'
            }), 404
        
        data = request.get_json()
        
        # Update fields if provided
        if 'khmer_name' in data:
            card.khmer_name = data['khmer_name']
        if 'latin_name' in data:
            card.latin_name = data['latin_name']
        if 'date_of_birth' in data:
            card.date_of_birth = datetime.strptime(data['date_of_birth'], '%Y-%m-%d').date()
        if 'gender' in data:
            card.gender = data['gender']
        if 'nationality' in data:
            card.nationality = data['nationality']
        if 'place_of_birth' in data:
            card.place_of_birth = data['place_of_birth']
        if 'place_of_birth_province' in data:
            card.place_of_birth_province = data['place_of_birth_province']
        if 'current_address' in data:
            card.current_address = data['current_address']
        if 'current_address_province' in data:
            card.current_address_province = data['current_address_province']
        if 'father_name' in data:
            card.father_name = data['father_name']
        if 'mother_name' in data:
            card.mother_name = data['mother_name']
        if 'issue_date' in data:
            card.issue_date = datetime.strptime(data['issue_date'], '%Y-%m-%d').date()
        if 'expiry_date' in data:
            card.expiry_date = datetime.strptime(data['expiry_date'], '%Y-%m-%d').date()
        if 'photo_url' in data:
            card.photo_url = data['photo_url']
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ID Card updated successfully',
            'data': card.to_dict()
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error updating ID card: {str(e)}'
        }), 500

# 6. DELETE - Delete ID Card
@app.route('/api/id-cards/<int:card_id>', methods=['DELETE'])
def delete_id_card(card_id):
    """
    Delete ID Card
    DELETE /api/id-cards/{id}
    """
    try:
        card = IDCard.query.get(card_id)
        if not card:
            return jsonify({
                'success': False,
                'message': 'ID Card not found'
            }), 404
        
        db.session.delete(card)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ID Card deleted successfully'
        }), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error deleting ID card: {str(e)}'
        }), 500

# 7. GET STATISTICS
@app.route('/api/statistics', methods=['GET'])
def get_statistics():
    """
    Get ID Card statistics
    GET /api/statistics
    """
    try:
        total = IDCard.query.count()
        male_count = IDCard.query.filter_by(gender='ប្រុស').count()
        female_count = IDCard.query.filter_by(gender='ស្រី').count()
        
        return jsonify({
            'success': True,
            'data': {
                'total': total,
                'male': male_count,
                'female': female_count
            }
        }), 200
        
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error fetching statistics: {str(e)}'
        }), 500

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500

# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == '__main__':
    print("\n🌐 Open your browser and go to: http://localhost:5000")
    print("📚 API Documentation:")
    print("   POST   /api/id-cards       - Create new ID card")
    print("   GET    /api/id-cards       - Get all ID cards")
    print("   GET    /api/id-cards/{id}  - Get single ID card")
    print("   GET    /api/id-cards/search?q={term} - Search ID cards")
    print("   PUT    /api/id-cards/{id}  - Update ID card")
    print("   DELETE /api/id-cards/{id}  - Delete ID card")
    print("   GET    /api/statistics     - Get statistics")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)