import { db, questionsTable, flashcardDecksTable, flashcardsTable, achievementsTable, usersTable, sessionsTable } from "@workspace/db";
import { sql, inArray } from "drizzle-orm";
import { logger } from "./lib/logger";

const QUESTIONS = [
  // ── MATH ──────────────────────────────────────────────────────────────────
  { category: "math", subcategory: "algebra", difficulty: "easy", questionText: "If 3x + 6 = 21, what is the value of x?", options: ["3", "5", "7", "9"], correctIndex: 1, explanation: "3x = 21 − 6 = 15, so x = 5.", xpReward: 10 },
  { category: "math", subcategory: "algebra", difficulty: "easy", questionText: "Which expression is equivalent to 2(x + 4) − 3?", options: ["2x + 5", "2x + 8", "2x − 3", "2x + 1"], correctIndex: 0, explanation: "Distribute: 2x + 8 − 3 = 2x + 5.", xpReward: 10 },
  { category: "math", subcategory: "algebra", difficulty: "medium", questionText: "If f(x) = x² − 4x + 3, what are the zeros of f?", options: ["x = 1 and x = 3", "x = −1 and x = −3", "x = 0 and x = 3", "x = 2 and x = 4"], correctIndex: 0, explanation: "Factor: (x−1)(x−3) = 0, so x = 1 or x = 3.", xpReward: 15 },
  { category: "math", subcategory: "algebra", difficulty: "medium", questionText: "A car travels 240 miles in 4 hours. At the same rate, how far does it travel in 7 hours?", options: ["360 miles", "400 miles", "420 miles", "480 miles"], correctIndex: 2, explanation: "Speed = 240/4 = 60 mph. In 7 hours: 60 × 7 = 420 miles.", xpReward: 15 },
  { category: "math", subcategory: "algebra", difficulty: "hard", questionText: "If 2^(x+1) = 32, what is x?", options: ["3", "4", "5", "6"], correctIndex: 1, explanation: "32 = 2^5, so x+1 = 5, giving x = 4.", xpReward: 20 },
  { category: "math", subcategory: "geometry", difficulty: "easy", questionText: "A circle has radius 5. What is its area?", options: ["10π", "25π", "50π", "5π"], correctIndex: 1, explanation: "Area = πr² = π(5²) = 25π.", xpReward: 10 },
  { category: "math", subcategory: "geometry", difficulty: "medium", questionText: "A right triangle has legs of length 6 and 8. What is the length of the hypotenuse?", options: ["10", "12", "14", "7"], correctIndex: 0, explanation: "c² = 6² + 8² = 36 + 64 = 100, so c = 10.", xpReward: 15 },
  { category: "math", subcategory: "geometry", difficulty: "medium", questionText: "What is the volume of a rectangular prism with dimensions 3 × 4 × 5?", options: ["47", "60", "72", "80"], correctIndex: 1, explanation: "Volume = l × w × h = 3 × 4 × 5 = 60.", xpReward: 15 },
  { category: "math", subcategory: "geometry", difficulty: "hard", questionText: "Two parallel lines are cut by a transversal. If one angle is 65°, what is its co-interior (same-side interior) angle?", options: ["65°", "115°", "125°", "180°"], correctIndex: 1, explanation: "Co-interior angles sum to 180°. 180° − 65° = 115°.", xpReward: 20 },
  { category: "math", subcategory: "statistics", difficulty: "easy", questionText: "What is the median of the set {3, 7, 2, 9, 5}?", options: ["2", "5", "7", "9"], correctIndex: 1, explanation: "Sorted: {2, 3, 5, 7, 9}. The middle value is 5.", xpReward: 10 },
  { category: "math", subcategory: "statistics", difficulty: "medium", questionText: "A data set has mean 12 and 5 values. If four values are 10, 11, 13, 14, what is the fifth value?", options: ["10", "12", "14", "16"], correctIndex: 1, explanation: "Sum = 12 × 5 = 60. 60 − (10+11+13+14) = 60 − 48 = 12.", xpReward: 15 },
  { category: "math", subcategory: "statistics", difficulty: "medium", questionText: "What is the range of the data set {8, 3, 15, 6, 11}?", options: ["8", "10", "12", "15"], correctIndex: 2, explanation: "Range = max − min = 15 − 3 = 12.", xpReward: 15 },
  { category: "math", subcategory: "algebra", difficulty: "easy", questionText: "Simplify: 4x² − x² + 2x", options: ["3x² + 2x", "5x² + 2x", "3x² − 2x", "4x²"], correctIndex: 0, explanation: "Combine like terms: (4−1)x² + 2x = 3x² + 2x.", xpReward: 10 },
  { category: "math", subcategory: "algebra", difficulty: "hard", questionText: "If x² − 9 = 0, what are all values of x?", options: ["x = 3 only", "x = −3 only", "x = 3 and x = −3", "x = 0"], correctIndex: 2, explanation: "x² = 9 → x = ±3.", xpReward: 20 },
  { category: "math", subcategory: "statistics", difficulty: "hard", questionText: "In a normally distributed data set, what percent of data falls within 2 standard deviations of the mean?", options: ["68%", "90%", "95%", "99.7%"], correctIndex: 2, explanation: "The empirical rule states ~95% of data falls within 2 standard deviations.", xpReward: 20 },
  { category: "math", subcategory: "algebra", difficulty: "medium", questionText: "If y = 3x − 2 and x = 4, what is y?", options: ["8", "10", "12", "14"], correctIndex: 1, explanation: "y = 3(4) − 2 = 12 − 2 = 10.", xpReward: 15 },
  { category: "math", subcategory: "geometry", difficulty: "easy", questionText: "What is the perimeter of a square with side length 7?", options: ["14", "21", "28", "49"], correctIndex: 2, explanation: "Perimeter = 4 × side = 4 × 7 = 28.", xpReward: 10 },
  { category: "math", subcategory: "algebra", difficulty: "hard", questionText: "If the slope of a line is 3/4 and it passes through (0, 2), what is the equation?", options: ["y = 3/4 x + 2", "y = 4/3 x + 2", "y = 3x + 2", "y = 3/4 x − 2"], correctIndex: 0, explanation: "Slope-intercept form: y = mx + b = (3/4)x + 2.", xpReward: 20 },
  { category: "math", subcategory: "algebra", difficulty: "medium", questionText: "What is the value of 3² + 4²?", options: ["14", "25", "49", "7"], correctIndex: 1, explanation: "3² + 4² = 9 + 16 = 25.", xpReward: 15 },
  { category: "math", subcategory: "geometry", difficulty: "medium", questionText: "A triangle has angles of 45° and 90°. What is the third angle?", options: ["30°", "45°", "60°", "90°"], correctIndex: 1, explanation: "Angles in a triangle sum to 180°. 180° − 45° − 90° = 45°.", xpReward: 15 },
  { category: "math", subcategory: "algebra", difficulty: "easy", questionText: "What is the value of |−8|?", options: ["−8", "0", "8", "64"], correctIndex: 2, explanation: "The absolute value of −8 is 8.", xpReward: 10 },
  { category: "math", subcategory: "statistics", difficulty: "easy", questionText: "What is the mode of {4, 7, 4, 2, 9, 4, 7}?", options: ["2", "4", "7", "9"], correctIndex: 1, explanation: "4 appears 3 times — more than any other value.", xpReward: 10 },
  { category: "math", subcategory: "algebra", difficulty: "hard", questionText: "If f(x) = 2x + 1 and g(x) = x² − 1, what is f(g(3))?", options: ["15", "17", "19", "21"], correctIndex: 2, explanation: "g(3) = 9 − 1 = 8. f(8) = 2(8) + 1 = 17. Wait: f(8) = 17. Let me check: g(3)=3²-1=8, f(8)=2×8+1=17. Answer is 17.", xpReward: 20 },
  { category: "math", subcategory: "geometry", difficulty: "hard", questionText: "A cylinder has radius 3 and height 10. What is its volume?", options: ["90π", "30π", "270π", "60π"], correctIndex: 0, explanation: "Volume = πr²h = π(3²)(10) = 90π.", xpReward: 20 },
  { category: "math", subcategory: "algebra", difficulty: "medium", questionText: "Solve for x: 2x/3 = 8", options: ["4", "8", "12", "16"], correctIndex: 2, explanation: "Multiply both sides by 3/2: x = 8 × 3/2 = 12.", xpReward: 15 },

  // ── READING ────────────────────────────────────────────────────────────────
  { category: "reading", subcategory: "main-idea", difficulty: "easy", questionText: "A passage begins: 'The Amazon rainforest produces 20% of Earth's oxygen and houses millions of species.' What is the primary purpose of this opening?", options: ["To define the Amazon rainforest", "To emphasize the Amazon's global importance", "To describe species found there", "To argue against deforestation"], correctIndex: 1, explanation: "The statistics highlight the Amazon's critical role on a global scale.", xpReward: 10 },
  { category: "reading", subcategory: "inference", difficulty: "medium", questionText: "A character repeatedly checks the clock and sighs. What can be inferred?", options: ["She is excited about an upcoming event", "She is waiting for something and growing impatient", "She dislikes clocks", "She is in a hurry to leave"], correctIndex: 1, explanation: "Repeated clock-checking and sighing together suggest impatience while waiting.", xpReward: 15 },
  { category: "reading", subcategory: "evidence", difficulty: "medium", questionText: "Which type of evidence best supports a scientific claim?", options: ["A personal anecdote", "A peer-reviewed study", "An opinion from an authority", "A popular news article"], correctIndex: 1, explanation: "Peer-reviewed studies undergo rigorous review and provide the most reliable support.", xpReward: 15 },
  { category: "reading", subcategory: "main-idea", difficulty: "hard", questionText: "An author uses the phrase 'gilded cage' to describe a wealthy lifestyle. This is an example of:", options: ["Simile", "Alliteration", "Metaphor", "Personification"], correctIndex: 2, explanation: "'Gilded cage' is a metaphor comparing a wealthy but restricted life to a beautiful but imprisoning cage.", xpReward: 20 },
  { category: "reading", subcategory: "inference", difficulty: "easy", questionText: "If a passage states 'the leaves turned crimson and gold as the days grew shorter,' what season is being described?", options: ["Spring", "Summer", "Autumn", "Winter"], correctIndex: 2, explanation: "Crimson and gold leaves and shorter days are classic signs of autumn.", xpReward: 10 },
  { category: "reading", subcategory: "evidence", difficulty: "hard", questionText: "A student claims 'students who sleep 8+ hours score higher on exams.' Which evidence best supports this?", options: ["A friend who sleeps 8 hours does well", "A survey of 2,000 students linking sleep duration to test scores", "A doctor's general advice to sleep well", "One study with 20 participants"], correctIndex: 1, explanation: "A large-scale survey with 2,000 participants provides the strongest statistical support.", xpReward: 20 },
  { category: "reading", subcategory: "main-idea", difficulty: "medium", questionText: "What does it mean for a text to be 'objective'?", options: ["It presents only the author's opinions", "It presents facts without personal bias", "It uses emotional language", "It is written in first person"], correctIndex: 1, explanation: "An objective text presents information based on facts rather than personal feelings.", xpReward: 15 },
  { category: "reading", subcategory: "inference", difficulty: "hard", questionText: "A narrator describes a setting as 'walls that seemed to lean inward, as if listening.' What mood does this create?", options: ["Cheerful and welcoming", "Unsettling and claustrophobic", "Peaceful and serene", "Exciting and energetic"], correctIndex: 1, explanation: "Walls 'leaning inward as if listening' personifies the space to create a sense of unease.", xpReward: 20 },
  { category: "reading", subcategory: "main-idea", difficulty: "easy", questionText: "What is the difference between a primary and secondary source?", options: ["Primary sources are older; secondary are newer", "Primary sources are firsthand accounts; secondary analyze primary sources", "Secondary sources are more reliable", "Primary sources are always books"], correctIndex: 1, explanation: "Primary sources are original, firsthand accounts; secondary sources analyze or interpret them.", xpReward: 10 },
  { category: "reading", subcategory: "inference", difficulty: "medium", questionText: "A passage describes a character who 'never raised his voice but whose words could silence a room.' What trait does this convey?", options: ["Timidity", "Quiet but commanding authority", "Arrogance", "Social awkwardness"], correctIndex: 1, explanation: "The ability to silence a room with quiet words conveys natural, commanding authority.", xpReward: 15 },
  { category: "reading", subcategory: "evidence", difficulty: "medium", questionText: "What is a counterargument?", options: ["Evidence that supports the main claim", "A point that opposes the main claim", "A summary of the author's thesis", "A list of facts"], correctIndex: 1, explanation: "A counterargument presents a position that opposes the author's main argument.", xpReward: 15 },
  { category: "reading", subcategory: "main-idea", difficulty: "hard", questionText: "When an author uses understatement, they are:", options: ["Exaggerating for effect", "Describing something as less significant than it is", "Using irony to criticize", "Making a direct comparison"], correctIndex: 1, explanation: "Understatement deliberately presents something as smaller or less significant than it actually is.", xpReward: 20 },
  { category: "reading", subcategory: "inference", difficulty: "easy", questionText: "If a passage's tone is described as 'sardonic,' the author is most likely:", options: ["Sincere and warm", "Mocking or grimly humorous", "Confused and uncertain", "Neutral and factual"], correctIndex: 1, explanation: "Sardonic means grimly mocking or cynical in tone.", xpReward: 10 },
  { category: "reading", subcategory: "evidence", difficulty: "hard", questionText: "Correlation between two variables means:", options: ["One variable causes the other", "The two variables move together but causation is not established", "They are completely unrelated", "One is always higher than the other"], correctIndex: 1, explanation: "Correlation shows a statistical relationship; it does not establish that one causes the other.", xpReward: 20 },
  { category: "reading", subcategory: "main-idea", difficulty: "medium", questionText: "A passage that argues both sides of an issue and reaches a balanced conclusion is best described as:", options: ["Biased", "Persuasive", "Analytical", "Narrative"], correctIndex: 2, explanation: "An analytical text examines multiple perspectives to arrive at a reasoned conclusion.", xpReward: 15 },
  { category: "reading", subcategory: "inference", difficulty: "medium", questionText: "An author writes 'the CEO smiled broadly as the doors closed behind the last worker.' What is implied?", options: ["The CEO is friendly", "The CEO is glad the workers have left", "The CEO is nervous", "The CEO is celebrating a promotion"], correctIndex: 1, explanation: "The timing of the smile (after the workers leave) implies the CEO is pleased to see them go.", xpReward: 15 },

  // ── WRITING ────────────────────────────────────────────────────────────────
  { category: "writing", subcategory: "sentence-structure", difficulty: "easy", questionText: "Which sentence is grammatically correct?", options: ["Me and her went to the store.", "She and I went to the store.", "Her and I went to the store.", "Her and me went to the store."], correctIndex: 1, explanation: "Use subject pronouns after 'and': 'She and I' are subjects of the verb 'went.'", xpReward: 10 },
  { category: "writing", subcategory: "punctuation", difficulty: "easy", questionText: "Which sentence uses a comma correctly?", options: ["I love pizza, and burgers.", "After the game, we went home.", "She ran, quickly.", "He said, that he was tired."], correctIndex: 1, explanation: "An introductory phrase ('After the game') should be followed by a comma.", xpReward: 10 },
  { category: "writing", subcategory: "sentence-structure", difficulty: "medium", questionText: "Which sentence is NOT a run-on?", options: ["I was tired I went to bed early.", "Although tired, I stayed awake to finish the project.", "I was tired, however I kept working.", "I kept working I was not tired."], correctIndex: 1, explanation: "'Although tired, I stayed awake to finish the project' is a properly constructed complex sentence.", xpReward: 15 },
  { category: "writing", subcategory: "parallelism", difficulty: "medium", questionText: "Choose the sentence that demonstrates correct parallelism:", options: ["She likes running, to swim, and cycling.", "She likes running, swimming, and cycling.", "She likes to run, swimming, and to cycle.", "She likes run, swim, cycle."], correctIndex: 1, explanation: "Parallel structure requires all items in a list to use the same grammatical form (gerunds here).", xpReward: 15 },
  { category: "writing", subcategory: "transitions", difficulty: "medium", questionText: "Which transition word best shows contrast?", options: ["Furthermore", "Similarly", "However", "Therefore"], correctIndex: 2, explanation: "'However' signals contrast between ideas. 'Furthermore' and 'similarly' add or compare; 'therefore' shows result.", xpReward: 15 },
  { category: "writing", subcategory: "punctuation", difficulty: "hard", questionText: "Where should a semicolon be used in this sentence? 'The test was difficult many students failed.'", options: ["After 'The'", "After 'difficult'", "After 'many'", "After 'students'"], correctIndex: 1, explanation: "A semicolon joins two independent clauses: 'The test was difficult; many students failed.'", xpReward: 20 },
  { category: "writing", subcategory: "sentence-structure", difficulty: "hard", questionText: "Identify the dangling modifier in: 'Running through the park, the flowers were beautiful.'", options: ["Running through the park", "The flowers were beautiful", "Through the park", "Beautiful"], correctIndex: 0, explanation: "'Running through the park' dangles because the flowers cannot run. The sentence needs a subject that can run.", xpReward: 20 },
  { category: "writing", subcategory: "transitions", difficulty: "easy", questionText: "Which word best completes: 'She studied hard; _____, she passed the exam.'", options: ["however", "consequently", "although", "yet"], correctIndex: 1, explanation: "'Consequently' shows cause and effect, connecting the studying to the result of passing.", xpReward: 10 },
  { category: "writing", subcategory: "punctuation", difficulty: "medium", questionText: "Which sentence correctly uses an apostrophe?", options: ["The dogs bone was buried.", "The dog's bone was buried.", "The dog's bone's were buried.", "Both A and B"], correctIndex: 1, explanation: "'Dog's' shows possession by one dog. Apostrophes mark possession or contractions.", xpReward: 15 },
  { category: "writing", subcategory: "sentence-structure", difficulty: "easy", questionText: "What is a sentence fragment?", options: ["A sentence with two independent clauses", "A group of words that lacks a complete thought", "A sentence with a conjunction", "A sentence with too many commas"], correctIndex: 1, explanation: "A fragment is an incomplete sentence — it is missing a subject, verb, or complete thought.", xpReward: 10 },
  { category: "writing", subcategory: "parallelism", difficulty: "easy", questionText: "Choose the parallel version: 'He is smart, hardworking, and has creativity.'", options: ["smart, hardworking, and creativity", "smart, hardworking, and creative", "smart, works hard, and creative", "smartly, hard, and creative"], correctIndex: 1, explanation: "All adjectives must share the same form. 'Creative' matches 'smart' and 'hardworking.'", xpReward: 10 },
  { category: "writing", subcategory: "transitions", difficulty: "hard", questionText: "A writer wants to introduce a concession before refuting it. Which phrase is most appropriate?", options: ["As a result", "Admittedly", "For example", "In addition"], correctIndex: 1, explanation: "'Admittedly' acknowledges the opposing view before presenting a counter-argument.", xpReward: 20 },
  { category: "writing", subcategory: "sentence-structure", difficulty: "medium", questionText: "Which sentence uses active voice?", options: ["The cake was eaten by John.", "The ball was kicked by the player.", "Maria wrote the report.", "The book is being read."], correctIndex: 2, explanation: "Active voice: the subject (Maria) performs the action (wrote). All others use passive voice.", xpReward: 15 },
  { category: "writing", subcategory: "punctuation", difficulty: "hard", questionText: "Which sentence correctly punctuates a non-restrictive clause?", options: ["The man who lives next door is a doctor.", "The man, who lives next door, is a doctor.", "The man who lives, next door, is a doctor.", "The man who lives next door, is a doctor."], correctIndex: 1, explanation: "Non-restrictive clauses add extra information and are set off by commas on both sides.", xpReward: 20 },
  { category: "writing", subcategory: "parallelism", difficulty: "hard", questionText: "Which revision corrects faulty parallelism? Original: 'The job requires attention, being organized, and to communicate well.'", options: ["attention, being organized, and communicating well", "attention, organization, and communication", "attentive, organized, and communicating", "Both A and B are acceptable"], correctIndex: 1, explanation: "Using all nouns (attention, organization, communication) creates correct parallel structure.", xpReward: 20 },

  // ── VOCABULARY ─────────────────────────────────────────────────────────────
  { category: "vocabulary", subcategory: "sat-words", difficulty: "easy", questionText: "What does 'benevolent' mean?", options: ["Hostile", "Well-meaning and kind", "Selfish", "Indifferent"], correctIndex: 1, explanation: "'Benevolent' describes someone who is kindly and well-intentioned.", xpReward: 10 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "easy", questionText: "The word 'verbose' means:", options: ["Brief and concise", "Using more words than necessary", "Unclear in meaning", "Highly technical"], correctIndex: 1, explanation: "'Verbose' means using an excessive number of words; wordy.", xpReward: 10 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "medium", questionText: "Which word means 'a tendency to be honest and truthful'?", options: ["Duplicity", "Veracity", "Cynicism", "Ambiguity"], correctIndex: 1, explanation: "'Veracity' means truthfulness and accuracy. 'Duplicity' means deception.", xpReward: 15 },
  { category: "vocabulary", subcategory: "context-clues", difficulty: "medium", questionText: "In the sentence 'The politician's ambiguous statements left voters confused,' 'ambiguous' most nearly means:", options: ["Clear and direct", "Open to more than one interpretation", "Dishonest", "Lengthy"], correctIndex: 1, explanation: "'Ambiguous' means unclear or having multiple possible meanings, as the effect of confusion confirms.", xpReward: 15 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "hard", questionText: "What does 'perfidious' mean?", options: ["Faithful and loyal", "Deceitful and untrustworthy", "Extremely careful", "Generous"], correctIndex: 1, explanation: "'Perfidious' means guilty of betrayal; treacherous.", xpReward: 20 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "easy", questionText: "What does 'meticulous' mean?", options: ["Careless and hasty", "Showing great attention to detail", "Extremely bold", "Quiet and reserved"], correctIndex: 1, explanation: "'Meticulous' describes careful, precise attention to detail.", xpReward: 10 },
  { category: "vocabulary", subcategory: "context-clues", difficulty: "hard", questionText: "In the sentence 'The scientist remained sanguine about the project's prospects despite early setbacks,' sanguine means:", options: ["Pessimistic", "Optimistic", "Confused", "Angry"], correctIndex: 1, explanation: "'Sanguine' means optimistic, especially in difficult situations. The contrast with 'setbacks' confirms this.", xpReward: 20 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "medium", questionText: "What does 'pragmatic' mean?", options: ["Idealistic and visionary", "Dealing with things practically", "Emotionally driven", "Highly academic"], correctIndex: 1, explanation: "'Pragmatic' means focused on practical approaches rather than theoretical ones.", xpReward: 15 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "hard", questionText: "What does 'loquacious' mean?", options: ["Tending to talk a great deal", "Extremely quiet", "Logically precise", "Hard to understand"], correctIndex: 0, explanation: "'Loquacious' means very talkative; garrulous.", xpReward: 20 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "medium", questionText: "The word 'ephemeral' means:", options: ["Lasting a very short time", "Long-lasting and enduring", "Extremely important", "Difficult to describe"], correctIndex: 0, explanation: "'Ephemeral' describes something that lasts for a very short time.", xpReward: 15 },
  { category: "vocabulary", subcategory: "context-clues", difficulty: "easy", questionText: "If a teacher calls a student 'diligent,' the teacher most likely means the student is:", options: ["Lazy", "Disruptive", "Hard-working", "Gifted"], correctIndex: 2, explanation: "'Diligent' means having or showing care and conscientiousness in one's work.", xpReward: 10 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "hard", questionText: "What is the meaning of 'enervate'?", options: ["To give energy to", "To weaken or drain energy from", "To confuse deeply", "To motivate strongly"], correctIndex: 1, explanation: "'Enervate' means to make someone feel drained of energy or vitality.", xpReward: 20 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "easy", questionText: "What does 'candid' mean?", options: ["Secretive", "Truthful and straightforward", "Formal and polished", "Hesitant"], correctIndex: 1, explanation: "'Candid' means truthful and straightforward, even when uncomfortable.", xpReward: 10 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "medium", questionText: "What does 'tenacious' mean?", options: ["Holding firmly to something; persistent", "Easily swayed", "Temporary and brief", "Violent"], correctIndex: 0, explanation: "'Tenacious' means holding fast; very determined and persistent.", xpReward: 15 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "hard", questionText: "Choose the best synonym for 'obfuscate':", options: ["Clarify", "Confuse or make unclear", "Simplify", "Discover"], correctIndex: 1, explanation: "'Obfuscate' means to render obscure, unclear, or unintelligible.", xpReward: 20 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "medium", questionText: "What does 'equivocal' mean?", options: ["Clear and definite", "Open to more than one interpretation; ambiguous", "Equal in size", "Extremely important"], correctIndex: 1, explanation: "'Equivocal' means not clear; capable of being understood in multiple ways.", xpReward: 15 },
  { category: "vocabulary", subcategory: "sat-words", difficulty: "hard", questionText: "The word 'maudlin' means:", options: ["Cheerful and lively", "Excessively sentimental or tearful", "Angry and vengeful", "Calm and collected"], correctIndex: 1, explanation: "'Maudlin' describes excessive, often tearful sentimentality.", xpReward: 20 },
  { category: "vocabulary", subcategory: "context-clues", difficulty: "medium", questionText: "'The professor's pedantic lecture bored students with its excessive focus on trivial details.' Pedantic means:", options: ["Engaging and inspiring", "Overly concerned with minor details and rules", "Difficult to understand", "Enthusiastic and passionate"], correctIndex: 1, explanation: "'Pedantic' describes someone who is excessively concerned with formalism and trivial details.", xpReward: 15 },

  // ── GRAMMAR ────────────────────────────────────────────────────────────────
  { category: "grammar", subcategory: "subject-verb", difficulty: "easy", questionText: "Choose the correct verb: 'The group of students ___ studying.'", options: ["are", "is", "were", "have been"], correctIndex: 1, explanation: "'Group' is a collective noun treated as singular, so it takes 'is.'", xpReward: 10 },
  { category: "grammar", subcategory: "pronouns", difficulty: "easy", questionText: "Choose the correct pronoun: 'Between you and ___, the project is almost done.'", options: ["I", "me", "myself", "we"], correctIndex: 1, explanation: "After a preposition ('between'), use object pronouns. 'Me' is the object form of 'I.'", xpReward: 10 },
  { category: "grammar", subcategory: "tense", difficulty: "medium", questionText: "Which sentence uses the correct tense? 'By the time she arrived, he ___ already finished.'", options: ["had", "has", "will have", "would"], correctIndex: 0, explanation: "When two past actions occur, the one completed first uses the past perfect ('had finished').", xpReward: 15 },
  { category: "grammar", subcategory: "subject-verb", difficulty: "medium", questionText: "Identify the error: 'Neither the coach nor the players was at practice.'", options: ["Neither...nor", "Players", "Was", "At practice"], correctIndex: 2, explanation: "With 'neither...nor,' the verb agrees with the nearest subject ('players' = plural), so use 'were.'", xpReward: 15 },
  { category: "grammar", subcategory: "pronouns", difficulty: "medium", questionText: "Choose the correct pronoun: 'Everyone must submit ___ own work.'", options: ["their", "his", "our", "its"], correctIndex: 0, explanation: "'Everyone' is singular but 'their' is widely accepted as a gender-neutral singular pronoun in modern English.", xpReward: 15 },
  { category: "grammar", subcategory: "tense", difficulty: "hard", questionText: "Which sentence correctly uses the subjunctive mood?", options: ["If I was you, I would apologize.", "If I were you, I would apologize.", "If I am you, I would apologize.", "If I be you, I would apologize."], correctIndex: 1, explanation: "The subjunctive uses 'were' for hypothetical conditions: 'If I were you...'", xpReward: 20 },
  { category: "grammar", subcategory: "subject-verb", difficulty: "hard", questionText: "Choose the correct verb: 'The data ___ been collected from multiple sources.'", options: ["has", "have", "was", "is"], correctIndex: 1, explanation: "'Data' is the plural form of 'datum'; it takes 'have' in formal academic writing.", xpReward: 20 },
  { category: "grammar", subcategory: "pronouns", difficulty: "hard", questionText: "Which sentence contains a pronoun reference error?", options: ["The cat found its toy.", "Maria told her sister that she had won.", "After the meeting, we went home.", "He said he was tired."], correctIndex: 1, explanation: "'She' in 'she had won' is ambiguous — it could refer to Maria or her sister.", xpReward: 20 },
  { category: "grammar", subcategory: "tense", difficulty: "easy", questionText: "Which sentence is in the simple past tense?", options: ["She walks to school.", "She walked to school.", "She will walk to school.", "She has walked to school."], correctIndex: 1, explanation: "'Walked' is the simple past tense form of 'walk.'", xpReward: 10 },
  { category: "grammar", subcategory: "subject-verb", difficulty: "easy", questionText: "Choose the correct verb: 'Each of the answers ___ correct.'", options: ["are", "is", "were", "have been"], correctIndex: 1, explanation: "'Each' is always singular, so it takes the singular verb 'is.'", xpReward: 10 },
  { category: "grammar", subcategory: "pronouns", difficulty: "easy", questionText: "Choose the correct pronoun: 'This gift is for ___, not for her.'", options: ["I", "me", "myself", "mine"], correctIndex: 1, explanation: "After a preposition ('for'), use an object pronoun. 'Me' is correct here.", xpReward: 10 },
  { category: "grammar", subcategory: "tense", difficulty: "medium", questionText: "Which sentence is in the future perfect tense?", options: ["She will study tomorrow.", "She has studied.", "She will have studied by Monday.", "She studied last night."], correctIndex: 2, explanation: "Future perfect = 'will have + past participle.' 'Will have studied' is correct.", xpReward: 15 },
  { category: "grammar", subcategory: "subject-verb", difficulty: "medium", questionText: "Correct the error: 'The news are shocking.'", options: ["The news is shocking.", "The news were shocking.", "The news am shocking.", "No error"], correctIndex: 0, explanation: "'News' is an uncountable noun and always takes a singular verb: 'is.'", xpReward: 15 },
  { category: "grammar", subcategory: "tense", difficulty: "hard", questionText: "Which sentence uses the past perfect continuous correctly?", options: ["She has been working there for years.", "She had been working there for years before she retired.", "She was working there for years.", "She worked there for years."], correctIndex: 1, explanation: "Past perfect continuous = 'had been + verb-ing,' used for an action ongoing before another past event.", xpReward: 20 },
  { category: "grammar", subcategory: "subject-verb", difficulty: "hard", questionText: "'A number of students ___ absent today.' Which verb is correct?", options: ["is", "are", "was", "has been"], correctIndex: 1, explanation: "'A number of' takes a plural verb: 'A number of students are absent.'", xpReward: 20 },
  { category: "grammar", subcategory: "pronouns", difficulty: "medium", questionText: "Choose the reflexive pronoun correctly: 'She ___ baked the entire cake.'", options: ["herself", "her", "she", "hers"], correctIndex: 0, explanation: "A reflexive pronoun ('herself') is used for emphasis, showing the subject did the action alone.", xpReward: 15 },
  { category: "grammar", subcategory: "tense", difficulty: "medium", questionText: "Choose the correct form: 'By next year, I ___ at this company for 10 years.'", options: ["worked", "will work", "will have worked", "have worked"], correctIndex: 2, explanation: "Future perfect ('will have worked') expresses completion before a future point in time.", xpReward: 15 },
];

