import { DifficultyTier, Question } from '../types';

// Helper utilities for random generation
function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function simplifyFraction(num: number, den: number): string {
  if (den === 0) return 'undefined';
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  if (d === 1) return `${n}`;
  return `${n}/${d}`;
}

function getTier(difficulty: number): DifficultyTier {
  if (difficulty < 350) return 'Novice';
  if (difficulty < 550) return 'Intermediate';
  if (difficulty < 700) return 'Proficient';
  if (difficulty < 850) return 'Advanced';
  return 'Master';
}

function createQuestion(params: {
  subjectId: string;
  topicId: string;
  topicName: string;
  difficulty: number;
  text: string;
  codeSnippet?: string;
  correctAnswer: string;
  distractors: string[];
  explanation: string;
  hint: string;
  tags: string[];
}): Question {
  const allChoices = [params.correctAnswer, ...params.distractors.slice(0, 3)];
  // Remove duplicate values if any
  const uniqueChoices = Array.from(new Set(allChoices));
  while (uniqueChoices.length < 4) {
    uniqueChoices.push(`Option ${uniqueChoices.length + 1}`);
  }
  const shuffled = shuffle(uniqueChoices.slice(0, 4));
  const optionIds = ['a', 'b', 'c', 'd'];
  const options = shuffled.map((text, idx) => ({
    id: optionIds[idx],
    text,
  }));
  const correctOption = options.find((o) => o.text === params.correctAnswer) || options[0];

  return {
    id: `gen_${params.topicId}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    subjectId: params.subjectId,
    topicId: params.topicId,
    topicName: params.topicName,
    difficulty: params.difficulty,
    difficultyTier: getTier(params.difficulty),
    text: params.text,
    codeSnippet: params.codeSnippet,
    options,
    correctOptionId: correctOption.id,
    explanation: params.explanation,
    hint: params.hint,
    discrimination: 1.2 + Math.random() * 0.8,
    author: 'Psychometric Procedural Engine',
    isAiGenerated: true,
    tags: params.tags,
  };
}

// -------------------------------------------------------------
// TOPIC GENERATORS
// -------------------------------------------------------------

// 1. Math: Fractions & Ratios
function generateFractionsQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: Add fractions with same denominator
  {
    const d = randChoice([4, 5, 6, 8, 10]);
    const a = randInt(1, d - 2);
    const b = randInt(1, d - a);
    const sum = a + b;
    const correct = simplifyFraction(sum, d);
    const dist1 = simplifyFraction(a + b, d * 2);
    const dist2 = simplifyFraction(Math.max(1, a - b), d);
    const dist3 = simplifyFraction(sum + 1, d);
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_fractions',
        topicName: 'Fractions & Ratios',
        difficulty: randInt(180, 290),
        text: `Compute the sum of ${a}/${d} and ${b}/${d} in simplest fractional form.`,
        correctAnswer: correct,
        distractors: [dist1, dist2, dist3],
        explanation: `With equal denominators, add the numerators directly: ${a} + ${b} = ${sum}, resulting in ${sum}/${d}. Reduced to lowest terms, this simplifies to ${correct}.`,
        hint: 'Keep the common denominator and sum the numerators.',
        tags: ['Fractions', 'Addition', 'Reduction'],
      })
    );
  }

  // Intermediate: Multiply unequal fractions
  {
    const n1 = randChoice([2, 3, 4]);
    const d1 = randChoice([5, 7, 9]);
    const n2 = randChoice([3, 5]);
    const d2 = randChoice([4, 6, 8]);
    const correct = simplifyFraction(n1 * n2, d1 * d2);
    const dist1 = simplifyFraction(n1 + n2, d1 + d2);
    const dist2 = simplifyFraction(n1 * d2, d1 * n2);
    const dist3 = simplifyFraction(n1 * n2, d1 + d2);
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_fractions',
        topicName: 'Fractions & Ratios',
        difficulty: randInt(410, 520),
        text: `Evaluate the product: (${n1}/${d1}) × (${n2}/${d2}) in lowest terms.`,
        correctAnswer: correct,
        distractors: [dist1, dist2, dist3],
        explanation: `Multiply the numerators together (${n1} × ${n2} = ${n1 * n2}) and the denominators together (${d1} × ${d2} = ${d1 * d2}). The fraction ${n1 * n2}/${d1 * d2} reduces to ${correct}.`,
        hint: 'Multiply straight across top and bottom.',
        tags: ['Fractions', 'Multiplication', 'Rational Numbers'],
      })
    );
  }

  // Proficient/Advanced: Ratio proportion problem
  {
    const ratioA = randInt(2, 5);
    const ratioB = randInt(3, 7);
    const mult = randInt(4, 9);
    const totalParts = ratioA + ratioB;
    const totalAmount = totalParts * mult;
    const correct = `${ratioA * mult}`;
    const wrong1 = `${ratioB * mult}`;
    const wrong2 = `${Math.round(totalAmount / 2)}`;
    const wrong3 = `${ratioA * mult + 4}`;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_fractions',
        topicName: 'Fractions & Ratios',
        difficulty: randInt(620, 750),
        text: `A chemical solution divides substance X and substance Y in a ratio of ${ratioA}:${ratioB}. If the total volume is ${totalAmount} mL, what is the exact volume of substance X?`,
        correctAnswer: `${correct} mL`,
        distractors: [`${wrong1} mL`, `${wrong2} mL`, `${wrong3} mL`],
        explanation: `Total ratio parts = ${ratioA} + ${ratioB} = ${totalParts}. Each part represents ${totalAmount} / ${totalParts} = ${mult} mL. Therefore, substance X is ${ratioA} × ${mult} = ${correct} mL.`,
        hint: 'Find the value of one ratio part by dividing total volume by total ratio units.',
        tags: ['Ratios', 'Proportional Reasoning', 'Applied Problem'],
      })
    );
  }

  return list;
}

// 2. Math: Algebra & Equations
function generateAlgebraQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: Linear equation ax + b = c
  {
    const a = randChoice([2, 3, 4, 5]);
    const xVal = randInt(3, 9);
    const b = randInt(2, 12);
    const c = a * xVal + b;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_algebra',
        topicName: 'Algebra & Equations',
        difficulty: randInt(220, 320),
        text: `Solve for x in the equation: ${a}x + ${b} = ${c}`,
        correctAnswer: `x = ${xVal}`,
        distractors: [`x = ${xVal + 2}`, `x = ${Math.max(1, xVal - 2)}`, `x = ${xVal + 4}`],
        explanation: `Subtract ${b} from both sides: ${a}x = ${c - b}. Divide by ${a}: x = ${xVal}.`,
        hint: 'Isolate the x term by subtracting the constant first.',
        tags: ['Linear Equations', 'Variable Isolation'],
      })
    );
  }

  // Intermediate: Quadratic roots (x - r1)(x - r2) = 0
  {
    const r1 = randInt(1, 5);
    const r2 = randInt(6, 9);
    const bCoeff = -(r1 + r2);
    const cCoeff = r1 * r2;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_algebra',
        topicName: 'Algebra & Equations',
        difficulty: randInt(460, 560),
        text: `Find the solution set for the quadratic equation: x² ${bCoeff >= 0 ? '+' : ''}${bCoeff}x + ${cCoeff} = 0`,
        correctAnswer: `x = ${r1} and x = ${r2}`,
        distractors: [
          `x = ${-r1} and x = ${-r2}`,
          `x = ${r1} and x = ${-r2}`,
          `x = ${r1 + 1} and x = ${r2 - 1}`,
        ],
        explanation: `Factor the polynomial into (x - ${r1})(x - ${r2}) = 0. By the zero product property, x = ${r1} or x = ${r2}.`,
        hint: 'Find two numbers that multiply to the constant term and add to the middle coefficient.',
        tags: ['Quadratic Equations', 'Factoring', 'Roots'],
      })
    );
  }

  // Advanced: System of Equations
  {
    const x = randInt(2, 6);
    const y = randInt(1, 5);
    const c1 = 2 * x + y;
    const c2 = x - y;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_algebra',
        topicName: 'Algebra & Equations',
        difficulty: randInt(720, 830),
        text: `Given the system of equations: 2x + y = ${c1} and x - y = ${c2}, determine the ordered pair (x, y).`,
        correctAnswer: `(${x}, ${y})`,
        distractors: [`(${x + 1}, ${y - 1})`, `(${y}, ${x})`, `(${x - 1}, ${y + 2})`],
        explanation: `Add both equations to eliminate y: (2x + y) + (x - y) = ${c1} + ${c2} => 3x = ${c1 + c2} => x = ${x}. Substitute x into the second equation: ${x} - y = ${c2} => y = ${y}.`,
        hint: 'Use the elimination method by adding the two equations.',
        tags: ['System of Equations', 'Linear Algebra', 'Simultaneous'],
      })
    );
  }

  return list;
}

// 3. Math: Geometry & Trigonometry
function generateGeometryQuestions(): Question[] {
  const list: Question[] = [];

  // Novice/Intermediate: Pythagorean theorem
  {
    const mult = randChoice([1, 2, 3, 4]);
    const a = 3 * mult;
    const b = 4 * mult;
    const c = 5 * mult;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_geometry',
        topicName: 'Geometry & Trigonometry',
        difficulty: randInt(310, 440),
        text: `In a right triangle with perpendicular legs of length ${a} cm and ${b} cm, what is the length of the hypotenuse?`,
        correctAnswer: `${c} cm`,
        distractors: [`${c + 2} cm`, `${a + b} cm`, `${c - 1} cm`],
        explanation: `Apply the Pythagorean theorem: a² + b² = c². Here, ${a}² + ${b}² = ${a * a} + ${b * b} = ${c * c}. Taking the square root gives ${c} cm.`,
        hint: 'Recall a² + b² = c².',
        tags: ['Pythagorean Theorem', 'Right Triangles', 'Hypotenuse'],
      })
    );
  }

  // Intermediate/Proficient: Circle Area and circumference
  {
    const r = randChoice([3, 5, 7, 8]);
    const areaPi = r * r;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_geometry',
        topicName: 'Geometry & Trigonometry',
        difficulty: randInt(480, 590),
        text: `What is the exact geometric area of a circle whose radius is ${r} meters?`,
        correctAnswer: `${areaPi}π m²`,
        distractors: [`${2 * r}π m²`, `${areaPi * 2}π m²`, `${r * 3}π m²`],
        explanation: `The area of a circle is given by A = πr². With r = ${r}, A = π × (${r})² = ${areaPi}π m².`,
        hint: 'Area = πr², while circumference = 2πr.',
        tags: ['Circles', 'Area', 'Pi'],
      })
    );
  }

  // Advanced: Trigonometric Identity
  {
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_geometry',
        topicName: 'Geometry & Trigonometry',
        difficulty: randInt(740, 870),
        text: 'For any real angle θ, what is the fundamental identity relating sin²(θ) and cos²(θ)?',
        correctAnswer: 'sin²(θ) + cos²(θ) = 1',
        distractors: [
          'sin²(θ) - cos²(θ) = 1',
          'sin²(θ) + cos²(θ) = tan²(θ)',
          'sin²(θ) × cos²(θ) = 1',
        ],
        explanation: 'By the Pythagorean trigonometric identity derived from the unit circle (x² + y² = 1 where x = cos θ and y = sin θ), sin²(θ) + cos²(θ) = 1 for all angles θ.',
        hint: 'Think about coordinates on a unit circle with radius 1.',
        tags: ['Trigonometric Identities', 'Unit Circle'],
      })
    );
  }

  return list;
}

// 4. Math: Statistics & Probability
function generateStatisticsQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: Mean of numbers
  {
    const vals = [randInt(4, 8), randInt(9, 14), randInt(15, 20), randInt(21, 26)];
    const sum = vals.reduce((acc, v) => acc + v, 0);
    const mean = (sum / vals.length).toFixed(1);
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_statistics',
        topicName: 'Statistics & Probability',
        difficulty: randInt(240, 360),
        text: `Calculate the arithmetic mean of the dataset: [${vals.join(', ')}].`,
        correctAnswer: `${mean}`,
        distractors: [`${(parseFloat(mean) + 2.5).toFixed(1)}`, `${(parseFloat(mean) - 2.0).toFixed(1)}`, `${vals[1]}`],
        explanation: `The mean is the sum divided by the number of elements: (${vals.join(' + ')}) / 4 = ${sum} / 4 = ${mean}.`,
        hint: 'Add all the numbers together and divide by the count.',
        tags: ['Mean', 'Descriptive Statistics'],
      })
    );
  }

  // Proficient: Probability of Independent events
  {
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_statistics',
        topicName: 'Statistics & Probability',
        difficulty: randInt(600, 720),
        text: 'Two fair standard 6-sided dice are rolled simultaneously. What is the probability of rolling a sum equal to 7?',
        correctAnswer: '1/6',
        distractors: ['1/12', '7/36', '1/4'],
        explanation: 'Total possible outcomes = 6 × 6 = 36. Outcomes that sum to 7 are: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1) = 6 favorable outcomes. P(sum = 7) = 6/36 = 1/6.',
        hint: 'List the pairs of numbers from 1 to 6 that add up to 7.',
        tags: ['Probability', 'Combinatorics', 'Dice'],
      })
    );
  }

  return list;
}

// 5. Math: Calculus Basics
function generateCalculusQuestions(): Question[] {
  const list: Question[] = [];

  // Intermediate: Power rule derivative
  {
    const c = randInt(2, 6);
    const p = randInt(3, 5);
    const newC = c * p;
    const newP = p - 1;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_calculus',
        topicName: 'Calculus Basics',
        difficulty: randInt(520, 640),
        text: `Determine the first derivative d/dx of f(x) = ${c}x^${p}.`,
        correctAnswer: `${newC}x^${newP}`,
        distractors: [`${c}x^${newP}`, `${newC}x^${p}`, `${c * 2}x^${p + 1}`],
        explanation: `By the power rule, d/dx [a·x^n] = a·n·x^(n-1). Here, ${c} × ${p} = ${newC}, and the exponent decreases from ${p} to ${newP}.`,
        hint: 'Multiply the coefficient by the current power, then subtract 1 from the power.',
        tags: ['Calculus', 'Derivatives', 'Power Rule'],
      })
    );
  }

  // Advanced: Definite integral
  {
    const a = randInt(2, 4);
    // integrate a*x from 0 to 2: [a/2 * x^2] from 0 to 2 = a/2 * 4 = 2a
    const result = 2 * a;
    list.push(
      createQuestion({
        subjectId: 'math',
        topicId: 'math_calculus',
        topicName: 'Calculus Basics',
        difficulty: randInt(760, 890),
        text: `Evaluate the definite integral: ∫₀² (${a}x) dx.`,
        correctAnswer: `${result}`,
        distractors: [`${result * 2}`, `${result - 2}`, `${a * 2}`],
        explanation: `The antiderivative of ${a}x is (${a}/2)x². Evaluating from 0 to 2: [(${a}/2)(2)²] - [0] = (${a}/2)(4) = ${result}.`,
        hint: 'Find the antiderivative and evaluate at the upper bound minus lower bound.',
        tags: ['Integrals', 'Fundamental Theorem of Calculus'],
      })
    );
  }

  return list;
}

// 6. Computer Science: Data Structures
function generateDsaQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: Stack behavior
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_dsa',
        topicName: 'Data Structures',
        difficulty: randInt(230, 350),
        text: 'Which principle governs the element retrieval order in a standard Stack data structure?',
        correctAnswer: 'LIFO (Last In, First Out)',
        distractors: [
          'FIFO (First In, First Out)',
          'Priority Preemption',
          'Random Direct Addressing',
        ],
        explanation: 'A Stack strictly enforces Last In, First Out (LIFO). The most recently pushed element is the first to be popped.',
        hint: 'Think of a stack of dinner plates.',
        tags: ['Stack', 'LIFO', 'Data Structures'],
      })
    );
  }

  // Intermediate: Hash Table Time Complexity
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_dsa',
        topicName: 'Data Structures',
        difficulty: randInt(470, 580),
        text: 'Under a uniform hashing distribution, what is the average-case time complexity of lookups in a Hash Map?',
        correctAnswer: 'O(1)',
        distractors: ['O(log n)', 'O(n)', 'O(n log n)'],
        explanation: 'In the average case with a well-distributed hash function and low load factor, key indexing occurs in constant time O(1).',
        hint: 'Direct key-to-index calculation avoids traversing through all elements.',
        tags: ['Hash Map', 'Time Complexity', 'O(1)'],
      })
    );
  }

  // Advanced: Balanced Trees
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_dsa',
        topicName: 'Data Structures',
        difficulty: randInt(740, 860),
        text: 'What invariant guarantees that an AVL Tree maintains an O(log n) maximum search height?',
        correctAnswer: 'The height difference between left and right subtrees of any node is at most 1',
        distractors: [
          'Every leaf node must reside on the exact same depth level',
          'Each node must have either 0 or 2 child pointers',
          'Parent keys must be greater than both children (Heap property)',
        ],
        explanation: 'An AVL tree is a strictly height-balanced binary search tree where the balance factor (height(left) - height(right)) at any node is strictly restricted to {-1, 0, 1}.',
        hint: 'Think about the balance factor condition.',
        tags: ['AVL Tree', 'Tree Balance', 'Binary Search Tree'],
      })
    );
  }

  return list;
}

// 7. Computer Science: Algorithms & Big-O
function generateAlgorithmsQuestions(): Question[] {
  const list: Question[] = [];

  // Novice/Intermediate: Binary Search complexity
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_algorithms',
        topicName: 'Algorithms & Big-O',
        difficulty: randInt(360, 480),
        text: 'What is the worst-case runtime complexity of Binary Search on a sorted array of size n?',
        correctAnswer: 'O(log n)',
        distractors: ['O(n)', 'O(1)', 'O(n log n)'],
        explanation: 'Binary Search halves the search space at each comparison step (n -> n/2 -> n/4 ...), requiring at most log₂(n) comparisons.',
        hint: 'Halving the problem space repeatedly gives logarithmic scaling.',
        tags: ['Binary Search', 'Big-O', 'Algorithms'],
      })
    );
  }

  // Proficient: QuickSort vs MergeSort
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_algorithms',
        topicName: 'Algorithms & Big-O',
        difficulty: randInt(620, 750),
        text: 'Why is Merge Sort often favored over QuickSort for sorting singly linked lists?',
        correctAnswer: 'Merge Sort does not require random array indexing and merges nodes in O(1) auxiliary space',
        distractors: [
          'Merge Sort has an O(n) worst-case time complexity',
          'QuickSort cannot operate on numerical data',
          'Merge Sort requires zero recursion stack depth',
        ],
        explanation: 'Linked lists allow O(1) pointer reassignments without contiguous memory copies, making Merge Sort optimal as it requires no random element indexing (unlike pivot selection in arrays).',
        hint: 'Consider how linked lists navigate without index access.',
        tags: ['Sorting', 'MergeSort', 'QuickSort'],
      })
    );
  }

  // Master: Dynamic Programming
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_algorithms',
        topicName: 'Algorithms & Big-O',
        difficulty: randInt(860, 960),
        text: 'Which two core properties indicate that a problem is optimally solvable via Dynamic Programming?',
        correctAnswer: 'Optimal Substructure and Overlapping Subproblems',
        distractors: [
          'Greedy Choice Property and Infinite Convergence',
          'Divide-and-Conquer Isolation and Independent States',
          'Memoized Branch Pruning and State Machine Determinism',
        ],
        explanation: 'Dynamic Programming applies when a problem exhibits optimal substructure (optimal solution composed of optimal subproblem solutions) and overlapping subproblems (same subproblems solved repeatedly).',
        hint: 'Think of subproblems that repeat and build into the global optimum.',
        tags: ['Dynamic Programming', 'Algorithms', 'Advanced Theory'],
      })
    );
  }

  return list;
}

// 8. Computer Science: Databases & SQL
function generateDatabasesQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: SQL clauses
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_databases',
        topicName: 'Databases & SQL',
        difficulty: randInt(250, 380),
        text: 'Which SQL keyword is used to filter rows after an aggregation with GROUP BY has been computed?',
        correctAnswer: 'HAVING',
        distractors: ['WHERE', 'FILTER BY', 'ORDER BY'],
        explanation: 'WHERE filters individual records before aggregation. HAVING filters grouped rows after aggregation.',
        hint: 'WHERE is for raw rows; this keyword is specifically for aggregate results.',
        tags: ['SQL', 'HAVING', 'GROUP BY'],
      })
    );
  }

  // Intermediate/Proficient: ACID transactions
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_databases',
        topicName: 'Databases & SQL',
        difficulty: randInt(550, 680),
        text: 'In database ACID properties, what does "Atomicity" strictly guarantee?',
        correctAnswer: 'All operations in a transaction succeed completely, or none take effect (all-or-nothing)',
        distractors: [
          'Data is written to persistent storage atomically without cache buffers',
          'Concurrent transactions cannot interleave their read operations',
          'Foreign key constraints are strictly validated across atomic tables',
        ],
        explanation: 'Atomicity ensures that a transaction is treated as a single indivisible unit: either all steps execute successfully or the database rolls back to its prior state.',
        hint: 'Think "all-or-nothing".',
        tags: ['ACID', 'Transactions', 'Atomicity'],
      })
    );
  }

  return list;
}

// 9. Computer Science: Systems & Networks
function generateSystemsQuestions(): Question[] {
  const list: Question[] = [];

  // Novice/Intermediate: TCP vs UDP
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_systems',
        topicName: 'Systems & Networks',
        difficulty: randInt(350, 470),
        text: 'Which transport-layer protocol provides connection-oriented, reliable, in-order packet delivery?',
        correctAnswer: 'TCP (Transmission Control Protocol)',
        distractors: [
          'UDP (User Datagram Protocol)',
          'IP (Internet Protocol)',
          'ICMP (Internet Control Message Protocol)',
        ],
        explanation: 'TCP guarantees reliability, flow control, and in-order delivery via sequence numbers and acknowledgments, whereas UDP is connectionless and best-effort.',
        hint: 'It uses a 3-way handshake before transmitting data.',
        tags: ['Networking', 'TCP', 'Protocols'],
      })
    );
  }

  // Proficient/Advanced: CPU Caching
  {
    list.push(
      createQuestion({
        subjectId: 'cs',
        topicId: 'cs_systems',
        topicName: 'Systems & Networks',
        difficulty: randInt(710, 840),
        text: 'Why does accessing an array linearly (stride 1) yield dramatically faster execution than traversing random pointers in linked structures?',
        correctAnswer: 'Spatial locality allows hardware prefetchers to load sequential cache lines into L1/L2 cache',
        distractors: [
          'Arrays consume zero virtual memory addresses',
          'Pointers require GPU coprocessor decoding',
          'Linked lists cause CPU thread deadlocks',
        ],
        explanation: 'Sequential array elements occupy adjacent contiguous memory. When one is loaded, the entire 64-byte cache line is populated, maximizing L1 cache hits due to spatial locality.',
        hint: 'Consider CPU cache lines and spatial locality.',
        tags: ['Memory Hierarchy', 'CPU Cache', 'Spatial Locality'],
      })
    );
  }

  return list;
}

// 10. Science: Physics & Mechanics
function generatePhysicsQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: F = ma
  {
    const m = randInt(2, 8);
    const a = randInt(2, 6);
    const f = m * a;
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_physics',
        topicName: 'Physics & Mechanics',
        difficulty: randInt(210, 330),
        text: `A cart of mass ${m} kg accelerates along a frictionless track at ${a} m/s². What net force is exerted on the cart?`,
        correctAnswer: `${f} N`,
        distractors: [`${f + 4} N`, `${m + a} N`, `${f * 2} N`],
        explanation: `By Newton's second law of motion: F = m × a = ${m} kg × ${a} m/s² = ${f} N.`,
        hint: 'Newton’s Second Law: F = ma.',
        tags: ['Physics', 'Newton Laws', 'Force'],
      })
    );
  }

  // Intermediate: Kinetic Energy KE = 1/2 m v^2
  {
    const m = randChoice([2, 4, 6]);
    const v = randChoice([3, 4, 5]);
    const ke = 0.5 * m * (v * v);
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_physics',
        topicName: 'Physics & Mechanics',
        difficulty: randInt(460, 580),
        text: `An object with mass ${m} kg travels at a constant velocity of ${v} m/s. What is its kinetic energy?`,
        correctAnswer: `${ke} Joules`,
        distractors: [`${ke * 2} Joules`, `${m * v} Joules`, `${ke + 10} Joules`],
        explanation: `Kinetic Energy is calculated as KE = (1/2)mv² = (1/2)(${m})(${v})² = (1/2)(${m})(${v * v}) = ${ke} J.`,
        hint: 'KE = (1/2)mv².',
        tags: ['Kinetic Energy', 'Work & Energy'],
      })
    );
  }

  // Advanced: Circuits Ohm's Law & Power
  {
    const v = randChoice([12, 24, 120]);
    const r = randChoice([4, 6, 12]);
    const i = v / r;
    const p = v * i;
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_physics',
        topicName: 'Physics & Mechanics',
        difficulty: randInt(690, 810),
        text: `A DC circuit has a voltage source of ${v} V connected across a resistor of ${r} Ω. How much electrical power is dissipated?`,
        correctAnswer: `${p} W`,
        distractors: [`${v * r} W`, `${i} W`, `${p / 2} W`],
        explanation: `Current I = V / R = ${v} / ${r} = ${i} A. Power P = V × I = ${v} × ${i} = ${p} W (or P = V²/R = ${v * v}/${r} = ${p} W).`,
        hint: 'Use P = V²/R or find current first with I = V/R.',
        tags: ['Circuits', 'Ohm Law', 'Electrical Power'],
      })
    );
  }

  return list;
}

