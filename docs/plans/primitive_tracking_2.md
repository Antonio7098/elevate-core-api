The Adaptive Mastery Learning System: A Holistic Design
1. Core Philosophy: Personalized, Adaptive, Mastery-Oriented Learning
The system's goal is to guide users to true mastery of complex topics by breaking down knowledge into atomic units (primitives), tracking individual progress on these units across different cognitive levels (UEE), and dynamically generating challenges tailored to their needs. It prioritizes understanding and application over rote memorization.

2. The Knowledge Blueprint (Source Data Model)
This is the static, deconstructed representation of the learning source. It's the "DNA" of the content, produced by the deconstruction pipeline.

SourceMetadata:

source_id: Unique identifier for the source (e.g., photosynthesis_chapter_1).

title: "Photosynthesis: From Light to Sugar".

type: "Textbook Chapter", "Research Paper", "Video Lecture".

summary: High-level overview, core thesis, inferred purpose.

Sections: List[Section]:

section_id: Unique ID (e.g., sec_light_reactions).

name: "Light-Dependent Reactions".

description: Brief summary of section content.

parent_section_id: For hierarchical organization.

text_span_start_char, text_span_end_char: (Optional, for precise linking).

KnowledgePrimitives: The atomic units of knowledge extracted from the source.

Concepts: List[Primitive]:

id: Unique ID (e.g., conc_energy_conversion).

label: "Energy Conversion Principle".

description: "The transformation of one form of energy into another."

type: "Proposition", "Theory", "Principle", "High-Level Process".

sections: List[str] (IDs of sections where this concept is present).

Entities: List[Primitive]:

id: Unique ID (e.g., ent_chloroplast).

label: "Chloroplast".

definition: "Organelle in plant cells where photosynthesis occurs."

category: "Organelle", "Enzyme", "Molecule", "Organism", "Location".

sections: List[str].

Relationships: List[Pathway]:

id: Unique ID (e.g., rel_loc_photosynthesis).

type: "LocationOf", "ComponentOf", "Causes", "Enables", "Requires".

source_id: ID of source primitive.

target_id: ID of target primitive.

description: How they are related (e.g., "Photosynthesis (source) takes place in Chloroplast (target)").

sections: List[str].

QuestionTypesForMastery: List[QuestionTypeDefinition]:

type_id: Unique ID (e.g., qt_critical_evaluation).

name: "Critical Evaluation".

description: What this type of question tests.

bloom_level: "Understanding", "Applying", "Analyzing", "Evaluating", "Creating" (maps to UEE).

prompt_template: "Critique the assumptions behind [CONCEPT/PRIMITIVE A] when applied to [CONTEXT/PRIMITIVE B]."

answer_guidelines: Criteria for a good answer (for AI evaluation/user feedback).

CuratedQuestions: List[CuratedQuestion] (Optional):

id: Unique ID.

question_text: A specific, pre-written question (e.g., from the source, or manually crafted).

question_type_id: Links to QuestionTypesForMastery.

linked_primitives: List[str] (IDs of primitives directly relevant to this question).

sections: List[str].

source_reference: Where this question came from in the original source.

3. The User Learning Model (Dynamic Progress Data)
This is individual user data, stored in a separate database, reflecting their progress and performance.

UserPrimitiveProgress: List[PrimitiveProgress] (Per User, Per Source):

primitive_id: ID of the KnowledgePrimitive being tracked.

source_id: ID of the source blueprint.

current_uee_level: "Understand", "Use", "Explore".

last_reviewed_date: Timestamp of last review.

current_interval_index: Index in the SRS interval sequence ([1d, 2d, 3d, 30d]).

due_date: Next scheduled review date.

consecutive_failures_at_level: Counter for applying failure logic.

consecutive_accelerated_successes: Counter for accelerated mastery.

distinct_questions_passed_at_level: List[str] (IDs of distinct questions/question instances successfully answered at this UEE level for this primitive, used for N-question mastery).

4. The System Architecture (Agents & Algorithms)
A. Deconstruction Pipeline (Offline / Batch Processing)
This runs once per source to build the Knowledge Blueprint.

1. Source Preprocessor: Takes raw source (e.g., PDF, HTML, text).

Agent: Section-Finding Agent: Identifies sections and their hierarchy. Splits source text into section-level chunks.

Output: Structured text chunks by section.

