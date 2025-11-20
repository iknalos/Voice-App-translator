# Voice Translator App - Design System

## Design Philosophy

### Color Palette
- **Primary**: Deep Ocean Blue (#1e3a8a) - Trust, reliability, communication
- **Secondary**: Soft Teal (#14b8a6) - Technology, innovation, clarity
- **Accent**: Warm Coral (#f97316) - Energy, interaction, warmth
- **Neutral**: Charcoal Gray (#374151) - Professional, readable, sophisticated
- **Background**: Off-White (#fafafa) - Clean, spacious, modern

### Typography
- **Display Font**: "Inter" - Modern, clean sans-serif for headings
- **Body Font**: "Inter" - Consistent typography system
- **Monospace**: "JetBrains Mono" - For technical elements and code
- **Font Weights**: 300 (Light), 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold)

### Visual Language
- **Minimalist Approach**: Clean, uncluttered interface focusing on functionality
- **Subtle Depth**: Soft shadows and gentle gradients for visual hierarchy
- **Smooth Animations**: Fluid transitions that enhance user experience
- **Geometric Shapes**: Circular elements for recording, rectangular for content areas
- **Consistent Spacing**: 8px grid system for perfect alignment

## Visual Effects & Styling

### Used Libraries
- **Anime.js**: Smooth micro-interactions and button animations
- **ECharts.js**: Audio waveform visualization and language statistics
- **p5.js**: Dynamic background particle system representing sound waves
- **Pixi.js**: Advanced visual effects for recording state indicators
- **Splide.js**: Smooth carousel for language selection

### Animation Effects
- **Microphone Pulse**: Gentle breathing animation during recording
- **Text Reveal**: Staggered character animation for translated text
- **Waveform Visualization**: Real-time audio wave representation
- **Particle System**: Floating dots that respond to audio input
- **Button Hover**: Subtle lift and glow effects

### Header Effect
- **Dynamic Background**: Subtle animated gradient that shifts based on app state
- **Floating Elements**: Gentle geometric shapes representing sound waves
- **Color Transitions**: Smooth color changes during different app states

### Interactive Elements
- **Recording Button**: Large circular button with pulsing animation
- **Language Cards**: Hover effects with 3D tilt and shadow expansion
- **Translation Text**: Smooth fade-in with character-by-character reveal
- **Navigation Tabs**: Sliding indicator with smooth transitions

## Layout & Structure

### Grid System
- **Mobile-First**: Responsive design starting from 320px width
- **Breakpoints**: 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- **Container**: Max-width 1200px with centered alignment
- **Padding**: Consistent 24px horizontal padding on mobile, 48px on desktop

### Component Hierarchy
- **Hero Section**: Minimal height (20% of viewport) with app branding
- **Main Interface**: Central focus area (60% of viewport)
- **Secondary Features**: Collapsible panels and side elements
- **Navigation**: Bottom-fixed tab bar for mobile, top navigation for desktop

### Visual Hierarchy
- **Primary Actions**: Large, prominent buttons with strong contrast
- **Secondary Actions**: Smaller buttons with subtle styling
- **Information Display**: Clear typography hierarchy with proper spacing
- **Status Indicators**: Color-coded system for different app states

## Accessibility & Usability
- **High Contrast**: All text meets WCAG 4.5:1 contrast ratio
- **Touch Targets**: Minimum 44px touch targets for mobile
- **Voice Feedback**: Audio cues for all major interactions
- **Visual Feedback**: Clear state changes for all interactive elements
- **Error States**: Gentle, helpful error messaging with clear recovery paths