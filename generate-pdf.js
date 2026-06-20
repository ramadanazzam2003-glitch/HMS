import { readFileSync, writeFileSync } from "fs";
import { marked } from "marked";

const MD_FILE = "Graduation_Book_Full.md";
const HTML_FILE = "Graduation_Book_Full.html";

let md = readFileSync(MD_FILE, "utf-8");

const chapters = [
  { num: "1", title: "Introduction" },
  { num: "2", title: "Literature Review" },
  { num: "3", title: "System Analysis" },
  { num: "4", title: "System Design" },
  { num: "5", title: "Implementation" },
  { num: "6", title: "Testing and Evaluation" },
  { num: "7", title: "Conclusion and Future Work" },
];

// Remove cover info & abstract & TOC from body (already in HTML)
let bodyStart = md.indexOf("## Chapter 1:");
let result = bodyStart > -1 ? md.substring(bodyStart) : md;

for (const ch of chapters) {
  const pattern = `## Chapter ${ch.num}:`;
  const idx = result.indexOf(pattern);
  if (idx !== -1) {
    const chapterPage = `
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-number">Chapter ${ch.num}</span>
    <h1 class="chapter-title">${ch.title}</h1>
  </div>
</div>
`;
    result = result.slice(0, idx) + chapterPage + result.slice(idx);
  }
}

const bodyHtml = marked(result, { breaks: true, gfm: true });

