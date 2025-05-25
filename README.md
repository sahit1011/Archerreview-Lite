# ArcherReview Dynamic AI NCLEX Calendar

A prototype for an AI-powered adaptive study calendar for NCLEX preparation.

## Features

- Dynamic, AI-powered study plan that adapts to student performance
- Modern, bold, futuristic UI with drag-and-drop functionality
- Optional diagnostic assessment for personalized learning
- Interactive calendar with flexible scheduling
- AI tutor for contextual help and remediation
- Comprehensive progress tracking and analytics
- Predictive readiness scoring

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, TailwindCSS
- **UI Components**: Framer Motion (animations), react-beautiful-dnd (drag-and-drop)
- **Calendar**: FullCalendar
- **Charts**: Chart.js, react-chartjs-2
- **Date Handling**: date-fns

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/dynamic-calendar.git
   cd dynamic-calendar
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Run the development server
   ```bash
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000) with your browser

## Project Structure

- `/src/app` - Next.js app directory with pages and layouts
- `/src/components` - Reusable UI components
- `/src/features` - Feature-specific components and logic
- `/src/hooks` - Custom React hooks
- `/src/lib` - Library code and API functions
- `/src/types` - TypeScript type definitions
- `/src/utils` - Utility functions

## Development Guidelines

- Use TypeScript for type safety
- Follow the component structure and naming conventions
- Use TailwindCSS for styling
- Create reusable components in the `/src/components` directory
- Implement feature-specific components in the `/src/features` directory
- Use custom hooks for shared logic
- Document complex AI algorithms and decision-making processes
