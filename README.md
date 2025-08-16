# Elevate Core API - Blueprint-Centric Learning System

## 🎯 Overview

The Elevate Core API is a modern, blueprint-centric learning management system that replaces legacy folder-based approaches with a sophisticated, section-based learning architecture. The system is designed to provide personalized, adaptive learning experiences through mastery-based progression and intelligent content organization.

## 🏗️ Architecture

### Core System Components

#### **Blueprint-Centric Learning Model**
- **LearningBlueprint**: Central learning structure containing sections and criteria
- **BlueprintSection**: Hierarchical learning sections with depth and difficulty levels
- **MasteryCriterion**: Specific learning objectives with mastery thresholds
- **KnowledgePrimitive**: Atomic knowledge units that can be combined
- **QuestionInstance**: Individual questions linked to mastery criteria

#### **Mastery System**
- **Enhanced Spaced Repetition**: Advanced SR algorithm for optimal review scheduling
- **Mastery Tracking**: Comprehensive progress monitoring and analytics
- **UUES Progression**: Understand → Use → Explore → Synthesize learning stages
- **Adaptive Difficulty**: Dynamic difficulty adjustment based on performance

#### **AI Integration**
- **AI Blueprint Generation**: Automated learning path creation
- **Content Recommendations**: Intelligent content suggestions
- **Mind Mapping**: Visual knowledge representation
- **Vector Indexing**: Semantic search and content discovery

## 📁 Project Structure

```
src/
├── services/
│   ├── mastery/           # Mastery system services
│   ├── ai/                # AI and ML services
│   ├── user/              # User management services
│   ├── legacy/            # Legacy compatibility services
│   ├── core/              # Core system services
│   └── blueprint-centric/ # Blueprint system services
├── controllers/
│   ├── mastery/           # Mastery system controllers
│   ├── ai/                # AI service controllers
│   ├── user/              # User management controllers
│   ├── legacy/            # Legacy compatibility controllers
│   ├── core/              # Core system controllers
│   └── blueprint-centric/ # Blueprint system controllers
├── routes/
│   ├── mastery/           # Mastery system routes
│   ├── ai/                # AI service routes
│   ├── user/              # User management routes
│   ├── legacy/            # Legacy compatibility routes
│   ├── core/              # Core system routes
│   └── blueprint-centric/ # Blueprint system routes
└── db/
    └── prisma/
        └── schema.prisma  # Database schema
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 13+
- Prisma CLI

### Installation
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your database credentials

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://user:password@localhost:5432/elevate_core"
JWT_SECRET="your-jwt-secret"
AI_API_KEY="your-ai-service-key"
```

## 🔧 Development

### Key Services

#### **Enhanced Spaced Repetition Service**
```typescript
import { EnhancedSpacedRepetitionService } from './services/mastery/enhancedSpacedRepetition.service';

const srService = new EnhancedSpacedRepetitionService();
const dueCriteria = await srService.getDueCriteria(userId);
```

#### **Enhanced Today's Tasks Service**
```typescript
import { EnhancedTodaysTasksService } from './services/mastery/enhancedTodaysTasks.service';

const tasksService = new EnhancedTodaysTasksService();
const todaysTasks = await tasksService.generateTodaysTasksForUser(userId);
```

#### **Blueprint Section Service**
```typescript
import { BlueprintSectionService } from './services/blueprint-centric/blueprintSection.service';

const sectionService = new BlueprintSectionService();
const sections = await sectionService.getSectionsByBlueprint(blueprintId);
```

### Database Schema

The system uses a modern Prisma schema with the following key models:

- **User**: User accounts and preferences
- **LearningBlueprint**: Main learning structures
- **BlueprintSection**: Hierarchical learning sections
- **MasteryCriterion**: Learning objectives
- **QuestionInstance**: Individual questions
- **KnowledgePrimitive**: Atomic knowledge units
- **UserCriterionMastery**: User progress tracking

## 🧪 Testing

```bash
# Run all tests
npm test

# Run specific test suites
npm run test:mastery
npm run test:ai
npm run test:integration

# Run tests with coverage
npm run test:coverage
```

## 📊 API Endpoints

### Mastery System
- `POST /api/mastery-criterion` - Create mastery criterion
- `GET /api/mastery-criterion/:id` - Get criterion details
- `POST /api/mastery-criterion/:id/review` - Submit review

### Today's Tasks
- `GET /api/enhanced-todays-tasks` - Get today's tasks
- `GET /api/enhanced-todays-tasks/capacity-analysis` - Analyze user capacity
- `POST /api/enhanced-todays-tasks/prioritize` - Reprioritize tasks

### Blueprint Management
- `POST /api/blueprint-section` - Create section
- `GET /api/blueprint-section/:id` - Get section details
- `PUT /api/blueprint-section/:id` - Update section

## 🔄 Migration from Legacy System

The system includes compatibility layers for migrating from the old folder-based system:

- **Legacy Compatibility Service**: Handles old data formats
- **Recursive Folder Service**: Processes legacy folder structures
- **Migration Scripts**: Automated data migration tools

## 🚧 Development Status

### ✅ Completed
- Blueprint-centric architecture implementation
- Enhanced spaced repetition system
- Mastery tracking and progression
- AI integration services
- Domain-based code organization

### 🔄 In Progress
- Import path cleanup and consolidation
- Legacy code removal
- Test suite updates

### 📋 Planned
- Performance optimization
- Advanced analytics dashboard
- Mobile API endpoints
- Real-time collaboration features

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the [API Documentation](docs/API.md)
- Review the [Architecture Guide](docs/ARCHITECTURE.md)

---

**Built with ❤️ by the Elevate Team**
