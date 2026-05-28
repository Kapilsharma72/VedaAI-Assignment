# Requirements Document

## Introduction

VedaAI — AI Assessment Creator is a teacher-facing web platform that enables educators to create, generate, and manage AI-powered question papers. Teachers register and log in using email/password or Google OAuth, configure assignment parameters (question types, marks, reference documents), and receive a beautifully structured question paper generated in real-time by Google Gemini via WebSocket streaming. The platform supports PDF export, assignment management, and a responsive mobile-first UI with a dark sidebar design language.

The system is built as a monorepo with a Next.js 14 frontend, a Node.js/Express backend, MongoDB for persistence, Redis for caching, and BullMQ for background job processing.

---

## Glossary

- **System**: The VedaAI AI Assessment Creator platform as a whole.
- **Frontend**: The Next.js 14 web application served to teachers.
- **API**: The Node.js/Express backend service.
- **Worker**: The BullMQ background job processor responsible for AI generation.
- **Auth_Service**: The component handling registration, login, JWT issuance, and Google OAuth.
- **Assignment_Service**: The component managing assignment CRUD operations.
- **Generation_Service**: The component orchestrating AI question paper generation via Gemini.
- **WebSocket_Server**: The Socket.io server emitting real-time progress events.
- **PDF_Renderer**: The @react-pdf/renderer component producing downloadable PDF files.
- **File_Processor**: The backend component handling file uploads and text extraction.
- **Gemini_Client**: The wrapper around the Google Gemini API (gemini-1.5-flash model).
- **Teacher**: An authenticated user of the platform with the role of educator.
- **Assignment**: A configuration record created by a Teacher specifying question types, marks, subject, class, and optional reference material.
- **GeneratedPaper**: The structured question paper produced by the Worker from an Assignment.
- **Question_Type**: A category of question (e.g., MCQ, Short Questions, Long Questions) with an associated count and marks per question.
- **Section**: A grouping of questions within a GeneratedPaper sharing the same Question_Type.
- **Answer_Key**: A collapsible list of correct answers corresponding to questions in a GeneratedPaper.
- **JWT**: JSON Web Token used for stateless authentication.
- **OAuth**: Open Authorization protocol used for Google sign-in.
- **BullMQ**: A Redis-backed job queue library used for background processing.
- **Redis**: In-memory data store used for job queuing and paper caching.
- **MongoDB**: Document database storing Users, Assignments, and GeneratedPapers.
- **CBSE**: Central Board of Secondary Education — the curriculum standard used for question generation.

---

## Requirements

### Requirement 1: User Registration

**User Story:** As a Teacher, I want to register with my name, email, password, school name, and location, so that I can create a personal account and access the platform.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a POST /api/auth/register endpoint that accepts name (1–100 characters), email (valid RFC 5322 format), password (8–128 characters), schoolName (1–200 characters), and location (1–200 characters) fields.
2. WHEN a Teacher submits a registration form with all required fields present and valid, THE Auth_Service SHALL create a new User record with the password hashed using bcrypt with a minimum cost factor of 10.
3. WHEN a Teacher submits a registration form with an email that already exists in the database, THE Auth_Service SHALL return a 409 Conflict response with a message identifying the email conflict.
4. WHEN a Teacher submits a registration form with an invalid email format, THE Auth_Service SHALL return a 422 Unprocessable Entity response with a body identifying the email field as invalid.
5. WHEN a Teacher submits a registration form with a password shorter than 8 characters or longer than 128 characters, THE Auth_Service SHALL return a 422 Unprocessable Entity response with a body identifying the password field as invalid.
6. WHEN a Teacher submits a registration form with any required field missing or empty, THE Auth_Service SHALL return a 422 Unprocessable Entity response identifying each missing field.
7. WHEN registration succeeds, THE Auth_Service SHALL return a 201 Created response containing a signed JWT (7-day expiry) and the new User profile object with fields: id, name, email, schoolName, location, and avatar — and SHALL NOT include the password field.
8. WHEN a Teacher interacts with the registration form, THE Frontend SHALL display an inline validation error message directly below each invalid field without requiring a full page reload.
9. WHEN registration succeeds, THE Frontend SHALL display a toast notification confirming successful account creation and redirect the Teacher to /assignments.

