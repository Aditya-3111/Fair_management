# 🛡️ Venus Fair Management System

A complete field-work & expense tracking system for security/fair management companies. Track employees on field duty, log expenses with payment screenshots, and auto-generate professional WhatsApp + PDF reports.

---

## 📦 What's Included

- **Master Panel** — full visibility of all employees, admins, field works, and live "who's on duty" tracking.
- **Admin Panel** — create employees, start/end field work, view expenses, download/print PDF reports, send WhatsApp reports.
- **Employee Panel** (mobile-first) — add expenses with amount + mandatory remark + optional payment screenshot while working in the field.
- **Cloudinary** integration for screenshot storage.
- **MySQL** database.
- **Flask** REST API backend.
- **React + Tailwind CSS** frontend (light, professional theme).
- Auto-generated **PDF reports** with your company logo.
- **WhatsApp Business API** integration to send reports to your company number.
- Fully responsive — works great on mobile (for employees in the field).

---

## 🗂️ Project Structure

```
fair-management/
├── backend/
│   ├── app.py                 # Main Flask app
│   ├── db.py                  # MySQL connection
│   ├── schema.sql             # Database schema
│   ├── create_master.py       # Script to create your Master login
│   ├── requirements.txt
│   ├── .env                   # Your secrets (DB, Cloudinary, WhatsApp)
│   └── routes/
│       ├── auth.py
│       ├── users.py
│       ├── field_works.py
│       ├── expenses.py
│       └── reports.py
├── frontend/
│   ├── src/
│   │   ├── pages/             # LoginPage, MasterPanel, AdminPanel, EmployeePanel
│   │   ├── components/        # Layout, StatCard
│   │   ├── context/           # AuthContext
│   │   └── utils/api.js
│   ├── public/
│   │   ├── logo.jpeg          # Your company logo
│   │   ├── venus-logo.jpeg
│   │   └── favicon.ico
│   ├── .env
│   └── package.json
└── WHATSAPP_TEMPLATE_GUIDE.md  # How to set up WhatsApp Business template
```

---

## 🚀 Setup Instructions

### 1. Database (MySQL)

```bash
mysql -u root -p < backend/schema.sql
```

This creates the `fair_management` database with all required tables (`users`, `field_works`, `expenses`).

### 2. Backend (Flask)

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Edit `backend/.env`** with your real values:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=fair_management

JWT_SECRET=generate_a_long_random_string_here

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_ACCESS_TOKEN=your_access_token
WHATSAPP_TEMPLATE_NAME=fair_expense_report
COMPANY_WHATSAPP_NUMBER=91XXXXXXXXXX

COMPANY_NAME=Venus Security
```

**Create your Master login:**
```bash
python create_master.py
```
Follow the prompts to set your Master email & password. This is the ONLY account created manually — Master then creates Admins, and Admins create Employees, all through the UI.

**Run the backend:**
```bash
python app.py
```
Backend runs on `http://localhost:5000`

### 3. Frontend (React)

```bash
cd frontend
npm install
npm run dev
```
Frontend runs on `http://localhost:3000` and proxies `/api` calls to the backend automatically.

---

## ☁️ Cloudinary Setup (for payment screenshots)

1. Sign up free at https://cloudinary.com
2. From your Dashboard, copy: **Cloud Name**, **API Key**, **API Secret**
3. Paste into `backend/.env`

Screenshots are stored under the `fair_management/screenshots` folder in your Cloudinary account.

---

## 💬 WhatsApp Setup

See **`WHATSAPP_TEMPLATE_GUIDE.md`** for full step-by-step instructions on:
- Creating a Meta WhatsApp Business app
- Getting your Phone Number ID & Access Token
- Creating and getting your message template approved
- Testing the integration

You mentioned you'll verify the template yourself in Meta Business Manager — the guide has the exact template text to submit.

---

## 👥 How the Roles Work

| Role | Created By | Can Do |
|---|---|---|
| **Master** | You (via `create_master.py`) | See everything: all admins, employees, field works, live duty status. Create admins & employees. |
| **Admin** | Master (or another Admin) | Create employees, start field work for an employee, end field work, view expenses, download/print PDF, send WhatsApp report. |
| **Employee** | Admin/Master | See their own active field work, add expenses (amount + remark mandatory + screenshot optional) as they spend money in the field. |

### Typical Flow:
1. **Master** logs in → creates an **Admin** account.
2. **Admin** logs in → creates **Employee** accounts.
3. **Admin** starts a **Field Work** for an employee (assigns title, location).
4. **Employee** opens the app on their phone → sees their active field work → adds expenses one by one as they spend (e.g. "₹500 - Travel to venue", with optional payment screenshot).
5. **Admin** can see live running total at any time.
6. When the work is done, **Admin** clicks **Complete** → field work is marked completed.
7. **Admin** clicks **Send WhatsApp** → report (with logo, all expenses, total, remarks) is sent to the company WhatsApp number. Admin can also **Download/Print PDF** any time.
8. **Master** can see all of this across all admins/employees at any time from the Master Panel.

---

## 🎨 Design

- **Light, professional theme** — navy blue (`#1e3a5f`) + white, with red accent, matching your brand colors from the logo.
- Fully responsive — sidebar collapses to a mobile drawer menu.
- Employee panel is designed mobile-first (large tap targets, bottom-sheet modals) since employees will mostly use phones in the field.

---

## 🔒 Security Notes

- Passwords are hashed with **bcrypt** — never stored in plain text.
- JWT tokens used for all authenticated API calls.
- All secrets (DB password, Cloudinary keys, WhatsApp tokens, company WhatsApp number) are in `.env` — **never commit this file** (already in `.gitignore`).
- Role-based access control enforced on every backend route (Master/Admin/Employee).

---

## 🛠️ Production Deployment Tips

- Backend: deploy with Gunicorn (`gunicorn app:app`) behind Nginx, set `FLASK_ENV=production`.
- Frontend: `npm run build` → deploy the `dist/` folder to any static host (Vercel, Netlify, or your own Nginx).
- Use a permanent WhatsApp Access Token (System User token from Meta Business Manager) so it doesn't expire every 24 hours.
- Set up SSL (HTTPS) — required for WhatsApp webhook/API calls in production.
- Consider adding automated DB backups for `fair_management` database.

---

Built with ❤️ for Venus Security's field operations team.
