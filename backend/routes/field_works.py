from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from db import get_connection
import json

field_works_bp = Blueprint('field_works', __name__)

@field_works_bp.route('/', methods=['GET'])
@jwt_required()
def get_field_works():
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            if identity['role'] in ('master', 'admin'):
                cur.execute("""
                    SELECT fw.*, u.name as employee_name, u.phone as employee_phone,
                           a.name as admin_name
                    FROM field_works fw
                    JOIN users u ON u.id = fw.employee_id
                    JOIN users a ON a.id = fw.admin_id
                    ORDER BY fw.created_at DESC
                """)
            else:
                cur.execute("""
                    SELECT fw.*, u.name as employee_name, a.name as admin_name
                    FROM field_works fw
                    JOIN users u ON u.id = fw.employee_id
                    JOIN users a ON a.id = fw.admin_id
                    WHERE fw.employee_id = %s
                    ORDER BY fw.created_at DESC
                """, (identity['id'],))
            works = cur.fetchall()
        conn.close()
        # Convert datetime to string
        for w in works:
            for key in ('started_at', 'completed_at', 'created_at'):
                if w.get(key):
                    w[key] = str(w[key])
        return jsonify(works)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@field_works_bp.route('/<int:fw_id>', methods=['GET'])
@jwt_required()
def get_field_work(fw_id):
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT fw.*, u.name as employee_name, u.phone as employee_phone,
                       a.name as admin_name
                FROM field_works fw
                JOIN users u ON u.id = fw.employee_id
                JOIN users a ON a.id = fw.admin_id
                WHERE fw.id = %s
            """, (fw_id,))
            work = cur.fetchone()
            if not work:
                return jsonify({'error': 'Not found'}), 404

            if identity['role'] == 'employee' and work['employee_id'] != identity['id']:
                return jsonify({'error': 'Unauthorized'}), 403

            cur.execute("""
                SELECT e.*, u.name as employee_name
                FROM expenses e
                JOIN users u ON u.id = e.employee_id
                WHERE e.field_work_id = %s
                ORDER BY e.added_at ASC
            """, (fw_id,))
            expenses = cur.fetchall()
            for exp in expenses:
                if exp.get('added_at'):
                    exp['added_at'] = str(exp['added_at'])
        conn.close()
        for key in ('started_at', 'completed_at', 'created_at'):
            if work.get(key):
                work[key] = str(work[key])
        work['expenses'] = expenses
        return jsonify(work)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@field_works_bp.route('/', methods=['POST'])
@jwt_required()
def create_field_work():
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ('master', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    data = request.json
    employee_id = data.get('employee_id')
    title = data.get('title', '').strip()
    location = data.get('location', '').strip()
    description = data.get('description', '').strip()

    if not employee_id or not title:
        return jsonify({'error': 'Employee and title are required'}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cur:
            # Check if employee already has active field work
            cur.execute("SELECT id FROM field_works WHERE employee_id = %s AND status = 'active'", (employee_id,))
            existing = cur.fetchone()
            if existing:
                return jsonify({'error': 'Employee already has active field work'}), 409

            cur.execute(
                "INSERT INTO field_works (employee_id, admin_id, title, location, description) VALUES (%s, %s, %s, %s, %s)",
                (employee_id, identity['id'], title, location, description)
            )
            new_id = cur.lastrowid
        conn.close()
        return jsonify({'id': new_id, 'message': 'Field work started'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@field_works_bp.route('/<int:fw_id>/complete', methods=['PUT'])
@jwt_required()
def complete_field_work(fw_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ('master', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE field_works SET status = 'completed', completed_at = NOW()
                WHERE id = %s AND status = 'active'
            """, (fw_id,))
        conn.close()

        # Auto-send WhatsApp report immediately after completion
        from routes.reports import _send_whatsapp_report
        whatsapp_result = None
        whatsapp_error = None
        try:
            wa_response = _send_whatsapp_report(fw_id)
            # wa_response is a Flask Response object from jsonify
            wa_data = wa_response[0].get_json() if isinstance(wa_response, tuple) else wa_response.get_json()
            if wa_response[1] if isinstance(wa_response, tuple) else 200 == 200:
                whatsapp_result = wa_data.get('message')
            else:
                whatsapp_error = wa_data.get('error')
        except Exception as wa_err:
            whatsapp_error = str(wa_err)

        return jsonify({
            'message': 'Field work completed',
            'whatsapp_sent': whatsapp_result is not None,
            'whatsapp_message': whatsapp_result,
            'whatsapp_error': whatsapp_error
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500
    
    
@field_works_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_for_employee():
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("""
                SELECT fw.*, u.name as employee_name, a.name as admin_name
                FROM field_works fw
                JOIN users u ON u.id = fw.employee_id
                JOIN users a ON a.id = fw.admin_id
                WHERE fw.employee_id = %s AND fw.status = 'active'
                LIMIT 1
            """, (identity['id'],))
            work = cur.fetchone()
        conn.close()
        if work:
            for key in ('started_at', 'completed_at', 'created_at'):
                if work.get(key):
                    work[key] = str(work[key])
        return jsonify(work)
    except Exception as e:
        return jsonify({'error': str(e)}), 500