---

### Requirement 2: User Login (Email + Password)

**User Story:** As a Teacher, I want to log in with my email and password, so that I can access my assignments and create new ones.

#### Acceptance Criteria

1. THE Auth_Service SHALL provide a POST /api/auth/login endpoint that accepts email and password fields.
2. WHEN a Teacher submits valid credentials matching an existing User record, THE Auth_Service SHALL return a 200 OK response containing a signed JWT (7-day expiry) and the User profile (excluding the password field).
3. WHEN a Teacher submits an unrecognised email or an incorrect password, THE Auth_Service SHALL return a 401 Unauthorized response with a generic message that does not distinguish between the two failure modes.
4. WHEN a Teacher submits a login form with a missing email or password field, THE Auth_Service SHALL return a 422 Unprocessable Entity response identifying the missing field.
5. WHEN login succeeds, THE Frontend SHALL store the JWT in an httpOnly cookie and redirect the Teacher to /assignments.
6. WHEN login fails due to invalid credentials or a missing field, THE Frontend SHALL display a toast notification containing a login-failure error message that auto-dismisses within 5 seconds.
7. THE Auth_Service SHALL issue JWTs with an expiry of exactly 7 days from the time of issuance.

---

### Requirement 3: Google OAuth Login and Registration

**User Story:** As a Teacher, I want to sign in with my Google account, so that I can access the platform without managing a separate password.

#### Acceptance Criteria

1. THE Auth_Service SHALL expose a GET /api/auth/google route that initiates the Google OAuth 2.0 authorization code flow and redirects the Teacher's browser to Google's authorization endpoint.
2. WHEN a Teacher completes Google OAuth for the first time (no existing User record with the returned googleId or email), THE Auth_Service SHALL create a new User record populated with the name, email, and avatar URL from the Google profile and set the googleId field.
3. WHEN a Teacher completes Google OAuth and an existing User record is found matching the returned googleId, THE Auth_Service SHALL retrieve that User record without creating a duplicate.
4. WHEN a Teacher completes Google OAuth and an existing User record is found matching the returned email but no googleId, THE Auth_Service SHALL link the googleId to that existing User record and retrieve it.
5. WHEN Google OAuth completes successfully, THE Auth_Service SHALL issue a JWT (7-day expiry), set it in an httpOnly cookie, and redirect the Teacher's browser to /assignments.
6. WHEN Google OAuth fails, is cancelled by the Teacher, or returns an error from Google, THE Auth_Service SHALL redirect the Teacher's browser to /login?error=oauth_failed.
7. THE Frontend SHALL display a "Sign in with Google" button on both the /login and /register pages that initiates the OAuth flow when clicked.

---

### Requirement 4: JWT Authentication and Session Management

**User Story:** As a Teacher, I want my session to persist across page refreshes, so that I do not have to log in repeatedly.

#### Acceptance Criteria

1. THE Auth_Service SHALL issue JWTs with an expiry of 7 days from the time of issuance.
2. WHEN a request arrives at a protected API route without a JWT, THE Auth_Service SHALL return a 401 Unauthorized response.
3. WHEN a request arrives at a protected API route with a JWT that is expired, THE Auth_Service SHALL return a 401 Unauthorized response with a message indicating token expiry.
4. WHEN a request arrives at a protected API route with a JWT that is correctly signed, unexpired, and contains a valid Teacher ID claim, THE Auth_Service SHALL allow the request to proceed and make the Teacher's identity available to the route handler.
5. IF a request arrives at a protected API route with a JWT that is malformed or signed with an incorrect secret, THE Auth_Service SHALL return a 401 Unauthorized response.
6. THE Auth_Service SHALL expose a GET /api/auth/me endpoint that returns the authenticated Teacher's profile (id, name, email, schoolName, location, avatar) when a valid JWT is provided.
7. WHEN a Teacher navigates to a protected route and no valid JWT is present in the httpOnly cookie, THE Frontend SHALL redirect the Teacher to /login.
8. WHEN a Teacher loads any page and a valid JWT is present in the httpOnly cookie, THE Frontend SHALL restore the Teacher's session without requiring re-authentication.
9. WHEN a Teacher logs out via POST /api/auth/logout, THE Frontend SHALL clear the JWT cookie and redirect the Teacher to /login.

