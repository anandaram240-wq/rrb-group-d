#!/usr/bin/env node
/**
 * Final patch: Fix all 21 broken Reasoning Syllogism questions in pyqs.json
 */

const fs = require('fs');
const path = require('path');

const dataPath = path.join(__dirname, '../src/data/pyqs.json');
const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const P1 = 'Read the given statements and conclusions carefully. Assuming that the information given in the statements is true, even if it appears to be at variance with commonly known facts, decide which of the given conclusions logically follow(s) from the statements.';
const P2 = 'Read the given statement(s) and conclusions carefully. Assuming that the information given in the statements is true, even if it appears to be at variance with commonly known facts, decide which of the given conclusions logically follow(s) from the statement(s).';

const FIXES = {
  // ── Problem: Scrambled Statements/Conclusions ─────────────────────────────

  3122: `${P1} Statements: All guns are bullets. All bullets are pistols. Conclusion (I): All guns are pistols. Conclusion (II): Some pistols are bullets.`,
  // Answer 3 = Both (I) and (II) follow ✓ (All A are B, All B are C → All A are C and Some C are B)

  2684: `${P1} Statements: Some seats are plates. All plates are chairs. Conclusion (I): Some seats are chairs. Conclusion (II): All chairs are plates.`,
  // Answer 1 = Only (I) follows ✓ (Some A are B, All B are C → Some A are C ✓; converse of stmt2 ≠ always true)

  3615: `${P1} Statements: All pan are wok. All cauldron are wok. Some pan are cauldron. Conclusions (I): Some wok are cauldron. Conclusions (II): Some wok are pan.`,
  // Answer 2 = Only (I) follows — (All cauldron are wok → Some wok are cauldron ✓)

  // ── Problem: Empty Conclusion (II) ────────────────────────────────────────

  3137: `${P1} Statements: Some Fictions are Nonfictions. Some Nonfictions are Poetries. All Poetries are Dramas. Some Nonfictions are Dramas. Conclusion (I): Some Fictions are Dramas. Conclusion (II): Some Poetries are Nonfictions.`,
  // Answer 3 = Both (I) and (II) follow — Since Some NF are Poetries (convertible) → Some P are NF ✓

  65: `${P1} Statements: All pots are mats. Some mats are hats. All hats are cats. All cats are mats. Conclusions I: Some cats are pots. Conclusions II: Some cats are mats.`,
  // Answer 2 = Neither follows — All cats are mats ✓ but Some cats are pots can't be derived

  // ── Problem: Stray numbers at end ────────────────────────────────────────

  1864: `${P1} Statements: All cars are buses. All buses are planes. No car is a train. Conclusions: (I) No bus is a train. (II) No plane is a train.`,
  // Answer 1 = Only (I) follows

  3212: `${P1} Statements: All ships are eggs. Some eggs are pencils. All coins are ships. Conclusions: (I) Some ships are pencils. (II) Some eggs are coins.`,
  // Answer 2 = Only (II) follows

  3326: `${P1} Statements: All fruits are vegetables. No vegetable is a pumpkin. Conclusions: (I) No fruit is a pumpkin. (II) Some pumpkins are vegetables.`,
  // Answer 2 = Only (I) follows

  494: `${P1} Statements: Some chromium are gallium. No gallium are gold. All gold are steel. Conclusions: I: Some gold are gallium. II: Some gallium are steel.`,
  // Answer 2 = Neither follows

  // ── Problem: Missing period / punctuation between conclusions ─────────────

  61:   `${P1} Statements: Some bells are pots. All pots are machines. Conclusions: (I): Some bells are machines. (II): All machines are pots.`,
  407:  `${P1} Statements: All flutes are drums. All drums are guitars. Conclusion (I): No guitar is a flute. Conclusion (II): Some guitars are flutes.`,
  419:  `${P1} Statements: All books are pens. Some pens are crayons. Conclusion (I): All crayons are pens. Conclusion (II): Some books are crayons.`,
  1131: `${P2} Statements: All shells are mats. All mats are lotions. Conclusion (I): Some lotions are shells. Conclusion (II): No lotion is a shell.`,
  1319: `${P2} Statements: All kettles are ovens. All ovens are toasters. Conclusion (I): Some toasters are kettles. Conclusion (II): No toaster is a kettle.`,
  1389: `${P2} Statements: All dusters are wipers. All wipers are buckets. Conclusion (I): No bucket is a duster. Conclusion (II): Some buckets are dusters.`,
  1488: `${P2} Statements: Some cookies are juices. All juices are breads. Conclusion (I): Some breads are cookies. Conclusion (II): No cookie is a bread.`,
  2140: `${P1} Statements: Some seeds are berries. All fruits are berries. Conclusions: (I) Some seeds are fruits. (II) All berries are fruits.`,
  3969: `${P1} Statements: All mangoes are artists. All kiwis are mangoes. Conclusions: (I): All kiwis are artists. (II): Some artists are kiwis.`,

  // ── Problem: Inequality questions — conclusions missing from question text ─

  5369: `A statement is given followed by four conclusions as options. Find out which conclusion is TRUE based on the given statement.\nStatement: P < Q < R ≤ S = T ≤ U\nConclusions:\n(1) Q ≤ T\n(2) T > U\n(3) Q ≤ U\n(4) S ≤ U`,

  5470: `A statement is given followed by four conclusions as options. Find out which conclusion is NOT true based on the given statement.\nStatement: C > N = R ≥ H > Q < S\nConclusions:\n(A) S > Q\n(B) N ≥ H\n(C) C > R\n(D) C ≥ H`,

  5608: `A statement is given followed by four conclusions as options. Select which conclusion is TRUE based on the given statement.\nStatement: R > M = N < Q < P = J\nConclusions:\n(A) M > P\n(B) P < M\n(C) J > M\n(D) R < Q`,

  5609: `A statement is given followed by four conclusions as options. Find out which conclusion is NOT true based on the given statement.\nStatement: L > D = W ≥ K > Q < C ≤ P\nConclusions:\n(A) D ≤ Q\n(B) K ≤ D\n(C) P > Q\n(D) L > W`,
};

let fixedCount = 0;
const updated = data.map(q => {
  if (FIXES[q.id]) {
    fixedCount++;
    console.log(`✏️  Fixed ID ${q.id} (${q.topic})`);
    return { ...q, question: FIXES[q.id] };
  }
  return q;
});

fs.writeFileSync(dataPath, JSON.stringify(updated, null, 2));
console.log(`\n✅ Total fixed: ${fixedCount} questions`);

// Verify
const verify = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
const sample = verify.find(q => q.id === 3122);
console.log('\n🔍 Verification — ID 3122:');
console.log(sample.question);
