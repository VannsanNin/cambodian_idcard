from flask import Flask, request, jsonify, render_template, send_from_directory, url_for
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from datetime import datetime
import os
import re
from uuid import uuid4
from urllib.parse import urlparse
from werkzeug.utils import secure_filename

# Initialize Flask app
app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///id_cards.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JSON_AS_ASCII'] = False  # Support Khmer text
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024
app.config['PHOTO_UPLOAD_FOLDER'] = os.path.join(app.root_path, 'static', 'uploads', 'photos')

# Enable CORS
db = SQLAlchemy(app)
CORS(app)

ID_NUMBER_PATTERN = re.compile(r'^\d{5,20}$')
LOCAL_PHOTO_PATH_PATTERN = re.compile(r'^/static/uploads/photos/[A-Za-z0-9_.-]+$')
KHMER_TEXT_PATTERN = re.compile(r'^[\u1780-\u17FF ]+$')
LATIN_NAME_PATTERN = re.compile(r"^[A-Za-z .'-]+$")
DEFAULT_ID_NUMBER_WIDTH = 9
VALIDITY_PERIOD_YEARS = 5
ALLOWED_GENDERS = {'ប្រុស', 'ស្រី'}
ALLOWED_PHOTO_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
TEXT_FIELD_LIMITS = {
    'khmer_name': 100,
    'latin_name': 100,
    'nationality': 50,
    'place_of_birth': 200,
    'place_of_birth_province': 100,
    'current_address': 300,
    'current_address_province': 100,
    'father_name': 100,
    'mother_name': 100,
    'photo_url': 500,
}

os.makedirs(app.config['PHOTO_UPLOAD_FOLDER'], exist_ok=True)

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


def normalize_text(value):
    if value is None:
        return ''
    return re.sub(r'\s+', ' ', str(value).strip())


def validate_text_field(raw_value, field_name, required=False, khmer_only=False, latin_only=False):
    value = normalize_text(raw_value)
    max_length = TEXT_FIELD_LIMITS[field_name]

    if required and not value:
        raise ValueError(f'Field {field_name} is required')

    if len(value) > max_length:
        raise ValueError(f'Field {field_name} exceeds max length of {max_length}')

    if value and khmer_only and not KHMER_TEXT_PATTERN.fullmatch(value):
        raise ValueError(f'Field {field_name} must contain only Khmer characters')

    if value and latin_only and not LATIN_NAME_PATTERN.fullmatch(value):
        raise ValueError(f'Field {field_name} must contain only English letters')

    return value


def validate_id_number(raw_value):
    value = normalize_text(raw_value)

    if not value:
        return ''

    if not ID_NUMBER_PATTERN.fullmatch(value):
        raise ValueError('ID number must contain only 5 to 20 digits')

    return value


def parse_date_field(raw_value, field_name, required=False):
    value = normalize_text(raw_value)

    if required and not value:
        raise ValueError(f'Field {field_name} is required')

    if not value:
        return None

    try:
        return datetime.strptime(value, '%Y-%m-%d').date()
    except ValueError as exc:
        raise ValueError(f'Field {field_name} must use YYYY-MM-DD format') from exc


def add_years_clamped(date_value, years):
    try:
        return date_value.replace(year=date_value.year + years)
    except ValueError:
        return date_value.replace(year=date_value.year + years, month=2, day=28)


def validate_photo_url(raw_value, required=False):
    value = normalize_text(raw_value)

    if required and not value:
        raise ValueError('Field photo_url is required')

    if not value:
        return ''

    if len(value) > TEXT_FIELD_LIMITS['photo_url']:
        raise ValueError(
            f'Field photo_url exceeds max length of {TEXT_FIELD_LIMITS["photo_url"]}'
        )

    if LOCAL_PHOTO_PATH_PATTERN.fullmatch(value):
        return value

    parsed = urlparse(value)
    if parsed.scheme not in {'http', 'https'} or not parsed.netloc:
        raise ValueError('photo_url must start with http:// or https:// or use a local uploaded image')

    return value


def is_allowed_photo_file(filename):
    if not filename or '.' not in filename:
        return False
    return filename.rsplit('.', 1)[1].lower() in ALLOWED_PHOTO_EXTENSIONS