---

### Requirement 5: Assignment Creation — Step 1 (Details)

**User Story:** As a Teacher, I want to configure question types, marks, a due date, and optionally upload a reference document in Step 1 of the assignment wizard, so that the AI has all the information it needs to generate a relevant question paper.

#### Acceptance Criteria

1. THE Frontend SHALL present Step 1 of the assignment creation wizard at /assignments/create with a file upload zone, due date input, question types table, and additional information textarea.
2. WHEN a Teacher uploads a file, THE Frontend SHALL accept only JPEG, PNG, and PDF files with a maximum size of 10 MB; for JPEG/PNG files it SHALL display an image thumbnail preview; for PDF files it SHALL display the filename and a document icon.
3. WHEN a Teacher uploads a file exceeding 10 MB, THE Frontend SHALL display an inline error message specifying that the file exceeds the size limit and SHALL NOT upload the file.
4. WHEN a Teacher uploads a file with an unsupported MIME type, THE Frontend SHALL display an inline error message specifying that the file type is not supported and SHALL NOT upload the file.
5. THE Frontend SHALL pre-populate the question types table with the following default types available in the dropdown: Multiple Choice Questions, Short Questions, Long Questions, Diagram/Graph-Based Questions, Numerical Problems, True/False, Fill in the Blanks.
6. WHEN a Teacher changes the count or marks value for any Question_Type row, THE Frontend SHALL recalculate and display the updated Total Questions and Total Marks values within 300 milliseconds.
7. THE Frontend SHALL allow a Teacher to add a new Question_Type row by clicking "+ Add Question Type", with the type selected from a dropdown containing the same options listed in criterion 5.
8. THE Frontend SHALL allow a Teacher to remove any Question_Type row by clicking the remove button on that row.
9. WHEN a Teacher enters a due date that is strictly before the current calendar date (ignoring time of day), THE Frontend SHALL display an inline validation error on the due date field and SHALL prevent navigation to Step 2.
10. WHEN a Teacher clicks "Next" and no Question_Type row has both a count greater than 0 and a marks value greater than 0, THE Frontend SHALL display an inline validation error and SHALL NOT navigate to Step 2.
11. THE Frontend SHALL limit the additional information textarea to 2000 characters and display a character count indicator.
12. THE Frontend SHALL display a microphone icon inside the additional information textarea as a UI decoration; clicking it SHALL NOT trigger audio capture.

---

### Requirement 6: Assignment Creation — Step 2 (Settings)

**User Story:** As a Teacher, I want to specify the assignment title, subject, class, school name, time allowed, and instructions in Step 2, so that the generated paper has accurate header information.

#### Acceptance Criteria

1. THE Frontend SHALL present Step 2 of the assignment creation wizard with fields for Assignment Title (max 200 characters), Subject (max 100 characters), Class/Grade (max 50 characters), School Name (max 200 characters), Time Allowed in minutes, and Instructions (max 1000 characters).
2. WHEN the authenticated Teacher's profile contains a schoolName value, THE Frontend SHALL pre-fill the School Name field with that value; WHEN the profile has no schoolName, THE Frontend SHALL leave the field empty and editable.
3. WHEN a Teacher clicks "Generate Assignment →" and any of Assignment Title, Subject, or Class/Grade is empty, THE Frontend SHALL display an inline validation error on each empty field and SHALL NOT submit the form.
4. WHEN a Teacher clicks "Generate Assignment →" and the Time Allowed value is not a whole number between 1 and 300, THE Frontend SHALL display an inline validation error on the Time Allowed field and SHALL NOT submit the form.
5. WHEN all Step 2 validations pass, THE Frontend SHALL POST the complete assignment configuration (combining Step 1 and Step 2 data) to POST /api/assignments.
6. WHEN the API returns an error during assignment creation, THE Frontend SHALL display a toast notification containing the reason for failure and SHALL remain on Step 2.
7. WHEN the API returns a successful response containing the new assignment id, THE Frontend SHALL navigate to /assignments/{id}.
8. WHEN a Teacher clicks "Previous", THE Frontend SHALL navigate back to Step 1 and SHALL preserve all previously entered Step 1 data.

