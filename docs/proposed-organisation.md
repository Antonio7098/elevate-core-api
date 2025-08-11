Organizing “textbook-scale” content without deep-folder pain
Short answer: use a hybrid model—one canonical “Book tree” for sequential reading + tags/topics for cross-cuts + collections for curated sequences. Avoid relying solely on nested folders.
Recommended structure
Canonical Book tree (ordered, shallow)
Types: book → part (optional) → chapter → section (depth ≤ 4)
Each node: id, parentId, type, title, slug, orderIndex, tags
Purpose: preserves sequence and generates a clean Table of Contents (TOC)
Attachments (many-to-many)
Link notes, blueprints, question sets, assets to any node (e.g., a section)
Relation table: node_item_map(nodeId, itemId, role, orderIndex)
No duplication; everything is referenced, not copied
Topics/Taxonomy (graph)
Separate topic entities with a controlled vocabulary (e.g., “Derivatives,” “Limits”)
Map nodes and items to topics for cross-book discoverability
Collections/Playlists
Curated sequences independent of the Book tree (e.g., “Exam Review 1”)
Great for teaching flows, study paths, or quick bundles
Navigation UX
Book page
Left: sticky TOC (collapsible by chapter), search “in this book,” progress
Main: section content with inline “Linked items” blocks (blueprints, notes, sets)
Right inspector: context, tags, related topics, quick-add attachments
Global browsing
“All Blueprints” view with filters (type, tag, topic, modified, owner), saved views
Topic explorer: browse by topic graph; see all linked sections/items
Collections: list of curated sequences; drag-and-drop to reorder
Shortcuts to reduce depth pain
Breadcrumb with dropdowns at each segment (jump to siblings)
“Include sub-sections” toggle to flatten within a chapter
Omnibar (Cmd/Ctrl+K) finds sections by title, topic, or content
Practical rules of thumb
Keep depth shallow: stop at section; avoid subsection in the tree—use headings inside content if needed
Order explicitly: use orderIndex so names don’t need numbers
One canonical parent per Book node; everything else is a reference
Attach, don’t move: link items to sections; let them also live in global views
Use topics for cross-cuts, not more folders
Collections for teaching/study sequences, not more folders
Minimal schema sketch (conceptual)
node(id, parentId, type['book'|'part'|'chapter'|'section'], title, slug, orderIndex, tags[])
item(id, type['blueprint'|'note'|'questionSet'|'asset'], title, tags[], owner, modifiedAt)
node_item_map(nodeId, itemId, role['primary'|'supplementary'], orderIndex)
topic(id, name, parentId?)
node_topic_map(nodeId, topicId) and item_topic_map(itemId, topicId)
collection(id, title, description) and collection_item(collectionId, itemId, orderIndex)
Why this beats deep folders
Findability: TOC for sequence, Omnibar and Topic views for discovery
Flexibility: items can appear in multiple contexts without duplication
Scalability: shallow tree + tags/collections scale better than deep nesting
Clarity: clear separation of canonical structure (Book) and ad hoc views (Collections/Topics)
If useful, I can draft a quick ERD or a JSON example for one book with chapters, sections, and attached items.
Proposed a hybrid IA: canonical Book tree + many-to-many attachments + topics + collections.
Gave concrete UX: TOC navigation, inline linked items per section, global views, topic explorer.
Provided simple schema fields and rules to keep depth shallow and navigation effortless.


enum BookNodeType {
  PART
  CHAPTER
  SECTION
}

enum BlueprintStatus {
  DRAFT
  ACTIVE
  ARCHIVED
}

model Book {
  id          Int       @id @default(autoincrement())
  userId      Int
  title       String
  description String?
  slug        String    @unique
  tags        String[]  @default([])
  isPinned    Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  nodes  BookNode[]

  @@index([userId, title])
}