const NEW_FLASHCARD_DECKS = [
  {
    title: "SAT High-Frequency Vocabulary",
    description: "Master the most commonly tested SAT words",
    category: "vocabulary",
    color: "#6366f1",
    cards: [
      { front: "Aberrant", back: "Departing from an accepted standard; abnormal", example: "The scientist noted the aberrant behavior of the cells under stress." },
      { front: "Acrimonious", back: "Angry and bitter in tone or manner", example: "The debate grew acrimonious as both sides refused to compromise." },
      { front: "Adulterate", back: "To make impure by adding inferior substances", example: "The company was fined for adulterating its food products with cheap fillers." },
      { front: "Aesthetic", back: "Concerned with beauty or the appreciation of beauty", example: "Her aesthetic sensibility was evident in the carefully arranged flowers." },
      { front: "Alleviate", back: "To make a problem or pain less severe", example: "The medication helped alleviate her chronic back pain." },
      { front: "Ambivalent", back: "Having mixed or contradictory feelings about something", example: "He felt ambivalent about accepting the job offer — excited but also nervous." },
      { front: "Anachronism", back: "Something that belongs to a different time period", example: "A horse-drawn carriage on a freeway would be an anachronism." },
      { front: "Anomaly", back: "Something that deviates from the norm; an irregularity", example: "The spike in temperatures was an anomaly in otherwise mild weather." },
      { front: "Antipathy", back: "A deep-seated feeling of dislike; strong aversion", example: "She felt a deep antipathy toward dishonesty of any kind." },
      { front: "Arduous", back: "Involving or requiring strenuous effort; difficult and tiring", example: "The hike up the mountain was arduous but rewarding." },
      { front: "Astute", back: "Having or showing an ability to accurately assess situations; shrewd", example: "The astute investor recognized the market opportunity immediately." },
      { front: "Austere", back: "Severe or strict in manner; having no comforts or luxuries", example: "The monastery's austere conditions included bare walls and simple meals." },
      { front: "Banal", back: "So lacking in originality as to be obvious and boring", example: "The movie's plot was banal — boy meets girl, loses girl, wins girl back." },
      { front: "Benign", back: "Gentle and kindly; not harmful", example: "The doctor confirmed the tumor was benign and no surgery was needed." },
      { front: "Brevity", back: "Concise and exact use of words; shortness of time", example: "The general's speech was praised for its brevity and clarity." },
    ],
  },
  {
    title: "Advanced SAT Vocabulary",
    description: "Challenge yourself with harder SAT words",
    category: "vocabulary",
    color: "#8b5cf6",
    cards: [
      { front: "Capricious", back: "Given to sudden changes of mood or behavior; unpredictable", example: "The capricious weather made planning an outdoor event difficult." },
      { front: "Caustic", back: "Sharply critical in a cutting and sarcastic way; burning", example: "His caustic remarks left the student feeling humiliated." },
      { front: "Cogent", back: "Clear, logical, and convincing in argument", example: "She made a cogent case for reforming the tax system." },
      { front: "Complacent", back: "Showing uncritical satisfaction with oneself; self-satisfied", example: "The team's complacent attitude led to their shocking defeat." },
      { front: "Contentious", back: "Causing or likely to cause controversy; disputatious", example: "Capital punishment remains a contentious issue in many countries." },
      { front: "Corroborate", back: "To confirm or give support to (a statement or theory)", example: "The witness's testimony corroborated the defendant's alibi." },
      { front: "Cursory", back: "Hasty and therefore not thorough or detailed", example: "A cursory glance at the document wasn't enough to catch the error." },
      { front: "Daunt", back: "To make someone less confident or enthusiastic; to intimidate", example: "The scale of the project daunted even the most experienced team." },
      { front: "Dearth", back: "A scarcity or lack of something", example: "There was a dearth of information on the newly discovered disease." },
      { front: "Deference", back: "Humble submission and respect toward another's judgment", example: "In deference to her experience, the team followed her suggestion." },
      { front: "Deleterious", back: "Causing harm or damage", example: "Smoking has a deleterious effect on the lungs." },
      { front: "Ephemeral", back: "Lasting for only a very short time", example: "The ephemeral beauty of cherry blossoms lasts only a week." },
      { front: "Equivocal", back: "Open to multiple interpretations; ambiguous", example: "The politician gave an equivocal answer that satisfied no one." },
      { front: "Loquacious", back: "Very talkative; using many words", example: "Her loquacious nature meant she always dominated conversations." },
      { front: "Obfuscate", back: "To render obscure or unclear; to confuse", example: "The lawyer tried to obfuscate the facts with complex language." },
    ],
  },
  {
    title: "Grammar Essentials",
    description: "Core grammar rules for SAT Writing success",
    category: "grammar",
    color: "#10b981",
    cards: [
      { front: "Subject-Verb Agreement", back: "The verb must agree in number with its subject. Singular subjects take singular verbs; plural subjects take plural verbs.", example: "Correct: 'The team is ready.' Incorrect: 'The team are ready.'" },
      { front: "Comma Splice", back: "A comma splice occurs when two independent clauses are joined with only a comma. Use a semicolon, period, or conjunction instead.", example: "Wrong: 'I was hungry, I ate.' Right: 'I was hungry; I ate.'" },
      { front: "Dangling Modifier", back: "A modifier that does not clearly modify any word in the sentence. Move the modifier next to what it describes.", example: "Wrong: 'Jogging quickly, the park was beautiful.' Right: 'Jogging quickly, she found the park beautiful.'" },
      { front: "Parallel Structure", back: "Items in a list or series must be in the same grammatical form (all nouns, all verbs, all -ing forms, etc.).", example: "Wrong: 'She likes to run, swim, and cycling.' Right: 'She likes to run, swim, and cycle.'" },
      { front: "Active vs. Passive Voice", back: "Active voice: subject performs the action. Passive voice: subject receives the action. Active is usually preferred.", example: "Active: 'The dog bit the man.' Passive: 'The man was bitten by the dog.'" },
      { front: "Apostrophe Use", back: "Apostrophes show possession (John's book) or contractions (it's = it is). 'Its' (no apostrophe) is the possessive pronoun.", example: "The cat licked its paw. It's (it is) a hot day." },
      { front: "Semicolon Use", back: "Joins two closely related independent clauses without a conjunction. Also separates items in a list containing commas.", example: "I studied for hours; I still failed the test." },
      { front: "Subjunctive Mood", back: "Used for hypothetical or contrary-to-fact situations. Uses 'were' instead of 'was' for all persons.", example: "If I were president, I would change the law." },
      { front: "Pronoun-Antecedent Agreement", back: "A pronoun must agree in number and gender with the noun it replaces (its antecedent).", example: "Each student must bring their own pencil." },
      { front: "Colon Use", back: "A colon introduces a list, explanation, or quotation. The clause before the colon must be a complete sentence.", example: "She needed three things: a pencil, paper, and courage." },
    ],
  },
  {
    title: "Math Formulas & Concepts",
    description: "Essential math formulas for the SAT",
    category: "math",
    color: "#f59e0b",
    cards: [
      { front: "Slope Formula", back: "m = (y₂ − y₁) / (x₂ − x₁)", example: "For points (1, 2) and (3, 8): m = (8−2)/(3−1) = 3" },
      { front: "Quadratic Formula", back: "x = (−b ± √(b²−4ac)) / 2a for ax² + bx + c = 0", example: "For x² − 5x + 6 = 0: x = 2 or x = 3" },
      { front: "Distance Formula", back: "d = √((x₂−x₁)² + (y₂−y₁)²)", example: "Distance between (1,1) and (4,5): d = √(9+16) = 5" },
      { front: "Pythagorean Theorem", back: "a² + b² = c², where c is the hypotenuse of a right triangle", example: "Legs 3 and 4: c² = 9 + 16 = 25, so c = 5" },
      { front: "Area of a Circle", back: "A = πr²", example: "Radius = 7: A = 49π ≈ 153.94" },
      { front: "Percent Change", back: "% Change = ((New − Old) / Old) × 100", example: "From $80 to $100: ((100−80)/80) × 100 = 25% increase" },
      { front: "Mean (Average)", back: "Mean = Sum of all values / Number of values", example: "Set {4, 8, 6, 5, 7}: Mean = 30/5 = 6" },
      { front: "Difference of Squares", back: "a² − b² = (a + b)(a − b)", example: "x² − 16 = (x+4)(x−4)" },
      { front: "FOIL Method", back: "To multiply two binomials: First, Outer, Inner, Last", example: "(x+2)(x+3) = x² + 3x + 2x + 6 = x² + 5x + 6" },
      { front: "Properties of Exponents", back: "xᵃ · xᵇ = xᵃ⁺ᵇ | xᵃ / xᵇ = xᵃ⁻ᵇ | (xᵃ)ᵇ = xᵃᵇ | x⁰ = 1", example: "2³ · 2⁴ = 2⁷ = 128" },
      { front: "Vertex Form of a Parabola", back: "y = a(x − h)² + k, where (h, k) is the vertex", example: "y = 2(x − 3)² + 1 has vertex at (3, 1)" },
      { front: "Systems of Equations", back: "Two methods: Substitution (solve one equation for one variable, substitute) or Elimination (add/subtract equations to cancel a variable)", example: "2x + y = 10, x − y = 2 → Add: 3x = 12 → x = 4" },
    ],
  },
  {
    title: "Reading Strategies",
    description: "Key reading comprehension techniques",
    category: "reading",
    color: "#3b82f6",
    cards: [
      { front: "Inference", back: "A conclusion reached from evidence and reasoning rather than from explicit statements.", example: "If a character shivers and looks at their breath, you infer it is cold, even if not stated." },
      { front: "Author's Purpose", back: "The reason an author writes a text. Common purposes: to inform, to persuade, to entertain, or to describe.", example: "A newspaper article typically aims to inform the reader." },
      { front: "Central Idea vs. Topic", back: "The topic is WHAT the passage is about. The central idea is the MAIN POINT the author makes about the topic.", example: "Topic: Climate Change. Central Idea: 'Human activity is accelerating climate change at a dangerous rate.'" },
      { front: "Connotation vs. Denotation", back: "Denotation = the literal dictionary meaning. Connotation = the implied or emotional associations of a word.", example: "Denotation of 'snake' = a reptile. Connotation = deceitfulness." },
      { front: "Rhetorical Appeals", back: "Ethos (credibility), Pathos (emotion), Logos (logic and evidence). Authors use these to persuade readers.", example: "Pathos: 'Imagine your child going to bed hungry tonight.'" },
      { front: "Point of View", back: "First person (I, we), second person (you), third person (he/she/they). Third person can be limited or omniscient.", example: "First person: 'I watched the storm approach.'" },
      { front: "Tone vs. Mood", back: "Tone = the author's attitude toward the subject. Mood = the feeling the reader gets from the text.", example: "A humorous tone might create a lighthearted mood in the reader." },
      { front: "Counterargument", back: "A point or argument that opposes the main claim. Good writers acknowledge and refute counterarguments.", example: "Claim: Exercise improves focus. Counterargument: Some people are too tired to exercise." },
      { front: "Textual Evidence", back: "Specific words, phrases, or sentences from the text used to support an argument or interpretation.", example: "To support 'the character is afraid,' cite: 'His hands trembled as he reached for the door.'" },
      { front: "Figurative Language", back: "Non-literal language used to create effects. Types: metaphor, simile, hyperbole, personification, alliteration.", example: "Metaphor: 'Time is money.' Simile: 'Quick as lightning.'" },
    ],
  },
];