---

### Requirement 7: File Upload and Text Extraction

**User Story:** As a Teacher, I want to upload a reference document (PDF, JPEG, PNG) that the AI uses as context when generating questions, so that the questions are relevant to my teaching material.

#### Acceptance Criteria

1. THE File_Processor SHALL expose a POST /api/upload endpoint that accepts multipart/form-data containing a single file field named "file".
2. WHEN a request arrives at POST /api/upload with no file field present, THE File_Processor SHALL return a 400 Bad Request response.
3. WHEN a PDF file is uploaded, THE File_Processor SHALL extract the text content from the PDF and return it as the uploadedFileText value in the response.
4. WHEN a JPEG or PNG file is uploaded, THE File_Processor SHALL store the file and return its accessible URL as the uploadedFileUrl value in the response.
5. THE File_Processor SHALL validate the MIME type of every uploaded file against the allowlist [image/jpeg, image/png, application/pdf] using file magic bytes and SHALL return a 415 Unsupported Media Type response for any file not on the allowlist.
6. THE File_Processor SHALL validate that every uploaded file does not exceed 10 MB (10,485,760 bytes) and SHALL return a 413 Payload Too Large response for oversized files.
7. WHEN PDF text extraction fails (e.g., the PDF is encrypted or corrupt), THE File_Processor SHALL return a 422 Unprocessable Entity response with a message indicating that text could not be extracted.
8. WHEN a file is successfully processed, THE File_Processor SHALL return a 200 OK response containing uploadedFileUrl (null if not applicable) and uploadedFileText (null if not applicable).

---

### Requirement 8: Assignment Persistence and Retrieval

**User Story:** As a Teacher, I want my assignments saved and listed so that I can review and manage them over time.

#### Acceptance Criteria

1. WHEN a Teacher sends a valid POST /api/assignments request, THE Assignment_Service SHALL create a new Assignment record in MongoDB associated with the authenticated Teacher's userId and return a 201 Created response containing the new assignment.
2. WHEN a Teacher sends a GET /api/assignments request, THE Assignment_Service SHALL return a 200 OK response containing all Assignment records belonging to that Teacher, sorted by createdAt descending.
3. WHEN a Teacher sends a GET /api/assignments/:id request for an Assignment that belongs to them, THE Assignment_Service SHALL return a 200 OK response containing that Assignment record.
4. WHEN a Teacher sends a GET /api/assignments/:id request for an Assignment that does not exist, THE Assignment_Service SHALL return a 404 Not Found response.
5. WHEN a Teacher sends a GET /api/assignments/:id request for an Assignment that belongs to a different Teacher, THE Assignment_Service SHALL return a 403 Forbidden response.
6. WHEN a Teacher sends a DELETE /api/assignments/:id request for an Assignment that belongs to them, THE Assignment_Service SHALL delete the Assignment record and its associated GeneratedPaper (if one exists) and return a 200 OK response.
7. WHEN a Teacher sends a DELETE /api/assignments/:id request for an Assignment that belongs to a different Teacher, THE Assignment_Service SHALL return a 403 Forbidden response without deleting any data.
8. WHEN an Assignment is created, THE Assignment_Service SHALL set its status to 'pending' and enqueue a job in the BullMQ question-generation queue containing the assignmentId.
9. THE Frontend SHALL display all assignments belonging to the authenticated Teacher in a 2-column grid on /assignments, with a search bar that filters by assignment title and a filter control that filters by assignment status.
10. WHEN no assignments exist for the authenticated Teacher, THE Frontend SHALL display an empty state illustration with a "Create Your First Assignment" call-to-action button.
11. WHEN the assignment count is greater than 0, THE Frontend SHALL display a badge on the Assignments sidebar navigation item showing the total count; WHEN the count is 0, THE Frontend SHALL not display the badge.

---

### Requirement 9: AI Question Paper Generation via BullMQ Worker

