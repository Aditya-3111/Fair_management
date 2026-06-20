from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
import bcrypt
from db import get_connection
import json


auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({'error': 'Email and password required'}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE email = %s AND is_active = TRUE", (email,))
            user = cur.fetchone()
        conn.close()
    except Exception as e:
        return jsonify({'error': str(e)}), 500

    if not user:
        return jsonify({'error': 'Invalid credentials'}), 401

    if not bcrypt.checkpw(password.encode(), user['password'].encode()):
        return jsonify({'error': 'Invalid credentials'}), 401

    import json
    token = create_access_token(identity=json.dumps({'id': user['id'], 'role': user['role']}))
    return jsonify({
        'token': token,
        'user': {
            'id': user['id'],
            'name': user['name'],
            'email': user['email'],
            'phone': user['phone'],
            'role': user['role']
        }
    })

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, phone, role, created_at FROM users WHERE id = %s", (identity['id'],))
            user = cur.fetchone()
        conn.close()
        return jsonify(user)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
