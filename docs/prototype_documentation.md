# ArcherReview Dynamic AI NCLEX Calendar - Prototype Documentation

## 1. Vision & Goal

To create a truly adaptive, AI-powered NCLEX study calendar that personalizes the learning journey for each student, optimizes study efficiency using learning science, provides proactive support, and significantly increases NCLEX pass rates, surpassing competitor offerings.

**Goal:** Develop a prototype demonstrating the core adaptive features, user experience, and key differentiators of the proposed system.

## 2. Key Differentiators & Competitive Edge

Our dynamic calendar will outperform competitors by focusing on:

*   **True, Continuous Adaptivity:** Unlike UWorld (time-based) or SimpleNursing (one-time personalization), our plan adapts *content, sequence, and schedule* continuously based on real-time performance, confidence, and even predicted needs.
*   **Deep Learning Science Integration:** Beyond basic spaced repetition, we'll use dynamic intervals adjusted by performance/confidence and incorporate interleaving for deeper understanding.
*   **Integrated AI Support:** Unlike Bootcamp or GoodNurse where the AI tutor is separate, our AI is woven into the workflow, offering *proactive, contextual help* when the student struggles.
*   **Proactive & Predictive Insights:** Moving beyond basic pass prediction (Bootcamp), we offer granular readiness scores, identify specific high-impact weaknesses, and forecast potential future struggles.
*   **Holistic User Experience:** Combining a flexible, user-friendly calendar with motivational elements and clear progress visualization.

## 3. Core AI-Powered Features (Prototype Scope)

These features represent the core intelligence of the prototype:

1.  **Hyper-Personalized Adaptive Scheduling:**
    *   **Functionality:** Generates an initial plan based on diagnostic results, exam date, and user-defined availability. Continuously adjusts the *daily tasks, topic sequence, and overall schedule* based on:
        *   Quiz/practice question performance (accuracy, time taken).
        *   Student's self-reported confidence levels post-task.
        *   Task completion status (detects missed/incomplete tasks).
        *   *Advanced:* Proactively balances daily workload based on predicted task difficulty and student's recent performance trends. If a student skips a day, it intelligently redistributes tasks, prioritizing high-yield/weak areas, rather than just tacking them onto the next day.
    *   **AI Element:** Constraint-based optimization, predictive modeling (difficulty/time estimation), rule-based rescheduling logic.
    *   **Edge over Competitors:** More granular and proactive than UWorld's time-slotting or SimpleNursing's static post-diagnostic plan.

2.  **Integrated AI Tutor & Proactive Remediation:**
    *   **Functionality:** An AI chatbot available throughout the platform. Crucially, the system *monitors performance* during quizzes/tasks. If a student consistently misses questions on a specific concept (e.g., electrolyte imbalances):
        *   The AI Tutor can be invoked manually by the student.
        *   *Proactive:* The system can automatically trigger a prompt: "It looks like you're finding questions about Potassium challenging. Would you like a quick explanation or a short video refresher?" This happens *in context*, immediately after the struggle is detected.
    *   **AI Element:** LLM for natural language understanding and explanation generation, integrated with performance monitoring triggers. Context-passing to the LLM.
    *   **Edge over Competitors:** Seamless integration and proactive triggering, unlike Bootcamp's separate tutor or GoodNurse's non-integrated chat planner.

3.  **Dynamic Spaced Repetition & Interleaving (SRI):**
    *   **Functionality:** Schedules review sessions for previously learned material based on spaced repetition principles.
        *   Intervals are dynamically adjusted based on recall accuracy, speed, and confidence during review quizzes. Struggling resets or shortens intervals.
        *   *Advanced:* Incorporates interleaving – review quizzes mix questions from related topics (e.g., different cardiac drugs) rather than just one topic at a time, promoting deeper understanding and discrimination.
    *   **AI Element:** Modified spaced repetition algorithms (e.g., FSRS or similar, adapted) incorporating multiple performance factors. Logic for selecting interleaved content.
    *   **Edge over Competitors:** More sophisticated than simple fixed-interval repetition; interleaving is often missing in basic implementations.

4.  **Predictive Readiness Score & Weakness Forecaster:**
    *   **Functionality:** Provides an estimated NCLEX readiness score based on performance across all topics, weighted by NCLEX category importance.
        *   Shows trends over time.
        *   *Advanced:* Highlights the top 3-5 specific sub-topics currently having the *biggest negative impact* on the score. Forecasts potential future weak areas based on current trends (e.g., "You're doing well in Fundamentals now, but your pace suggests you might struggle with the upcoming Advanced Med-Surg content unless you reinforce basics").
    *   **AI Element:** Machine learning model (e.g., logistic regression, gradient boosting) trained on performance data, feature importance analysis, time-series forecasting.
    *   **Edge over Competitors:** More actionable and predictive than Bootcamp's single pass/fail prediction.

