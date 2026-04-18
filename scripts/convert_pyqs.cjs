/**
 * Converts RRB_GroupD_PYQ_4478Q_Complete.json into the app's expected format.
 * Topic names match the deployed site at rrb-group-d.vercel.app
 */

const fs = require('fs');
const path = require('path');

const INPUT  = '/Users/ananda/Documents/RRB WEB/RRB_GroupD_PYQ_4478Q_Complete.json';
const OUTPUT = path.resolve(__dirname, '../src/data/pyqs.json');

const raw = JSON.parse(fs.readFileSync(INPUT, 'utf-8'));
console.log(`Loaded ${raw.length} questions from source.`);

// --- Subject normalization ---
const SUBJECT_MAP = {
  'Current Affairs': 'General Awareness',
  'General Knowledge': 'General Awareness',
  'GK': 'General Awareness',
};
function normalizeSubject(s) {
  return SUBJECT_MAP[s] || s;
}

// ══════════════════════════════════════════════
// TOPIC CLASSIFICATION — matches rrb-group-d.vercel.app exactly
// ══════════════════════════════════════════════

function classifyMathTopic(q) {
  const t = q.toLowerCase();
  if (t.includes('compound interest') || t.includes('compounded') || t.includes('c.i.') || t.includes('ci =')) return 'Compound Interest';
  if (t.includes('simple interest') || t.includes('s.i.') || t.includes('si =') || (t.includes('interest') && !t.includes('compound'))) return 'Simple Interest';
  if (t.includes('profit') || t.includes('loss') || t.includes('cost price') || t.includes('selling price') || t.includes('c.p.') || t.includes('s.p.') || t.includes('marked price') || t.includes('discount')) return 'Profit & Loss';
  if (t.includes('percent') || t.includes('%')) return 'Percentage';
  if (t.includes('pipe') || t.includes('cistern') || t.includes('tap') || t.includes('tank') || t.includes('leak') || t.includes('fill')) return 'Pipes & Cisterns';
  if (t.includes('boat') || t.includes('stream') || t.includes('downstream') || t.includes('upstream')) return 'Boats & Streams';
  if (t.includes('speed') || t.includes('train') || t.includes('km/h') || t.includes('km/hr') || t.includes('m/s') || t.includes('distance') || t.includes('race') || t.includes('overtake')) return 'Time, Speed & Distance';
  if (t.includes('work') || (t.includes('days') && (t.includes('complete') || t.includes('finish') || t.includes('together')))) return 'Time & Work';
  if (t.includes('ratio') || t.includes('proportion')) return 'Ratio & Proportion';
  if (t.includes('average') || t.includes('mean')) return 'Average';
  if (t.includes('age') || t.includes('years old') || t.includes('years ago') || t.includes('years hence') || t.includes('born')) return 'Ages';
  if (t.includes('volume') || t.includes('cylinder') || t.includes('sphere') || t.includes('cone') || t.includes('hemisphere') || t.includes('cube') || t.includes('cuboid') || t.includes('surface area') || t.includes('tsa') || t.includes('csa') || t.includes('lateral')) return '3D (Volume, Surface Area)';
  if (t.includes('circle') || t.includes('semicircle') || t.includes('radius') || t.includes('diameter') || t.includes('circumference') || t.includes('sector') || t.includes('arc')) return 'Circles';
  if (t.includes('quadrilateral') || t.includes('parallelogram') || t.includes('rhombus') || t.includes('trapezium') || t.includes('rectangle') || t.includes('square')) return 'Quadrilaterals';
  if (t.includes('angle') || t.includes('parallel') || t.includes('perpendicular') || t.includes('bisect') || t.includes('transversal') || t.includes('line')) return 'Lines & Angles';
  if (t.includes('triangle') || t.includes('area') || t.includes('perimeter') || t.includes('diagonal')) return '2D (Area, Perimeter)';
  if (t.includes('hcf') || t.includes('lcm') || t.includes('highest common') || t.includes('least common') || t.includes('common factor') || t.includes('common multiple')) return 'LCM & HCF';
  if (t.includes('prime') || t.includes('divisible') || t.includes('factor') || t.includes('remainder') || t.includes('digit') || t.includes('even') || t.includes('odd') || t.includes('natural number') || t.includes('whole number') || t.includes('integer')) return 'Number System';
  if (t.includes('equation') || t.includes('solve for') || t.includes('value of x') || t.includes('linear')) return 'Linear Equations';
  if (t.includes('sin') || t.includes('cos') || t.includes('tan') || t.includes('trigonometr') || t.includes('sec') || t.includes('cosec') || t.includes('cot')) return 'Basic Ratios';
  if (t.includes('simplif') || t.includes('bodmas') || t.includes('fraction') || t.includes('decimal') || t.includes('√') || t.includes('square root') || t.includes('cube root')) return 'Simplification';
  return 'Number System';
}