const htmlDoc = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>MediBook: Hospital Appointment Management System</title>
<style>
  @page { size: A4; margin: 2.5cm 2.5cm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.8; color: #1a1a1a; }

  .cover-page {
    page-break-after: always;
    display: flex; flex-direction: column; justify-content: center; align-items: center;
    height: 100vh; text-align: center; padding: 3cm;
    background: linear-gradient(135deg, #1e3a5f 0%, #2563eb 100%); color: white;
  }
  .cover-page .university { font-size: 16pt; font-weight: 300; letter-spacing: 2px; margin-bottom: 0.5cm; text-transform: uppercase; }
  .cover-page .faculty { font-size: 13pt; font-weight: 300; margin-bottom: 2cm; opacity: 0.9; }
  .cover-page .project-title { font-size: 28pt; font-weight: 700; margin-bottom: 1cm; line-height: 1.3; }
  .cover-page .project-subtitle { font-size: 16pt; font-weight: 400; margin-bottom: 2.5cm; opacity: 0.9; }
  .cover-page .label { font-size: 14pt; font-weight: 600; margin-bottom: 0.5cm; text-transform: uppercase; letter-spacing: 3px; opacity: 0.8; }
  .cover-page .meta { font-size: 12pt; line-height: 2; opacity: 0.9; }
  .cover-page .year { margin-top: 1.5cm; font-size: 13pt; font-weight: 300; opacity: 0.8; }

  .abstract-page { page-break-after: always; padding: 3cm 2.5cm; }
  .abstract-page h1, .acknowledgement-page h1 { font-size: 20pt; color: #1e3a5f; margin-bottom: 1.5cm; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .abstract-page p, .acknowledgement-page p { font-size: 11pt; line-height: 1.8; text-align: justify; margin-bottom: 0.5cm; }

  .acknowledgement-page { page-break-after: always; padding: 3cm 2.5cm; }
  .acknowledgement-page h1 { font-size: 20pt; color: #1e3a5f; margin-bottom: 1.5cm; text-align: center; text-transform: uppercase; letter-spacing: 1px; }

  .toc-page { page-break-after: always; padding: 2cm 2.5cm; }
  .toc-page h1 { font-size: 20pt; color: #1e3a5f; margin-bottom: 1.5cm; text-align: center; text-transform: uppercase; letter-spacing: 1px; }
  .toc-item { display: flex; padding: 5px 0; border-bottom: 1px dotted #ccc; font-size: 10pt; }
  .toc-item .toc-num { width: 3cm; font-weight: 600; color: #2563eb; }
  .toc-item .toc-title { flex: 1; }

  .chapter-page { page-break-after: always; display: flex; justify-content: center; align-items: center; height: 100vh; background: linear-gradient(135deg, #f0f4ff 0%, #e8edf5 100%); }
  .chapter-page-content { text-align: center; padding: 3cm; }
  .chapter-page-content .chapter-number { display: block; font-size: 14pt; color: #2563eb; text-transform: uppercase; letter-spacing: 4px; margin-bottom: 0.5cm; }
  .chapter-page-content .chapter-label { display: block; font-size: 10pt; color: #888; text-transform: uppercase; letter-spacing: 6px; margin-bottom: 1.5cm; }
  .chapter-page-content h1 { font-size: 28pt; color: #1e3a5f; font-weight: 700; }

  .content { padding: 0; }
  .content h1 { font-size: 18pt; color: #1e3a5f; margin-top: 1.2cm; margin-bottom: 0.6cm; border-bottom: 2px solid #2563eb; padding-bottom: 4px; page-break-before: always; }
  .content h2 { font-size: 14pt; color: #1e3a5f; margin-top: 1cm; margin-bottom: 0.5cm; }
  .content h3 { font-size: 12pt; color: #1e3a5f; margin-top: 0.7cm; margin-bottom: 0.4cm; }
  .content h4 { font-size: 11pt; color: #1e3a5f; margin-top: 0.6cm; margin-bottom: 0.3cm; }
  .content p { margin-bottom: 0.35cm; text-align: justify; }
  .content ul, .content ol { margin-left: 0.6cm; margin-bottom: 0.35cm; }
  .content li { margin-bottom: 4px; }

  .content table { width: 100%; border-collapse: collapse; margin: 0.5cm 0; font-size: 9pt; page-break-inside: avoid; }
  .content th { background: #1e3a5f; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
  .content td { padding: 6px 10px; border: 1px solid #ddd; }
  .content tr:nth-child(even) td { background: #f8f9fa; }

  .content pre { background: #1a1a2e; color: #e0e0e0; padding: 0.4cm; border-radius: 6px; font-family: 'Consolas', monospace; font-size: 8pt; overflow-x: auto; margin: 0.3cm 0; line-height: 1.5; }
  .content code { font-family: 'Consolas', monospace; font-size: 8.5pt; background: #f0f0f0; padding: 1px 3px; border-radius: 3px; }
  .content pre code { background: none; padding: 0; }

  .content blockquote { border-left: 4px solid #2563eb; padding: 0.3cm 0.5cm; margin: 0.4cm 0; background: #f0f4ff; }

  .img-placeholder { display: block; margin: 0.5cm auto; padding: 2cm; background: #f9f9f9; border: 2px dashed #bbb; border-radius: 8px; text-align: center; font-size: 11pt; color: #666; }
  .img-placeholder strong { display: block; margin-bottom: 8px; color: #333; font-size: 14pt; }
  .img-placeholder .img-desc { font-size: 9pt; color: #888; }

  @media print {
    body { font-size: 10pt; }
    .content pre { font-size: 7pt; }
    .content table { font-size: 8pt; }
  }
</style>
</head>
<body>

<div class="cover-page">
  <div class="university">Kafr El‑Sheikh University</div>
  <div class="faculty">Faculty of Computer &amp; Information<br>Department of Computer Science</div>
  <div class="project-title">MediBook:<br>Hospital Appointment Management System</div>
  <div class="project-subtitle">Graduation Project Report</div>
  <div class="label">Supervised By</div>
  <div class="meta">Dr. [Supervisor Name]</div>
  <br>
  <div class="label">Prepared By</div>
  <div class="meta">Student Name 1 — ID: XXXXXX</div>
  <div class="meta">Student Name 2 — ID: XXXXXX</div>
  <div class="meta">Student Name 3 — ID: XXXXXX</div>
  <div class="year">Academic Year 2025–2026</div>
</div>

<!-- ACKNOWLEDGEMENT PAGE -->
<div class="acknowledgement-page">
  <h1>Acknowledgement</h1>
  <p>First and foremost, we would like to express our sincere gratitude to <strong>Almighty God</strong> for giving us the strength, patience, and perseverance to complete this graduation project.</p>
  <p>We would like to extend our deepest appreciation and heartfelt thanks to our supervisor, <strong>Dr. [Supervisor Name]</strong>, for their invaluable guidance, continuous support, and constructive feedback throughout every stage of this project. Their expertise and encouragement have been instrumental in shaping the direction and quality of this work.</p>
  <p>We are deeply grateful to the <strong>Faculty of Computer and Information at Kafr El-Sheikh University</strong> for providing us with the knowledge, skills, and academic environment necessary to undertake this project. We also extend our thanks to all the faculty members and staff who contributed to our academic development.</p>
  <p>We would like to express our sincere appreciation to <strong>our families</strong> for their unconditional love, support, and encouragement. Their patience and understanding throughout our academic journey have been a constant source of motivation.</p>
  <p>Our deepest thanks go to <strong>our colleagues and friends</strong> who shared valuable experiences, provided constructive criticism, and offered moral support during the development of this project. Their collaboration and enthusiasm made this work possible.</p>
  <p>Finally, we would like to thank <strong>the reviewers and examiners</strong> who took the time to evaluate this project. Your insights and feedback will help us improve and grow in our professional careers.</p>
  <p style="margin-top: 1cm; text-align: center; font-style: italic; font-size: 12pt;">May God bless you all.</p>
</div>

<div class="abstract-page">
  <h1>Abstract</h1>
  <p>The healthcare sector has witnessed a significant digital transformation in recent years, with appointment management systems becoming essential for improving patient experiences and operational efficiency. This project presents MediBook, a web-based hospital appointment management system designed to address common challenges in traditional appointment booking methods. MediBook provides a comprehensive platform that enables patients to browse hospital departments, select doctors, book appointments online, and receive AI-powered triage assistance.</p>
  <p>The system incorporates role-based access control supporting multiple user roles including patients, doctors, nurses, receptionists, administrators, and directors. Built with React 19, Supabase, and PostgreSQL, MediBook features an intuitive interface, real-time availability tracking, secure authentication with email verification, billing and invoicing with Paymob integration, and an AI triage assistant that helps patients identify the appropriate department based on their symptoms.</p>
  <p>The system has been designed with bilingual support (Arabic and English), responsive design principles, and comprehensive audit logging to meet the needs of modern healthcare facilities. This report details the analysis, design, implementation, and evaluation of the MediBook system across seven chapters.</p>
</div>

<div class="toc-page">
  <h1>Table of Contents</h1>
  <div class="toc-item"><span class="toc-num">1</span><span class="toc-title">Introduction</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.1</span><span class="toc-title">Background</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.2</span><span class="toc-title">Problem Statement</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.3</span><span class="toc-title">Motivation</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.4</span><span class="toc-title">Objectives</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.5</span><span class="toc-title">Scope</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.6</span><span class="toc-title">Contributions</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;1.7</span><span class="toc-title">Project Structure</span></div>
  <div class="toc-item"><span class="toc-num">2</span><span class="toc-title">Literature Review</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;2.1</span><span class="toc-title">Overview of Healthcare Information Systems</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;2.2</span><span class="toc-title">Existing Appointment Management Systems</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;2.3</span><span class="toc-title">Comparative Analysis</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;2.4</span><span class="toc-title">Research Gap</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;2.5</span><span class="toc-title">Technology Overview</span></div>
  <div class="toc-item"><span class="toc-num">3</span><span class="toc-title">System Analysis</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.1</span><span class="toc-title">Stakeholders</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.2</span><span class="toc-title">Functional Requirements</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.3</span><span class="toc-title">Non-Functional Requirements</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.4</span><span class="toc-title">Use Case Analysis</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.5</span><span class="toc-title">User Roles and Permissions</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;3.6</span><span class="toc-title">Activity Diagrams</span></div>
  <div class="toc-item"><span class="toc-num">4</span><span class="toc-title">System Design</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;4.1</span><span class="toc-title">System Architecture</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;4.2</span><span class="toc-title">Database Design</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;4.3</span><span class="toc-title">Component Design</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;4.4</span><span class="toc-title">Sequence Diagrams</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;4.5</span><span class="toc-title">User Interface Design</span></div>
  <div class="toc-item"><span class="toc-num">5</span><span class="toc-title">Implementation</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.1</span><span class="toc-title">Technology Stack</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.2</span><span class="toc-title">Frontend Implementation</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.3</span><span class="toc-title">Backend and Database Implementation</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.4</span><span class="toc-title">Authentication and Authorization</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.5</span><span class="toc-title">Core Modules</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;5.6</span><span class="toc-title">Key Features</span></div>
  <div class="toc-item"><span class="toc-num">6</span><span class="toc-title">Testing and Evaluation</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;6.1</span><span class="toc-title">Testing Methodology</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;6.2</span><span class="toc-title">Functional Testing</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;6.3</span><span class="toc-title">Performance Testing</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;6.4</span><span class="toc-title">Security Testing</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;6.5</span><span class="toc-title">Evaluation Results</span></div>
  <div class="toc-item"><span class="toc-num">7</span><span class="toc-title">Conclusion and Future Work</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;7.1</span><span class="toc-title">Achievements</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;7.2</span><span class="toc-title">Limitations</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;7.3</span><span class="toc-title">Future Improvements</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;&nbsp;7.4</span><span class="toc-title">Final Remarks</span></div>
  <div class="toc-item" style="margin-top:0.5cm;"><span class="toc-num">&nbsp;</span><span class="toc-title">Acknowledgement</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;</span><span class="toc-title">Abstract</span></div>
  <div class="toc-item"><span class="toc-num">&nbsp;</span><span class="toc-title">References</span></div>
  <div class="toc-item" style="margin-top:0.5cm;"><span class="toc-num">A</span><span class="toc-title">Appendix A: Installation Guide</span></div>
  <div class="toc-item"><span class="toc-num">B</span><span class="toc-title">Appendix B: User Manual</span></div>
  <div class="toc-item"><span class="toc-num">C</span><span class="toc-title">Appendix C: Database Schema Reference</span></div>
  <div class="toc-item"><span class="toc-num">D</span><span class="toc-title">Appendix D: Glossary</span></div>
  <div class="toc-item"><span class="toc-num">E</span><span class="toc-title">Appendix E: Extended References</span></div>
</div>

<div class="content">
${bodyHtml}
</div>

<!-- ===== APPENDIX A: INSTALLATION GUIDE ===== -->
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-label">APPENDIX</span>
    <span class="chapter-number">Appendix A</span>
    <h1 class="chapter-title">Installation Guide</h1>
  </div>
</div>

<div class="content">

<h1>Appendix A: Installation Guide</h1>

<h2>A.1 System Requirements</h2>

<p>Before installing MediBook, ensure that the system meets the following requirements:</p>

<h3>Hardware Requirements</h3>

<table>
<tr><th>Component</th><th>Minimum</th><th>Recommended</th></tr>
<tr><td>CPU</td><td>2 cores, 2.0 GHz</td><td>4 cores, 2.5 GHz</td></tr>
<tr><td>RAM</td><td>4 GB</td><td>8 GB</td></tr>
<tr><td>Storage</td><td>10 GB free space</td><td>20 GB SSD</td></tr>
<tr><td>Internet</td><td>Broadband connection</td><td>Broadband connection</td></tr>
</table>

<h3>Software Requirements</h3>

<table>
<tr><th>Software</th><th>Version</th><th>Purpose</th></tr>
<tr><td>Node.js</td><td>18.x or later</td><td>JavaScript runtime</td></tr>
<tr><td>npm</td><td>9.x or later</td><td>Package manager</td></tr>
<tr><td>Git</td><td>2.x</td><td>Version control</td></tr>
<tr><td>Supabase Account</td><td>—</td><td>Backend services</td></tr>
<tr><td>Vercel Account</td><td>—</td><td>Deployment platform</td></tr>
<tr><td>Paymob Account</td><td>—</td><td>Payment gateway</td></tr>
<tr><td>Resend Account</td><td>—</td><td>Email service</td></tr>
<tr><td>OpenRouter API Key</td><td>—</td><td>AI model access</td></tr>
</table>

<h2>A.2 Local Development Setup</h2>

<h3>Step 1: Clone the Repository</h3>
<pre><code>git clone https://github.com/your-org/medibook.git
cd medibook</code></pre>

<h3>Step 2: Install Dependencies</h3>
<pre><code>npm install</code></pre>

<h3>Step 3: Configure Environment Variables</h3>
<p>Create a <code>.env</code> file in the project root with the following variables:</p>
<pre><code>VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_RESEND_API_KEY=re_your-resend-api-key
VITE_PAYMOB_API_KEY=your-paymob-api-key
VITE_PAYMOB_INTEGRATION_ID=your-integration-id
VITE_OPENROUTER_API_KEY=sk-or-your-openrouter-key</code></pre>

<h3>Step 4: Database Migration</h3>
<p>Run the Supabase migration scripts located in the <code>supabase/migrations/</code> directory. These scripts create all required tables, indexes, triggers, and functions:</p>
<pre><code>npx supabase db push</code></pre>

<h3>Step 5: Start Development Server</h3>
<pre><code>npm run dev</code></pre>
<p>The application will be available at <code>http://localhost:5173</code>.</p>

<h2>A.3 Production Deployment</h2>

<h3>Vercel Deployment</h3>
<ol>
<li>Push the repository to GitHub</li>
<li>Connect the repository to Vercel</li>
<li>Configure environment variables in Vercel dashboard</li>
<li>Deploy — Vercel automatically detects Vite configuration</li>
</ol>

<h3>Supabase Configuration</h3>
<ol>
<li>Create a Supabase project at <a href="https://supabase.com">supabase.com</a></li>
<li>Run all migration files from <code>supabase/migrations/</code></li>
<li>Configure Authentication settings (email OTP verification)</li>
<li>Set up Row-Level Security policies</li>
<li>Create the Triage-Chat Edge Function</li>
</ol>

<h2>A.4 Environment Configuration Reference</h2>

<table>
<tr><th>Variable</th><th>Description</th><th>Required</th></tr>
<tr><td>VITE_SUPABASE_URL</td><td>Supabase project URL</td><td>Yes</td></tr>
<tr><td>VITE_SUPABASE_ANON_KEY</td><td>Supabase anonymous API key</td><td>Yes</td></tr>
<tr><td>VITE_RESEND_API_KEY</td><td>Resend email API key</td><td>Yes</td></tr>
<tr><td>VITE_PAYMOB_API_KEY</td><td>Paymob payment API key</td><td>Yes</td></tr>
<tr><td>VITE_PAYMOB_INTEGRATION_ID</td><td>Paymob integration identifier</td><td>Yes</td></tr>
<tr><td>VITE_OPENROUTER_API_KEY</td><td>OpenRouter API key for AI</td><td>Yes</td></tr>
<tr><td>VITE_APP_NAME</td><td>Application display name</td><td>No</td></tr>
<tr><td>VITE_APP_URL</td><td>Application deployment URL</td><td>No</td></tr>
</table>

</div>

<!-- ===== APPENDIX B: USER MANUAL ===== -->
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-label">APPENDIX</span>
    <span class="chapter-number">Appendix B</span>
    <h1 class="chapter-title">User Manual</h1>
  </div>
</div>

<div class="content">

<h1>Appendix B: User Manual</h1>

<h2>B.1 Patient Guide</h2>

<h3>B.1.1 Creating an Account</h3>
<ol>
<li>Navigate to the MediBook homepage</li>
<li>Click the "Register" button in the top navigation bar</li>
<li>Enter your full name, email address, and password</li>
<li>Click "Create Account"</li>
<li>Check your email for a 6-digit verification code (OTP)</li>
<li>Enter the code on the verification page to activate your account</li>
</ol>

<h3>B.1.2 Booking an Appointment</h3>
<ol>
<li>Browse the hospital departments displayed on the home page</li>
<li>Click on a department to view available options</li>
<li>Choose between "Consultant" or "Doctor" booking type</li>
<li>Select an available doctor from the list</li>
<li>Pick a preferred date and time slot from the available options</li>
<li>Enter your personal information (name, phone number, age)</li>
<li>Review the booking summary and click "Confirm Booking"</li>
<li>Note your booking reference number and queue position</li>
<li>Optional: Click "Pay Now" to pay online via Paymob</li>
</ol>

<h3>B.1.3 Using the AI Triage Assistant (Salama)</h3>
<ol>
<li>Click on "AI Triage" or "Salama" in the navigation menu</li>
<li>Type your symptoms in the chat box (Arabic or English)</li>
<li>Respond to the AI's follow-up questions</li>
<li>Review the department recommendation and severity assessment</li>
<li>Use the "Book Now" option to proceed with booking</li>
</ol>

<h3>B.1.4 Cancelling a Booking</h3>
<ol>
<li>Navigate to the cancellation page</li>
<li>Enter your booking reference number</li>
<li>Enter the phone number used during booking</li>
<li>Review the booking details displayed</li>
<li>Click "Cancel Booking" to confirm</li>
</ol>

<h2>B.2 Staff Guide</h2>

<h3>B.2.1 Staff Login</h3>
<ol>
<li>Navigate to the staff login page</li>
<li>Enter your staff email and password</li>
<li>The system redirects you to your role-specific dashboard</li>
</ol>

<h3>B.2.2 Dashboard Overview</h3>
<p>The dashboard displays key performance indicators including:</p>
<ul>
<li>Total number of bookings</li>
<li>Today's appointments count</li>
<li>Active (confirmed) bookings</li>
<li>Cancelled bookings</li>
<li>Department-wise booking distribution with progress bars</li>
<li>Quick action buttons for common tasks</li>
</ul>

<h3>B.2.3 Managing Bookings</h3>
<ol>
<li>Navigate to the "Bookings" section from the sidebar</li>
<li>Use the search bar to find bookings by reference, patient name, or doctor</li>
<li>Filter bookings by status (All, Active, Cancelled)</li>
<li>Click "Cancel" on any booking to process a cancellation</li>
<li>View booking details by clicking on the booking row</li>
</ol>

<h2>B.3 Doctor Guide</h2>

<h3>B.3.1 Viewing Today's Appointments</h3>
<ol>
<li>Log in with your doctor credentials</li>
<li>The doctor dashboard displays all today's appointments</li>
<li>Each appointment shows patient name, time, and status</li>
<li>Click "Consult" to start a patient consultation</li>
</ol>

<h3>B.3.2 Conducting a Consultation</h3>
<ol>
<li>View patient information on the consultation page</li>
<li>Record vital signs: blood pressure, temperature, weight, heart rate</li>
<li>Enter diagnosis in the diagnosis text area</li>
<li>Add clinical notes as needed</li>
<li>Use the prescription builder to add medications:
  <ul>
    <li>Enter medication name</li>
    <li>Specify dosage (e.g., "500 mg")</li>
    <li>Set frequency (e.g., "twice daily")</li>
    <li>Define duration (e.g., "7 days")</li>
    <li>Click "Add Medication" for additional prescriptions</li>
  </ul>
</li>
<li>Click "Save & Complete" to finalize the consultation</li>
</ol>

<h2>B.4 Administrator Guide</h2>

<h3>B.4.1 Managing Departments</h3>
<ol>
<li>Navigate to Settings → Departments tab</li>
<li>View list of all departments with current status</li>
<li>Click "Add Department" to create a new department</li>
<li>Fill in the English name, Arabic name, description, and daily capacity</li>
<li>Toggle the "Open" switch to activate or deactivate the department</li>
<li>Click "Save" to confirm changes</li>
</ol>

<h3>B.4.2 Managing Doctors</h3>
<ol>
<li>Navigate to Settings → Doctors tab</li>
<li>View all doctors and consultants with their details</li>
<li>Click "Add Doctor" to create a new doctor profile</li>
<li>Enter the doctor's name, type (Doctor/Consultant), and department</li>
<li>Select working days by checking the applicable days</li>
<li>Configure available time slots by adding start and end times</li>
<li>Optionally create an auth account for the doctor's staff login</li>
<li>Click "Save" to confirm</li>
</ol>

<h3>B.4.3 Managing Users and Roles</h3>
<ol>
<li>Navigate to Admin Panel → Users tab</li>
<li>View all system users with their current roles</li>
<li>Change a user's role using the role dropdown selector</li>
<li>Navigate to Roles & Permissions tab to configure permissions</li>
<li>Select a role to view its associated permissions</li>
<li>Toggle permissions on or off as needed</li>
</ol>

<h2>B.5 Billing Guide</h2>

<h3>B.5.1 Creating an Invoice</h3>
<ol>
<li>Navigate to Billing → Create Invoice</li>
<li>Select or enter patient information</li>
<li>Add bill items from the preset list:
  <ul>
    <li>Consultation — EGP 200</li>
    <li>Lab Test — EGP 150</li>
    <li>X-Ray — EGP 300</li>
    <li>ECG — EGP 250</li>
    <li>Ultrasound — EGP 400</li>
    <li>Blood Test — EGP 100</li>
    <li>MRI — EGP 1,500</li>
    <li>CT Scan — EGP 1,200</li>
  </ul>
</li>
<li>Add custom items if needed</li>
<li>Set the tax rate (default: 14%)</li>
<li>Review the automatically calculated totals</li>
<li>Click "Save Invoice"</li>
</ol>

<h3>B.5.2 Processing Payments</h3>
<ol>
<li>From the invoice detail page, click "Record Payment"</li>
<li>Select payment method (Cash, Card, Paymob Online)</li>
<li>Enter the amount received</li>
<li>Confirm payment to update invoice status</li>
</ol>

<h2>B.6 AI Triage (Salama) — Detailed Guide</h2>

<h3>B.6.1 Supported Departments</h3>
<p>The AI triage system can recommend the following departments:</p>
<table>
<tr><th>Department</th><th>Common Symptoms</th></tr>
<tr><td>Internal Medicine</td><td>Fever, general weakness, digestive issues, infections</td></tr>
<tr><td>Cardiology</td><td>Chest pain, palpitations, shortness of breath, high blood pressure</td></tr>
<tr><td>Orthopedics</td><td>Bone pain, joint pain, fractures, back pain, muscle injuries</td></tr>
<tr><td>Pediatrics</td><td>Childhood illnesses, fever in children, growth concerns</td></tr>
<tr><td>Neurology</td><td>Headaches, dizziness, seizures, numbness, memory problems</td></tr>
<tr><td>Dermatology</td><td>Skin rashes, acne, eczema, fungal infections, hair loss</td></tr>
<tr><td>ENT</td><td>Ear pain, hearing loss, sore throat, sinus problems, tonsillitis</td></tr>
<tr><td>Ophthalmology</td><td>Vision problems, eye pain, redness, dry eyes, cataracts</td></tr>
<tr><td>General Surgery</td><td>Abdominal pain, hernias, appendicitis, gallstones, lumps</td></tr>
<tr><td>Obstetrics &amp; Gynecology</td><td>Pregnancy care, menstrual issues, pelvic pain, fertility</td></tr>
<tr><td>Psychiatry</td><td>Anxiety, depression, insomnia, stress, behavioral issues</td></tr>
</table>

<h3>B.6.2 Severity Levels</h3>
<table>
<tr><th>Severity</th><th>Color</th><th>Description</th><th>Action Required</th></tr>
<tr><td>Low</td><td>Green</td><td>Minor symptoms, non-urgent</td><td>Schedule regular appointment</td></tr>
<tr><td>Medium</td><td>Yellow</td><td>Moderate symptoms requiring attention</td><td>Schedule soon (within 1-2 days)</td></tr>
<tr><td>High</td><td>Orange</td><td>Serious symptoms requiring prompt care</td><td>Visit hospital as soon as possible</td></tr>
<tr><td>Emergency</td><td>Red</td><td>Life-threatening symptoms</td><td>Call emergency services immediately</td></tr>
</table>

</div>

<!-- ===== APPENDIX C: DATABASE SCHEMA ===== -->
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-label">APPENDIX</span>
    <span class="chapter-number">Appendix C</span>
    <h1 class="chapter-title">Database Schema Reference</h1>
  </div>
</div>

<div class="content">

<h1>Appendix C: Database Schema Reference</h1>

<h2>C.1 Complete Table Definitions</h2>

<h3>C.1.1 profiles</h3>
<pre><code>CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role_id INTEGER REFERENCES roles(id),
  department_id INTEGER REFERENCES departments(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.2 roles</h3>
<pre><code>CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  parent_id INTEGER REFERENCES roles(id),
  level INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed data
INSERT INTO roles (name, description, level) VALUES
  ('patient', 'Regular patient user', 0),
  ('doctor', 'Medical doctor', 1),
  ('nurse', 'Nursing staff', 2),
  ('receptionist', 'Front desk staff', 3),
  ('dept_manager', 'Department manager', 4),
  ('admin', 'System administrator', 5),
  ('director', 'Hospital director', 6),
  ('manager', 'Super administrator', 7);</code></pre>

<h3>C.1.3 permissions</h3>
<pre><code>CREATE TABLE permissions (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(20) DEFAULT 'own'
    CHECK (scope IN ('own', 'department', 'global')),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.4 role_permissions</h3>
<pre><code>CREATE TABLE role_permissions (
  role_id INTEGER NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  granted_by UUID REFERENCES auth.users(id),
  PRIMARY KEY (role_id, permission_id)
);</code></pre>

<h3>C.1.5 departments</h3>
<pre><code>CREATE TABLE departments (
  id SERIAL PRIMARY KEY,
  name_en VARCHAR(100) NOT NULL,
  name_ar VARCHAR(100) NOT NULL,
  description TEXT,
  max_daily INTEGER NOT NULL DEFAULT 50,
  is_open BOOLEAN DEFAULT true,
  image VARCHAR(255),
  head_doctor_id INTEGER REFERENCES doctors(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.6 doctors</h3>
<pre><code>CREATE TABLE doctors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('doctor', 'consultant')),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  user_id UUID REFERENCES auth.users(id),
  working_days INTEGER[] DEFAULT '{}',
  slots JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.7 bookings</h3>
<pre><code>CREATE TYPE booking_status AS ENUM (
  'active', 'cancelled', 'completed', 'no_show'
);

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref VARCHAR(20) UNIQUE NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  age INTEGER,
  user_id UUID REFERENCES auth.users(id),
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  booking_date DATE NOT NULL,
  slot_time TIME NOT NULL,
  queue_number INTEGER,
  status booking_status DEFAULT 'active',
  cancelled_by UUID REFERENCES auth.users(id),
  cancel_reason TEXT,
  notes TEXT,
  rescheduled_from UUID REFERENCES bookings(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_bookings_doctor_date ON bookings(doctor_id, booking_date);
CREATE INDEX idx_bookings_department_date ON bookings(department_id, booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_phone ON bookings(phone);
CREATE UNIQUE INDEX idx_bookings_ref ON bookings(booking_ref);</code></pre>

<h3>C.1.8 medical_records</h3>
<pre><code>CREATE TABLE medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  patient_age INTEGER,
  doctor_id INTEGER NOT NULL REFERENCES doctors(id),
  department_id INTEGER NOT NULL REFERENCES departments(id),
  booking_id UUID REFERENCES bookings(id),
  user_id UUID REFERENCES auth.users(id),
  diagnosis TEXT,
  notes TEXT,
  vitals JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.9 prescriptions</h3>
<pre><code>CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medical_record_id UUID NOT NULL REFERENCES medical_records(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency VARCHAR(100),
  duration VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.10 bills</h3>
<pre><code>CREATE TYPE payment_status AS ENUM (
  'unpaid', 'paid', 'partial', 'refunded'
);

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  patient_phone VARCHAR(20) NOT NULL,
  doctor_id INTEGER REFERENCES doctors(id),
  department_id INTEGER REFERENCES departments(id),
  booking_id UUID REFERENCES bookings(id),
  items JSONB DEFAULT '[]',
  subtotal NUMERIC(10,2) NOT NULL,
  tax_rate NUMERIC(5,2) DEFAULT 0,
  tax_amount NUMERIC(10,2) DEFAULT 0,
  total NUMERIC(10,2) NOT NULL,
  payment_status payment_status DEFAULT 'unpaid',
  payment_method VARCHAR(50),
  paymob_order_id VARCHAR(100),
  paymob_transaction_id VARCHAR(100),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.11 triage_sessions</h3>
<pre><code>CREATE TABLE triage_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  messages JSONB DEFAULT '[]',
  recommendation JSONB,
  department_id INTEGER REFERENCES departments(id),
  severity VARCHAR(20),
  created_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h3>C.1.12 audit_logs</h3>
<pre><code>CREATE TABLE audit_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  action VARCHAR(50) NOT NULL,
  model VARCHAR(50) NOT NULL,
  model_id VARCHAR(50),
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);</code></pre>

<h2>C.2 Database Functions</h2>

<h3>C.2.1 Queue Number Calculation</h3>
<pre><code>CREATE OR REPLACE FUNCTION calculate_queue_number(
  p_department_id INTEGER,
  p_date DATE
) RETURNS INTEGER AS $$
DECLARE
  next_queue INTEGER;
BEGIN
  SELECT COALESCE(MAX(queue_number), 0) + 1
  INTO next_queue
  FROM bookings
  WHERE department_id = p_department_id
    AND booking_date = p_date
    AND status != 'cancelled';
  RETURN next_queue;
END;
$$ LANGUAGE plpgsql;</code></pre>

<h3>C.2.2 Booking Reference Generation</h3>
<pre><code>CREATE OR REPLACE FUNCTION generate_booking_ref()
RETURNS VARCHAR(20) AS $$
DECLARE
  date_part VARCHAR(8);
  random_part VARCHAR(8);
BEGIN
  date_part := TO_CHAR(NOW(), 'YYYYMMDD');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 8));
  RETURN 'MB-' || date_part || '-' || random_part;
END;
$$ LANGUAGE plpgsql;</code></pre>

<h2>C.3 Row-Level Security Policies</h2>

<p>Row-Level Security is enabled on the following tables with appropriate policies:</p>

<table>
<tr><th>Table</th><th>RLS Enabled</th><th>Policy Description</th></tr>
<tr><td>profiles</td><td>Yes</td><td>Users can view/edit own profile; staff can view all</td></tr>
<tr><td>medical_records</td><td>Yes</td><td>Patients view own; doctors create/view assigned; staff view all</td></tr>
<tr><td>prescriptions</td><td>Yes</td><td>Inherits from medical_records policy</td></tr>
<tr><td>bills</td><td>Yes</td><td>Staff with billing permission can manage all</td></tr>
<tr><td>notification_logs</td><td>Yes</td><td>Staff with notification permission can view</td></tr>
</table>

</div>

<!-- ===== APPENDIX D: GLOSSARY ===== -->
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-label">APPENDIX</span>
    <span class="chapter-number">Appendix D</span>
    <h1 class="chapter-title">Glossary</h1>
  </div>
</div>

<div class="content">

<h1>Appendix D: Glossary</h1>

<table>
<tr><th style="width:25%;">Term</th><th>Definition</th></tr>
<tr><td>API</td><td>Application Programming Interface — a set of rules that allows different software applications to communicate with each other</td></tr>
<tr><td>BaaS</td><td>Backend as a Service — a cloud computing service model that provides backend services such as databases, authentication, and storage</td></tr>
<tr><td>CRUD</td><td>Create, Read, Update, Delete — the four basic operations for persistent storage in database management</td></tr>
<tr><td>Edge Function</td><td>A serverless function deployed at the network edge for low-latency execution</td></tr>
<tr><td>EHR</td><td>Electronic Health Record — a digital version of a patient's medical history</td></tr>
<tr><td>HIS</td><td>Healthcare Information System — a system designed to manage healthcare data and operations</td></tr>
<tr><td>HMR</td><td>Hot Module Replacement — a feature that updates modules in a running application without a full reload</td></tr>
<tr><td>i18n</td><td>Internationalization — the process of designing software to support multiple languages and regions</td></tr>
<tr><td>JSONB</td><td>JSON Binary — a PostgreSQL data type for storing JSON data in a binary format with indexing support</td></tr>
<tr><td>KPI</td><td>Key Performance Indicator — a measurable value that demonstrates how effectively an organization achieves key objectives</td></tr>
<tr><td>LLM</td><td>Large Language Model — an AI model trained on vast amounts of text data for natural language processing</td></tr>
<tr><td>OTP</td><td>One-Time Password — a temporary, single-use code used for authentication verification</td></tr>
<tr><td>RBAC</td><td>Role-Based Access Control — a security approach that restricts system access based on user roles</td></tr>
<tr><td>RLS</td><td>Row-Level Security — a database security feature that restricts which rows users can access</td></tr>
<tr><td>RTL</td><td>Right-to-Left — a text direction used by languages such as Arabic, Hebrew, and Urdu</td></tr>
<tr><td>SPA</td><td>Single Page Application — a web application that dynamically updates content without full page reloads</td></tr>
<tr><td>SQL</td><td>Structured Query Language — a programming language for managing relational databases</td></tr>
<tr><td>SSL</td><td>Secure Sockets Layer — a cryptographic protocol for secure internet communication</td></tr>
<tr><td>UI</td><td>User Interface — the visual elements through which users interact with a system</td></tr>
<tr><td>UX</td><td>User Experience — the overall experience of a user interacting with a system</td></tr>
<tr><td>UUID</td><td>Universally Unique Identifier — a 128-bit identifier used for unique record identification</td></tr>
<tr><td>Vite</td><td>A modern build tool for web applications that provides fast development server and optimized builds</td></tr>
<tr><td>WebSocket</td><td>A communication protocol that provides full-duplex communication channels over a single TCP connection</td></tr>
</table>

</div>

<!-- ===== APPENDIX E: REFERENCES ===== -->
<div class="chapter-page">
  <div class="chapter-page-content">
    <span class="chapter-label">APPENDIX</span>
    <span class="chapter-number">Appendix E</span>
    <h1 class="chapter-title">Extended References</h1>
  </div>
</div>

<div class="content">

<h1>Appendix E: Extended References</h1>

<h2>Academic References</h2>

<p>[1] Kamel, S., &amp; Wahba, K. (2020). The Digital Transformation of Healthcare in Egypt: Opportunities and Challenges. <em>Journal of Health Informatics in Developing Countries</em>, 14(2), 1–15.</p>

<p>[2] Gupta, D., &amp; Denton, B. (2008). Appointment scheduling in health care: Challenges and opportunities. <em>IIE Transactions</em>, 40(9), 800–819.</p>

<p>[3] Cayirli, T., &amp; Veral, E. (2003). Outpatient scheduling in health care: A review of literature. <em>Production and Operations Management</em>, 12(4), 519–549.</p>

<p>[4] Zachariadis, M., &amp; Ozcan, P. (2017). The API Economy and Digital Transformation in Financial Services: The Case of Open Banking. <em>SSRN Electronic Journal</em>.</p>

<p>[5] Raghupathi, W., &amp; Raghupathi, V. (2014). Big data analytics in healthcare: promise and potential. <em>Health Information Science and Systems</em>, 2(1), 3.</p>

<p>[6] Topol, E. J. (2019). High-performance medicine: the convergence of human and artificial intelligence. <em>Nature Medicine</em>, 25(1), 44–56.</p>

<p>[7] World Health Organization. (2021). Global strategy on digital health 2020–2025. Geneva: WHO.</p>

<p>[8] Adler-Milstein, J., &amp; Jha, A. K. (2017). HITECH Act drove large gains in hospital electronic health record adoption. <em>Health Affairs</em>, 36(8), 1416–1422.</p>

<p>[9] Bates, D. W., &amp; Gawande, A. A. (2003). Improving safety with information technology. <em>New England Journal of Medicine</em>, 348(25), 2526–2534.</p>

<p>[10] Fichman, R. G., Kohli, R., &amp; Krishnan, R. (2011). The role of information systems in healthcare: current research and future trends. <em>Information Systems Research</em>, 22(3), 419–428.</p>

<p>[11] Paschou, M., Sakkopoulos, E., Sourla, E., &amp; Tsakalidis, A. (2013). Health Internet of Things: Metrics and methods for efficient data transfer. <em>Simulation Modelling Practice and Theory</em>, 34, 186–199.</p>

<p>[12] Garg, A. X., Adhikari, N. K., McDonald, H., et al. (2005). Effects of computerized clinical decision support systems on practitioner performance and patient outcomes. <em>JAMA</em>, 293(10), 1223–1238.</p>

<p>[13] Chaudhry, B., Wang, J., Wu, S., et al. (2006). Systematic review: impact of health information technology on quality, efficiency, and costs of medical care. <em>Annals of Internal Medicine</em>, 144(10), 742–752.</p>

<p>[14] Blumenthal, D., &amp; Tavenner, M. (2010). The "meaningful use" regulation for electronic health records. <em>New England Journal of Medicine</em>, 363(6), 501–504.</p>

<p>[15] Kruse, C. S., Krowski, N., Rodriguez, B., et al. (2017). Telehealth and patient satisfaction: a systematic review and narrative analysis. <em>BMJ Open</em>, 7(8), e016242.</p>

<h2>Technical Documentation</h2>

<p>[16] React Documentation. (2025). React 19 Release Notes. Retrieved from https://react.dev/blog/2025/03/13/react-19</p>

<p>[17] Supabase Documentation. (2025). Supabase Official Documentation. Retrieved from https://supabase.com/docs</p>

<p>[18] Tailwind CSS Documentation. (2025). Tailwind CSS v3 Documentation. Retrieved from https://tailwindcss.com/docs</p>

<p>[19] Paymob Documentation. (2025). Paymob Accept API Integration Guide. Retrieved from https://docs.paymob.com</p>

<p>[20] Vite Documentation. (2025). Vite Build Tool Documentation. Retrieved from https://vitejs.dev/docs</p>

<p>[21] Framer Motion Documentation. (2025). Framer Motion API Reference. Retrieved from https://www.framer.com/motion/</p>

<p>[22] Recharts Documentation. (2025). Recharts Charting Library. Retrieved from https://recharts.org</p>

<p>[23] Resend Documentation. (2025). Resend Email API. Retrieved from https://resend.com/docs</p>

<p>[24] OpenRouter Documentation. (2025). OpenRouter API for LLMs. Retrieved from https://openrouter.ai/docs</p>

<p>[25] TanStack Table Documentation. (2025). TanStack Table v8. Retrieved from https://tanstack.com/table</p>

</div>

</body>
</html>`;

writeFileSync(HTML_FILE, htmlDoc, "utf-8");
console.log("HTML file generated successfully: " + HTML_FILE);
console.log("File size: " + htmlDoc.length + " bytes");
