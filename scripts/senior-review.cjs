#!/usr/bin/env node

const { execSync } = require('node:child_process');
const fs = require('node:fs');

const REVIEW_FILE = 'SENIOR_AGENT_REVIEW.md';
const REQUIRED_HEADERS = [
  '# Senior Agent Review',
  '## Summary',
  '## Findings',
  '## Risks',
  '## Validation',
];

const REVIEW_BYPASS = process.env.SENIOR_REVIEW_BYPASS === '1';
const CI = process.env.CI === 'true';

const error = message => {
  console.error(`\n[senior-review] ${message}\n`);
  process.exit(1);
};

const run = command => execSync(command, { encoding: 'utf8' }).trim();

try {
  if (REVIEW_BYPASS) {
    console.log('[senior-review] Bypass enabled via SENIOR_REVIEW_BYPASS=1');
    process.exit(0);
  }

  const workingTreeChanges = run('git diff --name-only HEAD');
  const headCommitChanges = run('git show --name-only --pretty="" HEAD');
  const changedFiles = `${workingTreeChanges}\n${headCommitChanges}`;
  const hasCodeChanges = changedFiles
    .split('\n')
    .filter(Boolean)
    .some(path => !path.startsWith('.github/') && path !== REVIEW_FILE);

  if (!hasCodeChanges) {
    console.log('[senior-review] No code changes detected, skipping review check.');
    process.exit(0);
  }

  let reviewContent;
  try {
    reviewContent = fs.readFileSync(REVIEW_FILE, 'utf8');
  } catch (e) {
    error(
      `Missing ${REVIEW_FILE}. Create it and document the senior review before committing changes.`
    );
  }

  const missingHeaders = REQUIRED_HEADERS.filter(h => !reviewContent.includes(h));
  if (missingHeaders.length > 0) {
    error(
      `${REVIEW_FILE} is missing required sections: ${missingHeaders.join(
        ', '
      )}. Please use the required template.`
    );
  }

  const minWords = CI ? 60 : 20;
  const wordCount = reviewContent.split(/\s+/).filter(Boolean).length;
  if (wordCount < minWords) {
    error(
      `${REVIEW_FILE} is too short (${wordCount} words). Provide a meaningful review with at least ${minWords} words.`
    );
  }

  console.log(`[senior-review] OK. ${REVIEW_FILE} passed validation.`);
} catch (e) {
  error(e.message);
}