function classifyReasoningTopic(q) {
  const t = q.toLowerCase();
  if (/[A-Z]{2,}/.test(q) && (t.includes('letter') || t.includes('alphabet'))) return 'Alphabet Series';
  if (t.includes('series') || t.includes('next') || t.includes('missing') || t.includes('wrong number') || t.includes('find the') && t.includes('?')) return 'Number Series';
  if (t.includes('odd one') || t.includes('does not belong') || t.includes('different from') || t.includes('which is different') || t.includes('unlike')) return 'Classification (Odd One Out)';
  if (t.includes('analogy') || t.includes('related') || t.includes('same way') || t.includes('is to') || t.includes('as') && t.includes('is to')) return 'Analogies';
  if (t.includes('code') || t.includes('coded') || t.includes('language') || t.includes('cipher')) return 'Coding-Decoding';
  if (t.includes('sitting') || t.includes('circular') || t.includes('round') || t.includes('facing') || t.includes('seat') || t.includes('neighbour') || t.includes('table')) return 'Seating Arrangement';
  if (t.includes('direction') || t.includes('north') || t.includes('south') || t.includes('east') || t.includes('west') || t.includes('left turn') || t.includes('right turn') || t.includes('walked') || t.includes('km') && t.includes('turn')) return 'Direction Sense';
  if (t.includes('blood') || t.includes('brother') || t.includes('sister') || t.includes('mother') || t.includes('father') || t.includes('son') || t.includes('daughter') || t.includes('uncle') || t.includes('aunt') || t.includes('nephew') || t.includes('niece') || t.includes('grandson') || t.includes('granddaughter')) return 'Blood Relations';
  if (t.includes('rank') || t.includes('position') || t.includes('stacked') || t.includes('topmost') || t.includes('bottom') || t.includes('top') && t.includes('arrangement')) return 'Ranking & Arrangement';
  if (t.includes('syllogism') || t.includes('conclusion') || t.includes('statement') || t.includes('all') && t.includes('some') && t.includes('no')) return 'Syllogism';
  if (t.includes('mirror') || t.includes('water image')) return 'Mirror & Water Image';
  if (t.includes('venn') || t.includes('diagram')) return 'Venn Diagrams';
  if (t.includes('puzzle')) return 'Puzzle';
  if (t.includes('stands for') || t.includes('interchange') || t.includes('replace') || t.includes('÷') || t.includes('×')) return 'Mathematical Operations';
  return 'Number Series'; // default for reasoning
}

