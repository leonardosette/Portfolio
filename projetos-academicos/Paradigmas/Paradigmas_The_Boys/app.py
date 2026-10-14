from flask import Flask, request, jsonify, send_from_directory, Response
import sqlite3
import os
import random
from datetime import datetime

app = Flask(__name__)

def create_connection():
    return sqlite3.connect('heroes.db')

@app.route('/')
def serve_HomePage():
    return send_from_directory('', 'index.html')

@app.route('/heroes.html')
def serve_index():
    return send_from_directory('', 'heroes.html')

@app.route('/missao.html')
def serve_missions():
    return send_from_directory('', 'missao.html')

@app.route('/crimes.html')
def serve_crimes():
    return send_from_directory('', 'crimes.html')

@app.route('/missao-heroi.html')
def serve_mission_hero():
    return send_from_directory('', 'missao-heroi.html')

@app.route('/batalha.html')
def serve_batalha():
    return send_from_directory('', 'batalha.html')


@app.route('/heroes', methods=['POST'])
def add_hero():
    data = request.json
    hero_data = (
        data['real_name'], data['hero_name'], data['gender'], data['height'], data['weight'],
        data['birth_date'], data['birth_place'], data['powers'], data['strength_level'],
        data['popularity'], "Ativo", data['battle_history']
    )
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO heroes (real_name, hero_name, gender, height, weight, birth_date,
                        birth_place, powers, strength_level, popularity, status, battle_history)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', hero_data)
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hero added successfully'}), 201

@app.route('/heroes/<int:hero_id>', methods=['DELETE'])
def delete_hero(hero_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM heroes WHERE id = ?', (hero_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hero deleted successfully'}), 200

@app.route('/heroes/<int:hero_id>', methods=['PUT'])
def update_hero(hero_id):
    data = request.json
    updated_data = (
        data['real_name'], data['hero_name'], data['gender'], data['height'], data['weight'],
        data['birth_date'], data['birth_place'], data['powers'], data['strength_level'],
        data['popularity'], data['battle_history'], hero_id
    )
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE heroes
    SET real_name = ?, hero_name = ?, gender = ?, height = ?, weight = ?, birth_date = ?,
        birth_place = ?, powers = ?, strength_level = ?, popularity = ?, battle_history = ?
    WHERE id = ?
    ''', updated_data)
    conn.commit()
    conn.close()
    return jsonify({'message': 'Hero updated successfully'}), 200
    
@app.route('/heroes/<int:hero_id>', methods=['GET'])
def get_hero_by_id(hero_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM heroes WHERE id = ?', (hero_id,))
    hero = cursor.fetchone()
    conn.close()

    if not hero:
        return jsonify({'message': 'Hero not found'}), 404

    # Retorna os dados do herói em formato JSON
    return jsonify({
        'id': hero[0],
        'real_name': hero[1],
        'hero_name': hero[2],
        'gender': hero[3],
        'height': hero[4],
        'weight': hero[5],
        'birth_date': hero[6],
        'birth_place': hero[7],
        'powers': hero[8],
        'strength_level': hero[9],
        'popularity': hero[10],
        'status': hero[11],
        'battle_history': hero[12]
    })

@app.route('/crimes', methods=['POST'])
def add_crime():
    data = request.get_json()
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO crimes (crime_name, crime_description, hero_id, hero_name, crime_date, crime_severity)
        VALUES (?, ?, ?, ?, ?, ?)
    """, (
        data['crime_name'], data['crime_description'], data['hero_id'], data['hero_name'], data['crime_date'],
        data['crime_severity']
    ))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Crime added successfully'}), 201

@app.route('/heroes', methods=['GET'])
def search_heroes():
    name = request.args.get('name', type=str)
    popularity = request.args.get('popularity', type=int)
    status = request.args.get('status', type=str)
    
    print(f"Received parameters - Name: {name}, Popularity: {popularity}, Status: {status}")
    
    conn = create_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM heroes WHERE 1=1"
    params = []
    
    if name:
        query += " AND hero_name LIKE ?"
        params.append(f"%{name}%")
    
    if popularity is not None:
        query += " AND popularity = ?"
        params.append(popularity)
    
    if status:
        query += " AND status = ?"
        params.append(status)
    
    print(f"Executing query: {query} with params: {params}")
    
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    
    if not results:
        return jsonify({'message': 'No heroes found matching the criteria'}), 404
    
    return jsonify(results)


@app.route('/crimes', methods=['GET'])
def search_crimes():
    hero_name = request.args.get('hero_name')
    crime_severity = request.args.get('crime_severity')
    conn = create_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM crimes WHERE 1=1"
    params = []
    if hero_name:
        query += " AND hero_name LIKE ?"
        params.append(f"%{hero_name}%")
    if crime_severity:
        query += " AND crime_severity = ?"
        params.append(crime_severity)
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@app.route('/missions', methods=['POST'])
def add_mission():
    data = request.json
    mission_data = (
        data['mission_name'], data['description'], data['difficulty_level'],
        data['rewards']
    )
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
    INSERT INTO missions (mission_name, description, difficulty_level, rewards)
    VALUES (?, ?, ?, ?)
    ''', mission_data)
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mission added successfully'}), 201


