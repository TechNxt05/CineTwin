# Which Character Are You?

A full-stack web application that matches users with fictional characters based on personality traits, quiz answers, and media preferences using AI-powered analysis.

## 🚀 Features

- **Personality Quiz**: 15-20 questions covering 10 personality traits
- **Multi-Universe Support**: Characters from Stranger Things, Marvel, DC, Harry Potter, Doraemon, Shinchan, Beyblade, and Squid Game
- **AI-Powered Media Analysis**: Uses Google Gemini API to map songs and movies to personality traits
- **Advanced Matching Algorithm**: Combines quiz responses and media preferences using cosine similarity
- **Admin Dashboard**: View statistics, results, and manage the application
- **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## 🏗️ Architecture

### Backend (Flask + Python)
- **Framework**: Flask with CORS support
- **Database**: MongoDB Atlas with PyMongo
- **AI Integration**: Google Gemini API for media trait mapping
- **Authentication**: Token-based admin authentication
- **Caching**: MongoDB-based caching for Gemini responses

### Frontend (React + TypeScript)
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with custom components
- **Routing**: React Router for navigation
- **State Management**: Local state with localStorage persistence
- **Notifications**: React Hot Toast for user feedback

### Database Collections
- `questions`: Quiz questions with trait mappings
- `characters`: Character data with personality traits
- `media_traits`: AI-mapped media to trait vectors
- `results`: User quiz results and matches
- `amritanshu_feedback`: Feedback for AI clone training

## 🛠️ Setup Instructions

### Prerequisites
- Python 3.8+
- Node.js 16+
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key

### 1. Clone and Setup

```bash
git clone <repository-url>
cd whichcharacter
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\\Scripts\\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp ../env.example .env

# Edit .env with your configuration
```

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Copy environment file
cp ../env.example .env.local

# Edit .env.local with your configuration
```

### 4. Database Setup

```bash
# Seed the database with characters and questions
cd ../seed
python seed_mongo.py ../characters.json ../questions.json
```

### 5. Environment Configuration

Create `.env` in the backend directory:

```env
# MongoDB Configuration
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/whichcharacter

# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Application Configuration
ALPHA=0.8
ADMIN_TOKEN=your_secure_admin_token

# Frontend Configuration
VITE_API_URL=http://localhost:5000
```

### 6. Running the Application

#### Development Mode

```bash
# Terminal 1 - Backend
cd backend
python app.py

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

#### Production Mode

```bash
# Backend
cd backend
gunicorn -w 4 -b 0.0.0.0:5000 app:app

# Frontend
cd frontend
npm run build
# Serve the dist/ folder with your preferred web server
```

## 🚀 Deployment

### Backend Deployment (Heroku/Render/Cloud Run)

1. **Prepare for deployment**:
   ```bash
   cd backend
   pip freeze > requirements.txt
   ```

2. **Set environment variables** in your deployment platform:
   - `MONGODB_URI`
   - `GEMINI_API_KEY`
   - `ADMIN_TOKEN`
   - `ALPHA`

3. **Deploy**:
   - **Heroku**: Use the Heroku CLI or GitHub integration
   - **Render**: Connect your repository and set environment variables
   - **Google Cloud Run**: Use `gcloud run deploy`

### Frontend Deployment (Vercel/Netlify)

1. **Build the application**:
   ```bash
   cd frontend
   npm run build
   ```

2. **Set environment variables**:
   - `VITE_API_URL`: Your deployed backend URL

3. **Deploy**:
   - **Vercel**: Connect repository and deploy
   - **Netlify**: Drag and drop the `dist/` folder or connect repository

## 📊 API Endpoints

### Public Endpoints

- `GET /api/questions` - Get all quiz questions
- `GET /api/characters?universe=<u>&limit=<n>` - Get characters by universe
- `POST /api/score` - Submit quiz and get character matches
- `POST /api/feedback/amritanshu` - Submit feedback for AI clone training
- `POST /api/media/map` - Map media to traits (internal)

### Admin Endpoints (Require Authorization)

- `GET /admin/stats` - Get application statistics
- `GET /admin/results` - Get recent quiz results
- `GET /admin/feedback` - Get Amritanshu feedback
- `POST /admin/media-mapping` - Re-map media traits

## 🧪 Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/
```

### API Testing

Import the Postman collection from `postman/WhichCharacterAreYou.postman_collection.json` to test all API endpoints.

## 🔧 Configuration

### Matching Algorithm

The matching algorithm combines quiz responses and media preferences:

```python
final_vector = alpha * question_vector + (1 - alpha) * media_vector
```

- `alpha`: Weight for question vector (default: 0.8)
- `question_vector`: Built from user's quiz answers
- `media_vector`: Built from AI-mapped songs and movies

### Gemini API Integration

The application uses Google Gemini API to map media titles to personality traits. The prompt is designed to return structured JSON with confidence scores and trait vectors.

## 📁 Project Structure

```
whichcharacter/
├── backend/
│   ├── app.py                 # Flask application
│   ├── requirements.txt       # Python dependencies
│   └── tests/
│       └── test_matching.py   # Algorithm tests
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── services/         # API services
│   │   ├── types/            # TypeScript types
│   │   └── main.tsx          # App entry point
│   ├── package.json          # Node dependencies
│   └── vite.config.ts        # Vite configuration
├── seed/
│   └── seed_mongo.py         # Database seeding script
├── postman/
│   └── WhichCharacterAreYou.postman_collection.json
├── characters.json           # Character data
├── questions.json           # Quiz questions
├── env.example              # Environment template
└── README.md               # This file
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Check the API documentation in the Postman collection
- Review the test files for usage examples
- Open an issue in the repository

## 🔮 Future Enhancements

- [ ] User accounts and result history
- [ ] More universes and characters
- [ ] Advanced analytics and insights
- [ ] Social sharing features
- [ ] Mobile app development
- [ ] Multi-language support