function classifyScienceTopic(q) {
  const t = q.toLowerCase();
  // Physics
  if (t.includes('motion') || t.includes('velocity') || t.includes('acceleration') || t.includes('speed') || t.includes('inertia') || t.includes('momentum') || t.includes('projectile') || t.includes('displacement')) return 'Motion';
  if (t.includes('force') || t.includes('newton') || t.includes('gravity') || t.includes('friction') || t.includes('pressure') || t.includes('thrust') || t.includes('buoyancy') || t.includes('archimedes')) return 'Force & Laws';
  if (t.includes('energy') || t.includes('work') || t.includes('power') || t.includes('joule') || t.includes('watt') || t.includes('kinetic') || t.includes('potential') || t.includes('conservation of energy')) return 'Work, Energy, Power';
  if (t.includes('light') || t.includes('mirror') || t.includes('lens') || t.includes('reflection') || t.includes('refraction') || t.includes('prism') || t.includes('colour') || t.includes('color') || t.includes('spectrum') || t.includes('convex') || t.includes('concave') || t.includes('focal') || t.includes('optical')) return 'Light';
  if (t.includes('sound') || t.includes('echo') || t.includes('frequency') || t.includes('wave') || t.includes('ultrasound') || t.includes('hertz') || t.includes('sonar') || t.includes('decibel') || t.includes('pitch')) return 'Sound';
  if (t.includes('electric') || t.includes('current') || t.includes('resistance') || t.includes('ohm') || t.includes('volt') || t.includes('circuit') || t.includes('fuse') || t.includes('transformer') || t.includes('battery') || t.includes('conductor') || t.includes('insulator')) return 'Electricity';
  if (t.includes('magnet') || t.includes('magnetic') || t.includes('electromagnet') || t.includes('compass') || t.includes('solenoid') || t.includes('field line')) return 'Magnetism';
  if (t.includes('heat') || t.includes('temperature') || t.includes('thermometer') || t.includes('conduction') || t.includes('convection') || t.includes('radiation') || t.includes('celsius') || t.includes('boiling') || t.includes('melting') || t.includes('latent') || t.includes('thermal') || t.includes('calorimeter')) return 'Heat';
  // Chemistry
  if (t.includes('acid') || t.includes('base') || t.includes('salt') || t.includes('ph') || t.includes('litmus') || t.includes('indicator') || t.includes('neutrali') || t.includes('antacid')) return 'Acids, Bases, Salts';
  if (t.includes('atom') || t.includes('molecule') || t.includes('atomic') || t.includes('valency') || t.includes('isotope') || t.includes('isobar') || t.includes('ion') || t.includes('proton') || t.includes('neutron') || t.includes('electron') || t.includes('orbital') || t.includes('shell')) return 'Atomic Structure';
  if (t.includes('periodic') || t.includes('metal') || t.includes('non-metal') || t.includes('metalloid') || t.includes('noble gas') || t.includes('alloy') || t.includes('ore') || t.includes('mineral') || t.includes('corrosion') || t.includes('galvani') || t.includes('electroplating')) return 'Metals & Non-metals';
  if (t.includes('reaction') || t.includes('oxidation') || t.includes('reduction') || t.includes('combustion') || t.includes('rusting') || t.includes('displacement') || t.includes('decomposition') || t.includes('combination') || t.includes('exothermic') || t.includes('endothermic') || t.includes('balanced equation')) return 'Chemical Reactions';
  if (t.includes('carbon') || t.includes('hydrocarbon') || t.includes('organic') || t.includes('alkane') || t.includes('alkene') || t.includes('alkyne') || t.includes('ethanol') || t.includes('methane') || t.includes('homologous') || t.includes('soap') || t.includes('detergent')) return 'Carbon Compounds';
  if (t.includes('matter') || t.includes('solid') || t.includes('liquid') || t.includes('gas') || t.includes('sublimation') || t.includes('evaporation') || t.includes('solution') || t.includes('colloid') || t.includes('suspension') || t.includes('mixture') || t.includes('solvent') || t.includes('solute') || t.includes('tyndall') || t.includes('saturated')) return 'Matter';
  // Biology
  if (t.includes('cell') || t.includes('tissue') || t.includes('nucleus') || t.includes('mitochondria') || t.includes('chloroplast') || t.includes('plastid') || t.includes('organelle') || t.includes('cytoplasm') || t.includes('endoplasmic') || t.includes('golgi') || t.includes('ribosome') || t.includes('vacuole') || t.includes('lysosome')) return 'Cell';
  if (t.includes('nutrition') || t.includes('digestion') || t.includes('enzyme') || t.includes('stomach') || t.includes('intestine') || t.includes('liver') || t.includes('vitamin') || t.includes('protein') || t.includes('carbohydrate') || t.includes('food') || t.includes('calorie') || t.includes('bile') || t.includes('pepsin') || t.includes('amylase') || t.includes('trypsin')) return 'Nutrition';
  if (t.includes('disease') || t.includes('virus') || t.includes('bacteria') || t.includes('vaccine') || t.includes('immunity') || t.includes('malaria') || t.includes('tuberculosis') || t.includes('infection') || t.includes('pathogen') || t.includes('antibiotic') || t.includes('aids') || t.includes('dengue') || t.includes('cholera')) return 'Diseases';
  if (t.includes('plant') || t.includes('leaf') || t.includes('root') || t.includes('stem') || t.includes('flower') || t.includes('seed') || t.includes('photosynthesis') || t.includes('xylem') || t.includes('phloem') || t.includes('crop') || t.includes('pollen') || t.includes('transpiration') || t.includes('rabi') || t.includes('kharif') || t.includes('stomata') || t.includes('chlorophyll')) return 'Plant Physiology';
  if (t.includes('blood') || t.includes('heart') || t.includes('lung') || t.includes('kidney') || t.includes('brain') || t.includes('nerve') || t.includes('hormone') || t.includes('respiration') || t.includes('excretion') || t.includes('circulat') || t.includes('skeleton') || t.includes('bone') || t.includes('muscle') || t.includes('gland') || t.includes('organ') || t.includes('body')) return 'Human Body';
  if (t.includes('reproduction') || t.includes('fertilization') || t.includes('embryo') || t.includes('ovary') || t.includes('sperm') || t.includes('puberty') || t.includes('reproductive') || t.includes('menstrual') || t.includes('placenta') || t.includes('pollination') || t.includes('budding') || t.includes('fission')) return 'Reproduction';
  if (t.includes('evolution') || t.includes('heredity') || t.includes('gene') || t.includes('dna') || t.includes('chromosome') || t.includes('mendel') || t.includes('trait') || t.includes('variation') || t.includes('allele') || t.includes('dominant') || t.includes('recessive') || t.includes('phenotype') || t.includes('genotype')) return 'Genetics';
  if (t.includes('ecosystem') || t.includes('biodiversity') || t.includes('environment') || t.includes('food chain') || t.includes('ozone') || t.includes('pollution') || t.includes('ecology') || t.includes('conservation') || t.includes('global warming') || t.includes('greenhouse')) return 'Environment';
  if (t.includes('animal') || t.includes('mammal') || t.includes('reptile') || t.includes('bird') || t.includes('fish') || t.includes('insect') || t.includes('species') || t.includes('amphibian')) return 'Classification';
  return 'General Science';
}

