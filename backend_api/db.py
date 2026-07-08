import sqlite3
import os
import json
from datetime import datetime

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "data", "mindvault.db")

def get_db_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # 1. Teams table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT UNIQUE NOT NULL
        )
    """)
    
    # Insert default team if not exists
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('General')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('Engineering')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('HR Operations')")
    cursor.execute("INSERT OR IGNORE INTO teams (name) VALUES ('Sales')")
    
    # 2. Documents table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT UNIQUE NOT NULL,
            team_id TEXT DEFAULT 'General'
        )
    """)
    
    # 3. Query Log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS query_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            query TEXT NOT NULL,
            confidence_score INTEGER,
            team_id TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 4. Meetings table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS meetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            filename TEXT NOT NULL,
            transcript TEXT,
            key_points TEXT, -- stored as JSON string
            decisions TEXT,  -- stored as JSON string
            action_items TEXT, -- stored as JSON string
            team_id TEXT DEFAULT 'General',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 5. Workflow Rules table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow_rules (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            condition_type TEXT NOT NULL, -- e.g. 'confidence_below'
            condition_value TEXT NOT NULL,
            action_type TEXT NOT NULL, -- e.g. 'notify_expert', 'flag_risk', 'log_alert'
            action_target TEXT,
            team_id TEXT DEFAULT 'General',
            is_active INTEGER DEFAULT 1
        )
    """)
    
    # Insert default workflows if empty
    cursor.execute("SELECT COUNT(*) FROM workflow_rules")
    if cursor.fetchone()[0] == 0:
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('Low Confidence Alert', 'confidence_below', '40', 'log_alert', '', 'General')
        """)
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('Critical Policy Notification', 'confidence_below', '60', 'notify_expert', 'Deepak Rao', 'General')
        """)
        cursor.execute("""
            INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
            VALUES ('High Risk Layoff Flag', 'confidence_below', '50', 'flag_risk', 'Compliance Board', 'Engineering')
        """)
    
    # 6. Workflow Log table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS workflow_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rule_id INTEGER,
            rule_name TEXT,
            query TEXT,
            answer TEXT,
            confidence_score INTEGER,
            action_executed TEXT,
            status TEXT, -- 'executed', 'pending_review', 'approved', 'rejected'
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)
    
    # 7. Onboarding progress table
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS onboarding_progress (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            role TEXT NOT NULL,
            item_id TEXT NOT NULL,
            viewed INTEGER DEFAULT 0,
            viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role, item_id) ON CONFLICT REPLACE
        )
    """)
    
    conn.commit()
    conn.close()

# TEAMS HELPER FUNCTIONS
def get_all_teams():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT name FROM teams ORDER BY name ASC")
    teams = [{"name": row["name"]} for row in cursor.fetchall()]
    conn.close()
    return teams

def create_team(name):
    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO teams (name) VALUES (?)", (name,))
        conn.commit()
        success = True
    except sqlite3.IntegrityError:
        success = False
    conn.close()
    return success

# DOCUMENTS TEAM HELPER FUNCTIONS
def set_document_team(filename, team_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO documents (filename, team_id) 
        VALUES (?, ?) 
        ON CONFLICT(filename) DO UPDATE SET team_id = excluded.team_id
    """, (filename, team_id))
    conn.commit()
    conn.close()

def get_document_team_map():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT filename, team_id FROM documents")
    mapping = {row["filename"]: row["team_id"] for row in cursor.fetchall()}
    conn.close()
    return mapping

# QUERY LOG HELPER FUNCTIONS
def log_query(query, confidence_score, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO query_log (query, confidence_score, team_id)
        VALUES (?, ?, ?)
    """, (query, confidence_score, team_id))
    conn.commit()
    conn.close()

def get_low_confidence_queries(limit=100):
    conn = get_db_connection()
    cursor = conn.cursor()
    # Pull low confidence queries (score < 40)
    cursor.execute("""
        SELECT query, confidence_score, team_id, created_at 
        FROM query_log 
        WHERE confidence_score < 40
        ORDER BY created_at DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

# MEETINGS HELPER FUNCTIONS
def insert_meeting(filename, transcript, key_points, decisions, action_items, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO meetings (filename, transcript, key_points, decisions, action_items, team_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        filename, 
        transcript, 
        json.dumps(key_points), 
        json.dumps(decisions), 
        json.dumps(action_items), 
        team_id
    ))
    conn.commit()
    meeting_id = cursor.lastrowid
    conn.close()
    return meeting_id

def get_all_meetings(team_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if team_id:
        cursor.execute("SELECT * FROM meetings WHERE team_id = ? ORDER BY created_at DESC", (team_id,))
    else:
        cursor.execute("SELECT * FROM meetings ORDER BY created_at DESC")
    rows = cursor.fetchall()
    conn.close()
    
    meetings = []
    for r in rows:
        m = dict(r)
        try:
            m["key_points"] = json.loads(m["key_points"])
        except Exception:
            m["key_points"] = []
        try:
            m["decisions"] = json.loads(m["decisions"])
        except Exception:
            m["decisions"] = []
        try:
            m["action_items"] = json.loads(m["action_items"])
        except Exception:
            m["action_items"] = []
        meetings.append(m)
    return meetings

# WORKFLOWS HELPER FUNCTIONS
def get_all_workflow_rules(team_id=None):
    conn = get_db_connection()
    cursor = conn.cursor()
    if team_id:
        cursor.execute("SELECT * FROM workflow_rules WHERE team_id = ? AND is_active = 1")
    else:
        cursor.execute("SELECT * FROM workflow_rules WHERE is_active = 1")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def insert_workflow_rule(name, condition_type, condition_value, action_type, action_target, team_id="General"):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow_rules (name, condition_type, condition_value, action_type, action_target, team_id)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (name, condition_type, condition_value, action_type, action_target, team_id))
    conn.commit()
    rule_id = cursor.lastrowid
    conn.close()
    return rule_id

def remove_workflow_rule(rule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM workflow_rules WHERE id = ?", (rule_id,))
    conn.commit()
    conn.close()

def log_workflow_execution(rule_id, rule_name, query, answer, confidence_score, action_executed, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO workflow_log (rule_id, rule_name, query, answer, confidence_score, action_executed, status)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (rule_id, rule_name, query, answer, confidence_score, action_executed, status))
    conn.commit()
    log_id = cursor.lastrowid
    conn.close()
    return log_id

def get_all_workflow_logs():
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM workflow_log ORDER BY created_at DESC LIMIT 100")
    rows = cursor.fetchall()
    conn.close()
    return [dict(r) for r in rows]

def update_workflow_log(log_id, status):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("UPDATE workflow_log SET status = ? WHERE id = ?", (status, log_id))
    conn.commit()
    conn.close()

# ONBOARDING HELPER FUNCTIONS
def log_onboarding_progress(role, item_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO onboarding_progress (role, item_id, viewed)
        VALUES (?, ?, 1)
        ON CONFLICT(role, item_id) DO UPDATE SET viewed = 1, viewed_at = CURRENT_TIMESTAMP
    """, (role, item_id))
    conn.commit()
    conn.close()

def get_onboarding_completed_items(role):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT item_id FROM onboarding_progress WHERE role = ? AND viewed = 1", (role,))
    completed = [row["item_id"] for row in cursor.fetchall()]
    conn.close()
    return completed