def generate_next_id_number(exclude_card_id=None):
    max_numeric_value = 0
    width = DEFAULT_ID_NUMBER_WIDTH

    for (id_number,) in db.session.query(IDCard.id_number).all():
        current = normalize_text(id_number)
        if current.isdigit():
            max_numeric_value = max(max_numeric_value, int(current))
            width = max(width, len(current))

    candidate_value = max_numeric_value + 1

    while True:
        width = max(width, len(str(candidate_value)))
        candidate = str(candidate_value).zfill(width)
        query = IDCard.query.filter_by(id_number=candidate)

        if exclude_card_id is not None:
            query = query.filter(IDCard.id != exclude_card_id)

        if not query.first():
            return candidate

        candidate_value += 1


def ensure_unique_id_number(id_number, current_card_id=None):
    query = IDCard.query.filter_by(id_number=id_number)

    if current_card_id is not None:
        query = query.filter(IDCard.id != current_card_id)

    if query.first():
        raise ValueError('ID number already exists')


def merge_card_payload(data, existing_card=None):
    card_fields = [
        'id_number',
        'khmer_name',
        'latin_name',
        'date_of_birth',
        'gender',
        'nationality',
        'place_of_birth',
        'place_of_birth_province',
        'current_address',
        'current_address_province',
        'father_name',
        'mother_name',
        'issue_date',
        'expiry_date',
        'photo_url',
    ]

    merged = {}
    data = data or {}

    for field in card_fields:
        if field in data:
            merged[field] = data.get(field)
        elif existing_card is not None:
            merged[field] = getattr(existing_card, field)
        else:
            merged[field] = None

    return merged


def validate_card_payload(data, existing_card=None):
    if not isinstance(data, dict):
        raise ValueError('Invalid JSON payload')

    source = merge_card_payload(data, existing_card)

    id_number = validate_id_number(source.get('id_number'))
    if not id_number:
        if existing_card is not None:
            id_number = existing_card.id_number
        else:
            id_number = generate_next_id_number()

    issue_date_source = source.get('issue_date')
    if not normalize_text(issue_date_source):
        if existing_card is None:
            issue_date = datetime.now().date()
        else:
            raise ValueError('Field issue_date is required')
    else:
        issue_date = parse_date_field(issue_date_source, 'issue_date', required=True)

    expiry_date = add_years_clamped(issue_date, VALIDITY_PERIOD_YEARS)

    payload = {
        'id_number': id_number,
        'khmer_name': validate_text_field(
            source.get('khmer_name'),
            'khmer_name',
            required=True,
            khmer_only=True
        ),
        'latin_name': validate_text_field(
            source.get('latin_name'),
            'latin_name',
            required=True,
            latin_only=True
        ),
        'date_of_birth': parse_date_field(source.get('date_of_birth'), 'date_of_birth', required=True),
        'gender': normalize_text(source.get('gender')),
        'nationality': validate_text_field(source.get('nationality') or 'ខ្មែរ', 'nationality'),
        'place_of_birth': validate_text_field(source.get('place_of_birth'), 'place_of_birth', required=True),
        'place_of_birth_province': validate_text_field(
            source.get('place_of_birth_province'),
            'place_of_birth_province'
        ),
        'current_address': validate_text_field(source.get('current_address'), 'current_address', required=True),
        'current_address_province': validate_text_field(
            source.get('current_address_province'),
            'current_address_province'
        ),
        'father_name': validate_text_field(
            source.get('father_name'),
            'father_name',
            required=True,
            khmer_only=True
        ),
        'mother_name': validate_text_field(
            source.get('mother_name'),
            'mother_name',
            required=True,
            khmer_only=True
        ),
        'issue_date': issue_date,
        'expiry_date': expiry_date,
        'photo_url': validate_photo_url(source.get('photo_url'), required=True),
    }

    if payload['gender'] not in ALLOWED_GENDERS:
        raise ValueError('Invalid gender value')

    if payload['issue_date'] < payload['date_of_birth']:
        raise ValueError('issue_date cannot be earlier than date_of_birth')

    if payload['expiry_date'] <= payload['issue_date']:
        raise ValueError('expiry_date must be later than issue_date')

    return payload

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

