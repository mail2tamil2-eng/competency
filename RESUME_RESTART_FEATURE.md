# Resume/Restart Feature - How It Works

## User Flow

### First Time Preview
1. User clicks **"Preview Course"** button
2. Opens preview modal directly (no resume screen)
3. User can navigate through slides, use CC, Transcript, Menu, Help features
4. User clicks **Exit** button (LogOut icon in top-right)
5. Returns to Step 3 page

### Second Time Preview (After Exit)
1. User clicks **"Preview Course"** button again
2. **Resume/Restart Screen** appears instead of preview
3. Shows:
   - Course title at top: "Emotional Intelligence" (or current course name)
   - **Resume** button in center (white rounded pill with Play icon)
   - **Restart** button at bottom (gray text with RotateCcw icon)
   - Close button (X) in top-right corner

### Resume Option
- Clicking **Resume** button:
  - Returns user to the exact slide they were on when they exited
  - Preserves their progress
  - Opens the preview modal at that slide position

### Restart Option
- Clicking **Restart** button:
  - Resets course to slide 1
  - Resets progress tracking
  - Opens the preview modal from the beginning

### Close Option
- Clicking **X** (close button):
  - Closes the resume/restart screen
  - Returns to Step 3 page without entering preview

## Technical Implementation

### State Variables
- `hasExitedCourse` - Tracks if user has exited the preview before
- `lastSlidePosition` - Stores the slide number user was on when they exited
- `showResumeScreen` - Controls visibility of resume/restart modal

### Preview Button Logic
```typescript
onClick={() => {
  if (hasExitedCourse) {
    // Show resume/restart screen if user has exited before
    setShowResumeScreen(true);
  } else {
    // First time preview - go directly to course
    setShowPreview(true);
  }
}}
```

### Exit Button Logic
```typescript
onClick={() => {
  // Save current position and mark as exited
  setLastSlidePosition(currentSlide);
  setHasExitedCourse(true);
  setShowPreview(false);
  // Close all modals
  setShowMenuModal(false);
  setShowHelpModal(false);
  setShowTranscriptModal(false);
  setShowCCOverlay(false);
}}
```

### Resume Button Logic
```typescript
onClick={() => {
  // Resume from last position
  setCurrentSlide(lastSlidePosition);
  setShowResumeScreen(false);
  setShowPreview(true);
}}
```

### Restart Button Logic
```typescript
onClick={() => {
  // Restart from beginning
  setCurrentSlide(1);
  setLastSlidePosition(1);
  setShowResumeScreen(false);
  setShowPreview(true);
}}
```

## UI Design

### Resume/Restart Screen
- **Background**: Black with 95% opacity and backdrop blur
- **Course Title**: White text, 2xl size, positioned at top (24rem from top)
- **Resume Button**: 
  - White background with rounded-full shape
  - Play icon + "Resume" text
  - Hover effects: lightens to gray-100, shadow increases
  - Centered on screen
- **Restart Button**:
  - Gray-400 text that lightens to white on hover
  - RotateCcw icon + "Restart" text
  - Positioned at bottom (24rem from bottom)
- **Close Button**:
  - White X icon in top-right corner
  - Hover effect: white/10 background
  - 6x6 size

### Animations
- Course title: Fades in and slides down from top
- Resume button: Fades in and scales up (0.1s delay)
- Restart button: Fades in and slides up from bottom (0.2s delay)

## SCORM Compliance
This feature aligns with SCORM resume functionality where:
- User progress is tracked
- Course can be resumed from last position
- User can choose to restart if desired
- Typical pattern used in LMS platforms