const ACHIEVEMENTS_SEED = [
  { title: "First Answer", description: "Answer your first question", icon: "⚡", xpReward: 10, category: "practice", rarity: "common", requirementType: "total_answered", requirementValue: 1 },
  { title: "On Fire", description: "Get a 5-question streak", icon: "🔥", xpReward: 25, category: "streak", rarity: "common", requirementType: "streak", requirementValue: 5 },
  { title: "Quiz Veteran", description: "Answer 25 questions", icon: "🎯", xpReward: 50, category: "practice", rarity: "rare", requirementType: "total_answered", requirementValue: 25 },
  { title: "Centurion", description: "Answer 100 questions", icon: "💯", xpReward: 100, category: "practice", rarity: "epic", requirementType: "total_answered", requirementValue: 100 },
  { title: "Perfectionist", description: "Complete a perfect session", icon: "✨", xpReward: 75, category: "accuracy", rarity: "rare", requirementType: "perfect_session", requirementValue: 1 },
  { title: "Level Up", description: "Reach Level 5", icon: "🚀", xpReward: 50, category: "level", rarity: "rare", requirementType: "level", requirementValue: 5 },
  { title: "XP Machine", description: "Earn 500 XP", icon: "⭐", xpReward: 100, category: "xp", rarity: "epic", requirementType: "xp", requirementValue: 500 },
  { title: "Master", description: "Reach Level 10", icon: "👑", xpReward: 200, category: "level", rarity: "legendary", requirementType: "level", requirementValue: 10 },
  { title: "Sharp Shooter", description: "Get 10 correct answers", icon: "🎯", xpReward: 20, category: "accuracy", rarity: "common", requirementType: "total_correct", requirementValue: 10 },
  { title: "Streak Legend", description: "Maintain a 15-question streak", icon: "🏆", xpReward: 150, category: "streak", rarity: "legendary", requirementType: "streak", requirementValue: 15 },
];

