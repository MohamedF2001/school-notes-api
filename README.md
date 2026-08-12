# API de Gestion des Notes — École Coranique

API REST Node.js / Express / MongoDB (Mongoose) pour la gestion des notes d'une école coranique : classes, matières, professeurs, élèves, parents et notes (interrogations / devoirs) sur deux semestres.

## 🚀 Installation

```bash
npm install
cp .env.example .env
```

Modifier `.env` avec votre chaîne de connexion MongoDB Atlas :

```env
PORT=3000
NODE_ENV=development
MONGO_URI=mongodb+srv://user:password@cluster.mongodb.net/school-notes-api
JWT_SECRET=un_secret_long_et_aleatoire
JWT_EXPIRES_IN=24h
DIRECTOR_USERNAME=admin
DIRECTOR_PASSWORD=admin
CORS_ORIGIN=*
```

## ▶️ Lancement

```bash
npm run dev     # développement (nodemon)
npm start       # production
```

Au premier démarrage, si aucun directeur n'existe en base, un compte `admin/admin` (ou les valeurs de `.env`) est créé automatiquement.

La documentation Swagger est disponible sur : `http://localhost:3000/api-docs`

## ☁️ Déploiement Vercel

Le projet est prêt pour un déploiement serverless sur Vercel (`vercel.json` inclus). Pensez à configurer les variables d'environnement dans le tableau de bord Vercel (`MONGO_URI`, `JWT_SECRET`, etc.).

## 🧪 Tester l'API (Postman / Thunder Client)

Toutes les routes protégées nécessitent un header :

```
Authorization: Bearer <token>
```

### 1. Connexion directeur
```
POST /api/auth/director/login
{ "username": "admin", "password": "admin" }
```

### 2. Création d'une classe (directeur)
```
POST /api/classes
{ "nom": "3ème année", "niveau": "Intermédiaire", "anneeScolaire": "2026-2027" }
```

### 3. Création d'une matière (directeur)
```
POST /api/subjects
{ "nom": "Coran", "coefficient": 3 }
```

### 4. Création d'un professeur (directeur)
```
POST /api/teachers
{ "username": "prof_ahmed", "password": "123456", "nom": "Ahmed Diallo" }
```

### 5. Affectation professeur / classe / matière (directeur)
```
POST /api/assignments
{ "teacher": "<teacherId>", "class": "<classId>", "subject": "<subjectId>", "anneeScolaire": "2026-2027" }
```

### 6. Création d'un parent (directeur)
```
POST /api/parents
{ "nom": "Diallo", "prenom": "Moussa", "telephone": "+22912345678" }
```

### 7. Création d'un élève (directeur)
```
POST /api/students
{
  "nom": "Diallo", "prenom": "Fatima", "classe": "<classId>",
  "matricule": "EC-2026-001", "anneeScolaire": "2026-2027", "parents": ["<parentId>"]
}
```

### 8. Association parent / élève
Se fait directement via `parents` lors de la création de l'élève, ou via `PUT /api/parents/:id` / `PUT /api/students/:id`.

### 9. Connexion professeur
```
POST /api/auth/teacher/login
{ "username": "prof_ahmed", "password": "123456" }
```

### 10. Ajout d'une interrogation (professeur)
```
POST /api/grades
{
  "student": "<studentId>", "subject": "<subjectId>", "class": "<classId>",
  "semester": 1, "type": "interrogation", "numero": 1,
  "note": 16, "bareme": 20, "anneeScolaire": "2026-2027"
}
```

### 11. Ajout d'un devoir (professeur)
```
POST /api/grades
{
  "student": "<studentId>", "subject": "<subjectId>", "class": "<classId>",
  "semester": 1, "type": "devoir", "numero": 1,
  "note": 14, "bareme": 20, "anneeScolaire": "2026-2027"
}
```

### 12. Consultation des résultats
```
GET /api/students/:id/results
GET /api/classes/:id/results
```

### 13. Génération du lien parent (directeur)
```
POST /api/parents/:id/access-link
{ "expiresInDays": 90 }
```

### 14. Consultation publique via le lien parent
```
GET /api/parent/public/:token
```

## 📁 Structure du projet

```
school-notes-api/
├── config/db.js
├── models/
├── controllers/
├── routes/
├── middlewares/
├── utils/
├── swagger.json
├── server.js
├── package.json
├── vercel.json
├── .env.example
└── .gitignore
```

## 🔐 Rôles

- **Directeur** : accès complet (classes, matières, professeurs, affectations, élèves, parents, notes, tableau de bord).
- **Professeur** : accès limité à ses classes/matières affectées ; saisie et modification de ses propres notes.
- **Parent** : accès en lecture seule à ses enfants via un lien/token sécurisé, sans authentification classique.

## 🧮 Calcul des moyennes

La logique est centralisée dans `utils/calculateResults.js` :
- Moyenne interrogations = moyenne des interrogations saisies (1 à 3, sans compter les notes manquantes comme 0).
- Moyenne devoirs = moyenne des devoirs saisis (1 à 2).
- Moyenne matière = (moyenne interrogations + moyenne devoirs) / 2 (uniquement sur les composantes disponibles).
- Moyenne générale du semestre = moyenne pondérée par les coefficients des matières ayant une moyenne disponible.
- Si aucune note n'est disponible, la moyenne retournée est `null` (jamais 0).
