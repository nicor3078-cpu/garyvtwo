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
- **Typography**: Space Mono monospaced font throughout (SpaceMono_400Regular, SpaceMono_700Bold)
- **Styling**: Pure black (#000000) background with neon blue accent (#00AAFF), off-white text (#E2E8F8)
- **Key UI Components**:
  - ChatBubble: AI messages are borderless with a 2px neon blue left border accent; user messages have a subtle blue-tinted bubble
  - MarkdownText - custom markdown renderer with Space Mono font (bold, italic, code, headers, lists)
  - DadsSummary - borderless left-border sections: blue for Summary, green for Reflexion, amber for Book
  - EmptyState - minimal, shows icon + terminal-style text
  - HeaderTitle - shows app icon + "GARY" in neon blue Space Mono
  - Copy buttons on every message
  - Image picker for photo analysis
  - Glassmorphism input bar (BlurView on iOS, dark translucent on Android/web)

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

### V2 Features — Sovereign Gary
1. **Pure black terminal aesthetic**: #000000 bg, #00AAFF neon blue, Space Mono font throughout
2. **Sovereign Key**: User's own Gemini API key (required — no built-in pool). Stored in AsyncStorage. If missing, Gary shows guidance to get a key from aistudio.google.com.
3. **Remote config (Gist Brain)**: `fetchConfig()` fetches `current_model` from a GitHub Gist URL before every request (5-min cache). Defaults to `gemini-1.5-flash` on failure.
4. **Full vision/multimodal**: Image analysis supported. System prompt explicitly enables vision. Base64 validation + fallback to text-only on 400 errors.
5. **Exponential backoff**: 429 errors retry at 2s, 4s, 8s intervals. Animated `:>` pulse + "Recalibrating sensors..." shown during retries.
6. **Ministry Metrics (Supabase)**: After every successful response, client calls `POST /api/log-metrics` with logic_score (IQ heuristic), topic, and student_name. Backend uses `SUPABASE_URL`+`SUPABASE_KEY` env vars to log to `student_metrics` table.
7. **Memory Vault**: Save name, grade, birthday, interests for personalized responses
8. **Structured responses**: Dad's Summary + Reflexion Questions + Book Recommendation every time
9. **Markdown rendering**: Custom renderer with Space Mono, bullet/numbered lists, code blocks, headers
10. **Copy buttons**: On every message and on the Dad's Summary
11. **Image analysis**: Pick a photo from gallery for GARY to analyze (vision model)
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
