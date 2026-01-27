import { parseResumeDeadSimple } from './server/services/deadSimpleParser.js';
import fs from 'fs';

const sampleText = `MOHAMMAD IQRAM
mohammadiqram001@gmail.com | (907) 000-5552 | js, and Firebase, with | GitHub: github.com/MohammadIqram | Portfolio: Node.js | React.js

PROFESSIONAL SUMMARY
Highly skilled Full-Stack Software Engineer with 2+ years of experience in developing and deploying scalable web applications. Proficient in JavaScript, Node.js, React.js, and Firebase, with expertise in ERP, CRM, and E-commerce platforms, including Salesforce Commerce Cloud (Demandware). Proven ability to lead product development, design robust backend services, build intuitive frontend interfaces, and integrate third-party APIs in fast-paced startup environments.

SKILLS
JavaScript, Node.js, React.js, HTML, CSS, Firebase, REST, APIs, Tailwind, Bootstrap, Salesforce, Commerce, Cloud, (Demandware), WordPress, Google, Analytics, GitHub, AWS, (Foundational, Knowledge), ERP, Systems, CRM, Admin, Panels, Authentication, Authorization, (IAM), Ticketing

EXPERIENCE
Software Engineer OCT 2024 – PRESENT
- Led full-stack development of an ERP product, incorporating modules such as CRM, HRM, Sales,

Accounts, Inventory, Calendar, IAM, and Ticketing systems.
- Designed and implemented robust backend services to support complex business workflows and
- drive internal automation.
- Developed and maintained intuitive frontend dashboards and secure admin panels for enterprise
- users.
- Contributed to a training and certification platform for Australian organizations, featuring course
- management, membership, and corporate admin controls.
- PAGE BREAK ---
- Contributed significantly to architectural decisions and ensured successful end-to-end product
- delivery.

Software Engineer (Full-Stack) JAN 2024 – SEP 2024

CLOUDODYSSEY (SALESFORCE PARTNER COMPANY)
- Executed full-stack development for Salesforce Commerce Cloud (Demandware) projects.
- Implemented and supported critical B2C e-commerce flows leveraging Salesforce platform tools.
- Integrated diverse third-party services, including Google Analytics, Maps APIs, and customer
- review systems.
- Collaborated with cross-functional teams to maintain high-performance, production-grade e-
- commerce websites.
- Optimized website performance and implemented key improvements, enhancing user

Full-Stack Developer JUL 2022 – DEC 2023

STEALTH STARTUP
- Developed and deployed multiple production web applications, including GoGoMovers,

Sharwings, ResumeBotAI, and HomeAssets.
- Engineered full-stack features using React.js, Node.js, and Firebase, ensuring robust functionality.
- Implemented critical functionalities such as authentication, complex business logic, admin
- panels, and real-time features.
- Collaborated closely with founders in a fast-paced startup environment to rapidly iterate and
- deliver features.

PROJECTS
SALESFORCE COMMERCE CLOUD WEBSITES
Contributed to enterprise-scale e-commerce platforms including: https://www.titan.co.in,
https://www.sonatawatches.in, https://www.fastrack.in
JavaScript Salesforce Demandware Google Analytics APIs: -- PAGE BREAK ---
TOUR & TRAVEL WEBSITE
Developed a production WordPress website with responsive optimization. URL:
https://zammadventure.com/
WordPress

CERTIFICATIONS
- AWS Cloud Practitioner
- Foundation Badge AWS Solutions Architect
- Foundation Badge Secured 3rd Position in Technophilia Fest
    
EDUCATION
RIMT Engineering College Punjab Kashmir Harvard J&K 2015 | 2022
RIMT Engineering College, Punjab | 2022
Kashmir Harvard, J&K | 2015`;

const result = parseResumeDeadSimple(sampleText);
fs.writeFileSync('reproduce_output.json', JSON.stringify(result, null, 2));
console.log('Output saved to reproduce_output.json');
