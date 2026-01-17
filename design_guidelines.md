# GARY: The Subject Decoder - Design Guidelines

## Brand Identity

**Purpose**: GARY is a fatherly tutor app that breaks down complex subjects using the Feynman Technique with simple analogies. It's educational, approachable, and designed for students sharing knowledge.

**Aesthetic Direction**: **Refined Academic** - Think late-night study session meets wise mentor. Dark, focused interface with warm golden accents that feel scholarly yet approachable. Clean, readable, with enough personality to feel human, not robotic.

**Memorable Element**: The signature "Dad's Summary" box - a visually distinct container with warm yellow border that appears at the end of every GARY response, containing exactly 3 bullet points. This becomes GARY's trademark.

---

## Navigation Architecture

**Root Navigation**: Tab Bar (2 tabs)
- **Chat** (Home) - Main conversation interface
- **History** - List of past topics

**Navigation Stack**:
- Chat Screen (Tab 1)
- History Screen (Tab 2)
- Topic Detail Screen (navigates from History, shows past conversation)

---

## Screen-by-Screen Specifications

### 1. Chat Screen (Home Tab)
**Purpose**: Primary interface for asking GARY questions and receiving tutoring.

**Layout**:
- Header: Default navigation header, transparent background
  - Title: "GARY"
  - Right button: "Clear Chat" (yellow text)
- Main content: Auto-scrolling chat messages
  - Root view: Non-scrollable (messages handle their own scroll)
  - Safe area insets: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl + keyboard height
- Floating elements:
  - "Share App" button (top-right, subtle yellow outline)
  - Message input bar (bottom, above tab bar, includes KeyboardAvoidingView)

**Components**:
- Chat message bubbles (user messages: right-aligned, dark gray; GARY messages: left-aligned, slightly lighter gray)
- "Dad's Summary" box (yellow border, 3 bullets, appears at end of GARY responses)
- Text input with send button (yellow accent)
- Typing indicator when GARY is responding

**Empty State**: Center-aligned illustration showing friendly professor figure with text "Ask GARY about any subject"

---

### 2. History Screen
**Purpose**: Browse all past topics/conversations.

**Layout**:
- Header: Default navigation header, transparent background
  - Title: "History"
- Main content: Scrollable list
  - Root view: FlatList of history items
  - Safe area insets: top = headerHeight + Spacing.xl, bottom = tabBarHeight + Spacing.xl

**Components**:
- History list items (topic title, preview of first question, timestamp)
- Each item is touchable, navigates to Topic Detail Screen

**Empty State**: Illustration showing closed book with text "No topics yet. Start a conversation with GARY!"

---

### 3. Topic Detail Screen
**Purpose**: View a complete past conversation.

**Layout**:
- Header: Default navigation header (non-transparent, dark background)
  - Left button: Back arrow
  - Title: Topic name (truncated)
- Main content: Scrollable chat messages (read-only)
  - Root view: ScrollView
  - Safe area insets: top = Spacing.xl, bottom = insets.bottom + Spacing.xl

**Components**:
- Same chat bubble design as Chat Screen
- Same "Dad's Summary" boxes
- No input field (read-only)

---

## Color Palette

**Primary**: #FFD700 (Gold) - Used for accents, CTAs, highlights  
**Background**: #121212 (Near Black)  
**Surface**: #1E1E1E (Dark Gray) - Cards, message bubbles  
**Surface Variant**: #2A2A2A (Lighter Gray) - GARY's message bubbles  
**Text Primary**: #FFFFFF (White)  
**Text Secondary**: #B0B0B0 (Light Gray)  
**Border**: #3A3A3A (Subtle Gray)  
**Dad's Summary Border**: #FFD700 (Gold)  
**Error**: #FF6B6B (Soft Red)

---

## Typography

**Font**: System default (SF Pro on iOS, Roboto on Android)

**Type Scale**:
- App Title (Header): Bold, 20px
- Screen Title: Bold, 18px
- Message Text: Regular, 16px
- Dad's Summary Title: Bold, 16px, #FFD700
- Dad's Summary Bullets: Regular, 15px
- Timestamp/Secondary: Regular, 14px, #B0B0B0
- Button Text: Semibold, 16px

---

## Visual Design

- All touchable elements: Subtle opacity change (0.7) on press
- Dad's Summary box: 2px solid #FFD700 border, 12px border radius, 16px padding
- Message bubbles: 16px border radius, 12px padding
- Share App button: Outlined style (1px #FFD700 border), 8px border radius
- Clear Chat button: Text-only, no background
- Tab bar icons: Use Feather icons (@expo/vector-icons)
- Chat: "message-square"
- History: "clock"

**Floating Button Shadow** (Share App button):
- shadowOffset: {width: 0, height: 2}
- shadowOpacity: 0.10
- shadowRadius: 2

---

## Assets to Generate

1. **icon.png** - App icon showing wise professor owl with gold glasses (represents GARY's fatherly wisdom)  
   **WHERE USED**: Device home screen

2. **splash-icon.png** - Same owl icon, simplified for splash screen  
   **WHERE USED**: App launch screen

3. **empty-chat.png** - Friendly professor figure (human silhouette) with open book and lightbulb  
   **WHERE USED**: Chat screen empty state

4. **empty-history.png** - Closed vintage book with bookmark  
   **WHERE USED**: History screen empty state

5. **gary-avatar.png** - Small circular avatar of wise professor (used next to GARY's messages)  
   **WHERE USED**: Left side of GARY's chat bubbles

**Asset Style**: Minimalist line art with yellow (#FFD700) accents on dark background, simple and scholarly, NOT cartoonish.