function classifyGATopic(q) {
  const t = q.toLowerCase();
  if (t.includes('sport') || t.includes('cricket') || t.includes('olympic') || t.includes('world cup') || t.includes('tournament') || t.includes('trophy') || t.includes('medal') || t.includes('player') || t.includes('match') || t.includes('game') || t.includes('hockey') || t.includes('football') || t.includes('tennis') || t.includes('badminton')) return 'Sports';
  if (t.includes('award') || t.includes('prize') || t.includes('honour') || t.includes('honor') || t.includes('bharat ratna') || t.includes('padma') || t.includes('nobel') || t.includes('arjuna') || t.includes('dronacharya') || t.includes('sahitya') || t.includes('ramon magsaysay')) return 'Awards & Honors';
  if (t.includes('book') || t.includes('author') || t.includes('written by') || t.includes('novel') || t.includes('literature') || t.includes('poet') || t.includes('autobiography')) return 'Books & Authors';
  if (t.includes('constitution') || t.includes('parliament') || t.includes('president') || t.includes('prime minister') || t.includes('supreme court') || t.includes('fundamental') || t.includes('amendment') || t.includes('article') || t.includes('lok sabha') || t.includes('rajya sabha') || t.includes('governor') || t.includes('election') || t.includes('panchayat') || t.includes('legislature')) return 'Polity';
  if (t.includes('geography') || t.includes('river') || t.includes('mountain') || t.includes('ocean') || t.includes('continent') || t.includes('climate') || t.includes('soil') || t.includes('plateau') || t.includes('desert') || t.includes('island') || t.includes('lake') || t.includes('glacier') || t.includes('volcano') || t.includes('rainfall') || t.includes('monsoon') || t.includes('tropic')) return 'Geography';
  if (t.includes('gdp') || t.includes('economy') || t.includes('budget') || t.includes('tax') || t.includes('rbi') || t.includes('inflation') || t.includes('bank') || t.includes('fiscal') || t.includes('niti') || t.includes('rupee') || t.includes('currency') || t.includes('gst') || t.includes('monetary') || t.includes('reserve bank') || t.includes('repo rate') || t.includes('sebi')) return 'Economy';
  if (t.includes('history') || t.includes('ancient') || t.includes('medieval') || t.includes('mughal') || t.includes('british') || t.includes('independence') || t.includes('revolt') || t.includes('dynasty') || t.includes('emperor') || t.includes('mahatma') || t.includes('gandhi') || t.includes('freedom') || t.includes('temple') || t.includes('monument') || t.includes('vedic') || t.includes('maurya') || t.includes('gupta') || t.includes('delhi sultan') || t.includes('battle')) return 'Static GK';
  if (t.includes('state') || t.includes('capital') || t.includes('headquarter') || t.includes('largest') || t.includes('smallest') || t.includes('highest') || t.includes('longest') || t.includes('first') || t.includes('national') || t.includes('country') || t.includes('world') && !t.includes('world cup')) return 'Static GK';
  if (t.includes('scheme') || t.includes('mission') || t.includes('yojana') || t.includes('programme') || t.includes('initiative') || t.includes('swachh') || t.includes('digital india') || t.includes('make in india')) return 'Current Affairs';
  if (t.includes('culture') || t.includes('heritage') || t.includes('dance') || t.includes('festival') || t.includes('folk') || t.includes('tradition') || t.includes('art') || t.includes('music') || t.includes('classical')) return 'Static GK';
  if (t.includes('day') || t.includes('celebrated') || t.includes('observed')) return 'Current Affairs';
  if (t.includes('satellite') || t.includes('isro') || t.includes('space') || t.includes('technology') || t.includes('invention') || t.includes('scientist') || t.includes('discovery') || t.includes('nasa') || t.includes('chandrayaan') || t.includes('mangalyaan')) return 'Current Affairs';
  return 'Current Affairs';
}

