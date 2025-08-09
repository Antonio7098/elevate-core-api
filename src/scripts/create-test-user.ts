import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/auth';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export interface TestUserOptions {
  email?: string;
  bucketPrefs?: {
    criticalSize?: number;
    coreSize?: number;
    plusSize?: number;
    addMoreIncrement?: number;
    maxDailyLimit?: number;
    masteryThresholdLevel?: 'SURVEY' | 'PROFICIENT' | 'EXPERT';
  };
}

export async function createTestUser(options: TestUserOptions = {}): Promise<{ id: number; token: string }> {
  const { email = 'test@example.com', bucketPrefs = {} } = options;

  await prisma.$connect();

  console.log('🌱 Starting comprehensive test user creation...');

  // Clean previous test user for idempotence
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('🧹 Cleaning up previous test user...');
    await prisma.user.delete({ where: { id: existing.id } });
    console.log('✅ Previous test user deleted.');
  }

  // Create user
  console.log('👤 Creating test user...');
  const user = await prisma.user.create({
    data: {
      email,
      name: 'Test User',
      password: await bcrypt.hash('password123', 10),
      dailyStudyTimeMinutes: 30,
    },
  });
  console.log(`✅ User created: ${user.email} (ID: ${user.id})`);

  // Bucket preferences
  console.log('⚙️ Creating bucket preferences...');
  await prisma.userBucketPreferences.create({
    data: {
      userId: user.id,
      criticalSize: bucketPrefs.criticalSize ?? 10,
      coreSize: bucketPrefs.coreSize ?? 15,
      plusSize: bucketPrefs.plusSize ?? 5,
      addMoreIncrement: bucketPrefs.addMoreIncrement ?? 5,
      maxDailyLimit: bucketPrefs.maxDailyLimit ?? 50,
      masteryThresholdLevel: bucketPrefs.masteryThresholdLevel ?? 'PROFICIENT',
    },
  });
  console.log('✅ Bucket preferences created.');

  // User memory profile
  console.log('🧠 Creating user memory profile...');
  await prisma.userMemory.create({
    data: {
      userId: user.id,
      cognitiveApproach: 'ADAPTIVE',
      explanationStyles: ['ANALOGY_DRIVEN', 'PRACTICAL_EXAMPLES'],
      interactionStyle: 'SOCRATIC',
      primaryGoal: 'Master complex concepts through active learning',
    },
  });
  console.log('✅ User memory profile created.');

  // Folders hierarchy
  console.log('📁 Creating folder structure...');
  const scienceFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Science',
      description: 'Core scientific concepts and principles',
      imageUrls: ['https://placehold.co/600x400/a78bfa/FFFFFF?text=Science'],
      isPinned: true,
      masteryHistory: [],
    },
  });

  const physicsFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Physics',
      description: 'Classical and modern physics concepts',
      parentId: scienceFolder.id,
      imageUrls: ['https://placehold.co/600x400/ef4444/FFFFFF?text=Physics'],
      masteryHistory: [],
    },
  });

  const chemistryFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Chemistry',
      description: 'Chemical reactions and molecular interactions',
      parentId: scienceFolder.id,
      imageUrls: ['https://placehold.co/600x400/10b981/FFFFFF?text=Chemistry'],
      masteryHistory: [],
    },
  });

  const historyFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'History',
      description: 'Historical events and their significance',
      imageUrls: ['https://placehold.co/600x400/f59e0b/FFFFFF?text=History'],
      masteryHistory: [],
    },
  });

  const mathFolder = await prisma.folder.create({
    data: {
      userId: user.id,
      name: 'Mathematics',
      description: 'Mathematical concepts and problem-solving',
      imageUrls: ['https://placehold.co/600x400/3b82f6/FFFFFF?text=Mathematics'],
      masteryHistory: [],
    },
  });
  console.log('✅ Folder structure created.');

  // Comprehensive blueprints with question sets and notes
  console.log('📋 Creating comprehensive learning blueprints...');
  
  // Physics Blueprint 1: Newton's Laws
  const newtonBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "Newton's laws of motion are three fundamental principles that describe the relationship between forces and motion. The first law states that an object at rest stays at rest and an object in motion stays in motion unless acted upon by an unbalanced force. The second law states that force equals mass times acceleration (F=ma). The third law states that for every action, there is an equal and opposite reaction.",
      blueprintJson: {
        title: "Newton's Laws of Motion",
        sections: [
          { section_id: 's1', section_name: 'First Law (Inertia)', description: 'Objects resist changes in their motion' },
          { section_id: 's2', section_name: 'Second Law (F=ma)', description: 'Force is proportional to acceleration' },
          { section_id: 's3', section_name: 'Third Law (Action-Reaction)', description: 'Forces always occur in pairs' },
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            'Inertia is the tendency of objects to resist changes in motion',
            'Force equals mass times acceleration',
            'Action and reaction forces are equal and opposite'
          ],
          key_entities_and_definitions: [
            'Newton: Unit of force',
            'Inertia: Resistance to motion changes',
            'Acceleration: Rate of velocity change'
          ],
          described_processes_and_steps: [
            'How to calculate force using F=ma',
            'How to identify action-reaction pairs'
          ],
          identified_relationships: [
            'Mass and acceleration are inversely related for constant force',
            'Greater mass requires greater force for same acceleration'
          ],
          implicit_and_open_questions: [
            'How do Newton\'s laws apply to space travel?',
            'Why do seatbelts work based on Newton\'s laws?'
          ]
        }
      },
    },
  });

  // Physics Blueprint 2: Energy Conservation
  const energyBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "The law of conservation of energy states that energy cannot be created or destroyed, only transformed from one form to another. Kinetic energy is the energy of motion, calculated as KE = 1/2mv². Potential energy is stored energy due to position, such as gravitational potential energy (PE = mgh). In a closed system, the total mechanical energy (kinetic + potential) remains constant.",
      blueprintJson: {
        title: "Energy Conservation and Transformation",
        sections: [
          { section_id: 's1', section_name: 'Conservation of Energy', description: 'Energy cannot be created or destroyed' },
          { section_id: 's2', section_name: 'Kinetic Energy', description: 'Energy of motion' },
          { section_id: 's3', section_name: 'Potential Energy', description: 'Stored energy due to position' },
          { section_id: 's4', section_name: 'Energy Transformation', description: 'Converting between energy forms' },
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            'Energy is conserved in closed systems',
            'Kinetic energy = 1/2 × mass × velocity²',
            'Gravitational potential energy = mass × gravity × height'
          ],
          key_entities_and_definitions: [
            'Kinetic Energy: Energy of motion',
            'Potential Energy: Stored energy',
            'Mechanical Energy: Sum of kinetic and potential'
          ],
          described_processes_and_steps: [
            'How to calculate kinetic energy',
            'How to calculate gravitational potential energy',
            'How to analyze energy transformations'
          ],
          identified_relationships: [
            'Higher velocity means greater kinetic energy',
            'Higher position means greater potential energy'
          ],
          implicit_and_open_questions: [
            'How does friction affect energy conservation?',
            'What happens to energy in a pendulum?'
          ]
        }
      },
    },
  });

  // Chemistry Blueprint: Chemical Bonding
  const bondingBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "Chemical bonding is the attraction between atoms that allows the formation of chemical substances. Ionic bonds form when electrons are transferred between atoms, creating charged ions. Covalent bonds form when atoms share electrons. Metallic bonds involve a sea of delocalized electrons shared among many atoms. The type of bond affects the properties of the resulting compound.",
      blueprintJson: {
        title: "Chemical Bonding and Molecular Structure",
        sections: [
          { section_id: 's1', section_name: 'Ionic Bonding', description: 'Electron transfer between atoms' },
          { section_id: 's2', section_name: 'Covalent Bonding', description: 'Electron sharing between atoms' },
          { section_id: 's3', section_name: 'Metallic Bonding', description: 'Delocalized electrons in metals' },
          { section_id: 's4', section_name: 'Bond Properties', description: 'How bonding affects compound properties' },
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            'Ionic bonds form through electron transfer',
            'Covalent bonds form through electron sharing',
            'Metallic bonds involve delocalized electrons'
          ],
          key_entities_and_definitions: [
            'Ion: Charged atom or molecule',
            'Covalent Bond: Shared electron pair',
            'Metallic Bond: Delocalized electron sea'
          ],
          described_processes_and_steps: [
            'How to identify ionic vs covalent compounds',
            'How to predict bond type from electronegativity'
          ],
          identified_relationships: [
            'Ionic compounds have high melting points',
            'Covalent compounds can be gases, liquids, or solids'
          ],
          implicit_and_open_questions: [
            'Why do metals conduct electricity?',
            'How do hydrogen bonds differ from covalent bonds?'
          ]
        }
      },
    },
  });

  // History Blueprint: French Revolution
  const revolutionBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "The French Revolution (1789-1799) was a period of radical social and political upheaval in France. It began with the storming of the Bastille on July 14, 1789, and led to the overthrow of the monarchy and establishment of a republic. Key events included the Declaration of the Rights of Man and Citizen, the Reign of Terror, and the rise of Napoleon Bonaparte. The revolution had profound effects on European society and politics.",
      blueprintJson: {
        title: "The French Revolution and Its Impact",
        sections: [
          { section_id: 's1', section_name: 'Causes of Revolution', description: 'Social, economic, and political factors' },
          { section_id: 's2', section_name: 'Key Events', description: 'Bastille, Declaration of Rights, Reign of Terror' },
          { section_id: 's3', section_name: 'Napoleon\'s Rise', description: 'From general to emperor' },
          { section_id: 's4', section_name: 'Revolutionary Impact', description: 'Effects on Europe and the world' },
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            'The Bastille was stormed on July 14, 1789',
            'The Declaration of Rights established equality before law',
            'The Reign of Terror executed thousands of people'
          ],
          key_entities_and_definitions: [
            'Bastille: Paris prison symbolizing royal tyranny',
            'Reign of Terror: Period of mass executions',
            'Napoleon Bonaparte: Military leader who became emperor'
          ],
          described_processes_and_steps: [
            'How the Estates General led to revolution',
            'How the Committee of Public Safety operated'
          ],
          identified_relationships: [
            'Economic inequality led to social unrest',
            'Revolutionary ideals spread across Europe'
          ],
          implicit_and_open_questions: [
            'How did the revolution affect women\'s rights?',
            'Why did the revolution become so violent?'
          ]
        }
      },
    },
  });

  // Math Blueprint: Calculus Fundamentals
  const calculusBlueprint = await prisma.learningBlueprint.create({
    data: {
      userId: user.id,
      sourceText: "Calculus is the mathematical study of continuous change. Derivatives measure instantaneous rates of change, while integrals measure accumulation. The fundamental theorem of calculus connects these two operations. Limits are the foundation of calculus, allowing us to analyze behavior as values approach specific points. Calculus has applications in physics, engineering, economics, and many other fields.",
      blueprintJson: {
        title: "Calculus Fundamentals and Applications",
        sections: [
          { section_id: 's1', section_name: 'Limits and Continuity', description: 'Foundation of calculus' },
          { section_id: 's2', section_name: 'Derivatives', description: 'Rates of change' },
          { section_id: 's3', section_name: 'Integrals', description: 'Accumulation and area' },
          { section_id: 's4', section_name: 'Fundamental Theorem', description: 'Connection between derivatives and integrals' },
        ],
        knowledge_primitives: {
          key_propositions_and_facts: [
            'Derivatives measure instantaneous rates of change',
            'Integrals measure accumulation over intervals',
            'The fundamental theorem connects derivatives and integrals'
          ],
          key_entities_and_definitions: [
            'Limit: Value approached as input gets closer',
            'Derivative: Rate of change of a function',
            'Integral: Accumulation of a function'
          ],
          described_processes_and_steps: [
            'How to find derivatives using power rule',
            'How to evaluate definite integrals',
            'How to apply the chain rule'
          ],
          identified_relationships: [
            'Derivative of position is velocity',
            'Integral of velocity is position'
          ],
          implicit_and_open_questions: [
            'How does calculus apply to optimization?',
            'What is the relationship between calculus and physics?'
          ]
        }
      },
    },
  });

  console.log('✅ Comprehensive blueprints created.');

  // Create question sets for each blueprint
  console.log('📚 Creating question sets for blueprints...');

  // Question Set 1: Newton's Laws
  const newtonQuestionSet = await prisma.questionSet.create({
    data: {
      title: "Newton's Laws Assessment",
      userId: user.id,
      folderId: physicsFolder.id,
      isTracked: true,
      questions: {
        create: [
          {
            questionText: "What is Newton's First Law of Motion?",
            answerText: "An object at rest stays at rest, and an object in motion stays in motion unless acted upon by an unbalanced force.",
            marksAvailable: 2,
          },
          {
            questionText: "Calculate the force needed to accelerate a 5kg mass at 3 m/s².",
            answerText: "15 N (using F = ma = 5kg × 3 m/s²)",
            marksAvailable: 3,
          },
          {
            questionText: "Explain how Newton's Third Law applies to rocket propulsion.",
            answerText: "The rocket expels gas backward (action), and the gas exerts an equal and opposite force on the rocket (reaction), propelling it forward.",
            marksAvailable: 4,
          },
          {
            questionText: "Why do seatbelts work based on Newton's laws?",
            answerText: "Seatbelts prevent passengers from continuing their forward motion (inertia) when the car suddenly stops, keeping them in place.",
            marksAvailable: 3,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Question Set 2: Energy Conservation
  const energyQuestionSet = await prisma.questionSet.create({
    data: {
      title: "Energy Conservation Problems",
      userId: user.id,
      folderId: physicsFolder.id,
      isTracked: true,
      questions: {
        create: [
          {
            questionText: "Calculate the kinetic energy of a 2kg object moving at 4 m/s.",
            answerText: "16 J (KE = 1/2 × 2kg × (4 m/s)² = 16 J)",
            marksAvailable: 3,
          },
          {
            questionText: "A 10kg object falls from a height of 5m. Calculate its gravitational potential energy at the top.",
            answerText: "490 J (PE = mgh = 10kg × 9.8 m/s² × 5m = 490 J)",
            marksAvailable: 3,
          },
          {
            questionText: "Explain energy conservation in a swinging pendulum.",
            answerText: "At the top, the pendulum has maximum potential energy and minimum kinetic energy. At the bottom, it has maximum kinetic energy and minimum potential energy. The total mechanical energy remains constant.",
            marksAvailable: 4,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Question Set 3: Chemical Bonding
  const bondingQuestionSet = await prisma.questionSet.create({
    data: {
      title: "Chemical Bonding Concepts",
      userId: user.id,
      folderId: chemistryFolder.id,
      isTracked: true,
      questions: {
        create: [
          {
            questionText: "What is the difference between ionic and covalent bonds?",
            answerText: "Ionic bonds form through electron transfer between atoms, creating charged ions. Covalent bonds form through electron sharing between atoms.",
            marksAvailable: 3,
          },
          {
            questionText: "Why do ionic compounds have high melting points?",
            answerText: "Ionic compounds have high melting points because strong electrostatic forces between oppositely charged ions require significant energy to overcome.",
            marksAvailable: 2,
          },
          {
            questionText: "Explain why metals conduct electricity.",
            answerText: "Metals conduct electricity because they have delocalized electrons that can move freely throughout the metallic lattice, carrying electrical charge.",
            marksAvailable: 3,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Question Set 4: French Revolution
  const revolutionQuestionSet = await prisma.questionSet.create({
    data: {
      title: "French Revolution Timeline",
      userId: user.id,
      folderId: historyFolder.id,
      isTracked: true,
      questions: {
        create: [
          {
            questionText: "What was the significance of the storming of the Bastille?",
            answerText: "The storming of the Bastille on July 14, 1789, symbolized the people's revolt against royal tyranny and marked the beginning of the French Revolution.",
            marksAvailable: 3,
          },
          {
            questionText: "What were the main causes of the French Revolution?",
            answerText: "The main causes included social inequality, economic hardship, Enlightenment ideas, and the financial crisis of the monarchy.",
            marksAvailable: 4,
          },
          {
            questionText: "How did Napoleon Bonaparte rise to power?",
            answerText: "Napoleon rose to power through his military successes, political maneuvering, and the chaos following the Reign of Terror, eventually declaring himself emperor.",
            marksAvailable: 3,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Question Set 5: Calculus
  const calculusQuestionSet = await prisma.questionSet.create({
    data: {
      title: "Calculus Fundamentals",
      userId: user.id,
      folderId: mathFolder.id,
      isTracked: true,
      questions: {
        create: [
          {
            questionText: "Find the derivative of f(x) = x³ + 2x² - 5x + 3.",
            answerText: "f'(x) = 3x² + 4x - 5 (using power rule for each term)",
            marksAvailable: 3,
          },
          {
            questionText: "What is the relationship between derivatives and velocity?",
            answerText: "The derivative of position with respect to time is velocity. If s(t) is position, then v(t) = s'(t) is velocity.",
            marksAvailable: 2,
          },
          {
            questionText: "Explain the fundamental theorem of calculus.",
            answerText: "The fundamental theorem states that the definite integral of a function's derivative over an interval equals the difference in the function's values at the endpoints.",
            marksAvailable: 4,
          },
        ],
      },
    },
    include: { questions: true },
  });

  // Update marks available for all question sets
  const updateMarksForSet = async (set: any) => {
    const total = set.questions.reduce((sum: number, q: any) => sum + (q.marksAvailable || 0), 0);
    await prisma.questionSet.update({ where: { id: set.id }, data: { marksAvailable: total } });
  };
  
  await updateMarksForSet(newtonQuestionSet);
  await updateMarksForSet(energyQuestionSet);
  await updateMarksForSet(bondingQuestionSet);
  await updateMarksForSet(revolutionQuestionSet);
  await updateMarksForSet(calculusQuestionSet);
  console.log('✅ Question sets created.');

  // Create notes for each blueprint
  console.log('📝 Creating comprehensive notes...');

  // Note 1: Newton's Laws
  const newtonNote = await prisma.note.create({
    data: {
      userId: user.id,
      folderId: physicsFolder.id,
      generatedFromBlueprintId: newtonBlueprint.id,
      title: 'Newton\'s Laws: Real-World Applications',
      content: `## Newton's Laws in Everyday Life

### First Law (Inertia)
- **Car Safety**: Seatbelts prevent passengers from continuing forward motion when the car stops
- **Space Travel**: Objects in space continue moving until acted upon by forces
- **Sports**: A soccer ball stays in motion until friction or air resistance slows it

### Second Law (F=ma)
- **Rocket Launch**: More fuel (mass) requires more thrust (force) for the same acceleration
- **Car Performance**: Lighter cars accelerate faster with the same engine power
- **Sports Equipment**: Heavier bats require more force to swing at the same speed

### Third Law (Action-Reaction)
- **Walking**: Your foot pushes backward on the ground, the ground pushes you forward
- **Swimming**: You push water backward, water pushes you forward
- **Rocket Propulsion**: Gas expelled backward pushes rocket forward

### Key Formulas
- Force = mass × acceleration (F = ma)
- Weight = mass × gravity (W = mg)
- Momentum = mass × velocity (p = mv)

### Common Misconceptions
- Objects don't "run out of force" - they're acted upon by opposing forces
- Heavier objects don't fall faster (in vacuum)
- Action-reaction pairs act on different objects`,
      imageUrls: [],
    },
  });

  // Note 2: Energy Conservation
  const energyNote = await prisma.note.create({
    data: {
      userId: user.id,
      folderId: physicsFolder.id,
      generatedFromBlueprintId: energyBlueprint.id,
      title: 'Energy Transformations and Conservation',
      content: `## Energy Conservation in Systems

### Types of Energy
1. **Kinetic Energy (KE)**: Energy of motion
   - Formula: KE = 1/2 × mass × velocity²
   - Units: Joules (J)

2. **Potential Energy (PE)**: Stored energy
   - Gravitational PE = mass × gravity × height
   - Elastic PE = 1/2 × spring constant × displacement²

### Energy Conservation Examples

#### Pendulum Motion
- At highest point: Maximum PE, minimum KE
- At lowest point: Maximum KE, minimum PE
- Total mechanical energy remains constant

#### Roller Coaster
- Top of hill: High PE, low KE
- Bottom of hill: High KE, low PE
- Friction converts some energy to heat

#### Bouncing Ball
- Each bounce loses some energy to air resistance
- Eventually stops due to energy dissipation

### Real-World Applications
- **Hydroelectric Power**: Converts gravitational PE to electrical energy
- **Wind Turbines**: Convert kinetic energy of air to electrical energy
- **Solar Panels**: Convert light energy to electrical energy

### Energy Efficiency
- No system is 100% efficient
- Some energy always converts to heat
- Efficiency = useful energy output / total energy input`,
      imageUrls: [],
    },
  });

  // Note 3: Chemical Bonding
  const bondingNote = await prisma.note.create({
    data: {
      userId: user.id,
      folderId: chemistryFolder.id,
      generatedFromBlueprintId: bondingBlueprint.id,
      title: 'Chemical Bonding: Types and Properties',
      content: `## Understanding Chemical Bonds

### Ionic Bonds
**Formation**: Electron transfer between metal and nonmetal
**Properties**:
- High melting and boiling points
- Conduct electricity when dissolved or molten
- Brittle crystalline structure
- Soluble in water

**Examples**: NaCl (table salt), CaO (lime)

### Covalent Bonds
**Formation**: Electron sharing between nonmetals
**Properties**:
- Lower melting points than ionic compounds
- Poor electrical conductivity
- Can be gases, liquids, or solids
- Variable solubility

**Examples**: H₂O (water), CO₂ (carbon dioxide)

### Metallic Bonds
**Formation**: Delocalized electrons shared among metal atoms
**Properties**:
- Excellent electrical conductivity
- Malleable and ductile
- High thermal conductivity
- Metallic luster

**Examples**: Copper, iron, aluminum

### Bond Strength Factors
1. **Electronegativity Difference**: Greater difference = more ionic character
2. **Atomic Size**: Smaller atoms form stronger bonds
3. **Number of Bonds**: Multiple bonds are stronger than single bonds

### Predicting Bond Type
- **Ionic**: Electronegativity difference > 1.7
- **Polar Covalent**: Electronegativity difference 0.4-1.7
- **Nonpolar Covalent**: Electronegativity difference < 0.4`,
      imageUrls: [],
    },
  });

  // Note 4: French Revolution
  const revolutionNote = await prisma.note.create({
    data: {
      userId: user.id,
      folderId: historyFolder.id,
      generatedFromBlueprintId: revolutionBlueprint.id,
      title: 'The French Revolution: Causes and Consequences',
      content: `## The French Revolution (1789-1799)

### Pre-Revolutionary France
**Social Structure**:
- First Estate: Clergy (0.5% of population)
- Second Estate: Nobility (1.5% of population)
- Third Estate: Everyone else (98% of population)

**Economic Problems**:
- Heavy taxation on the Third Estate
- Food shortages and high bread prices
- Government debt from wars
- Inefficient tax collection

### Key Events Timeline

**1789**:
- May: Estates General convenes
- June: Third Estate declares National Assembly
- July 14: Storming of the Bastille
- August: Declaration of the Rights of Man

**1792-1794**:
- 1792: France declares war on Austria
- 1793: Reign of Terror begins
- 1794: Robespierre executed

**1799**:
- Napoleon stages coup d'état
- Establishes Consulate

### Revolutionary Ideas
1. **Liberty**: Freedom from oppression
2. **Equality**: Equal rights before law
3. **Fraternity**: Brotherhood of citizens

### Impact on Europe
- Spread of revolutionary ideals
- Napoleonic Wars (1803-1815)
- Rise of nationalism
- End of absolute monarchy in many countries

### Long-term Consequences
- Modern citizenship concepts
- Metric system adoption
- Secular education
- Modern military organization`,
      imageUrls: [],
    },
  });

  // Note 5: Calculus
  const calculusNote = await prisma.note.create({
    data: {
      userId: user.id,
      folderId: mathFolder.id,
      generatedFromBlueprintId: calculusBlueprint.id,
      title: 'Calculus: The Mathematics of Change',
      content: `## Understanding Calculus

### What is Calculus?
Calculus is the mathematical study of continuous change. It has two main branches:
- **Differential Calculus**: Studies rates of change
- **Integral Calculus**: Studies accumulation

### Derivatives (Rates of Change)

**Definition**: The derivative measures how fast a function changes
**Notation**: f'(x) or dy/dx

**Common Derivatives**:
- Power Rule: d/dx(xⁿ) = nxⁿ⁻¹
- Constant Rule: d/dx(c) = 0
- Sum Rule: d/dx(f + g) = f' + g'
- Chain Rule: d/dx(f(g(x))) = f'(g(x)) × g'(x)

**Applications**:
- Velocity is the derivative of position
- Acceleration is the derivative of velocity
- Marginal cost is the derivative of total cost

### Integrals (Accumulation)

**Definition**: The integral measures accumulation over an interval
**Notation**: ∫f(x)dx

**Types**:
- **Indefinite Integral**: ∫f(x)dx = F(x) + C
- **Definite Integral**: ∫ₐᵇf(x)dx = F(b) - F(a)

**Applications**:
- Area under a curve
- Distance traveled (integral of velocity)
- Total cost (integral of marginal cost)

### Fundamental Theorem of Calculus
Connects derivatives and integrals:
∫ₐᵇf'(x)dx = f(b) - f(a)

### Real-World Applications
- **Physics**: Motion, forces, energy
- **Economics**: Marginal analysis, optimization
- **Engineering**: Design, optimization
- **Biology**: Population growth, drug concentration`,
      imageUrls: [],
    },
  });

  console.log('✅ Comprehensive notes created.');

  // Create insight catalysts for the notes
  console.log('💡 Creating insight catalysts...');
  
  await prisma.insightCatalyst.create({
    data: {
      userId: user.id,
      noteId: newtonNote.id,
      title: 'Car Crash Analogy',
      content: 'Think of Newton\'s laws like a car crash: the car stops suddenly (external force), but passengers continue forward (inertia) until seatbelts apply the stopping force.',
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      userId: user.id,
      noteId: energyNote.id,
      title: 'Bank Account Analogy',
      content: 'Energy conservation is like a bank account: you can transfer money between savings (potential) and checking (kinetic), but the total balance stays the same unless you spend it (friction).',
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      userId: user.id,
      noteId: bondingNote.id,
      title: 'Dating Analogy',
      content: 'Chemical bonding is like dating: ionic bonds are like a one-sided relationship (electron transfer), covalent bonds are like sharing everything equally, and metallic bonds are like a party where everyone shares the music.',
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      userId: user.id,
      noteId: revolutionNote.id,
      title: 'Pressure Cooker Analogy',
      content: 'The French Revolution was like a pressure cooker: social inequality, economic hardship, and Enlightenment ideas built up pressure until the lid blew off with the storming of the Bastille.',
    },
  });

  await prisma.insightCatalyst.create({
    data: {
      userId: user.id,
      noteId: calculusNote.id,
      title: 'Speedometer Analogy',
      content: 'Derivatives are like a speedometer: they tell you how fast you\'re changing at any moment. Integrals are like an odometer: they tell you how far you\'ve traveled over time.',
    },
  });

  console.log('✅ Insight catalysts created.');

  // Create knowledge primitives for each blueprint
  console.log('🧠 Creating knowledge primitives...');
  
  const createPrimitiveForBlueprint = async (blueprint: any, folder: any, title: string) => {
    const primitiveId = `bp_${blueprint.id}`;
    const kp = await prisma.knowledgePrimitive.upsert({
      where: { primitiveId },
      create: {
        primitiveId,
        title,
        userId: user.id,
        blueprintId: blueprint.id,
        primitiveType: 'concept',
        difficultyLevel: 'intermediate',
        conceptTags: [folder.name.toLowerCase()],
        complexityScore: 7.0,
        isCoreConcept: true,
      },
      update: {},
    });

    // Initial progress
    await prisma.userPrimitiveProgress.upsert({
      where: {
        userId_primitiveId_blueprintId: {
          userId: user.id,
          primitiveId: kp.primitiveId,
          blueprintId: kp.blueprintId,
        },
      },
      create: {
        userId: user.id,
        primitiveId: kp.primitiveId,
        blueprintId: kp.blueprintId,
        masteryLevel: 'UNDERSTAND',
        trackingIntensity: 'NORMAL',
        nextReviewAt: new Date(),
      },
      update: {},
    });

    return kp;
  };

  const newtonPrimitive = await createPrimitiveForBlueprint(newtonBlueprint, physicsFolder, "Newton's Laws of Motion");
  const energyPrimitive = await createPrimitiveForBlueprint(energyBlueprint, physicsFolder, "Energy Conservation");
  const bondingPrimitive = await createPrimitiveForBlueprint(bondingBlueprint, chemistryFolder, "Chemical Bonding");
  const revolutionPrimitive = await createPrimitiveForBlueprint(revolutionBlueprint, historyFolder, "French Revolution");
  const calculusPrimitive = await createPrimitiveForBlueprint(calculusBlueprint, mathFolder, "Calculus Fundamentals");

  console.log('✅ Knowledge primitives created.');

  // Create study sessions and answers for question sets
  console.log('📊 Creating study sessions and mastery history...');
  
  const createStudySessions = async (questionSet: any, primitive: any) => {
    const now = new Date();
    const daysAgo = (n: number) => new Date(now.getTime() - n * 24 * 60 * 60 * 1000);

    const sessions = [
      { when: daysAgo(7), correctRatio: 0.6 },
      { when: daysAgo(4), correctRatio: 0.8 },
      { when: daysAgo(1), correctRatio: 0.9 },
    ];

    for (const s of sessions) {
      const totalQ = questionSet.questions.length;
      const correct = Math.round(totalQ * s.correctRatio);
      const totalMarks = questionSet.questions.reduce((sum: number, q: any) => sum + (q.marksAvailable || 0), 0);
      const marksAwarded = Math.round(totalMarks * s.correctRatio);

      await prisma.questionSetStudySession.create({
        data: {
          userId: user.id,
          questionSetId: questionSet.id,
          startedAt: new Date(s.when.getTime() - 30 * 60 * 1000),
          completedAt: s.when,
          totalQuestions: totalQ,
          correctAnswers: correct,
          totalMarks: totalMarks,
          marksAwarded: marksAwarded,
          difficultyLevel: 'intermediate',
          masteryScore: marksAwarded / (totalMarks || 1),
          timeSpentMinutes: 45,
        },
      });

      // Record answers for each question
      for (let i = 0; i < questionSet.questions.length; i++) {
        const q = questionSet.questions[i];
        const isCorrect = i < correct;
        await prisma.userQuestionAnswer.create({
          data: {
            userId: user.id,
            questionSetId: questionSet.id,
            questionId: q.id,
            primitiveId: primitive.primitiveId,
            userAnswer: isCorrect ? (q.answerText || 'correct') : 'incorrect',
            isCorrect: isCorrect,
            marksAwarded: isCorrect ? q.marksAvailable : 0,
          },
        });
      }
    }
  };

  await createStudySessions(newtonQuestionSet, newtonPrimitive);
  await createStudySessions(energyQuestionSet, energyPrimitive);
  await createStudySessions(bondingQuestionSet, bondingPrimitive);
  await createStudySessions(revolutionQuestionSet, revolutionPrimitive);
  await createStudySessions(calculusQuestionSet, calculusPrimitive);

  console.log('✅ Study sessions and mastery history created.');

  // Create daily summaries for primitives
  console.log('📈 Creating daily summaries...');
  
  const createDailySummary = async (primitive: any, questionSet: any) => {
    await prisma.userPrimitiveDailySummary.upsert({
      where: { userId_primitiveId: { userId: user.id, primitiveId: primitive.primitiveId } },
      create: {
        userId: user.id,
        primitiveId: primitive.primitiveId,
        primitiveTitle: primitive.title,
        masteryLevel: 'UNDERSTAND',
        nextReviewAt: new Date(),
        totalCriteria: questionSet.questions.length,
        masteredCriteria: Math.floor(questionSet.questions.length * 0.8),
        weightedMasteryScore: 0.8,
        canProgressToNext: true,
      },
      update: {
        weightedMasteryScore: 0.8,
        canProgressToNext: true,
        lastCalculated: new Date(),
      },
    });
  };

  await createDailySummary(newtonPrimitive, newtonQuestionSet);
  await createDailySummary(energyPrimitive, energyQuestionSet);
  await createDailySummary(bondingPrimitive, bondingQuestionSet);
  await createDailySummary(revolutionPrimitive, revolutionQuestionSet);
  await createDailySummary(calculusPrimitive, calculusQuestionSet);

  console.log('✅ Daily summaries created.');

  // Create pinned and scheduled reviews
  console.log('📌 Creating pinned and scheduled reviews...');
  
  await prisma.pinnedReview.create({
    data: {
      userId: user.id,
      primitiveId: newtonPrimitive.primitiveId,
      reviewAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    },
  });

  await prisma.scheduledReview.create({
    data: {
      userId: user.id,
      questionSetId: newtonQuestionSet.id,
      primitiveId: newtonPrimitive.primitiveId,
      scheduledFor: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // Day after tomorrow
      completed: false,
    },
  });

  console.log('✅ Pinned and scheduled reviews created.');

  // Create premium features data
  console.log('⭐ Creating premium features data...');
  
  await prisma.userLearningAnalytics.create({
    data: {
      userId: user.id,
      date: new Date(),
      totalStudyTimeMinutes: 120,
      conceptsReviewed: 5,
      conceptsMastered: 3,
      averageMasteryScore: 0.8,
      learningEfficiency: 0.85,
      focusAreas: ['physics', 'chemistry', 'history', 'mathematics'],
      achievements: ['Completed 5 blueprints', 'Mastered Newton\'s Laws', 'Created comprehensive notes'],
    },
  });

  await prisma.userMemoryInsight.create({
    data: {
      userId: user.id,
      insightType: 'LEARNING_PATTERN',
      title: 'Strong Conceptual Learner',
      content: 'You perform best when concepts are explained with real-world analogies and practical examples.',
      relatedPrimitiveIds: [newtonPrimitive.primitiveId, energyPrimitive.primitiveId],
      confidenceScore: 0.9,
      isActionable: true,
    },
  });

  await prisma.learningPath.create({
    data: {
      userId: user.id,
      pathName: 'Physics Fundamentals',
      description: 'Complete understanding of classical mechanics and energy concepts',
      targetMasteryLevel: 'EXPLORE',
      estimatedDurationDays: 45,
      isActive: true,
      pathSteps: {
        create: [
          {
            primitiveId: newtonPrimitive.primitiveId,
            stepOrder: 1,
            isCompleted: true,
            completedAt: new Date(),
            estimatedTimeMinutes: 90,
          },
          {
            primitiveId: energyPrimitive.primitiveId,
            stepOrder: 2,
            isCompleted: false,
            estimatedTimeMinutes: 75,
          },
        ],
      },
    },
  });

  console.log('✅ Premium features data created.');

  const token = generateToken(user);
  await prisma.$disconnect();
  
  console.log('\n🎉 Comprehensive test user creation complete!');
  console.log('📧 Email: test@example.com');
  console.log('🔑 Password: password123');
  console.log('👤 User ID:', user.id);
  console.log('🔑 Token:', token);
  console.log('\n📊 Created Content Summary:');
  console.log('📁 Folders: 5 (Science, Physics, Chemistry, History, Mathematics)');
  console.log('📋 Blueprints: 5 comprehensive learning blueprints');
  console.log('📚 Question Sets: 5 with 16 total questions');
  console.log('📝 Notes: 5 detailed notes with real-world applications');
  console.log('💡 Insight Catalysts: 5 analogies and memory aids');
  console.log('🧠 Knowledge Primitives: 5 with progress tracking');
  console.log('📊 Study Sessions: 15 sessions with mastery history');
  console.log('⭐ Premium Features: Analytics, insights, and learning paths');
  
  return { id: user.id, token };
}

// --- CLI entry point ---
if (require.main === module) {
  (async () => {
    try {
      const { id, token } = await createTestUser();
      console.log(JSON.stringify({ id, token }));
      process.exit(0);
    } catch (err) {
      console.error('Failed to create test user:', err instanceof Error ? err.message : err);
      process.exit(1);
    }
  })();
}