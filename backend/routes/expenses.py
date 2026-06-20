from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import cloudinary
import cloudinary.uploader
import os
from db import get_connection
import json

expenses_bp = Blueprint('expenses', __name__)

cloudinary.config(
    cloud_name=os.getenv('CLOUDINARY_CLOUD_NAME'),
    api_key=os.getenv('CLOUDINARY_API_KEY'),
    api_secret=os.getenv('CLOUDINARY_API_SECRET')
)

@expenses_bp.route('/', methods=['POST'])
@jwt_required()
def add_expense():
    identity = json.loads(get_jwt_identity())

    amount = request.form.get('amount')
    remark = request.form.get('remark', '').strip()
    field_work_id = request.form.get('field_work_id')
    screenshot = request.files.get('screenshot')

    if not amount or not remark or not field_work_id:
        return jsonify({'error': 'Amount, remark, and field_work_id are required'}), 400

    try:
        amount = float(amount)
    except ValueError:
        return jsonify({'error': 'Invalid amount'}), 400

    try:
        conn = get_connection()
        with conn.cursor() as cur:
            # Verify field work is active and belongs to this employee
            cur.execute("""
                SELECT id FROM field_works 
                WHERE id = %s AND employee_id = %s AND status = 'active'
            """, (field_work_id, identity['id']))
            fw = cur.fetchone()
            if not fw:
                conn.close()
                return jsonify({'error': 'No active field work found'}), 404

        # Upload screenshot if provided
        screenshot_url = None
        screenshot_public_id = None
        if screenshot:
            try:
                result = cloudinary.uploader.upload(
                    screenshot,
                    folder='fair_management/screenshots',
                    resource_type='image'
                )
                screenshot_url = result['secure_url']
                screenshot_public_id = result['public_id']
            except Exception as e:
                return jsonify({'error': f'Screenshot upload failed: {str(e)}'}), 500

        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO expenses (field_work_id, employee_id, amount, remark, 
                   payment_screenshot_url, payment_screenshot_public_id) 
                   VALUES (%s, %s, %s, %s, %s, %s)""",
                (field_work_id, identity['id'], amount, remark, screenshot_url, screenshot_public_id)
            )
            new_id = cur.lastrowid

            # Update total expense in field_works
            cur.execute("""
                UPDATE field_works SET total_expense = (
                    SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE field_work_id = %s
                ) WHERE id = %s
            """, (field_work_id, field_work_id))

        conn.close()
        return jsonify({
            'id': new_id,
            'message': 'Expense added',
            'screenshot_url': screenshot_url
        }), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/field-work/<int:fw_id>', methods=['GET'])
@jwt_required()
def get_expenses(fw_id):
    identity = json.loads(get_jwt_identity())
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            if identity['role'] == 'employee':
                cur.execute("""
                    SELECT e.*, u.name as employee_name FROM expenses e
                    JOIN users u ON u.id = e.employee_id
                    WHERE e.field_work_id = %s AND e.employee_id = %s
                    ORDER BY e.added_at DESC
                """, (fw_id, identity['id']))
            else:
                cur.execute("""
                    SELECT e.*, u.name as employee_name FROM expenses e
                    JOIN users u ON u.id = e.employee_id
                    WHERE e.field_work_id = %s
                    ORDER BY e.added_at DESC
                """, (fw_id,))
            expenses = cur.fetchall()
        conn.close()
        for exp in expenses:
            if exp.get('added_at'):
                exp['added_at'] = str(exp['added_at'])
        return jsonify(expenses)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@expenses_bp.route('/<int:expense_id>', methods=['DELETE'])
@jwt_required()
def delete_expense(expense_id):
    identity = json.loads(get_jwt_identity())
    if identity['role'] not in ('master', 'admin'):
        return jsonify({'error': 'Unauthorized'}), 403
    try:
        conn = get_connection()
        with conn.cursor() as cur:
            cur.execute("SELECT field_work_id, payment_screenshot_public_id FROM expenses WHERE id = %s", (expense_id,))
            exp = cur.fetchone()
            if not exp:
                return jsonify({'error': 'Not found'}), 404
            if exp['payment_screenshot_public_id']:
                try:
                    cloudinary.uploader.destroy(exp['payment_screenshot_public_id'])
                except:
                    pass
            cur.execute("DELETE FROM expenses WHERE id = %s", (expense_id,))
            cur.execute("""
                UPDATE field_works SET total_expense = (
                    SELECT COALESCE(SUM(amount), 0) FROM expenses WHERE field_work_id = %s
                ) WHERE id = %s
            """, (exp['field_work_id'], exp['field_work_id']))
        conn.close()
        return jsonify({'message': 'Deleted'})
    except Exception as e:
        return jsonify({'error': str(e)}), 500