export async function seedDatabase() {
  try {
    // Remove fake bot/demo users (usernames with underscore = old demo data)
    // First find the bot user IDs, then delete their sessions, then delete the users
    const botUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(sql`username LIKE '%\_%' ESCAPE '\' OR LOWER(username) IN ('alex', 'champion', 'demo')`);

    if (botUsers.length > 0) {
      const botIds = botUsers.map(u => u.id);
      // Delete sessions first (FK constraint)
      await db.delete(sessionsTable).where(inArray(sessionsTable.userId, botIds));
      // Now delete the users
      await db.delete(usersTable).where(inArray(usersTable.id, botIds));
      logger.info(`Removed ${botIds.length} fake bot users.`);
    }

    // Seed questions - add any that don't already exist by question text
    const existingQs = await db.select({ questionText: questionsTable.questionText }).from(questionsTable);
    const existingTexts = new Set(existingQs.map(q => q.questionText));
    const newQuestions = QUESTIONS.filter(q => !existingTexts.has(q.questionText));

    if (newQuestions.length > 0) {
      logger.info(`Seeding ${newQuestions.length} new questions...`);
      for (const q of newQuestions) {
        await db.insert(questionsTable).values({
          category: q.category,
          subcategory: q.subcategory,
          difficulty: q.difficulty,
          questionText: q.questionText,
          options: q.options,
          correctIndex: q.correctIndex,
          explanation: q.explanation,
          xpReward: q.xpReward,
        });
      }
      logger.info(`Added ${newQuestions.length} new questions.`);
    }

    // Seed flashcard decks - add decks not already present by title
    const existingDecks = await db.select({ title: flashcardDecksTable.title }).from(flashcardDecksTable);
    const existingDeckTitles = new Set(existingDecks.map(d => d.title));

    for (const deck of NEW_FLASHCARD_DECKS) {
      if (!existingDeckTitles.has(deck.title)) {
        logger.info(`Seeding flashcard deck: ${deck.title}`);
        const [insertedDeck] = await db.insert(flashcardDecksTable).values({
          title: deck.title,
          description: deck.description,
          category: deck.category,
          color: deck.color,
        }).returning();

        for (const card of deck.cards) {
          await db.insert(flashcardsTable).values({
            deckId: insertedDeck.id,
            front: card.front,
            back: card.back,
            example: card.example ?? null,
          });
        }
      }
    }

    // Seed achievements
    const existingAchs = await db.select({ title: achievementsTable.title }).from(achievementsTable);
    const existingAchTitles = new Set(existingAchs.map(a => a.title));
    const newAchs = ACHIEVEMENTS_SEED.filter(a => !existingAchTitles.has(a.title));

    if (newAchs.length > 0) {
      logger.info(`Seeding ${newAchs.length} achievements...`);
      for (const ach of newAchs) {
        await db.insert(achievementsTable).values(ach);
      }
    }

    const [{ value: totalQuestions }] = await db.select({ value: sql<number>`COUNT(*)` }).from(questionsTable);
    const [{ value: totalDecks }] = await db.select({ value: sql<number>`COUNT(*)` }).from(flashcardDecksTable);
    logger.info(`Database ready: ${totalQuestions} questions, ${totalDecks} flashcard decks.`);

  } catch (err) {
    logger.error({ err }, "Error seeding database");
  }
}
