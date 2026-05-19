# 🚀 Project Master Prompts

This file contains the prompts required to finalize documentation and kickoff the development session.

---

## 1. Prompt for Claude (To Finalize SRS/PRD)
**Use this prompt first** to get a bulletproof technical blueprint from Claude.

> "I am providing you with two documents: a PRD and a detailed SRS for a Healthcare Home Services platform. I want you to act as a Senior Software Architect. 
> 
> Your task is to review and finalize the SOFTWARE REQUIREMENTS SPECIFICATION (SRS) based on the PRD. Please rewrite the SRS to include:
> 
> 1. **Complete Database Schema:** Deepen the current schema by ensuring all relations (Foreign Keys), Indexes, and Enums are perfectly defined for Prisma/PostgreSQL.
> 2. **Comprehensive API Documentation:** List every single endpoint required for the Auth, Booking, Staff, and Report modules, including request bodies and response structures.
> 3. **Security & Validation:** Add a dedicated section in the SRS for 'Request Validation' (Zod/Joi) and 'Security Protocols' (JWT, Webhook Signing, RBAC).
> 4. **State Machine Logic:** Clearly define the 'Booking Status' transitions (e.g., from Pending to Assigned to Completed) to avoid logical conflicts.
> 5. **Technical Gap Analysis:** Based on the PRD, identify any functional requirements that are missing from the current SRS and add them.
> 
> **Combine the PRD insights and the SRS technicalities into one final, bulletproof SRS document that an AI can use to build the entire system from scratch."**

---

## 2. Kickoff Prompt for Antigravity (To Start Development)
**Use this prompt at home** once you have the finalized SRS and PRD files.

> "Hello Antigravity. I have pulled the project architecture and custom skills we developed. Please follow these instructions strictly:
> 
> 1. **Read the PRD and the finalized SRS file** in this directory. Our priority is to build the Website (React Web) and Backend first.
> 2. **Analyze the `SKILLS_GUIDE.md`** and use the `react-web-clean-bootstrap` and `backend-clean-bootstrap` skills as your primary foundation.
> 3. **The Mobile App (React Native)** will be handled in a later phase, but keep the architecture 'Shared' so we can reuse logic later.
> 4. **Start by proposing 'Phase 1: Web & Backend Initialization'** following our strict logic/design separation and Zero-Any TypeScript policy.
> 5. **Begin with UI mockups** for the Web landing/login pages using the `premium-ui-design-iteration` skill before coding.
> 
> **Are you ready to build the Web and Backend first?"**