**User Story:** As a Teacher, I want the AI to generate a complete, curriculum-aligned question paper from my assignment configuration, so that I save time creating assessments.

#### Acceptance Criteria

1. THE Worker SHALL consume jobs from the BullMQ question-generation queue and process them one at a time.
2. WHEN a Worker job starts processing, THE Worker SHALL emit a progress event to the WebSocket room for that assignment with the message "Analyzing your inputs..." and a progress value of 20.
3. THE Worker SHALL fetch the Assignment record from MongoDB using the assignmentId from the job data; IF the Assignment is not found, THE Worker SHALL mark the job as failed and emit a failure event.
4. THE Worker SHALL construct a prompt that includes the subject, class, school name, time allowed, instructions, each question type with its count and marks per question, CBSE curriculum context, and any extracted text or file URL from the uploaded reference document.
5. THE Gemini_Client SHALL send the constructed prompt to the gemini-1.5-flash model and request a response containing only a valid JSON object with a sections array and an answerKey array.
6. WHEN the Gemini API returns a response, THE Worker SHALL emit a progress event with the message "Structuring your question paper..." and a progress value of 70.
7. THE Worker SHALL parse the Gemini response and verify that it contains a non-empty sections array and a non-empty answerKey array; IF parsing fails, THE Worker SHALL retry the Gemini call once with a stricter prompt before marking the job as failed.
8. WHEN parsing succeeds, THE Worker SHALL save a GeneratedPaper document to MongoDB and store a serialized copy in Redis with a TTL of 3600 seconds, keyed by assignmentId.
9. WHEN the GeneratedPaper is saved, THE Worker SHALL update the Assignment status to 'completed' and emit a completion event to the WebSocket room containing the assignmentId and the new paperId.
10. WHEN the job fails after all retries, THE Worker SHALL update the Assignment status to 'failed' and emit a failure event to the WebSocket room with a descriptive error message.
11. THE prompt SHALL explicitly instruct the model to distribute question difficulty as approximately 40% Easy, 40% Moderate, and 20% Hard across all sections combined.

---

### Requirement 10: Real-Time WebSocket Progress Updates

**User Story:** As a Teacher, I want to see live progress updates while my question paper is being generated, so that I know the system is working and how long to wait.

#### Acceptance Criteria

1. THE WebSocket_Server SHALL support room-based messaging where each room corresponds to a single assignment.
2. WHEN a client emits a join event with an assignmentId, THE WebSocket_Server SHALL add that client's connection to the room for that assignment.
3. WHEN a Teacher navigates to /assignments/{id}, THE Frontend SHALL establish a WebSocket connection to the server and join the room for that assignment.
4. WHEN the Frontend receives a progress event, THE Frontend SHALL update an animated progress bar to reflect the event's numeric progress value (0–100) and display the event's message as a status label below the bar.
5. WHEN the Frontend receives a completion event, THE Frontend SHALL stop the progress animation, fetch and display the generated question paper, and show a success toast notification that auto-dismisses within 5 seconds.
6. WHEN the Frontend receives a failure event, THE Frontend SHALL display an error state showing the failure message and a "Retry" button that re-triggers the generation job.
7. WHILE the generation job is in progress, THE Frontend SHALL display a loading skeleton in the question paper area.
8. WHEN the WebSocket connection cannot be established or is lost during generation, THE Frontend SHALL display an inline error message and a "Retry Connection" button.

---

### Requirement 11: Generated Question Paper Display

**User Story:** As a Teacher, I want to view the generated question paper in a well-formatted, print-like layout, so that I can review it before downloading.

#### Acceptance Criteria

