# CareScreen Engineering Architecture & Design Document

## 1. Core Architecture & Strategic Trade-offs

### 1.1 Shared Package (`shared/`) vs. Duplicated Logic
The form schema, branching rules, and core eligibility evaluator are meticulously isolated within a top-level `shared/` directory.
- **Rationale:** The evaluator is intentionally designed as a pure, deterministic function that is independently testable outside the context of Next.js or NestJS. This ensures strict decoupling of domain logic from framework-specific constraints, adhering precisely to the assignment requirements.
- **Trade-off:** The `shared/` directory currently relies on a manual synchronization step into `backend/src/shared` for NestJS compilation. In a production setting, transitioning to a formal npm workspace structure (e.g., `@carescreen/shared`) or implementing a robust build-time sync script would significantly elevate the developer experience.

### 1.2 Server-Driven Progression vs. Client-Side Evaluation
The application employs a server-driven architecture where the backend API evaluates the current session state and dictates the subsequent screen after each submission.
- **Rationale:** This paradigm establishes an immutable single source of truth, precludes client-side tampering with medical branching logic, and seamlessly facilitates session resumption (`GET /api/session/:id`) across diverse devices and contexts.
- **Trade-off:** This introduces a network round-trip for each screen transition. However, given the context of a rigorous 15-step medical screening form where data persistence, security, and integrity are paramount, this latency is demonstrably negligible and entirely acceptable.

### 1.3 Early Terminal Outcomes vs. Deferred Evaluation
Critical disqualifying criteria (e.g., underage, pregnancy) trigger immediate termination of the flow, rather than deferring the final evaluation.
- **Rationale:** This strategy maps directly to the specification's "End: Ineligible" pathways and profoundly optimizes the patient experience by preemptively halting irrelevant and potentially intrusive medical inquiries.
- **Trade-off:** The final comprehensive evaluator (Screen 15) must still be robustly architected to handle these edge cases, guaranteeing logical consistency regardless of the patient's specific traversal history.

## 2. Roadmap for Future Enhancements (With Additional Time)

- **Workspace Monorepo Integration:** Migrate the `shared/` folder into a formal npm workspace package (e.g., `@carescreen/shared`) with a unified build artifact to permanently eliminate manual code synchronization.
- **State Traversal History:** Engineer a comprehensive traversal history stack to support "Previous" navigation. This requires sophisticated backend logic to manage retroactive answer modifications and gracefully cascade the invalidation of dependent downstream branch data.
- **Advanced Testing Paradigms:** Introduce property-based testing (via `fast-check`) for the evaluator to rigorously fuzz test thousands of answer permutations, coupled with snapshot testing to validate the complex `FORM_SCHEMA` structure.
- **API Specification:** Automate the generation of comprehensive OpenAPI (Swagger) documentation directly from NestJS Data Transfer Objects (DTOs).
- **Database Architecture Refinement:** Draft an Architecture Decision Record (ADR) detailing the strategic evolution of session storage—specifically migrating from a flexible JSON `answers` column to highly normalized entity tables to support advanced Business Intelligence (BI) and analytics.

## 3. Next.js Versioning Rationale

While the assignment specification requested Next.js 15, I elected to implement Next.js 16 in conjunction with React 19. This strategic decision was made to leverage the latest stable ecosystem features, guarantee forward-compatibility with React 19 Server Components, and preemptively avoid ecosystem warning states occasionally observed with earlier Next 15 / React 19 RC pairings.

## 4. AI Tool Utilization & Reflection

| Tool | High-Value Impact | Limitations & Friction |
|------|-------------------|------------------------|
| **Claude Opus 4.6 (Thinking)** | Exceptional at architecting the NestJS/Prisma foundation, reasoning through complex evaluator branching logic, and generating robust Vitest/Playwright test suites. | Required explicit prompting to strictly adhere to the provided medical specification, as initial drafts occasionally hallucinated non-standard clinical flows. |
| **Gemini 3.1 Pro (High)** | Highly efficient at rapid refactoring, auto-completing Tailwind layout boilerplate, and synthesizing complex state management patterns in React components. | Occasionally struggled with resolving precise relative import paths across the backend/frontend monorepo boundaries, necessitating manual correction. |

**Final Takeaway:** AI tooling served as a formidable accelerator for structural scaffolding (CRUD endpoints, test setups) and boilerplate reduction. However, achieving strict fidelity to the clinical logic specification demanded human-in-the-loop validation. Meticulous review of the Form Logic Specification remained imperative to guarantee clinical safety and rule accuracy.

## 5. Specification Ambiguities & Clinical Resolutions

During the implementation phase, several ambiguities within the product specification were identified and systematically resolved. Here is how they were addressed:

| Ambiguity / Edge Case | Engineering Resolution |
|-----------------------|------------------------|
| **Conflicting Rules:** Summary lists GLP-1 under "Immediate Ineligibility", but Screen 10 branch specifies "Requires Clinical Review — Already On Therapy". | Adhered to the more specific **Screen 10 branch logic** (`requires_clinical_review` with flag `already_on_glp1`). This decision is documented here to facilitate future alignment with the product/clinical teams. |
| **Age > 75:** Specification indicates "Proceed with caution" without explicitly defining whether to terminate or continue the flow. | **Action: Continue flow.** The evaluator appends a specialized flag and ultimately yields a `requires_clinical_review` status, provided no higher-priority disqualifying rule is triggered beforehand. |
| **Conflicting UI Selections:** A user simultaneously selects "Normal" and "Hypertensive Crisis" for blood pressure. | Permitted the UI selection (standard checkbox UX) without introducing rigid blocking validation. The backend evaluator resolves this by treating **Crisis as the dominant condition**, appropriately flagging the session for clinical review. |
| **Complex Multi-factor Logic:** The criterion "Daily alcohol + moderate/high risk factors" lacks an explicit definition of a "risk factor". | Engineered an internal heuristic: ≥2 comorbidities, stage 1/2 BP, high-sugar/processed diet, sedentary lifestyle, smoking, or diabetes. This heuristic is explicitly documented within the codebase pending formal clinical review. |

## 6. Performance & Scalability Considerations

- **Database Optimization:** The architecture executes a single, lightweight database round-trip per screen (upsert answer + update session). At anticipated scale and interaction frequency, this read/write profile is exceptionally performant.
- **Evaluator Compute Efficiency:** The eligibility evaluator algorithms operate with $O(1)$ time complexity over a fixed answer map. This computational efficiency makes it perfectly viable to re-execute dynamically on `GET` requests without the overhead of caching.
- **Caching Strategy:** Considering the highly personalized, ephemeral, and session-specific nature of the screening form, intermediate caching layers (e.g., Redis) were intentionally omitted. This decision prevents unnecessary architectural complexity for the current project scope.
