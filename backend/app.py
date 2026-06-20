from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
import os

load_dotenv()

import init_db
init_db.run()

app = Flask(__name__)
CORS(app, origins=["http://localhost:3000", "http://localhost:5173"])

app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET', 'change-me-secret')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False
app.config['JWT_TOKEN_LOCATION'] = ['headers']
app.config['JWT_HEADER_NAME'] = 'Authorization'
app.config['JWT_HEADER_TYPE'] = 'Bearer'


jwt = JWTManager(app)

from routes.auth import auth_bp
from routes.users import users_bp
from routes.field_works import field_works_bp
from routes.expenses import expenses_bp
from routes.reports import reports_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(users_bp, url_prefix='/api/users')
app.register_blueprint(field_works_bp, url_prefix='/api/field-works')
app.register_blueprint(expenses_bp, url_prefix='/api/expenses')
app.register_blueprint(reports_bp, url_prefix='/api/reports')

@app.route('/api/health')
def health():
    return {'status': 'ok', 'message': 'Venus Fair Management API Running'}

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5000))
    app.run(debug=True, port=port)