1. WHEN the generation job completes, THE Frontend SHALL display the GeneratedPaper on /assignments/{id} inside a white card styled to resemble a printed exam paper.
2. WHILE the generation job is in progress, THE Frontend SHALL display a loading skeleton in place of the question paper card.
3. WHEN the generation job fails, THE Frontend SHALL display an error message and a "Retry" button in place of the question paper card.
4. THE Frontend SHALL render the school name centered and bold at the top of the paper card.
5. THE Frontend SHALL render the subject and class centered below the school name.
6. THE Frontend SHALL render the time allowed and total marks on the same row, with time allowed aligned to the left and total marks aligned to the right.
7. THE Frontend SHALL render student information blanks for Name, Roll Number, and Class/Section as labeled lines.
8. THE Frontend SHALL render each Section with a centered uppercase header, followed by numbered questions; each question SHALL display a difficulty badge (green background for Easy, amber background for Moderate, red background for Hard) and the question's marks value.
9. THE Frontend SHALL number questions sequentially starting from 1 within each section.
10. THE Frontend SHALL render the Answer Key in a collapsible section below the last question section; the Answer Key SHALL be collapsed by default and expand when the Teacher clicks a toggle control.
11. WHEN the GeneratedPaper is displayed, THE Frontend SHALL show a dark-background AI message card above the paper card containing a contextual message and a "⬇ Download as PDF" button.

---

### Requirement 12: PDF Export

**User Story:** As a Teacher, I want to download the generated question paper as a formatted PDF, so that I can print it and distribute it to students.

#### Acceptance Criteria

1. THE PDF_Renderer SHALL generate an A4-sized PDF with 20mm margins on all sides.
2. THE PDF_Renderer SHALL render the school name centered and bold at the top of the first page.
3. THE PDF_Renderer SHALL render a horizontal divider line between each section header and its questions.
4. THE PDF_Renderer SHALL render a difficulty tag immediately before each question's text in the format [Easy], [Moderate], or [Hard].
5. THE PDF_Renderer SHALL render the Answer Key on a separate page, with each entry showing the question number paired with its correct answer.
6. THE PDF_Renderer SHALL render a page number in the footer of every page.
7. THE PDF_Renderer SHALL name the downloaded file using the pattern {subject}_Class{class}_QuestionPaper.pdf, replacing spaces with underscores and removing special characters from subject and class values.
8. WHEN a Teacher clicks "⬇ Download as PDF", THE Frontend SHALL trigger the PDF file download without navigating away from the current page.
9. WHEN PDF generation fails, THE Frontend SHALL display a toast notification indicating that the download failed and offering the Teacher the option to retry.

---

### Requirement 13: Assignment Regeneration

**User Story:** As a Teacher, I want to regenerate a question paper for an existing assignment, so that I can get a different set of questions if the first result is unsatisfactory.

#### Acceptance Criteria

1. WHEN an authenticated Teacher sends a POST /api/assignments/:id/regenerate request for an Assignment that belongs to them and has a status of 'completed' or 'failed', THE Assignment_Service SHALL reset the Assignment status to 'pending' and enqueue a new generation job.
2. WHEN a POST /api/assignments/:id/regenerate request is received for an Assignment with a status of 'pending' or 'processing', THE Assignment_Service SHALL return a 409 Conflict response indicating that generation is already in progress.
3. WHEN a POST /api/assignments/:id/regenerate request is received for an Assignment that belongs to a different Teacher, THE Assignment_Service SHALL return a 403 Forbidden response.
4. WHEN the regeneration job starts, THE Worker SHALL overwrite the existing GeneratedPaper document for that Assignment and delete the Redis cache entry keyed by assignmentId before saving the new paper.
5. WHEN the regeneration job fails after all retries, THE Worker SHALL set the Assignment status to 'failed' and SHALL preserve the most recently completed GeneratedPaper document without deleting it.
6. THE Frontend SHALL display a "↺ Regenerate" button on the /assignments/{id} page alongside the "⬇ Download as PDF" button.
7. WHEN a Teacher clicks "↺ Regenerate", THE Frontend SHALL display a confirmation dialog containing a warning that the current paper will be replaced and two actions: "Confirm" and "Cancel".
8. WHEN the Teacher confirms regeneration, THE Frontend SHALL reset the progress bar to 0 and display real-time progress updates via WebSocket as defined in Requirement 10.

---

### Requirement 14: Security and Rate Limiting

**User Story:** As a system operator, I want the API to be protected against abuse and common web vulnerabilities, so that the platform remains secure and available.

#### Acceptance Criteria

