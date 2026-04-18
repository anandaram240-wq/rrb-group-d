#!/usr/bin/env python3
"""
RRB Group D PYQ — Step-by-Step Solution Generator
Uses Gemini API to generate proper solutions for all questions.

Usage:
  1. Set your Gemini API key:
     export GEMINI_API_KEY="your-key-here"
  2. Run:
     python3 scripts/generate_solutions.py

  Options:
    --batch-size N     Questions per API call (default: 5)
    --start-from N     Resume from question index N (default: 0)
    --dry-run          Process only first 10 questions
    --output FILE      Output file (default: src/data/pyqs.json)
"""

import json
import os
import sys
import time
import argparse
import re
from pathlib import Path

# ─── Config ──────────────────────────────────────────────────────────────────

API_KEY = os.environ.get("GEMINI_API_KEY", "")
MODEL = "gemini-2.0-flash"
API_URL = f"https://generativelanguage.googleapis.com/v1beta/models/{MODEL}:generateContent"

RATE_LIMIT_DELAY = 1.5  # seconds between API calls
MAX_RETRIES = 3

# ─── Subject-specific prompt templates ────────────────────────────────────────

SUBJECT_PROMPTS = {
    "Mathematics": """You are an expert RRB Group D Mathematics tutor. Generate a clear, step-by-step solution.

Rules:
- Show EVERY calculation step (don't skip steps)
- Use the actual numbers from the question
- Show formula substitution clearly
- Include the relevant formula used
- Give a practical exam tip for this type of problem
- Keep language simple (for Indian railway exam students)
- If the question involves units, track units throughout""",

    "Reasoning": """You are an expert RRB Group D Reasoning tutor. Generate a clear, step-by-step logical solution.

Rules:
- Break down the reasoning into numbered logical steps
- For series: show the pattern clearly
- For direction problems: draw the path step by step
- For coding/decoding: show the mapping
- For analogies: explain the relationship
- For blood relations: trace relationships step by step
- For Venn diagrams: explain set relationships
- Keep language simple and clear""",

    "General Science": """You are an expert RRB Group D General Science tutor (NCERT Class 9-10 level).

Rules:
- Explain WHY the correct answer is right
- Briefly explain why other options are wrong (1 line each)
- Reference the relevant NCERT concept
- Include the key scientific principle/law
- Keep explanation concise but educational
- Focus on facts that help remember the answer""",

    "General Awareness": """You are an expert RRB Group D General Awareness tutor.

Rules:
- State the correct fact clearly
- Provide 2-3 additional context points that help remember
- For current affairs: mention date, place, who was involved
- For history: mention era, significance
- For geography: mention location context
- For polity: mention the relevant article/provision
- Keep it factual and concise"""
}


def get_solution_prompt(questions_batch):
    """Build the prompt for a batch of questions."""
    
    prompts = []
    for i, q in enumerate(questions_batch):
        subject = q.get("subject", "General")
        subject_instruction = SUBJECT_PROMPTS.get(subject, SUBJECT_PROMPTS["General Awareness"])
        
        correct_letter = chr(65 + q["correctAnswer"])  # A, B, C, D
        correct_text = q["options"][q["correctAnswer"]] if q["correctAnswer"] < len(q["options"]) else ""
        
        options_text = "\n".join([f"  {chr(65+j)}. {opt}" for j, opt in enumerate(q["options"])])
        
        prompts.append(f"""
---QUESTION {i+1}---
Subject: {subject}
Topic: {q.get("topic", "")}
Question: {q["question"]}
Options:
{options_text}
Correct Answer: ({correct_letter}) {correct_text}
""")
    
    full_prompt = f"""Generate step-by-step solutions for the following RRB Group D exam questions.

{subject_instruction}

For EACH question, output in this EXACT format (preserve emojis and formatting exactly):

===SOLUTION {"{N}"}===
✅ Correct Answer: ({"{letter}"}) {"{answer text}"}

📖 Step-by-Step Solution:
1. [First step with actual calculation/reasoning]
2. [Second step]
3. [Third step if needed]
4. [Final answer derivation]

📐 Key Concept: [One-line formula or principle used]

💡 Exam Tip: [One practical tip for solving this type of question quickly]
===END===

{"".join(prompts)}

IMPORTANT: 
- Generate solutions for ALL {len(questions_batch)} questions above.
- Use ===SOLUTION N=== and ===END=== markers for each.
- Show actual numbers and calculations, not generic text.
- Each solution should be specific to that exact question.
"""
    return full_prompt


