# 💰 Shop Credit Management System

A full-stack web application to manage customer credit and debit transactions for small shops and businesses.
It helps track how much each customer owes or has paid, with a simple dashboard and audit system.

---

## 🚀 Features

* ➕ Add and delete customers
* 💸 Credit tracking (customer takes goods → balance increases)
* 💵 Debit tracking (customer pays back → balance decreases)
* 🔍 Search customers instantly
* 📊 Audit dashboard with real-time chart (Chart.js)
* 🧾 Recent transaction summary for each customer
* 🔐 Secure login using hashed passwords and environment variables

---

## 🛠 Tech Stack

* **Backend:** Flask (Python)
* **Frontend:** HTML, CSS, JavaScript
* **Database:** SQLite
* **Visualization:** Chart.js
* **Security:** Werkzeug (password hashing), python-dotenv

---

## 📂 Project Structure

```
Shop-Credit-System/
│── static/
│── templates/
│── app.py
│── requirements.txt
│── README.md
│── .gitignore
│── run.bat
```

---

## ⚙️ Run Locally

### 1️⃣ Clone the repository

```
git clone <https://github.com/Anikgarg05/ShopLedger-Credit-Debit-Management-System.git>
cd Shop-Credit-System
```

### 2️⃣ Create virtual environment

```
python -m venv venv
venv\Scripts\activate
```

### 3️⃣ Install dependencies

```
pip install -r requirements.txt
```

### 4️⃣ Create `.env` file

Create a `.env` file in the root directory and add:

```
OWNER_EMAIL=your_email_here
OWNER_PASSWORD_HASH=your_password_hash_here
```

> ⚠️ Do NOT share your `.env` file or credentials publicly.

---

### 5️⃣ Run the application

```
python app.py
```

### 6️⃣ Open in browser

---

## 🔐 Authentication

Login credentials are stored securely using environment variables and hashed passwords.
Users must configure their own credentials in the `.env` file.

---

## 📊 How It Works

* **Credit:** Customer takes goods/money → balance increases
* **Debit:** Customer pays → balance decreases
* **Audit Dashboard:** Displays total credit, debit, and net balance with chart

---

## 🎯 Use Case

* Small shop owners
* Local businesses managing customer dues
* Learning full-stack development with Flask

---

## 🚀 Future Improvements

* Authentication with sessions/JWT
* Multi-user support
* Data export (CSV/PDF)
* Cloud deployment

---

## 👨‍💻 Author

**Anik Garg**
B.Tech CSE (IoT), Manipal University Jaipur

---

## ⭐ Support

If you like this project, give it a ⭐ on GitHub!