1. THE API SHALL apply Helmet.js middleware on all routes to set secure HTTP response headers including Content-Security-Policy, X-Frame-Options, and X-Content-Type-Options.
2. THE API SHALL apply rate-limiting middleware that allows a maximum of 100 requests per 15-minute window per IP address.
3. WHEN a client exceeds the rate limit, THE API SHALL return a 429 Too Many Requests response including a Retry-After header indicating when the client may retry.
4. THE File_Processor SHALL determine the MIME type of every uploaded file by inspecting the file's magic bytes and SHALL return a 415 Unsupported Media Type response for any file whose magic-byte MIME type is not in the allowlist [image/jpeg, image/png, application/pdf].
5. WHEN user-supplied text fields (subject, class, schoolName, additionalInfo, instructions) are included in the Gemini prompt, THE API SHALL strip or escape any characters that could alter the prompt's instruction structure before concatenation.
6. WHEN a request arrives from an origin that matches the FRONTEND_URL environment variable, THE API SHALL include CORS headers permitting the request; WHEN the origin does not match, THE API SHALL omit CORS headers, causing the browser to block the response.
7. IF the FRONTEND_URL environment variable is not set at startup, THE API SHALL log a warning and deny all cross-origin requests.
8. THE Auth_Service SHALL store passwords exclusively as bcrypt hashes with a minimum cost factor of 10 and SHALL NOT write plaintext passwords to any storage medium or log.

---

### Requirement 15: Responsive Mobile-First UI

**User Story:** As a Teacher using a mobile device, I want the application to be fully usable on a 375px-wide screen, so that I can manage assignments on the go.

#### Acceptance Criteria

1. THE Frontend SHALL render a bottom tab bar on viewports narrower than 768px with tabs for Home, Assignments, Library, and AI Toolkit.
2. THE Frontend SHALL hide the sidebar navigation on viewports narrower than 768px.
3. THE Frontend SHALL render the assignments grid as a single column on viewports narrower than 768px.
4. THE Frontend SHALL render the assignment creation wizard steps as full-width on viewports narrower than 768px.
5. WHEN a route change occurs, THE Frontend SHALL display a transition animation lasting no more than 300 milliseconds between the outgoing and incoming page.
6. THE Frontend SHALL use the Inter font family throughout all pages.
7. THE Frontend SHALL apply consistent visual design tokens (sidebar background color, accent color, main content background color, card border radius) across all pages and components.
8. THE Frontend SHALL NOT produce horizontal scrolling at a viewport width of 375px on any page.
9. THE Frontend SHALL render all interactive controls (buttons, links, form inputs) with a minimum touch target size of 44×44 CSS pixels.

---

### Requirement 16: Infrastructure and Developer Experience

**User Story:** As a developer, I want the project to run with a single Docker Compose command and have shared TypeScript types, so that onboarding and local development are straightforward.

#### Acceptance Criteria

1. THE System SHALL provide a docker-compose.yml file defining services for mongodb (mongo:7), redis (redis:7-alpine), api (port 5000), and web (port 3000), with the api service depending on mongodb and redis.
2. THE System SHALL provide a .env.example file listing all required environment variables with placeholder values and a comment describing each variable's purpose.
3. THE System SHALL provide a packages/shared directory exporting TypeScript interfaces for User, Assignment, GeneratedPaper, Question_Type, Section, AnswerKey entry, and WebSocket event payloads (progress, complete, failed).
4. THE API SHALL emit a structured log entry via Winston for every incoming HTTP request (method, path, status code, duration), every Worker job lifecycle event (enqueued, started, completed, failed), and every unhandled error.
5. THE System SHALL enforce TypeScript strict mode (strict: true in tsconfig.json) across all packages and SHALL NOT use the `any` type.
6. WHEN the Frontend is fetching data from the API, THE Frontend SHALL display a loading skeleton component in place of the content being loaded.
7. WHEN a Teacher initiates a delete action, THE Frontend SHALL optimistically remove the assignment card from the UI immediately; IF the DELETE API call returns an error, THE Frontend SHALL restore the assignment card and display a toast notification with the error message.
8. THE Frontend SHALL display a toast notification via sonner for each of the following user-initiated actions: assignment created, assignment deleted, PDF downloaded, regeneration triggered, and any action that results in an API error.