def call_gemini_api(prompt):
    """Call Gemini API and return the response text."""
    import urllib.request
    import urllib.error
    
    url = f"{API_URL}?key={API_KEY}"
    
    payload = json.dumps({
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": 0.3,
            "maxOutputTokens": 8192,
        }
    }).encode("utf-8")
    
    req = urllib.request.Request(
        url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    
    try:
        with urllib.request.urlopen(req, timeout=120) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            # Extract text from Gemini response
            candidates = data.get("candidates", [])
            if candidates:
                parts = candidates[0].get("content", {}).get("parts", [])
                if parts:
                    return parts[0].get("text", "")
        return ""
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8") if e.fp else ""
        print(f"  ❌ HTTP {e.code}: {error_body[:200]}")
        raise
    except Exception as e:
        print(f"  ❌ Error: {e}")
        raise


def parse_solutions(response_text, count):
    """Parse the API response into individual solutions."""
    solutions = {}
    
    for i in range(1, count + 1):
        # Try to extract each solution block
        pattern = rf"===SOLUTION\s*{i}\s*===(.*?)===END==="
        match = re.search(pattern, response_text, re.DOTALL)
        
        if match:
            solution_text = match.group(1).strip()
            # Clean up any markdown artifacts
            solution_text = solution_text.replace("```", "")
            solutions[i - 1] = solution_text
        else:
            # Fallback: try without strict markers
            print(f"  ⚠️  Could not parse solution {i}, will retry")
    
    return solutions


def process_batch(questions_batch, batch_idx, total_batches):
    """Process a batch of questions through the API."""
    print(f"\n  📦 Batch {batch_idx + 1}/{total_batches} ({len(questions_batch)} questions)...")
    
    prompt = get_solution_prompt(questions_batch)
    
    for attempt in range(MAX_RETRIES):
        try:
            response = call_gemini_api(prompt)
            solutions = parse_solutions(response, len(questions_batch))
            
            if len(solutions) < len(questions_batch):
                print(f"  ⚠️  Got {len(solutions)}/{len(questions_batch)} solutions (attempt {attempt + 1})")
                if attempt < MAX_RETRIES - 1:
                    time.sleep(2)
                    continue
            
            print(f"  ✅ Got {len(solutions)}/{len(questions_batch)} solutions")
            return solutions
            
        except Exception as e:
            if attempt < MAX_RETRIES - 1:
                wait = (attempt + 1) * 3
                print(f"  ⏳ Retrying in {wait}s... (attempt {attempt + 1}/{MAX_RETRIES})")
                time.sleep(wait)
            else:
                print(f"  ❌ Failed after {MAX_RETRIES} attempts: {e}")
                return {}
    
    return {}


def main():
    parser = argparse.ArgumentParser(description="Generate step-by-step solutions for RRB PYQs")
    parser.add_argument("--batch-size", type=int, default=5, help="Questions per API call")
    parser.add_argument("--start-from", type=int, default=0, help="Resume from this question index")
    parser.add_argument("--dry-run", action="store_true", help="Only process first 10 questions")
    parser.add_argument("--output", type=str, default="src/data/pyqs.json", help="Output file path")
    parser.add_argument("--progress-file", type=str, default="scripts/.solution_progress.json", help="Progress tracking file")
    args = parser.parse_args()
    
    if not API_KEY:
        print("❌ Error: GEMINI_API_KEY environment variable is not set!")
        print("   Get a free key at: https://aistudio.google.com/apikey")
        print("   Then run: export GEMINI_API_KEY='your-key-here'")
        sys.exit(1)
    
    # Load questions
    input_file = Path(args.output)
    if not input_file.exists():
        print(f"❌ Error: {input_file} not found!")
        sys.exit(1)
    
    print(f"📂 Loading questions from {input_file}...")
    with open(input_file) as f:
        questions = json.load(f)
    
    total = len(questions)
    print(f"📊 Total questions: {total}")
    
    # Load progress if exists
    progress_file = Path(args.progress_file)
    progress = {}
    if progress_file.exists():
        with open(progress_file) as f:
            progress = json.load(f)
        print(f"📋 Resuming from progress file ({len(progress)} already done)")
    
    # Determine range
    start = args.start_from
    end = min(start + 10, total) if args.dry_run else total
    
    if args.dry_run:
        print(f"🧪 DRY RUN: Processing questions {start} to {end - 1}")
    else:
        print(f"🚀 Processing questions {start} to {end - 1}")
    
    # Process in batches
    batch_size = args.batch_size
    questions_to_process = []
    indices = []
    
    for i in range(start, end):
        if str(i) in progress:
            continue  # Skip already processed
        questions_to_process.append(questions[i])
        indices.append(i)
    
    if not questions_to_process:
        print("✅ All questions already have solutions!")
        return
    
    total_batches = (len(questions_to_process) + batch_size - 1) // batch_size
    print(f"📦 {len(questions_to_process)} questions to process in {total_batches} batches")
    
    updated = 0
    failed = 0
    
    for batch_idx in range(total_batches):
        batch_start = batch_idx * batch_size
        batch_end = min(batch_start + batch_size, len(questions_to_process))
        batch = questions_to_process[batch_start:batch_end]
        batch_indices = indices[batch_start:batch_end]
        
        solutions = process_batch(batch, batch_idx, total_batches)
        
        # Apply solutions
        for local_idx, solution in solutions.items():
            global_idx = batch_indices[local_idx]
            questions[global_idx]["solution"] = solution
            progress[str(global_idx)] = True
            updated += 1
        
        failed += len(batch) - len(solutions)
        
        # Save progress every batch
        with open(progress_file, 'w') as f:
            json.dump(progress, f)
        
        # Save questions every 10 batches
        if (batch_idx + 1) % 10 == 0 or batch_idx == total_batches - 1:
            print(f"\n  💾 Saving to {input_file}... ({updated} updated so far)")
            with open(input_file, 'w', encoding='utf-8') as f:
                json.dump(questions, f, ensure_ascii=False, indent=None)
        
        # Rate limit
        if batch_idx < total_batches - 1:
            time.sleep(RATE_LIMIT_DELAY)
    
    # Final save
    print(f"\n💾 Final save to {input_file}...")
    with open(input_file, 'w', encoding='utf-8') as f:
        json.dump(questions, f, ensure_ascii=False, indent=None)
    
    # Clean up progress file on completion
    if failed == 0 and not args.dry_run:
        progress_file.unlink(missing_ok=True)
        print("🧹 Cleaned up progress file")
    
    print(f"""
╔══════════════════════════════════════╗
║     Solution Generation Complete!    ║
╠══════════════════════════════════════╣
║  ✅ Updated:  {updated:>5} questions          ║
║  ❌ Failed:   {failed:>5} questions          ║
║  📊 Total:    {total:>5} questions          ║
╚══════════════════════════════════════╝
""")


if __name__ == "__main__":
    main()