@app.route('/missions', methods=['GET'])
def search_missions():
    name = request.args.get('name')
    conn = create_connection()
    cursor = conn.cursor()
    query = "SELECT * FROM missions WHERE 1=1"
    params = []
    if name:
        query += " AND mission_name LIKE ?"
        params.append(f"%{name}%")
    cursor.execute(query, params)
    results = cursor.fetchall()
    conn.close()
    return jsonify(results)

@app.route('/mission_heroes', methods=['POST'])
def add_hero_mission():
    data = request.json
    mission_id = data['mission_id']
    mission_name = data['mission_name']
    result = data['result']
    hero_ids = data['hero_ids']  # Array de IDs de heróis

    conn = create_connection()
    cursor = conn.cursor()
    
    for hero_id in hero_ids:
        cursor.execute('SELECT hero_name FROM heroes WHERE id = ?', (hero_id,))
        hero_name = cursor.fetchone()[0]
        hero_mission_data = (
            hero_id, mission_id, mission_name, hero_name, result
        )
        cursor.execute('''
        INSERT INTO mission_heroes (hero_id, mission_id, mission_name, hero_name, result)
        VALUES (?, ?, ?, ?, ?)
        ''', hero_mission_data)
    
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mission linked to heroes successfully'}), 201

@app.route('/missions/<int:mission_id>', methods=['PUT'])
def update_mission(mission_id):
    data = request.json
    updated_data = (
        data['mission_name'], data['description'], data['difficulty_level'],
        data['rewards'], mission_id
    )
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('''
    UPDATE missions
    SET mission_name = ?, description = ?, difficulty_level = ?, rewards = ?
    WHERE id = ?
    ''', updated_data)
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mission updated successfully'}), 200

@app.route('/missions/<int:mission_id>', methods=['DELETE'])
def delete_mission(mission_id):
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM missions WHERE id = ?', (mission_id,))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Mission deleted successfully'}), 200

@app.route('/heroes_list', methods=['GET'])
def get_heroes_list():
    conn = create_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, hero_name FROM heroes")
    heroes = cursor.fetchall()
    conn.close()
    return jsonify(heroes)

@app.route('/heroes_by_difficulty/<int:difficulty_level>', methods=['GET'])
def get_heroes_by_difficulty(difficulty_level):
    conn = create_connection()
    cursor = conn.cursor()
    
    if difficulty_level <= 30:
        cursor.execute("SELECT id, hero_name FROM heroes")
    elif difficulty_level >= 31 and difficulty_level <= 60:
        cursor.execute("SELECT id, hero_name FROM heroes WHERE strength_level BETWEEN 40 AND 100")
    elif difficulty_level >=61 and difficulty_level <= 90:
        cursor.execute("SELECT id, hero_name FROM heroes WHERE strength_level BETWEEN 80 AND 100")
    else:
        cursor.execute("SELECT id, hero_name FROM heroes WHERE strength_level > 95")
    
    heroes = cursor.fetchall()
    conn.close()
    return jsonify(heroes)


# Função para gerar uma história de batalha
def generate_battle_story(hero1, hero2, climate_factor, location_factor, battle_result):
    battle_story = []
    battle_story.append(f"A batalha entre {hero1[1]} e {hero2[1]} no clima {climate_factor} e local {location_factor} começou!\n")
    battle_story.append(f"{hero1[1]} se preparou para a luta, enquanto {hero2[1]} estava pronto para vencer.\n")

    if battle_result == 'empate':
        battle_story.append("A batalha terminou em empate, ambos os heróis estavam igualmente fortes!\n")
    else:
        winner = hero1 if battle_result == hero1[1] else hero2
        loser = hero2 if winner == hero1 else hero1
        battle_story.append(f"Após uma luta intensa, {winner[1]} venceu {loser[1]} no {climate_factor}!\n")
    
    battle_story.append("A batalha foi marcada por incríveis momentos de heroísmo!\n")
    return "".join(battle_story)