model BookNode {
  id         Int          @id @default(autoincrement())
  bookId     Int
  parentId   Int?
  type       BookNodeType
  title      String
  slug       String?
  orderIndex Int
  createdAt  DateTime     @default(now())
  updatedAt  DateTime     @updatedAt

  book     Book      @relation(fields: [bookId], references: [id], onDelete: Cascade)
  parent   BookNode? @relation("BookNodeHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children BookNode[] @relation("BookNodeHierarchy")

  // Attachments
  notes        BookNodeNote[]
  questionSets BookNodeQuestionSet[]
  blueprints   BookNodeBlueprint[]

  // Topics
  topics TopicBookNode[]

  @@index([bookId, parentId, orderIndex])
}

model BookNodeNote {
  bookNodeId Int
  noteId     Int
  role       String?   // "primary" | "supplementary"
  orderIndex Int       @default(0)

  bookNode BookNode @relation(fields: [bookNodeId], references: [id], onDelete: Cascade)
  note     Note     @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@id([bookNodeId, noteId])
}

model BookNodeQuestionSet {
  bookNodeId   Int
  questionSetId Int
  role         String?
  orderIndex   Int @default(0)

  bookNode    BookNode    @relation(fields: [bookNodeId], references: [id], onDelete: Cascade)
  questionSet QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)

  @@id([bookNodeId, questionSetId])
}

model BookNodeBlueprint {
  bookNodeId    Int
  blueprintId   Int
  role          String?
  orderIndex    Int @default(0)

  bookNode        BookNode         @relation(fields: [bookNodeId], references: [id], onDelete: Cascade)
  learningBlueprint LearningBlueprint @relation(fields: [blueprintId], references: [id], onDelete: Cascade)

  @@id([bookNodeId, blueprintId])
}

model Topic {
  id          Int       @id @default(autoincrement())
  userId      Int
  name        String
  slug        String?
  description String?
  parentId    Int?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user     User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  parent   Topic?  @relation("TopicHierarchy", fields: [parentId], references: [id], onDelete: SetNull)
  children Topic[] @relation("TopicHierarchy")

  notes        TopicNote[]
  questionSets TopicQuestionSet[]
  blueprints   TopicBlueprint[]
  bookNodes    TopicBookNode[]

  @@unique([userId, name])
  @@index([userId, parentId])
}

model TopicNote {
  topicId Int
  noteId  Int

  topic Topic @relation(fields: [topicId], references: [id], onDelete: Cascade)
  note  Note  @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@id([topicId, noteId])
}

model TopicQuestionSet {
  topicId       Int
  questionSetId Int

  topic       Topic       @relation(fields: [topicId], references: [id], onDelete: Cascade)
  questionSet QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)

  @@id([topicId, questionSetId])
}

model TopicBlueprint {
  topicId     Int
  blueprintId Int

  topic            Topic            @relation(fields: [topicId], references: [id], onDelete: Cascade)
  learningBlueprint LearningBlueprint @relation(fields: [blueprintId], references: [id], onDelete: Cascade)

  @@id([topicId, blueprintId])
}

model TopicBookNode {
  topicId    Int
  bookNodeId Int

  topic    Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  bookNode BookNode @relation(fields: [bookNodeId], references: [id], onDelete: Cascade)

  @@id([topicId, bookNodeId])
}

model Collection {
  id          Int      @id @default(autoincrement())
  userId      Int
  title       String
  description String?
  isPinned    Boolean  @default(false)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  notes        CollectionNote[]
  questionSets CollectionQuestionSet[]
  blueprints   CollectionBlueprint[]
  bookNodes    CollectionBookNode[]

  @@index([userId, title])
}

model CollectionNote {
  collectionId Int
  noteId       Int
  orderIndex   Int @default(0)

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  note       Note       @relation(fields: [noteId], references: [id], onDelete: Cascade)

  @@id([collectionId, noteId])
}

model CollectionQuestionSet {
  collectionId Int
  questionSetId Int
  orderIndex   Int @default(0)

  collection  Collection  @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  questionSet QuestionSet @relation(fields: [questionSetId], references: [id], onDelete: Cascade)

  @@id([collectionId, questionSetId])
}

model CollectionBlueprint {
  collectionId Int
  blueprintId  Int
  orderIndex   Int @default(0)

  collection       Collection       @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  learningBlueprint LearningBlueprint @relation(fields: [blueprintId], references: [id], onDelete: Cascade)

  @@id([collectionId, blueprintId])
}

model CollectionBookNode {
  collectionId Int
  bookNodeId   Int
  orderIndex   Int @default(0)

  collection Collection @relation(fields: [collectionId], references: [id], onDelete: Cascade)
  bookNode   BookNode   @relation(fields: [bookNodeId], references: [id], onDelete: Cascade)

  @@id([collectionId, bookNodeId])
}