// --- Normalize topic based on source topic + question text ---
function normalizeTopic(srcTopic, subject, question) {
  const normalizedSubject = normalizeSubject(subject);
  
  if (normalizedSubject === 'Mathematics') return classifyMathTopic(question);
  if (normalizedSubject === 'Reasoning') return classifyReasoningTopic(question);
  if (normalizedSubject === 'General Science') return classifyScienceTopic(question);
  if (normalizedSubject === 'General Awareness') return classifyGATopic(question);
  
  return srcTopic;
}

// --- Answer letter -> index ---
const letterToIndex = { 'A': 0, 'B': 1, 'C': 2, 'D': 3 };

// --- Strip option prefixes ---
function cleanOption(opt) {
  return opt.replace(/^[A-D]\.\s*/, '').trim();
}

// --- Assign difficulty ---
function assignDifficulty(q) {
  const qLen = q.question.length;
  const topic = (q.topic || '').toLowerCase();
  const hardTopics = ['compound interest', 'algebra', 'trigonometry', '3d', 'linear equation'];
  const hardKeywords = ['cube root', 'square root', 'compound interest', 'quadrilateral', 'parallelogram', 'rhombus', 'cylinder', 'sphere', 'cone', 'hemisphere'];
  const isHardTopic = hardTopics.some(t => topic.includes(t));
  const hasHardKeyword = hardKeywords.some(k => q.question.toLowerCase().includes(k));
  const isLongQuestion = qLen > 300;
  if ((isHardTopic && isLongQuestion) || (isHardTopic && hasHardKeyword)) return 'hard';
  if (isHardTopic || hasHardKeyword || isLongQuestion) return 'medium';
  const easyKeywords = ['which of the following', 'identify', 'name the', 'what is', 'who is', 'which one'];
  const isShort = qLen < 100;
  const hasEasyKeyword = easyKeywords.some(k => q.question.toLowerCase().includes(k));
  if (isShort && hasEasyKeyword) return 'easy';
  if (isShort) return 'easy';
  if (hasEasyKeyword) return 'easy';
  return 'medium';
}