@app.route('/battle', methods=['POST'])
def simulate_battle():
    data = request.json
    hero1_id = data['hero1_id']
    hero2_id = data['hero2_id']

    # Conectar ao banco de dados
    conn = create_connection()
    cursor = conn.cursor()

    # Buscar informações dos heróis
    cursor.execute('SELECT id, hero_name, strength_level, popularity, battle_history FROM heroes WHERE id = ?', (hero1_id,))
    hero1 = cursor.fetchone()
    cursor.execute('SELECT id, hero_name, strength_level, popularity, battle_history FROM heroes WHERE id = ?', (hero2_id,))
    hero2 = cursor.fetchone()

    if not hero1 or not hero2:
        return jsonify({'message': 'Herói(s) não encontrado(s).'}), 404

    # Fatores básicos
    hero1_strength = hero1[2] if hero1[2] else 0
    hero2_strength = hero2[2] if hero2[2] else 0

    # Adiciona variação aleatória de força
    hero1_strength += random.randint(-10, 10)
    hero2_strength += random.randint(-10, 10)

    # Penalidade ou bônus para heróis mais fracos
    strength_gap = abs(hero1_strength - hero2_strength)
    if hero1_strength < hero2_strength:
        hero1_strength += int(strength_gap * 0.4)  # Bônus de 40% da diferença
    elif hero2_strength < hero1_strength:
        hero2_strength += int(strength_gap * 0.4)

    # Bônus de popularidade
    hero1_bonus = int(hero1[3] * 0.5)
    hero2_bonus = int(hero2[3] * 0.5)

    # Fatores aleatórios de clima e local
    climate_factor = random.choice(["sunny", "rainy", "windy", "foggy", "stormy"])
    location_factor = random.choice(["open_field", "urban_area", "forest", "mountain", "arena"])

    # Impacto do clima e local
    climate_impact = {"sunny": 5, "rainy": -5, "windy": 2, "foggy": -3, "stormy": -7}
    location_impact = {"open_field": 5, "urban_area": 3, "forest": -2, "mountain": 0, "arena": 10}

    hero1_climate_effect = climate_impact[climate_factor] + location_impact[location_factor]
    hero2_climate_effect = climate_impact[climate_factor] + location_impact[location_factor]

    # Fator de sorte
    hero1_luck = random.randint(-5, 10)
    hero2_luck = random.randint(-5, 10)

    # Calcula pontuação final
    hero1_final_score = hero1_strength + hero1_bonus + hero1_climate_effect + hero1_luck
    hero2_final_score = hero2_strength + hero2_bonus + hero2_climate_effect + hero2_luck

    # Adiciona chance de lesão (impacto negativo aleatório)
    if random.random() < 0.2:  # 20% de chance de lesão
        injury_penalty = random.randint(5, 15)
        if hero1_final_score > hero2_final_score:
            hero1_final_score -= injury_penalty
        else:
            hero2_final_score -= injury_penalty

    # Determinar vencedor
    winner, loser = None, None
    battle_log = [f"Batalha no clima {climate_factor} e local {location_factor}!\n"]

    if hero1_final_score > hero2_final_score:
        winner, loser = hero1, hero2
        battle_log.append(f"{hero1[1]} venceu com {hero1_final_score} pontos!\n")
        battle_log.append(f"{hero2[1]} perdeu com {hero2_final_score} pontos.\n")
        battle_result = hero1[1]
    elif hero2_final_score > hero1_final_score:
        winner, loser = hero2, hero1
        battle_log.append(f"{hero2[1]} venceu com {hero2_final_score} pontos!\n")
        battle_log.append(f"{hero1[1]} perdeu com {hero1_final_score} pontos.\n")
        battle_result = hero2[1]
    else:
        battle_log.append("A batalha terminou em empate!\n")
        battle_log.append(f"Ambos os heróis tiveram a mesma força final: {hero1_final_score}\n")
        return jsonify({'result': 'Empate!', 'battle_log': battle_log}), 200

    # Gerar história da batalha
    battle_story = generate_battle_story(hero1, hero2, climate_factor, location_factor, battle_result)

    # Atualizar banco de dados
    winner_id, loser_id = winner[0], loser[0]
    cursor.execute('UPDATE heroes SET popularity = popularity + 10, battle_history = battle_history || ? WHERE id = ?',
                   (f'Vitória contra {loser[1]} no clima {climate_factor} em {location_factor}; ', winner_id))
    cursor.execute('UPDATE heroes SET popularity = popularity - 5, battle_history = battle_history || ? WHERE id = ?',
                   (f'Derrota para {winner[1]} no clima {climate_factor} em {location_factor}; ', loser_id))
    conn.commit()
    conn.close()

    return jsonify({
        'result': f'{winner[1]} venceu {loser[1]}!',
        'battle_log': battle_log,
        'battle_story': battle_story,  # História da batalha
        'battle_details': {
            'climate': climate_factor,
            'location': location_factor,
            'hero1_strength': hero1_strength,
            'hero2_strength': hero2_strength,
            'hero1_bonus': hero1_bonus,
            'hero2_bonus': hero2_bonus,
            'hero1_luck': hero1_luck,
            'hero2_luck': hero2_luck
        }
    }), 200