5.  **Interactive Calendar & Progress Visualization:**
    *   **Functionality:** User-friendly calendar interface (day/week/month) displaying scheduled tasks with clear color-coding and estimated times. Allows drag-and-drop rescheduling by the user (AI validates and rebalances the *rest* of the plan). Comprehensive dashboard showing progress, readiness score, upcoming tasks, and motivational elements.
    *   **AI Element:** While primarily UI, the AI backend constantly updates the data displayed and handles the re-planning logic triggered by user interactions.
    *   **Edge over Competitors:** Combines Bootcamp's user-friendly calendar with deeper AI integration for automatic rebalancing.

### Underlying Agentic AI Architecture

To implement these features efficiently, the system can be designed using an Agentic AI Workflow model, where specialized agents collaborate:

1.  **Scheduler Agent:**
    *   **Responsibility:** Handles the initial creation of the personalized study plan and major structural reorganizations if needed (e.g., significant changes in user availability or exam date).
    *   **Inputs:** Diagnostic results, user preferences (availability, days off), exam date, ArcherReview content metadata (topics, prerequisites, difficulty).
    *   **Outputs:** Initial structured study plan distributed across the calendar.
    *   **Interaction:** Primarily active during onboarding and for significant user-initiated changes. Provides the foundational plan for other agents to work with. Corresponds heavily with the *Personalized Plan Generation* aspect of Feature 1.

2.  **Monitor Agent:**
    *   **Responsibility:** Continuously tracks student progress, task completion, performance metrics (quiz scores, time taken, confidence ratings), and detects deviations from the plan (e.g., missed sessions, consistently slow pace).
    *   **Inputs:** Real-time user activity data (logins, task completions, quiz results, confidence ratings), current schedule.
    *   **Outputs:** Performance summaries, progress updates, alerts/flags for the Adaptation Agent when intervention is needed (e.g., "User missed 2 sessions," "Performance dropped in Pharmacology").
    *   **Interaction:** Runs constantly in the background, feeding data to the dashboard and triggering other agents. Essential for *Progress Tracking* and providing input for *Adaptive Rescheduling* and *Proactive Remediation*.

3.  **Adaptation Agent:**
    *   **Responsibility:** Makes dynamic, fine-grained adjustments to the study plan based on input from the Monitor Agent. Handles rescheduling of missed tasks, injects remedial content, adjusts task difficulty/sequence based on performance, and manages the spaced repetition intervals.
    *   **Inputs:** Alerts from Monitor Agent (missed tasks, performance dips/spikes), user's current schedule, remaining time, content metadata.
    *   **Outputs:** Updated daily/weekly tasks, modified review schedules, potentially adjusted overall plan pacing.
    *   **Interaction:** Reacts to triggers from the Monitor Agent. This is the core engine behind *Hyper-Personalized Adaptive Scheduling*, *Dynamic Spaced Repetition & Interleaving*, and parts of the *Integrated AI Tutor* (triggering remediation).

4.  **Feedback Agent:**
    *   **Responsibility:** Processes explicit user feedback (e.g., confidence ratings, comments on tasks) and implicit feedback (e.g., consistently skipping certain types of content). It can also analyze performance patterns to suggest broader improvements or identify areas where the AI's adaptations might need tuning.
    *   **Inputs:** User-submitted ratings/comments, performance trends from Monitor Agent, interaction logs.
    *   **Outputs:** Recommendations for the Adaptation Agent (e.g., "User consistently rates video tasks low confidence, consider adding more quizzes"), insights for the development team, potentially personalized motivational messages.
    *   **Interaction:** Analyzes qualitative and quantitative feedback to refine the adaptation process and potentially personalize the experience further (e.g., adjusting content mix based on preference patterns). Supports the *Predictive Readiness Score* by identifying nuanced patterns.

This multi-agent system allows for modularity and specialization, enabling the complex adaptive behaviors required for a truly dynamic study calendar.

## 4. User Experience (UX) Workflow

1.  **Onboarding:**
    *   User signs up/logs in.
    *   **Screen 1: Welcome & Goal:** Sets NCLEX exam date.
    *   **Screen 2: Diagnostic:** Takes a short, adaptive assessment to gauge baseline knowledge across key NCLEX categories.
    *   **Screen 3: Schedule Setup:** Defines available study days/hours, preferred times (optional), and any fixed days off.
    *   **Screen 4: Plan Preview:** AI generates the initial personalized plan. User sees a high-level overview (e.g., weekly topic focus, estimated daily load) and confirms. Explanation of how the plan will adapt.

2.  **Daily Use:**
    *   **Screen 5: Dashboard:** User logs in and sees the dashboard: Today's tasks, readiness score snapshot, upcoming items, quick access buttons.
    *   User selects a task (e.g., "Watch Cardiac Basics Video" or "Take Pharmacology Quiz").
    *   **Screen 6: Task View:** Views content (video, reading) or starts quiz.
    *   **Screen 7: Quiz Interface:** Answers questions, submits. Gets immediate feedback and rationales.
        *   *AI Intervention:* If poor performance detected on a concept, a prompt appears offering AI Tutor help or a resource link.
    *   User marks task complete, optionally rates confidence.
    *   The dashboard and calendar update automatically. The AI backend logs performance and may adjust future tasks based on results.

