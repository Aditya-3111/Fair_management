from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import bcrypt
import pymysql
from db import get_connection
import json

users_bp = Blueprint('users', __name__)

def require_role(*roles):
    def decorator(fn):
        from functools import wraps
        @wraps(fn)
        def wrapper(*args, **kwargs):
            from flask_jwt_extended import verify_jwt_in_request
            verify_jwt_in_request()
            identity = json.loads(get_jwt_identity())
            if identity['role'] not in roles:
                return jsonify({'error': 'Unauthorized'}), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

@users_bp.route('/', methods=['GET'])
@jwt_required()
def get_users():
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            if identity['role'] == 'master':
                cur.execute("SELECT id, name, email, phone, role, is_active, created_at FROM users ORDER BY created_at DESC")
            elif identity['role'] == 'admin':
                cur.execute("SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE role = 'employee' ORDER BY created_at DESC")
            else:
                return jsonify({'error': 'Unauthorized'}), 403
            users = cur.fetchall()
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/admins', methods=['GET'])
@jwt_required()
def get_admins():
    identity = json.loads(get_jwt_identity())
    if identity['role'] != 'master':
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT id, name, email, phone, role, is_active, created_at FROM users WHERE role IN ('admin','employee') ORDER BY role, name")
            users = cur.fetchall()
        conn.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/', methods=['POST'])
@jwt_required()
def create_user():
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ('master', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    name = data.get('name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()
    password = data.get('password', '')
    role = data.get('role', 'employee')

    if identity['role'] == 'admin' and role != 'employee':
        return jsonify({'error': 'Admins can only create employees'}), 403

    if not name or not email or not password:
        return jsonify({'error': 'Name, email, and password are required'}), 400

    hashed = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO users (name, email, phone, password, role) VALUES (%s, %s, %s, %s, %s)",
                (name, email, phone, hashed, role)
            )
            new_id = cur.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'name': name, 'email': email, 'role': role}), 201
    except pymysql.err.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/<int:user_id>', methods=['PUT'])
@jwt_required()
def update_user(user_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ('master', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            fields = []
            values = []
            if 'name' in data:
                fields.append('name = %s')
                values.append(data['name'])
            if 'phone' in data:
                fields.append('phone = %s')
                values.append(data['phone'])
            if 'is_active' in data:
                fields.append('is_active = %s')
                values.append(data['is_active'])
            if 'password' in data and data['password']:
                hashed = bcrypt.hashpw(data['password'].encode(), bcrypt.gensalt()).decode()
                fields.append('password = %s')
                values.append(hashed)
            if fields:
                values.append(user_id)
                cur.execute(f"UPDATE users SET {', '.join(fields)} WHERE id = %s", values)
        conn.close()
        return jsonify({'message': 'Updated successfully'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@users_bp.route('/employees-on-duty', methods=['GET'])
@jwt_required()
def employees_on_duty():
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.name, u.phone, fw.id as field_work_id, fw.title, fw.location,
                       fw.started_at, fw.total_expense
                FROM users u
                JOIN field_works fw ON fw.employee_id = u.id AND fw.status = 'active'
                ORDER BY fw.started_at DESC
            """)
            data = cur.fetchall()
        conn.close()
        return jsonify(data)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
