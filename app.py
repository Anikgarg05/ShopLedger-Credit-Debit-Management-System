from flask import Flask, request, jsonify, render_template
import sqlite3
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)

import os

from dotenv import load_dotenv
load_dotenv()

OWNER_EMAIL = os.environ.get("OWNER_EMAIL")
OWNER_PASSWORD = os.environ.get("OWNER_PASSWORD_HASH")

DB = "database.db"

# ---------- DB ----------
def get_db():
    return sqlite3.connect(DB)

def init_db():
    with get_db() as conn:
        conn.execute("""
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,   
            name TEXT,
            balance INTEGER DEFAULT 0
        )
        """)
        conn.execute("""
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id INTEGER,
            credit INTEGER DEFAULT 0,
            debit INTEGER DEFAULT 0
        )
        """)

init_db()

# ---------- PAGES ----------
@app.route("/")
def home():
    return render_template("index.html")

@app.route("/dashboard")
def dashboard():
    return render_template("dashboard.html")

@app.route("/audit")
def audit():
    return render_template("audit.html")

# ---------- LOGIN ----------
@app.route("/login", methods=["POST"])
def login():
    data = request.json

    if data["email"] != OWNER_EMAIL:
        return jsonify({"success": False, "message": "Invalid email"})

    if not check_password_hash(OWNER_PASSWORD, data["password"]):
        return jsonify({"success": False, "message": "Wrong password"})

    return jsonify({"success": True})

# ---------- CUSTOMER ----------
@app.route("/addCustomer", methods=["POST"])
def add_customer():
    name = request.json.get("name")

    if not name:
        return jsonify({"success": False, "message": "Name required"})

    with get_db() as conn:
        conn.execute("INSERT INTO customers (name, balance) VALUES (?, 0)", (name,))

    return jsonify({"success": True})

@app.route("/deleteCustomer/<int:id>", methods=["DELETE"])
def delete_customer(id):
    with get_db() as conn:
        conn.execute("DELETE FROM transactions WHERE customer_id=?", (id,))
        conn.execute("DELETE FROM customers WHERE id=?", (id,))

    return jsonify({"success": True})

# 🔥 DELETE ALL
@app.route("/deleteAllCustomers", methods=["DELETE"])
def delete_all():
    with get_db() as conn:
        conn.execute("DELETE FROM transactions")
        conn.execute("DELETE FROM customers")

    return jsonify({"success": True})

# ---------- CREDIT ----------
@app.route("/addCredit", methods=["POST"])
def add_credit():
    data = request.json

    if data["amount"] <= 0:
        return jsonify({"success": False, "message": "Invalid amount"})
    
    with get_db() as conn:
        conn.execute("UPDATE customers SET balance = balance + ? WHERE id=?",
                     (data["amount"], data["id"]))
        conn.execute("INSERT INTO transactions (customer_id, credit) VALUES (?, ?)",
                     (data["id"], data["amount"]))

    return jsonify({"success": True})

# ---------- DEBIT ----------
@app.route("/addDebit", methods=["POST"])
def add_debit():
    data = request.json

    if data["amount"] <= 0:
        return jsonify({"success": False, "message": "Invalid amount"})

    with get_db() as conn:
        conn.execute("UPDATE customers SET balance = balance - ? WHERE id=?",
                     (data["amount"], data["id"]))
        conn.execute("INSERT INTO transactions (customer_id, debit) VALUES (?, ?)",
                     (data["id"], data["amount"]))

    return jsonify({"success": True})

# ---------- DATA ----------
@app.route("/topCustomers")
def top_customers():
    with get_db() as conn:
        rows = conn.execute("SELECT * FROM customers ORDER BY id DESC LIMIT 5").fetchall()

    return jsonify([{"id": r[0], "name": r[1], "balance": r[2]} for r in rows])

@app.route("/search")
def search():
    q = request.args.get("q")

    with get_db() as conn:
        rows = conn.execute("SELECT * FROM customers WHERE name LIKE ?",
                            ('%' + q + '%',)).fetchall()

    return jsonify([{"id": r[0], "name": r[1], "balance": r[2]} for r in rows])

@app.route("/summary/<int:id>")
def summary(id):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("SELECT name FROM customers WHERE id=?", (id,))
        customer = cursor.fetchone()
        
        # ✅ Check if the customer actually exists first!
        if customer is None:
            return jsonify({"error": f"Customer with ID {id} not found"}), 404
            
        name = customer[0]

        cursor.execute("""
            SELECT credit, debit
            FROM transactions
            WHERE customer_id=?
            ORDER BY id DESC
            LIMIT 5
        """, (id,))
        rows = cursor.fetchall()

    result = []
    for r in rows:
        if r[0] > 0:
            result.append(f"₹{r[0]} given to {name}")
        elif r[1] > 0:
            result.append(f"₹{r[1]} received from {name}")

    return jsonify(result)

@app.route("/auditData")
def audit_data():
    with get_db() as conn:
        data = conn.execute(
            "SELECT SUM(credit), SUM(debit) FROM transactions"
        ).fetchone()

    return jsonify({
        "credit": data[0] or 0,
        "debit": data[1] or 0
    })

# ---------- RUN ----------
if __name__ == "__main__":
    import os
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)