# Serve local assets (e.g., Cambodia2025.json)
@app.route('/assets/<path:filename>')
def serve_asset(filename):
    return send_from_directory(os.path.join(app.root_path, 'assets'), filename)

# ============================================
# API ENDPOINTS - CRUD OPERATIONS
# ============================================

@app.route('/api/uploads/photo', methods=['POST'])
def upload_photo():
    try:
        photo = request.files.get('photo')
        if photo is None:
            return jsonify({
                'success': False,
                'message': 'No photo file provided'
            }), 400

        if not photo.filename:
            return jsonify({
                'success': False,
                'message': 'Photo filename is required'
            }), 400

        if not is_allowed_photo_file(photo.filename):
            return jsonify({
                'success': False,
                'message': 'Unsupported photo format'
            }), 400

        if not (photo.mimetype or '').startswith('image/'):
            return jsonify({
                'success': False,
                'message': 'Uploaded file must be an image'
            }), 400

        extension = secure_filename(photo.filename).rsplit('.', 1)[1].lower()
        saved_filename = f'{uuid4().hex}.{extension}'
        save_path = os.path.join(app.config['PHOTO_UPLOAD_FOLDER'], saved_filename)
        photo.save(save_path)

        return jsonify({
            'success': True,
            'message': 'Photo uploaded successfully',
            'data': {
                'photo_url': url_for('static', filename=f'uploads/photos/{saved_filename}')
            }
        }), 201
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error uploading photo: {str(e)}'
        }), 500

# 1. CREATE - Register new ID Card
@app.route('/api/id-cards', methods=['POST'])
def create_id_card():
    """
    Create new ID Card
    POST /api/id-cards
    """
    try:
        data = request.get_json(silent=True) or {}
        validated = validate_card_payload(data)
        ensure_unique_id_number(validated['id_number'])
        new_card = IDCard(**validated)
        
        db.session.add(new_card)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ID Card created successfully',
            'data': new_card.to_dict()
        }), 201
    except ValueError as e:
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': f'Error creating ID card: {str(e)}'
        }), 500


@app.route('/api/id-cards/generate-id', methods=['GET'])
def get_generated_id_number():
    try:
        return jsonify({
            'success': True,
            'data': {
                'id_number': generate_next_id_number()
            }
        }), 200
    except Exception as e:
        return jsonify({
            'success': False,
            'message': f'Error generating ID number: {str(e)}'
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
        card = db.session.get(IDCard, card_id)
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
        search_term = normalize_text(request.args.get('q', ''))
        
        if not search_term:
            return jsonify({
                'success': False,
                'message': 'Search query is required'
            }), 400

        if len(search_term) > 100:
            return jsonify({
                'success': False,
                'message': 'Search query is too long'
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
        card = db.session.get(IDCard, card_id)
        if not card:
            return jsonify({
                'success': False,
                'message': 'ID Card not found'
            }), 404
        
        data = request.get_json(silent=True) or {}
        validated = validate_card_payload(data, existing_card=card)
        ensure_unique_id_number(validated['id_number'], current_card_id=card.id)

        for field, value in validated.items():
            setattr(card, field, value)
        
        card.updated_at = datetime.utcnow()
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'ID Card updated successfully',
            'data': card.to_dict()
        }), 200
    except ValueError as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'message': str(e)
        }), 400
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
        card = db.session.get(IDCard, card_id)
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

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({
        'success': False,
        'message': 'Uploaded photo is too large. Maximum size is 5 MB'
    }), 413

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
    print("   POST   /api/uploads/photo - Upload local photo")
    print("   POST   /api/id-cards       - Create new ID card")
    print("   GET    /api/id-cards       - Get all ID cards")
    print("   GET    /api/id-cards/generate-id - Generate next ID number")
    print("   GET    /api/id-cards/{id}  - Get single ID card")
    print("   GET    /api/id-cards/search?q={term} - Search ID cards")
    print("   PUT    /api/id-cards/{id}  - Update ID card")
    print("   DELETE /api/id-cards/{id}  - Delete ID card")
    print("   GET    /api/statistics     - Get statistics")
    print("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
