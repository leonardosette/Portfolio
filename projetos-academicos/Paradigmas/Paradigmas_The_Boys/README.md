[Documentação da API](https://documenter.getpostman.com/view/33810023/2sAYBSisMm)


# Documentação da API - Sistema de Gerenciamento de Heróis do The Boys

## Interface

### 1. Página Inicial
**GET** `/`
- **Descrição:** Retorna a página inicial (`index.html`).

---

### 2. Página de Gerenciamento de Heróis
**GET** `/heroes.html`
- **Descrição:** Retorna a página de gerenciamento de heróis.

---

### 3. Página de Gerenciamento de Missões
**GET** `/missao.html`
- **Descrição:** Retorna a página de gerenciamento de missões.

---

### 4. Página de Gerenciamento de Crimes
**GET** `/crimes.html`
- **Descrição:** Retorna a página de gerenciamento de crimes.

---

### 5. Página para Vincular Missões a Heróis
**GET** `/missao-heroi.html`
- **Descrição:** Retorna a página para vincular missões a heróis.

---

### 6. Página de Simulação de Batalhas
**GET** `/batalha.html`
- **Descrição:** Retorna a página de simulação de batalhas.

---

## Gerenciamento de Heróis

### 1. Adicionar Herói
**POST** `/heroes`
- **Descrição:** Adiciona um novo herói ao sistema.

---

### 2. Buscar Heróis
**GET** `/heroes`
- **Descrição:** Busca heróis.

---

### 3. Buscar Herói por ID
**GET** `/heroes/<int:hero_id>`
- **Descrição:** Busca heróis com base em ID.

---

### 4. Atualizar Herói
**PUT** `/heroes/<int:hero_id>`
- **Descrição:** Atualiza os dados de um herói específico pelo ID.

---

### 5. Excluir Herói
**DELETE** `/heroes/<int:hero_id>`
- **Descrição:** Remove um herói do sistema pelo ID.

---

### 6. Listar Heróis
**GET** `/heroes_list`
- **Descrição:** Retorna uma lista de IDs e nomes de todos os heróis.

---

### 7. Buscar Heróis por Dificuldade
**GET** `/heroes_by_difficulty/<int:hero_id>`
- **Descrição:** Retorna heróis adequados com base no nível de dificuldade da missão.

---

## Gerenciamento de Missões

### 1. Adicionar Missão
**POST** `/missions`
- **Descrição:** Adiciona uma nova missão ao sistema.

---

### 2. Buscar Missões
**GET** `/missions`
- **Descrição:** Busca missões com base em parâmetros opcionais.

---

### 3. Atualizar Missão
**PUT** `/missions/<int:mission_id>`
- **Descrição:** Atualiza os dados de uma missão específica pelo ID.

---

### 4. Excluir Missão
**DELETE** `/missions/<int:mission_id>`
- **Descrição:** Remove uma missão do sistema pelo ID.

---

## Crimes

### 1. Adicionar Crime
**POST** `/crimes`
- **Descrição:** Adiciona um novo crime associado a um herói.

---

### 2. Buscar Crimes
**GET** `/crimes`
- **Descrição:** Busca crimes registrados no sistema com base em parâmetros opcionais.

---

## Vincular Missões a Heróis

### 1. Vincular Missão a Heróis
**POST** `/mission_heroes`
- **Descrição:** Vincula heróis a uma missão específica.

---

## Simulação de Batalhas

### 1. Simular Batalha
**POST** `/battle`
- **Descrição:** Simula uma batalha entre dois heróis.