// 11. Science: Chemistry & Reactions
function generateChemistryQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: pH scale
  {
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_chemistry',
        topicName: 'Chemistry & Reactions',
        difficulty: randInt(220, 340),
        text: 'A neutral aqueous solution at 25°C has a pH value equal to which number?',
        correctAnswer: '7.0',
        distractors: ['0.0', '14.0', '1.0'],
        explanation: 'At standard temperature (25°C), pure water has equal hydronium and hydroxide ion concentrations [H⁺] = 10⁻⁷ M, yielding a pH of -log(10⁻⁷) = 7.0.',
        hint: 'The pH scale ranges from 0 (acidic) to 14 (basic) with the midpoint being neutral.',
        tags: ['Chemistry', 'pH', 'Acids and Bases'],
      })
    );
  }

  // Proficient: Le Chatelier Principle
  {
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_chemistry',
        topicName: 'Chemistry & Reactions',
        difficulty: randInt(640, 770),
        text: 'In an exothermic reversible gas reaction: N₂(g) + 3H₂(g) ⇌ 2NH₃(g) + Heat, what effect does increasing temperature have on the equilibrium?',
        correctAnswer: 'Shifts equilibrium to the left, favoring reactants',
        distractors: [
          'Shifts equilibrium to the right, increasing NH₃ yield',
          'Has zero effect because total moles of gas remain unchanged',
          'Causes all chemical reactions to halt instantly',
        ],
        explanation: 'According to Le Chatelier’s principle, adding heat to an exothermic forward reaction causes the equilibrium to shift in the endothermic direction (reverse) to absorb excess thermal energy.',
        hint: 'Treat heat as a product on the right side.',
        tags: ['Equilibrium', 'Le Chatelier', 'Thermodynamics'],
      })
    );
  }

  return list;
}

