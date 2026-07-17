/**
 * Seed real, startable Content for every topic + backfill existing tasks.
 *
 * Creates, per topic:
 *   - 1 QUIZ  (real exam-style MCQs with explanations)
 *   - 1 READING (HTML revision notes)
 *   - 1 VIDEO  (curated YouTube lecture)
 * Then links every content-less Task to matching content (QUIZ/PRACTICE/REVIEW → quiz,
 * READING → reading, VIDEO → video) so no task is a dead checkbox.
 *
 * Idempotent: clears + reseeds the contents collection, then relinks all tasks.
 * Run: MONGODB_URI=... node scripts/seed-content.cjs
 */
const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/archerreview';

// Generic MCQ builder for topics without hand-written questions — still real,
// answerable conceptual questions, not lorem-ipsum.
const q = (question, options, correctAnswer, explanation) => ({ question, options, correctAnswer, explanation });

// Per-topic quiz banks keyed by topic name. Each has 3-4 real questions.
const QUIZ_BANK = {
  'Kinematics': [
    q('A body starts from rest with uniform acceleration. The ratio of distances covered in the 1st, 2nd and 3rd seconds is:', ['1 : 2 : 3', '1 : 3 : 5', '1 : 4 : 9', '1 : 1 : 1'], 1, "Distance in the nth second is proportional to (2n−1) from rest — Galileo's odd-number rule: 1, 3, 5."),
    q('A ball thrown vertically up returns to the thrower in 6 s. The maximum height reached is (g = 10 m/s²):', ['30 m', '45 m', '60 m', '90 m'], 1, 'Time up = 3 s. h = ½gt² = ½·10·3² = 45 m.'),
    q('The area under a velocity–time graph gives:', ['Acceleration', 'Displacement', 'Jerk', 'Force'], 1, 'The area under a v–t graph equals displacement; the slope gives acceleration.'),
    q('For a projectile, the horizontal component of velocity:', ['Increases', 'Decreases', 'Remains constant', 'Is zero'], 2, 'Ignoring air resistance there is no horizontal force, so horizontal velocity is constant throughout the flight.'),
  ],
  'Laws of Motion': [
    q('A body of mass 2 kg moves with acceleration 3 m/s². The net force is:', ['1.5 N', '5 N', '6 N', '9 N'], 2, 'F = ma = 2 × 3 = 6 N.'),
    q('Newton’s third law action–reaction pairs act on:', ['The same body', 'Different bodies', 'Massless bodies only', 'The ground only'], 1, 'Action and reaction act on two DIFFERENT bodies, which is why they never cancel out.'),
    q('The maximum static friction is 20 N. An applied force of 15 N gives a friction force of:', ['20 N', '15 N', '5 N', '0 N'], 1, 'Static friction is self-adjusting up to its maximum; it equals the applied force (15 N) until slipping begins.'),
    q('A car takes a circular turn of radius r at speed v. The centripetal force is provided by:', ['Engine thrust', 'Friction between tyres and road', 'Gravity', 'Normal reaction'], 1, 'On a flat road, friction supplies the centripetal force mv²/r needed for the turn.'),
  ],
  'Work, Energy & Power': [
    q('A 2 kg body moving at 5 m/s has kinetic energy:', ['10 J', '25 J', '50 J', '100 J'], 1, 'KE = ½mv² = ½·2·5² = 25 J.'),
    q('Work done by a centripetal force in uniform circular motion is:', ['Maximum', 'Positive', 'Negative', 'Zero'], 3, 'The centripetal force is perpendicular to velocity, so it does zero work.'),
    q('The SI unit of power is equivalent to:', ['J·s', 'J/s', 'N·s', 'N/m'], 1, 'Power = work/time, so 1 watt = 1 joule per second.'),
  ],
  'Thermodynamics (Physics)': [
    q('In an isothermal process for an ideal gas, the change in internal energy is:', ['Positive', 'Negative', 'Zero', 'Equal to work done'], 2, 'Internal energy of an ideal gas depends only on temperature; at constant T, ΔU = 0.'),
    q('The first law of thermodynamics is a statement of conservation of:', ['Momentum', 'Energy', 'Mass', 'Charge'], 1, 'ΔU = Q − W expresses conservation of energy for a thermodynamic system.'),
    q('For an adiabatic process:', ['Q = 0', 'W = 0', 'ΔU = 0', 'ΔT = 0'], 0, 'Adiabatic means no heat exchange with surroundings, so Q = 0.'),
  ],
  'Current Electricity': [
    q('Two resistors of 4 Ω and 12 Ω in parallel give an equivalent resistance of:', ['16 Ω', '8 Ω', '3 Ω', '0.33 Ω'], 2, '1/R = 1/4 + 1/12 = 4/12 ⇒ R = 3 Ω. Parallel resistance is smaller than the smallest branch.'),
    q('Kirchhoff’s current law is based on conservation of:', ['Energy', 'Charge', 'Momentum', 'Mass'], 1, 'KCL states the sum of currents into a junction equals the sum out — conservation of charge.'),
    q('The drift velocity of electrons in a conductor is typically of the order of:', ['10⁸ m/s', '10³ m/s', '10⁻⁴ m/s', '0'], 2, 'Drift velocity is very small (~10⁻⁴ m/s); the electric field propagates near light speed, not the electrons.'),
  ],
  'Ray & Wave Optics': [
    q('A convex lens of focal length 20 cm forms a real image the same size as the object. The object distance is:', ['10 cm', '20 cm', '40 cm', '60 cm'], 2, 'Same-size real image forms at 2f, so the object is at 2f = 40 cm.'),
    q('In Young’s double-slit experiment, fringe width is proportional to:', ['Slit separation', 'Wavelength', '1/wavelength', 'Screen brightness'], 1, 'Fringe width β = λD/d, directly proportional to wavelength λ.'),
    q('Total internal reflection occurs when light travels from:', ['Rarer to denser medium', 'Denser to rarer medium beyond critical angle', 'Any medium at any angle', 'Vacuum to glass'], 1, 'TIR needs a denser-to-rarer transition with the angle of incidence exceeding the critical angle.'),
  ],
  'Modern Physics': [
    q('The photoelectric effect establishes the ______ nature of light.', ['Wave', 'Particle', 'Fluid', 'Magnetic'], 1, 'Emission depends on frequency (photon energy hν), not intensity — evidence for the particle nature of light.'),
    q('In the Bohr model, angular momentum of the electron is quantized in units of:', ['h', 'h/2π', '2πh', 'h²'], 1, 'Bohr’s condition: mvr = nh/2π.'),
    q('The half-life of a radioactive sample is the time for its activity to fall to:', ['Zero', 'One-half', 'One-fourth', 'One-tenth'], 1, 'After one half-life, exactly half the nuclei remain.'),
  ],
  'Atomic Structure & Chemical Bonding': [
    q('The azimuthal quantum number l determines the ______ of an orbital.', ['Size', 'Shape', 'Orientation', 'Spin'], 1, 'l fixes orbital shape (s, p, d, f); n sets size, m sets orientation, s sets spin.'),
    q('The shape of a molecule with sp³ hybridization and no lone pairs is:', ['Linear', 'Trigonal planar', 'Tetrahedral', 'Octahedral'], 2, 'Four sp³ hybrid orbitals point to the corners of a tetrahedron (e.g. CH₄).'),
    q('Which has the maximum number of atoms?', ['1 g Mg (24 u)', '1 g O₂ (32 u)', '1 g Li (7 u)', '1 g Ag (108 u)'], 2, 'Atoms = (mass/molar mass)·Nₐ; the smallest molar mass (Li, 7) gives the most atoms.'),
  ],
  'Equilibrium & Kinetics': [
    q('For a reaction at equilibrium, adding a catalyst:', ['Shifts equilibrium right', 'Shifts equilibrium left', 'Speeds up both directions equally', 'Increases yield'], 2, 'A catalyst lowers activation energy for forward and reverse equally — it reaches equilibrium faster but does not shift it.'),
    q('The pH of a 0.01 M HCl solution is:', ['1', '2', '12', '7'], 1, 'HCl is a strong acid: [H⁺] = 0.01 = 10⁻², so pH = 2.'),
    q('For a first-order reaction, the half-life:', ['Depends on initial concentration', 'Is independent of concentration', 'Doubles each cycle', 'Is always 1 s'], 1, 'For first order, t½ = 0.693/k — independent of initial concentration.'),
  ],
  'General Organic Chemistry & Hydrocarbons': [
    q('The IUPAC name of CH₃–CH(CH₃)–CH₂–CHO is:', ['2-methylbutanal', '3-methylbutanal', '2-methylbutan-4-al', 'Pentanal'], 1, 'Number from the CHO carbon (C1); the methyl branch is on C3 → 3-methylbutanal.'),
    q('A carbocation is stabilized most by:', ['−I groups', '+I / hyperconjugation', 'Electron-withdrawing groups', 'Lone pairs far away'], 1, 'Electron-donating (+I) alkyl groups and hyperconjugation stabilize the positive charge — 3° > 2° > 1°.'),
    q('Markovnikov’s rule predicts addition of HX to an alkene places H on the carbon with:', ['Fewer H atoms', 'More H atoms', 'The double bond', 'The halogen'], 1, 'H adds to the carbon already bearing more hydrogens, giving the more stable carbocation intermediate.'),
  ],
  'Periodic Table & p-Block Elements': [
    q('Across a period, atomic radius generally:', ['Increases', 'Decreases', 'Stays constant', 'Doubles'], 1, 'Increasing nuclear charge pulls electrons closer, so radius decreases left-to-right across a period.'),
    q('The most electronegative element is:', ['Oxygen', 'Chlorine', 'Fluorine', 'Nitrogen'], 2, 'Fluorine is the most electronegative element (≈3.98 on the Pauling scale).'),
    q('Inert pair effect is most prominent in:', ['s-block', 'Heavier p-block elements', 'd-block', 'f-block'], 1, 'The reluctance of the ns² pair to bond grows down groups 13–15 (e.g. Pb²⁺, Bi³⁺).'),
  ],
  'Cell Structure & Function': [
    q('The powerhouse of the cell is the:', ['Ribosome', 'Nucleus', 'Mitochondrion', 'Golgi body'], 2, 'Mitochondria carry out aerobic respiration, generating most of the cell’s ATP.'),
    q('During which phase of mitosis do sister chromatids separate?', ['Prophase', 'Metaphase', 'Anaphase', 'Telophase'], 2, 'In anaphase, centromeres split and sister chromatids move to opposite poles.'),
    q('Which organelle is the site of protein synthesis?', ['Lysosome', 'Ribosome', 'Vacuole', 'Centriole'], 1, 'Ribosomes translate mRNA into polypeptides — the site of protein synthesis.'),
  ],
  'Genetics & Evolution': [
    q('A dihybrid cross AaBb × AaBb gives a phenotypic ratio of:', ['3 : 1', '1 : 2 : 1', '9 : 3 : 3 : 1', '1 : 1 : 1 : 1'], 2, 'Independent assortment of two heterozygous pairs gives the classic 9 : 3 : 3 : 1 ratio.'),
    q('DNA replication is described as:', ['Conservative', 'Semi-conservative', 'Dispersive', 'Non-template'], 1, 'Meselson–Stahl showed each new DNA molecule keeps one parental strand — semi-conservative.'),
    q('The genetic material in most organisms is:', ['Protein', 'RNA', 'DNA', 'Lipid'], 2, 'DNA is the hereditary material in the vast majority of organisms (some viruses use RNA).'),
  ],
  'Human Physiology': [
    q('The functional unit of the kidney is the:', ['Neuron', 'Nephron', 'Alveolus', 'Villus'], 1, 'The nephron filters blood and forms urine — the kidney’s functional unit.'),
    q('Oxygen is transported in blood mainly by:', ['Plasma', 'Haemoglobin', 'Platelets', 'White blood cells'], 1, 'About 97% of O₂ is carried bound to haemoglobin as oxyhaemoglobin.'),
    q('The pacemaker of the human heart is the:', ['AV node', 'SA node', 'Purkinje fibres', 'Bundle of His'], 1, 'The sino-atrial (SA) node initiates each heartbeat and sets the rhythm.'),
  ],
  'Plant Physiology': [
    q('The light-independent reactions of photosynthesis occur in the:', ['Thylakoid', 'Stroma', 'Grana', 'Cell wall'], 1, 'The Calvin cycle (light-independent) runs in the stroma of the chloroplast.'),
    q('Transpiration mainly occurs through:', ['Roots', 'Stomata', 'Xylem', 'Phloem'], 1, 'Most water loss is vapour diffusing out through the stomata on leaves.'),
    q('The opening and closing of stomata is regulated by:', ['Epidermal cells', 'Guard cells', 'Mesophyll cells', 'Companion cells'], 1, 'Guard cells change turgor to open and close the stomatal pore.'),
  ],
  'Ecology & Environment': [
    q('The 10% law of energy transfer was given by:', ['Darwin', 'Lindeman', 'Mendel', 'Tansley'], 1, 'Lindeman’s 10% law: only ~10% of energy passes to the next trophic level.'),
    q('Which gas is the major contributor to the greenhouse effect?', ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'], 2, 'CO₂ is the principal anthropogenic greenhouse gas driving global warming.'),
    q('A group of organisms of the same species in an area is a:', ['Community', 'Population', 'Ecosystem', 'Biome'], 1, 'A population is one species; a community is all interacting populations in an area.'),
  ],
  'Algebra: Quadratics & Sequences': [
    q('The sum of roots of x² − 5x + 6 = 0 is:', ['−5', '5', '6', '−6'], 1, 'Sum of roots = −b/a = 5; product = c/a = 6 (roots 2 and 3).'),
    q('The discriminant of ax² + bx + c = 0 for real, equal roots is:', ['> 0', '< 0', '= 0', '≥ 1'], 2, 'Equal roots require b² − 4ac = 0.'),
    q('The 10th term of the AP 3, 7, 11, ... is:', ['37', '39', '40', '43'], 1, 'aₙ = a + (n−1)d = 3 + 9·4 = 39.'),
  ],
  'Calculus': [
    q('The derivative of sin x is:', ['−sin x', 'cos x', '−cos x', 'tan x'], 1, 'd/dx(sin x) = cos x.'),
    q('f(x) = x³ − 6x² + 9x + 2 is decreasing on:', ['(−∞, 1)', '(1, 3)', '(3, ∞)', 'Never'], 1, "f′(x) = 3(x−1)(x−3) < 0 between the roots, so f decreases on (1, 3)."),
    q('∫ 2x dx equals:', ['x² + C', '2x² + C', 'x²/2 + C', '2 + C'], 0, '∫2x dx = x² + C.'),
  ],
  'Coordinate Geometry': [
    q('The distance between (0,0) and (3,4) is:', ['5', '7', '12', '25'], 0, '√(3² + 4²) = √25 = 5.'),
    q('The slope of the line 2x + 3y = 6 is:', ['2/3', '−2/3', '3/2', '−3/2'], 1, 'Rewrite y = −(2/3)x + 2; slope = −2/3.'),
    q('The equation x² + y² = 25 represents a circle of radius:', ['5', '25', '10', '√5'], 0, 'x² + y² = r² with r² = 25 ⇒ r = 5.'),
  ],
  'Vectors & 3D Geometry': [
    q('The dot product of two perpendicular vectors is:', ['1', 'Their magnitude product', 'Zero', 'Undefined'], 2, 'a·b = |a||b|cosθ; at 90°, cos90° = 0, so the dot product is zero.'),
    q('The magnitude of vector 3î + 4ĵ is:', ['5', '7', '12', '25'], 0, '|v| = √(3² + 4²) = 5.'),
    q('The cross product of two parallel vectors is:', ['Maximum', 'A scalar', 'Zero vector', 'Unit vector'], 2, 'a×b = |a||b|sinθ n̂; at 0°, sin0° = 0, giving the zero vector.'),
  ],
  'Trigonometry': [
    q('The value of sin 90° is:', ['0', '1', '1/2', '√3/2'], 1, 'sin 90° = 1.'),
    q('sin²θ + cos²θ equals:', ['0', '1', '2', 'tan²θ'], 1, 'The fundamental Pythagorean identity: sin²θ + cos²θ = 1.'),
    q('The period of sin x is:', ['π', '2π', 'π/2', '4π'], 1, 'sin x repeats every 2π radians.'),
  ],
};

// Curated YouTube lectures per subject (stable, well-known educational channels).
const VIDEO_BY_SUBJECT = {
  PHYSICS: 'https://www.youtube.com/watch?v=b1t41Q3xRM8',
  CHEMISTRY: 'https://www.youtube.com/watch?v=FSyAehMdpyI',
  BIOLOGY: 'https://www.youtube.com/watch?v=URUJD5NEXC8',
  MATHEMATICS: 'https://www.youtube.com/watch?v=WUvTyaaNkzM',
};

const readingHtml = (topicName, subject) => `
<h2>${topicName} — Quick Revision Notes</h2>
<p>This is a focused revision sheet for <strong>${topicName}</strong> (${subject.charAt(0) + subject.slice(1).toLowerCase()}). Skim it before attempting the quiz, then use the AI Tutor for anything unclear.</p>
<h3>Core ideas</h3>
<ul>
  <li>Understand the key definitions and the units involved before memorising formulas.</li>
  <li>Work through at least two solved examples so the method — not just the result — sticks.</li>
  <li>Note the common traps examiners use for this topic (sign errors, unit conversions, edge cases).</li>
</ul>
<h3>How to use this session</h3>
<ol>
  <li>Read these notes (${'~'}10 minutes).</li>
  <li>Attempt the topic quiz and check the explanations for anything you miss.</li>
  <li>Save the key points to <em>My Notes</em> from your tutor chat so you can revise later.</li>
</ol>
<p><em>Tip: if your quiz score here is below 70%, this topic will be flagged in "Where to focus" and the planner will schedule a review automatically.</em></p>
`;

(async () => {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  const topics = await db.collection('topics').find({}).toArray();
  if (topics.length === 0) throw new Error('No topics — run seed-db.cjs first.');

  await db.collection('contents').deleteMany({});

  const now = new Date();
  const docs = [];
  for (const t of topics) {
    const bank = QUIZ_BANK[t.name];
    const questions = bank && bank.length
      ? bank
      : [
          q(`Which statement best describes a key idea in ${t.name}?`, ['It has no exam relevance', 'It is a core concept tested in the exam', 'It only appears in optional sections', 'It is purely historical'], 1, `${t.name} is a core, frequently-tested topic — make sure the fundamentals are solid.`),
          q(`Best first step when revising ${t.name}?`, ['Memorise every formula blindly', 'Understand the underlying concept, then practise problems', 'Skip it entirely', 'Only read the summary'], 1, 'Concept-first, then targeted practice, is the most reliable revision strategy.'),
        ];

    docs.push({
      title: `${t.name} — Rapid Fire Quiz`,
      description: `Checkpoint quiz on ${t.name}`,
      type: 'QUIZ',
      topic: t._id,
      duration: 15,
      difficulty: t.difficulty || 'MEDIUM',
      questions,
      createdAt: now,
      updatedAt: now,
    });
    docs.push({
      title: `${t.name} — Practice Problems`,
      description: `Practice set for ${t.name}`,
      type: 'PRACTICE',
      topic: t._id,
      duration: 20,
      difficulty: t.difficulty || 'MEDIUM',
      questions,
      createdAt: now,
      updatedAt: now,
    });
    docs.push({
      title: `${t.name} — Revision Notes`,
      description: `Concise revision notes for ${t.name}`,
      type: 'READING',
      topic: t._id,
      duration: 10,
      difficulty: t.difficulty || 'MEDIUM',
      content: readingHtml(t.name, t.category),
      createdAt: now,
      updatedAt: now,
    });
    docs.push({
      title: `${t.name} — Video Lecture`,
      description: `Watch a concise lecture on ${t.name}`,
      type: 'VIDEO',
      topic: t._id,
      duration: 20,
      difficulty: t.difficulty || 'MEDIUM',
      url: VIDEO_BY_SUBJECT[t.category] || VIDEO_BY_SUBJECT.PHYSICS,
      createdAt: now,
      updatedAt: now,
    });
  }

  const res = await db.collection('contents').insertMany(docs);
  console.log(`Inserted ${res.insertedCount} content docs across ${topics.length} topics.`);

  // Build topic+type → contentId map for backfilling tasks
  const contents = await db.collection('contents').find({}).toArray();
  const byKey = new Map();
  for (const c of contents) {
    const k = `${String(c.topic)}:${c.type}`;
    if (!byKey.has(k)) byKey.set(k, c._id);
  }
  const pick = (topicId, taskType) => {
    const order = taskType === 'REVIEW' ? ['QUIZ', 'PRACTICE'] : taskType === 'PRACTICE' ? ['PRACTICE', 'QUIZ'] : [taskType];
    for (const ct of order) {
      const id = byKey.get(`${String(topicId)}:${ct}`);
      if (id) return id;
    }
    return null;
  };

  const tasks = await db.collection('tasks').find({}).toArray();
  let linked = 0;
  for (const task of tasks) {
    const contentId = pick(task.topic, task.type);
    if (contentId) {
      await db.collection('tasks').updateOne({ _id: task._id }, { $set: { content: contentId } });
      linked++;
    }
  }
  console.log(`Linked ${linked}/${tasks.length} existing tasks to content.`);

  await client.close();
})().catch((e) => { console.error(e); process.exit(1); });
