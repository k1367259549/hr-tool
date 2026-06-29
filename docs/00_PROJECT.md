# HR Daily AI

Version: 1.0

Status: Planning

Author: Project Owner

---

# Project Vision

HR Daily AI is an AI-first recruiting operating system.

It helps recruiters record daily work, analyze recruiting data, generate AI reviews, build a long-term knowledge base, and automatically generate tomorrow's work plan.

The goal is not to build a traditional HR management system.

The goal is to build an AI Recruiting Agent that becomes smarter every day.

---

# Product Goals

The software should help recruiters:

- Reduce repetitive manual work
- Record daily recruiting activities
- Analyze recruiting KPIs automatically
- Discover efficiency problems
- Generate actionable suggestions
- Generate tomorrow's work plan
- Build a long-term recruiting knowledge base

---

# Core Philosophy

AI is not an additional feature.

AI is the core of the product.

Everything revolves around AI.

Every module should generate structured data that AI can understand.

---

# Core Modules

## Module 1

Daily Log

Purpose

Record today's recruiting work.

Examples

- Resume screening
- Candidate communication
- Interviews
- Offer
- Onboarding
- Reflection

---

## Module 2

Dashboard

Purpose

Visualize recruiting KPIs.

Examples

- Resume count
- Interview count
- Offer count
- Hiring conversion
- Funnel
- Trends

---

## Module 3

AI Review

Purpose

Analyze today's work.

Output

- Summary
- KPI Analysis
- Problems
- Suggestions
- Daily Score

---

## Module 4

Tomorrow Planner

Purpose

Generate tomorrow's work plan automatically.

Output

- Priority Tasks
- Schedule
- Goals
- Risks

---

## Module 5

Knowledge Base

Purpose

Store long-term recruiting knowledge.

Knowledge comes from:

- AI
- User
- Daily Review
- Templates

---

# AI Core

AI Core connects every module.

Workflow

Daily Log

↓

Dashboard

↓

Review

↓

Knowledge

↓

Tomorrow Planner

AI should continuously learn from historical data.

---

# Tech Stack

Frontend

Next.js

React

TypeScript

TailwindCSS

shadcn/ui

Backend

Next.js Route Handlers

Prisma

PostgreSQL

Docker

AI

OpenAI API

Future:

Claude

Gemini

DeepSeek

Qwen

Deployment

Docker Compose

GitHub

GitHub Actions

---

# Development Principles

Every feature must:

Support Docker

Support Git

Support GitHub

Support PostgreSQL

Support AI

Be modular

Be testable

Be maintainable

---

# Architecture

Feature First

Repository Pattern

Service Layer

AI Layer

Prompt Layer

Never place business logic inside UI components.

Never call Prisma inside React components.

Never hardcode prompts.

---

# Coding Standards

TypeScript Strict Mode

ESLint

Prettier

No any

No duplicated code

Reusable components

Single Responsibility Principle

---

# Folder Structure

/docs

/src

/prisma

/prompts

/docker

/.github

/public

/components

/services

/repositories

/features

/config

/hooks

/types

/utils

---

# AI Principles

All AI prompts must be stored as Markdown files.

AI must return structured JSON whenever possible.

Every AI response should be stored in database.

Every AI request should be traceable.

Never expose API keys to frontend.

---

# Security

OpenAI API Key must remain on backend.

No frontend AI requests.

Environment variables only.

---

# Future Roadmap

Version 1

Daily Log

Dashboard

AI Review

Tomorrow Planner

Knowledge Base

Version 2

Resume Parser

Interview Records

Offer Tracking

Candidate Management

Version 3

Recruiting Agent

ATS Integration

Email Integration

Calendar Integration

Voice Agent

Multi-Agent Collaboration

---

# Success Criteria

A recruiter can finish daily work review within five minutes.

The AI provides useful suggestions.

Historical knowledge continuously improves future recommendations.

The project can be deployed using Docker with one command.

The project can be cloned from GitHub and run locally without manual configuration.
