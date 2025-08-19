Great—let’s start with CLARIFY. I’ll ask focused questions (with my default recommendation in parentheses) so we can quickly converge to ADD/DELETE/UPDATE/REMOVE decisions per area.

Please answer yes/no or short preference; I’ll then translate into a concrete change list.

CLARIFY

Legacy question-set artifacts
Remove question-set era models/fields?
Models: Question, QuestionSet, QuestionSetStudySession, ScheduledReview.questionSetId and relation to QuestionSet (DELETE)
UserStudySession.questionSetStudySessions relation (DELETE)
Note: We’ll migrate ScheduledReview to primitive-centric if you want to keep scheduled reviews. Is that desired? (Default: yes, convert to primitiveId)
MasteryCriterion primitive linking
Fully adopt the junction model MasteryCriterionPrimitive and remove MasteryCriterion.knowledgePrimitiveId + its relation? (Default: yes, REMOVE)
If yes, do we keep MasteryCriterion.weight as a criterion-level weight, or move all weighting into the junction (relationshipType/weight)? (Default: keep junction weight authoritative; demote/remove criterion.weight)
UEE stage enums and naming
What’s the canonical UEE enum? Options seen: UNDERSTAND/… vs SURVEY/PROFICIENT/EXPERT vs Understand string in UserPrimitiveProgress.
Target a single enum UeeStage with values: SURVEY, UNDERSTAND, EXPLAIN, EXECUTE? Or your preferred set. (Default: SURVEY, UNDERSTAND, EXPLAIN, EXECUTE)
Switch all string fields (e.g., UserPrimitiveProgress.currentUeeLevel, masteryLevel) to enums? (Default: yes, UPDATE to enums or remove redundant)
Subjective fields
Remove subjective/time fields?
KnowledgePrimitive: difficultyLevel (DELETE), estimatedTimeMinutes (DELETE), complexityScore? (Default: DELETE unless a computed/observed metric)
BlueprintSection: difficulty enum (UPDATE or DELETE?), estimatedTimeMinutes (DELETE)
MasteryCriterion: difficulty, complexityScore, timeLimit, estimatedPrimitiveCount, relationshipComplexity, maxPrimitives (Default: DELETE unless strong case to keep)
Note anchoring
Keep NoteSection anchored to BlueprintSection only and remove generatedFromBlueprint/generatedFromBlueprintId? (Default: yes, REMOVE both)
Keep NoteSection.contentVersion? If yes, define semantic meaning (schema-level doc). (Default: KEEP with brief doc)
KnowledgePrimitive linkage to blueprint
Keep blueprintSectionId optional and fix the broken type (Int?), and consider removing direct blueprintId (redundant when section exists)? (Default: KEEP blueprintSectionId Int?; REMOVE blueprintId if section is always present; otherwise keep both with clear rules)
Migrate prerequisiteIds/relatedConceptIds string arrays to proper junction (KnowledgeRelationship)? (Default: yes, UPDATE to normalized relations)
Questions and marks
Implement marks-based questions in the new system:
QuestionInstance: add marksAvailable (Int, default 1) and markingCriteria (Json?) (ADD)
UserQuestionAnswer: add marksAchieved (Int), maybe partial credit handling (ADD)
Remove Question model entirely if superseded (DELETE) (ties back to item 1)
Remove QuestionInstance.difficulty (subjective) (DELETE)
User vs UserPreferences duplication
Consolidate: move learningStyle, experienceLevel, study-time configs into UserPreferences, and simplify User model (Default: yes, UPDATE/DELETE duplicated fields from User)
Remove User.dailyStudyTimeMinutes from User if you’ll carry it via preferences (Default: DELETE)
UserPrimitiveDailySummary and caching
Keep UserPrimitiveDailySummary and related cached services as a performance layer? (Default: KEEP)
If yes, we’ll leave schema as-is or tidy naming indexes only. (Default: MINOR UPDATE only)
UserCriterionMastery simplification
Remove duplicated/legacy fields: attemptsAllowed (not here), reviewCount/successfulReviews duplicates, broken/duplicated id fields, typo blueprintSectionI, malformed lastTwoAttempts (Default: CLEANUP/DELETE redundant and FIX syntax)
Keep fields used by SR: masteryScore, nextReviewAt, trackingIntensity, uueStage, masteryCriterionId, userId, primitiveId?, blueprintSectionId (Default: KEEP those)
Enums standardization
Introduce enums for:
User.learningStyle and experienceLevel → move to UserPreferences and use enums (Default: yes)
KnowledgePrimitive.primitiveType → enum (Default: yes)
TrackingIntensity already exists: DENSE/NORMAL/SPARSE? Keep as-is? (Default: KEEP)
InsightCatalyst and blueprint-centric shift
Shift InsightCatalyst noteId/questionId fields to blueprint-centric anchors (e.g., noteSectionId, masteryCriterionId/primitiveId)? (Default: UPDATE to noteSectionId and/or masteryCriterionId)
ScheduledReview conversion
Replace questionSetId with primitiveId and/or masteryCriterionId for fine-grained scheduling? (Default: UPDATE to primitiveId, optional criterionId)
Keep model at all? (Default: KEEP but primitive-centric)
LearningPath, KnowledgeRelationship, analytics
Keep LearningPath and KnowledgeRelationship for knowledge graph and navigation semantics? (Default: KEEP, and ensure KnowledgePrimitive uses relationships rather than string arrays)
Keep UserLearningAnalytics and UserMemoryInsight; convert insightType to enum (Default: KEEP + enum for insightType)
Misc fixes to schema.prisma syntax
There are malformed lines that will break Prisma formatting (e.g., blueprintSectionId Int?String, inline comments breaking tokens, duplicate id in UserCriterionMastery). OK to clean these up as part of the change batch? (Default: yes, FIX)
Once you confirm these clarifications (feel free to say “accept defaults except X, Y”), I’ll:

Convert each CSV row to a concrete ADD/DELETE/UPDATE/REMOVE decision.
Patch schema.prisma accordingly (with tidy, valid Prisma syntax).
Update docs/schema_annotations.csv to reflect final statuses.
Feedback submitted
Close
44 minutes ago