2. Primitive Extraction Pipeline: Processes each section chunk.

Agent: Concept Extractor: Populates Concepts (Propositions, Theories, High-Level Processes).

Agent: Entity Extractor: Populates Entities (Terms, Definitions, Named Entities).

Agent: Relationship Identifier: Populates Relationships by finding connections between extracted Concepts and Entities.

Agent: (Optional) Curated Question Extractor/Generator: Identifies explicit questions in the source or generates initial high-quality questions for CuratedQuestions.

Output: Initial Concepts, Entities, Relationships, CuratedQuestions (linked to sections).

3. Knowledge Graph Builder: Consolidates and deduplicates primitives from all sections. Ensures unique IDs.

4. Human Review & Refinement Tool: Essential for quality control. Allows experts to review, correct, and add missing primitives, relationships, and refine QuestionTypeDefinitions (especially prompt_template and answer_guidelines).

B. Learning Engine (Runtime / Interactive)
This interacts directly with the user.

1. Spaced Repetition Scheduler:

Purpose: Determines which primitives are due_date for a user. Prioritizes those with lower current_interval_index or highest due_date overdue.

Input: UserPrimitiveProgress.

Output: List[primitive_id] due for review.

2. Question Generation Orchestrator:

Purpose: Crafts the optimal question for a due_primitive_id based on user's uee_level and performance.

Input: primitive_id, current_uee_level, UserPrimitiveProgress for primitive_id, KnowledgeBlueprint.

Logic:

Prioritization: Check CuratedQuestions first for a perfect match (correct question_type_id for UEE level, relevant linked_primitives, not answered recently).

Dynamic Generation: If no suitable curated question, select a QuestionTypeDefinition from QuestionTypesForMastery whose bloom_level matches the uee_level.

LLM Question Generator: Using the prompt_template from the selected QuestionTypeDefinition, inject relevant Concepts, Entities, and Relationships related to the primitive_id from the KnowledgeBlueprint. Generate a unique question.

Performance Tuning: If P has been failing on a specific type of question (e.g., causal analysis), bias selection/generation towards that type.

Output: A GeneratedQuestion object (with ID, question text, question_type_id, linked_primitives).

3. User Interaction & Answer Capture: Presents question to user, captures their free-text answer.

4. Answer Evaluation & Feedback Engine:

Purpose: Assesses the user's answer and provides feedback.

Input: UserAnswer, GeneratedQuestion, QuestionTypeDefinition (answer_guidelines), KnowledgeBlueprint (for ground truth).

Logic: Uses LLM with answer_guidelines and KnowledgePrimitives as context to evaluate correctness, completeness, and adherence to bloom_level.

Output: is_correct (boolean), feedback_text.

5. Primitive Mastery & Progression Logic:

Purpose: Updates UserPrimitiveProgress based on is_correct and current mastery criteria.

Input: primitive_id, is_correct, UserPrimitiveProgress, KnowledgeBlueprint.

Logic (as discussed):

Failure: Apply 1-fail, 2-fail, 3-fail logic (update current_interval_index, reset due_date, update consecutive_failures_at_level, potentially downgrade uee_level).

Success:

Update current_interval_index and due_date.

Add generated question ID to distinct_questions_passed_at_level.

Check for Accelerated Mastery: (90%+ for 2 sessions, 1d apart). If met, advance uee_level, reset interval to 1d.

Check for Standard Mastery: (Completed 30d interval AND met N distinct questions criteria). If met, advance uee_level, reset interval to 1d.

If uee_level advances, consecutive_failures_at_level and consecutive_accelerated_successes reset.

Output: Updated UserPrimitiveProgress for primitive_id.

5. The Learning Loop (User Experience)
Login/Access Learning Path: User selects a source or continues their learning journey.

Scheduler Identification: The Spaced Repetition Scheduler identifies the top N primitives due_date for review.

Question Generation: For each due primitive, the Question Generation Orchestrator crafts a unique question tailored to the user's uee_level and performance.

Review Session: The user is presented with a set of these dynamic questions.

Answer & Feedback: User provides answers; the system evaluates and provides immediate, targeted feedback.

Progress Update: The Primitive Mastery & Progression Logic updates the user's progress for each reviewed primitive.

Adaptive Path: The next set of questions or learning activities is then dynamically adjusted based on this new progress data, ensuring continuous opti