if __name__ == '__main__':
    conn = create_connection()
    cursor = conn.cursor()
    
    # Create tables if they don't exist
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS heroes (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    real_name      TEXT    NOT NULL,
    hero_name      TEXT    NOT NULL,
    gender         TEXT,
    height         REAL,
    weight         REAL,
    birth_date     TEXT,
    birth_place    TEXT,
    powers         TEXT,
    strength_level INTEGER,
    popularity     INTEGER DEFAULT 0,
    status         TEXT,
    battle_history TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS crimes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        crime_name TEXT NOT NULL,
        crime_description TEXT,
        hero_id INTEGER,
        crime_date TEXT,
        hero_name TEXT,
        crime_severity INTEGER,
        FOREIGN KEY (hero_id) REFERENCES heroes (id)
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS missions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    mission_name     TEXT    NOT NULL,
    description      TEXT,
    difficulty_level INTEGER,
    rewards          TEXT
    )
    ''')

    cursor.execute('''
    CREATE TABLE IF NOT EXISTS mission_heroes (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    hero_id      INTEGER,
    mission_id   INTEGER,
    mission_name TEXT,
    hero_name    TEXT,
    result       TEXT,
    FOREIGN KEY (
        hero_id
    )
    REFERENCES heroes (id),
    FOREIGN KEY (
        mission_id
    )
    REFERENCES missions (id) 
    );
    ''')
    
    # Create trigger to update hero popularity
    cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS update_hero_popularity
    AFTER INSERT ON crimes
    FOR EACH ROW
    BEGIN
    UPDATE heroes
    SET popularity = 
        CASE
            WHEN NEW.crime_severity BETWEEN 0 AND 10 THEN popularity - 10
            WHEN NEW.crime_severity BETWEEN 11 AND 20 THEN popularity - 20
            WHEN NEW.crime_severity BETWEEN 21 AND 30 THEN popularity - 30
            WHEN NEW.crime_severity BETWEEN 31 AND 40 THEN popularity - 40
            WHEN NEW.crime_severity BETWEEN 41 AND 50 THEN popularity - 50
            WHEN NEW.crime_severity BETWEEN 51 AND 60 THEN popularity - 60
            WHEN NEW.crime_severity BETWEEN 61 AND 70 THEN popularity - 70
            WHEN NEW.crime_severity BETWEEN 71 AND 80 THEN popularity - 80
            WHEN NEW.crime_severity BETWEEN 81 AND 90 THEN popularity - 90
            WHEN NEW.crime_severity BETWEEN 91 AND 100 THEN popularity - 100
            ELSE popularity
        END
    WHERE id = NEW.hero_id;
    END
    ''')

    cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS update_hero_status
    AFTER UPDATE OF popularity ON heroes
    FOR EACH ROW
    BEGIN
        UPDATE heroes
        SET status = 
            CASE
                WHEN NEW.popularity <= 20 THEN 'banido'
                WHEN NEW.popularity > 70 THEN 'ativo'
                ELSE status
            END
        WHERE id = NEW.id;
    END
    ''')

    cursor.execute('DROP TRIGGER IF EXISTS update_hero_stats')

    cursor.execute('''
    CREATE TRIGGER IF NOT EXISTS update_hero_stats
    AFTER INSERT ON mission_heroes
    FOR EACH ROW
    BEGIN
        UPDATE heroes
        SET strength_level = strength_level + 
            CASE
                WHEN NEW.result = 'Sucesso' THEN (SELECT difficulty_level FROM missions WHERE id = NEW.mission_id) / 10
                ELSE -(SELECT difficulty_level FROM missions WHERE id = NEW.mission_id) / 10
            END,
            popularity = popularity + 
            CASE
                WHEN NEW.result = 'Sucesso' THEN (SELECT difficulty_level FROM missions WHERE id = NEW.mission_id) / 5
                ELSE -(SELECT difficulty_level FROM missions WHERE id = NEW.mission_id) / 5
            END
        WHERE id = NEW.hero_id;
    END
    ''')
    
    conn.commit()
    conn.close()
    
    app.run(debug=True)