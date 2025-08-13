# Blueprint-Centric Migration

## 🆕 DATA MIGRATION - TRANSFORMS LEGACY FOLDER/QUESTION SET DATA

This directory contains the **migration scripts** that transform existing data from the old folder/question set system to the new blueprint-centric architecture.

## 🔄 Migration Overview

### What Gets Migrated
1. **Folders** → **BlueprintSections** (with hierarchy preserved)
2. **Notes** → **NoteSections** (linked to appropriate sections)
3. **QuestionSets** → **MasteryCriteria** (eliminating QuestionFamily layer)
4. **Questions** → **QuestionInstances** (linked to mastery criteria)
5. **KnowledgePrimitives** → Updated with section references

### What Gets Eliminated
- **QuestionFamily** model (merged into MasteryCriterion)
- Complex folder-question set relationships
- Redundant data structures

## 📋 Migration Steps

### Step 1: Create Blueprints
- Root folders become LearningBlueprints
- Preserves folder names and descriptions
- Maintains user ownership

### Step 2: Create Sections
- All folders become BlueprintSections
- Hierarchy and depth calculated automatically
- Order indices assigned sequentially

### Step 3: Migrate Notes
- Notes linked to appropriate sections
- Content and metadata preserved
- Version history maintained

### Step 4: Migrate Question Sets
- QuestionSets become MasteryCriteria
- Default UUE stage: UNDERSTAND
- Weight and assessment type preserved

### Step 5: Migrate Questions
- Questions become QuestionInstances
- Linked directly to MasteryCriteria
- Difficulty levels mapped appropriately

### Step 6: Update Knowledge Primitives
- Section references added where possible
- Maintains existing relationships
- Preserves complexity scores

## 🚀 Running the Migration

### Prerequisites
- New schema deployed (`schema-blueprint-centric.prisma`)
- Database backup completed
- Legacy system in maintenance mode

### Execution
```bash
# Run migration
npm run migrate:blueprint-centric

# Or run directly
npx ts-node src/migrations/blueprint-centric/blueprint-centric-migration.ts
```

### Rollback
```typescript
const migration = new BlueprintCentricMigration();
await migration.rollbackMigration();
```

## 📊 Migration Statistics

The migration script provides detailed statistics:
- **Blueprints Created**: Number of root folders converted
- **Sections Created**: Total sections in new hierarchy
- **Notes Migrated**: Notes successfully moved to sections
- **Questions Migrated**: Questions converted to instances
- **Errors**: Any migration failures with details

## ⚠️ Important Considerations

### Data Integrity
- **Backup First**: Always backup before migration
- **Test Environment**: Test migration on copy of production data
- **Validation**: Run validation scripts after migration

### Performance
- **Batch Processing**: Large datasets processed in batches
- **Transaction Safety**: Each step wrapped in transactions
- **Rollback Capability**: Full rollback support for testing

### Compatibility
- **Legacy Data Preserved**: Old data remains during transition
- **Gradual Migration**: Can migrate users incrementally
- **Hybrid Mode**: System can run both old and new simultaneously

## 🧪 Testing Migration

### Pre-Migration Tests
- Schema validation
- Data integrity checks
- Performance benchmarks

### Migration Tests
- Small dataset migration
- Error scenario testing
- Rollback verification

### Post-Migration Tests
- Data completeness verification
- Performance validation
- User acceptance testing

## 🔧 Customization

### Migration Rules
- Difficulty mapping logic
- UUE stage assignment
- Weight calculation

### Data Transformations
- Content format conversion
- Metadata enhancement
- Relationship rebuilding

## 📚 Related Files

- `schema-blueprint-centric.prisma` - New database schema
- `blueprint-centric-migration.ts` - Main migration script
- `docs/sprints/s50-blueprint-centric-overhaul-phase1.md` - Sprint details

## 🚀 Post-Migration Steps

1. **Verify Data**: Run validation scripts
2. **Update Services**: Modify existing services to use new models
3. **Test Functionality**: Ensure all features work with new system
4. **Remove Legacy**: Clean up old models and services
5. **Monitor Performance**: Watch for any performance issues

---

**Last Updated**: Sprint 50 Implementation
**Status**: ✅ Migration Script Complete - Ready for Data Transformation