3.  **Plan Interaction & Review:**
    *   **Screen 8: Calendar View:** User checks the calendar (week/month) to see the plan. Can drag-and-drop a task to reschedule (AI adjusts surrounding plan). Can add new days off.
    *   **Screen 9: Progress Report:** User navigates to the detailed progress section. Explores performance by topic, readiness score breakdown, and history of AI adaptations.
    *   **Screen 10: AI Tutor:** User manually opens the AI Tutor chat anytime to ask questions.

## 5. Mockup Screen Descriptions

*(These describe the key elements and interactions for each screen)*

1.  **Screen 1: Welcome & Exam Date:**
    *   **Elements:** ArcherReview Logo, Welcome message ("Let's build your personalized NCLEX study plan!"), Calendar input for selecting NCLEX Exam Date, "Next" button. Clean, encouraging design.

2.  **Screen 2: Diagnostic Assessment:**
    *   **Elements:** Title ("Quick Diagnostic Assessment"), Brief explanation ("This helps us tailor your plan. It's adaptive, so it might feel challenging."), "Start Assessment" button. During assessment: Question text, Multiple-choice answers, Progress indicator (e.g., "Question 5 of ~15"), "Submit Answer" button.

3.  **Screen 3: Schedule Setup:**
    *   **Elements:** Title ("Your Study Availability"), Interactive weekly calendar grid (Mon-Sun) where users can click days to mark as "Off". Sliders or input fields for "Average hours per study day" or "Total hours per week". Optional: Checkboxes for preferred study times ("Morning", "Afternoon", "Evening"). "Next" button.

4.  **Screen 4: Plan Preview:**
    *   **Elements:** Title ("Your Initial Study Plan"), High-level summary ("Based on your diagnostic and schedule, here's your starting plan:"), Visual timeline or list showing major topic blocks per week. Key message: "Remember, this plan will adapt as you learn!". "Confirm & Start Studying" button.

5.  **Screen 5: Dashboard (Home):**
    *   **Elements:** Top Navigation (Dashboard, Calendar, Progress, Tutor, Settings). Main area with widgets:
        *   "Today's Focus": List of 2-4 tasks (e.g., "Watch: Heart Failure Patho", "Quiz: Diuretics"), estimated total time. Clickable tasks.
        *   "Readiness Score": Prominent gauge/dial showing current score (e.g., 65%).
        *   "Upcoming": Small list of tasks for the next day.
        *   "Key Areas": Lists top strength and top weakness (e.g., "Strong: Pediatrics", "Focus: Pharmacology").
        *   "AI Tip/Motivation": Small box with a relevant study tip or encouraging message.

6.  **Screen 6: Task View (Video Example):**
    *   **Elements:** Task Title ("Watch: Heart Failure Pathophysiology"), Embedded video player, Brief description/learning objectives, "Mark as Complete" button (enabled after video duration or user interaction), Optional: Link to related reading/notes, AI Tutor help button.

7.  **Screen 7: Quiz Interface:**
    *   **Elements:** Question Number ("Question 3 of 10"), Question Text, Multiple Choice Options (radio buttons), "Submit Answer" button. After submit: Correct answer highlighted, Detailed rationale displayed below, Link to relevant lesson/video. *If incorrect on a key concept:* Small AI prompt appears ("Struggling with this? Ask the AI Tutor!"). "Next Question" button. Final screen shows score summary.

8.  **Screen 8: Calendar View (Weekly):**
    *   **Elements:** Header with Month/Year, Arrows to navigate weeks. Grid showing days (Mon-Sun). Each day cell contains small, color-coded blocks representing tasks (e.g., Blue=Video, Green=Quiz, Orange=Review). Hovering shows task title/time. Clicking opens Task Detail. Drag-and-drop enabled for tasks. Button to switch to Month/Day view.

9.  **Screen 9: Progress Report:**
    *   **Elements:** Tabs ("Overview", "Performance by Topic", "Readiness Details", "Plan Adaptations").
        *   **Overview:** Charts showing readiness score trend, overall plan completion %.
        *   **Performance by Topic:** Collapsible tree/list of NCLEX categories (e.g., Management of Care, Pharm, Physio Adaptation). Each shows mastery score/bar. Clicking expands to sub-topics.
        *   **Readiness Details:** Explains the score, shows top contributing strengths and weaknesses. Shows forecast if applicable.
        *   **Plan Adaptations:** Log of recent changes made by the AI (e.g., "Added extra quiz on Renal Failure due to recent performance - Scheduled for Friday").

10. **Screen 10: AI Tutor Chat:**
    *   **Elements:** Standard chat interface. Conversation history area. Text input field at the bottom ("Ask about a concept, rationale, or task..."). "Send" button. Contextual awareness (e.g., if opened from a quiz question, it might pre-fill: "Can you explain question 5 about Digoxin?").

## 6. Next Steps

*   Refine these feature descriptions and UX flows based on stakeholder feedback.
*   Develop low-fidelity wireframes based on the mockup descriptions.
*   Prioritize features for the initial prototype build.
*   Begin technical design and implementation of the core AI components and UI.