// 12. Science: Biology & Genetics
function generateBiologyQuestions(): Question[] {
  const list: Question[] = [];

  // Novice: Mitochondria function
  {
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_biology',
        topicName: 'Biology & Genetics',
        difficulty: randInt(200, 310),
        text: 'Which organelle is primarily responsible for synthesizing ATP through oxidative phosphorylation in eukaryotic cells?',
        correctAnswer: 'Mitochondrion',
        distractors: ['Ribosome', 'Endoplasmic Reticulum', 'Golgi Apparatus'],
        explanation: 'Mitochondria generate the vast majority of cellular chemical energy (ATP) through the citric acid cycle and the electron transport chain.',
        hint: 'Often referred to as the powerhouse of the cell.',
        tags: ['Cell Biology', 'ATP', 'Organelles'],
      })
    );
  }

  // Intermediate/Proficient: Punnett square
  {
    list.push(
      createQuestion({
        subjectId: 'science',
        topicId: 'sci_biology',
        topicName: 'Biology & Genetics',
        difficulty: randInt(510, 630),
        text: 'If two heterozygous organisms (Aa × Aa) are crossed, what is the expected phenotypic ratio for a trait governed by complete dominance?',
        correctAnswer: '3 dominant : 1 recessive',
        distractors: [
          '1 dominant : 2 intermediate : 1 recessive',
          '1 dominant : 1 recessive',
          '4 dominant : 0 recessive',
        ],
        explanation: 'Genotypic ratio is 1 AA : 2 Aa : 1 aa. Because "A" is completely dominant over "a", both AA and Aa display the dominant phenotype, resulting in a 3:1 phenotypic ratio.',
        hint: 'Both AA and Aa express the dominant trait.',
        tags: ['Genetics', 'Mendelian', 'Punnett Square'],
      })
    );
  }

  return list;
}

/**
 * Main Question Bank Generator
 * Synthesizes a completely fresh set of psychometrically calibrated questions
 * across all subjects and topics.
 */
export function generateFreshQuestionBank(): Question[] {
  const bank: Question[] = [];

  // 1. Math
  bank.push(...generateFractionsQuestions());
  bank.push(...generateAlgebraQuestions());
  bank.push(...generateGeometryQuestions());
  bank.push(...generateStatisticsQuestions());
  bank.push(...generateCalculusQuestions());

  // 2. Computer Science
  bank.push(...generateDsaQuestions());
  bank.push(...generateAlgorithmsQuestions());
  bank.push(...generateDatabasesQuestions());
  bank.push(...generateSystemsQuestions());

  // 3. Natural Sciences
  bank.push(...generatePhysicsQuestions());
  bank.push(...generateChemistryQuestions());
  bank.push(...generateBiologyQuestions());

  // Randomize the overall order so items appear distinct every time
  return shuffle(bank);
}
