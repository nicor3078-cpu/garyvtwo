# GARY: The Subject Decoder (V2)

## Overview

GARY is a mobile tutoring application that uses the Feynman Technique to explain complex subjects through simple analogies. The app features a wise, fatherly AI tutor personality that breaks down concepts into digestible explanations, always ending with a structured "Dad's Summary" (3 bullets), "Reflexion Questions" (3 numbered questions), and a "Book Recommendation".

Built as a **standalone Expo React Native app** (no backend dependency for AI). All AI calls are made directly from the client using the Gemini API.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: Expo SDK 54 with React Native 0.81
- **Navigation**: React Navigation v7 with tab-based structure
  - Three main tabs: Chat, History, Settings
  - Native stack navigators within each tab
  - Topic Detail screen accessible from History
- **State Management**: React local state + AsyncStorage
- **Local Storage**: AsyncStorage for conversation persistence, API key, memory vault
- **Styling**: Dark navy/black theme (#0A0E18) with neon blue accent (#00AAFF)
- **Key UI Components**:
  - ChatBubble with Dad's Summary, Reflexion Questions, Book Recommendation parsing
  - MarkdownText - custom markdown renderer (bold, italic, code, headers, lists)
  - DadsSummary - renders all three structured response sections
  - Copy buttons on every message
  - Image picker for photo analysis

### Backend Architecture
- **Runtime**: Node.js with Express 5
- **Role**: Minimal - serves static Expo files and landing page only
- **AI calls go directly from client** to Gemini API

### Data Storage (All Client-Side)
- `gary_conversations` - All saved conversations
- `gary_current_conversation` - ID of active conversation
- `gary_user_api_key` - User's own Gemini API key (BYOAK)
- `gary_memory_vault` - User profile (name, grade, birthday, interests)

### Storage Module (`client/lib/storage.ts`)
Centralized storage utilities for API key and memory vault CRUD.

### Gemini Integration (`client/lib/gemini.ts`)
- **BYOAK**: User's custom API key takes priority, falls back to built-in key pool
- **Auto-retry**: Up to 3 retries with exponential backoff for 429/503/502 errors
- **Temporal awareness**: Current date/time injected into every system prompt
- **Memory personalization**: Student profile from memory vault included in system prompt
- **Cancellation**: AbortController support for cancelling in-flight requests
- **Image analysis**: Supports base64 image attachments (Gemini Vision)

### V2 Features
1. **Neon Blue Theme**: Dark (#0A0E18) background with #00AAFF accent
2. **BYOAK Settings**: Users paste their own Gemini API key with validation
3. **Memory Vault**: Save name, grade, birthday, interests for personalized responses
4. **No question limit**: Unlimited questions (removed 10/day cap)
5. **Markdown rendering**: Custom renderer for bold, italic, code blocks, headers, lists
6. **Copy buttons**: On every message and on the Dad's Summary
7. **Auto-retry**: 3 retries with backoff on API errors
8. **Reflexion Questions**: 3 numbered follow-up questions after each explanation
9. **Book Recommendations**: One book suggestion after each explanation
10. **Temporal awareness**: GARY knows today's date and time
11. **Image analysis**: Pick a photo from gallery for GARY to analyze
12. **New conversation button**: Top-right "New" button to clear chat

### Path Aliases
- `@/` maps to `./client/`

### Build & Development
- **Development**: Separate processes for Expo (`expo:dev`) and server (`server:dev`)
- **Frontend**: Port 8081 (Expo Metro)
- **Backend**: Port 5000 (Express, serves static files + landing page)

## External Dependencies

### AI Services
- **Google Gemini 2.5 Flash** - direct from client
  - Built-in pool of API keys as fallback
  - Users can supply their own key via Settings (BYOAK)
  - Image analysis via Gemini Vision (base64 inline data)

### Key NPM Packages
- `expo` ecosystem for cross-platform mobile development
- `@react-navigation/*` for navigation
- `expo-clipboard` for copy-to-clipboard
- `expo-image-picker` for photo selection
- `react-native-keyboard-controller` for keyboard handling
- `express` for HTTP server
