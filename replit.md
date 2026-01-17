# GARY: The Subject Decoder

## Overview

GARY is a mobile tutoring application that uses the Feynman Technique to explain complex subjects through simple analogies. The app features a fatherly, approachable AI tutor personality that breaks down concepts into digestible explanations, always ending with a signature "Dad's Summary" containing exactly 3 bullet points.

The application is built as an Expo React Native app with a Node.js/Express backend, designed to run on iOS, Android, and web platforms. It uses Google's Gemini AI for generating educational responses.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with a tab-based structure
  - Two main tabs: Chat (home) and History
  - Native stack navigators within each tab
  - Topic Detail screen accessible from History
- **State Management**: TanStack React Query for server state
- **Local Storage**: AsyncStorage for conversation persistence on device
- **Styling**: Dark theme by default with golden accent colors (#FFD700)
- **Key UI Components**:
  - ChatBubble with special "Dad's Summary" parsing
  - Custom themed components (ThemedText, ThemedView, Button, Card)
  - Keyboard-aware input handling with react-native-keyboard-controller

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **API Structure**: RESTful endpoints under `/api/` prefix
- **AI Integration**: Google Gemini via Replit AI Integrations
  - Custom system prompt defining GARY's personality and response format
  - Chat endpoint at `/api/chat` for conversation handling
- **CORS**: Dynamic origin handling for Replit domains and localhost development

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` and `shared/models/chat.ts`
- **Tables**:
  - `users`: Basic user authentication (id, username, password)
  - `conversations`: Chat session metadata (id, title, createdAt)
  - `messages`: Individual messages (id, conversationId, role, content, createdAt)
- **Client-side**: AsyncStorage for current conversation and daily question limits
  - `gary_conversations`: All saved conversations
  - `gary_current_conversation`: ID of active conversation
  - `gary_daily_questions`: Daily question count with date (resets at midnight)

### Daily Question Limit
- Users can ask GARY a maximum of 10 questions per day
- Counter displayed in the header showing remaining questions
- When limit is reached, GARY responds: "Kid, no more questions until tomorrow!"
- Counter resets automatically at midnight (based on device date)

### Path Aliases
- `@/` maps to `./client/`
- `@shared/` maps to `./shared/`

### Build & Development
- **Development**: Separate processes for Expo (`expo:dev`) and server (`server:dev`)
- **Production**: Static web build with esbuild for server bundling
- **Database Migrations**: Drizzle Kit with `db:push` command

## External Dependencies

### AI Services
- **Google Gemini** via Replit AI Integrations
  - Environment variables: `AI_INTEGRATIONS_GEMINI_API_KEY`, `AI_INTEGRATIONS_GEMINI_BASE_URL`
  - Models used: `gemini-2.5-flash` for chat responses
  - Additional capability: Image generation with `gemini-2.5-flash-image`

### Database
- **PostgreSQL**: Connection via `DATABASE_URL` environment variable
- **ORM**: Drizzle ORM with drizzle-zod for schema validation

### Key NPM Packages
- `expo` ecosystem for cross-platform mobile development
- `@react-navigation/*` for navigation
- `@tanstack/react-query` for data fetching
- `react-native-reanimated` for animations
- `react-native-keyboard-controller` for keyboard handling
- `express` for HTTP server
- `drizzle-orm` and `pg` for database operations