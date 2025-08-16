#!/bin/bash

echo "🔧 Fixing import paths throughout the codebase..."

# Fix service imports
echo "📁 Fixing service imports..."

# Mastery services
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/masteryCriterion\.service'\''|from '\''\.\./services/mastery/masteryCriterion\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/enhancedSpacedRepetition\.service'\''|from '\''\.\./services/mastery/enhancedSpacedRepetition\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/masteryCalculation\.service'\''|from '\''\.\./services/mastery/masteryCalculation\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/enhancedTodaysTasks\.service'\''|from '\''\.\./services/mastery/enhancedTodaysTasks\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/enhancedBatchReview\.service'\''|from '\''\.\./services/mastery/enhancedBatchReview\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/masteryTracking\.service'\''|from '\''\.\./services/mastery/masteryTracking\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/masteryConfiguration\.service'\''|from '\''\.\./services/mastery/masteryConfiguration\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/masterySystemOrchestrator\.service'\''|from '\''\.\./services/mastery/masterySystemOrchestrator\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/uueStageProgression\.service'\''|from '\''\.\./services/mastery/uueStageProgression\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/primitiveSR\.service'\''|from '\''\.\./services/mastery/primitiveSR\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/todaysTasks\.service'\''|from '\''\.\./services/mastery/todaysTasks\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/questionInstance\.service'\''|from '\''\.\./services/mastery/questionInstance\.service'\''|g' {} \;

# AI services
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/aiBlueprintGenerator\.service'\''|from '\''\.\./services/ai/aiBlueprintGenerator\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/aiApiIntegration\.service'\''|from '\''\.\./services/ai/aiApiIntegration\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/ai-api-client\.service'\''|from '\''\.\./services/ai/ai-api-client\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/learningPathways\.service'\''|from '\''\.\./services/mastery/learningPathways\.service'\''|g' {} \;

# User services
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/userExperience\.service'\''|from '\''\.\./services/user/userExperience\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/userMemory\.service'\''|from '\''\.\./services/user/userMemory\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/payment\.service'\''|from '\''\.\./services/user/payment\.service'\''|g' {} \;

# Core services
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/dashboard\.service'\''|from '\''\.\./services/core/dashboard\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/errorHandling\.service'\''|from '\''\.\./services/core/errorHandling\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/monitoring\.service'\''|from '\''\.\./services/core/monitoring\.service'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/performanceOptimization\.service'\''|from '\''\.\./services/core/performanceOptimization\.service'\''|g' {} \;

# Legacy services
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./services/recursiveFolder\.service'\''|from '\''\.\./services/legacy/recursiveFolder\.service'\''|g' {} \;

echo "✅ Service imports fixed!"

# Fix controller imports
echo "📁 Fixing controller imports..."

# Mastery controllers
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/primitive\.controller'\''|from '\''\.\./controllers/mastery/primitive\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/review\.controller'\''|from '\''\.\./controllers/mastery/review\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/insightCatalyst\.controller'\''|from '\''\.\./controllers/mastery/insightCatalyst\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/primitiveSR\.controller'\''|from '\''\.\./controllers/mastery/primitiveSR\.controller'\''|g' {} \;

# AI controllers
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/ai\.controller'\''|from '\''\.\./controllers/ai/ai\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/aiBlueprintGenerator\.controller'\''|from '\''\.\./controllers/ai/aiBlueprintGenerator\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/chat\.controller'\''|from '\''\.\./controllers/ai/chat\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/primitiveAI\.controller'\''|from '\''\.\./controllers/ai/primitiveAI\.controller'\''|g' {} \;

# User controllers
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/auth\.controller'\''|from '\''\.\./controllers/user/auth\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/user\.controller'\''|from '\''\.\./controllers/user/user\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/payment\.controller'\''|from '\''\.\./controllers/user/payment\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/userMemory\.controller'\''|from '\''\.\./controllers/user/userMemory\.controller'\''|g' {} \;

# Legacy controllers
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/folder\.controller'\''|from '\''\.\./controllers/legacy/folder\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/questionset\.controller'\''|from '\''\.\./controllers/legacy/questionset\.controller'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./controllers/recursiveFolder\.controller'\''|from '\''\.\./controllers/legacy/recursiveFolder\.controller'\''|g' {} \;

echo "✅ Controller imports fixed!"

# Fix route imports
echo "📁 Fixing route imports..."

# Mastery routes
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/primitive\.routes'\''|from '\''\.\./routes/mastery/primitive\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/review\.routes'\''|from '\''\.\./routes/mastery/review\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/insightCatalyst\.routes'\''|from '\''\.\./routes/mastery/insightCatalyst\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/primitiveSR\.routes'\''|from '\''\.\./routes/mastery/primitiveSR\.routes'\''|g' {} \;

# AI routes
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/ai\.routes'\''|from '\''\.\./routes/ai/ai\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/aiBlueprintGenerator\.routes'\''|from '\''\.\./routes/ai/aiBlueprintGenerator\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/chat\.routes'\''|from '\''\.\./routes/ai/chat\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/primitiveAI\.routes'\''|from '\''\.\./routes/ai/primitiveAI\.routes'\''|g' {} \;

# User routes
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/auth'\''|from '\''\.\./routes/user/auth'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/user\.routes'\''|from '\''\.\./routes/user/user\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/payment\.routes'\''|from '\''\.\./routes/user/payment\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/userMemory\.routes'\''|from '\''\.\./routes/user/userMemory\.routes'\''|g' {} \;

# Legacy routes
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/folder\.routes'\''|from '\''\.\./routes/legacy/folder\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/questionset\.routes'\''|from '\''\.\./routes/legacy/questionset\.routes'\''|g' {} \;
find src/ -name "*.ts" -exec sed -i 's|from '\''\.\./routes/standalone-questionset\.routes'\''|from '\''\.\./routes/legacy/standalone-questionset\.routes'\''|g' {} \;

echo "✅ Route imports fixed!"

echo "🎉 All import paths have been updated!"
echo "📝 Note: You may need to run this script multiple times for nested imports"
echo "🔍 Next step: Try building the project to see if there are remaining issues"