// --- Solution generator ---
function generateSolution(q, correctIdx) {
  const correctOpt = cleanOption(q.options[correctIdx] || '');
  const letter = String.fromCharCode(65 + correctIdx);
  const sol = q.solution || '';
  const isPlaceholder = sol.toLowerCase().includes('refer to standard') || sol.trim() === '' || sol === '—';
  
  let result = `✅ Correct Answer: (${letter}) ${correctOpt}\n\n`;
  
  if (!isPlaceholder) {
    let cleaned = sol
      .replace(/✓\s*Answer:\s*[A-D]\.?\s*[^\\n]*/i, '')
      .replace(/📘\s*Concept:/g, '\n📘 Key Concept:\n')
      .replace(/📐\s*Formula\/Hint:/g, '\n📐 Formula:\n')
      .replace(/🧠\s*Logic:/g, '\n🧠 Logic:\n')
      .replace(/\\n/g, '\n')
      .trim();
    if (cleaned) result += `📖 Explanation:\n${cleaned}\n\n`;
  } else {
    result += `📖 Explanation:\nThe correct answer is option (${letter}): ${correctOpt}.\n\n`;
  }
  
  const subject = normalizeSubject(q.subject || '');
  const tips = {
    'Mathematics': '📝 Exam Tip: Mathematics carries 25 marks. Practice calculations mentally to save time.',
    'General Science': '📝 Exam Tip: General Science (25 marks) — focus on NCERT Class 9 & 10 concepts.',
    'Reasoning': '📝 Exam Tip: Reasoning (30 marks) is the highest-weightage section. Speed and accuracy are key.',
    'General Awareness': '📝 Exam Tip: GK (20 marks) — read daily news and make short notes.',
  };
  if (tips[subject]) result += '\n' + tips[subject];
  
  return result.trim();
}

// --- Process all questions ---
let skipped = 0;
let noAnswer = 0;

const converted = raw.map((q, i) => {
  let correctAnswer = -1;
  const ans = (q.answer || '').trim().toUpperCase();
  if (letterToIndex[ans] !== undefined) {
    correctAnswer = letterToIndex[ans];
  } else {
    const solMatch = (q.solution || '').match(/Answer:\s*([A-D])/i);
    if (solMatch) {
      correctAnswer = letterToIndex[solMatch[1].toUpperCase()];
    } else {
      correctAnswer = 0;
      noAnswer++;
    }
  }
  
  const options = (q.options || []).map(cleanOption);
  const solution = generateSolution(q, correctAnswer);
  const subject = normalizeSubject(q.subject || 'General');
  const topic = normalizeTopic(q.topic || 'Miscellaneous', q.subject || 'General', q.question || '');
  const difficulty = assignDifficulty(q);
  const tags = [subject, topic, difficulty];
  
  return {
    id: q.id || (i + 1),
    subject, topic, question: q.question || '', options, correctAnswer, solution, difficulty,
    exam_year: '', shift: '', tags,
  };
}).filter(q => {
  if (!q.question || q.question.length < 10) { skipped++; return false; }
  if (q.options.length < 4) { skipped++; return false; }
  if (q.options.some(o => o === '—' || o === '' || o === '-')) { skipped++; return false; }
  return true;
});

console.log(`Converted: ${converted.length} questions`);
console.log(`Skipped: ${skipped} (bad format)`);
console.log(`No clear answer: ${noAnswer} (defaulted to A)`);

const subjectDist = {};
converted.forEach(q => { subjectDist[q.subject] = (subjectDist[q.subject] || 0) + 1; });
console.log('\nSubject Distribution:');
Object.entries(subjectDist).sort((a,b) => b[1]-a[1]).forEach(([s,c]) => console.log(`  ${s}: ${c}`));

const diffDist = {};
converted.forEach(q => { diffDist[q.difficulty] = (diffDist[q.difficulty] || 0) + 1; });
console.log('\nDifficulty Distribution:');
Object.entries(diffDist).forEach(([d,c]) => console.log(`  ${d}: ${c}`));

const topicDist = {};
converted.forEach(q => {
  if (!topicDist[q.subject]) topicDist[q.subject] = {};
  topicDist[q.subject][q.topic] = (topicDist[q.subject][q.topic] || 0) + 1;
});
console.log('\nTopic Distribution:');
Object.entries(topicDist).forEach(([sub, topics]) => {
  console.log(`\n  ${sub}:`);
  Object.entries(topics).sort((a,b) => b[1]-a[1]).forEach(([t, c]) => console.log(`    ${t}: ${c}`));
});

fs.writeFileSync(OUTPUT, JSON.stringify(converted, null, 0));
const sizeMB = (fs.statSync(OUTPUT).size / (1024*1024)).toFixed(2);
console.log(`\nOutput: ${OUTPUT} (${sizeMB} MB)`);
