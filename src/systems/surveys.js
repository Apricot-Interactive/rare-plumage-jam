// SANCTUARY - Survey System
import { gameState, getBirdById, spendSeeds, addSeeds } from '../core/state.js';
import { ASSISTANT_TAP_RATE, SURVEY_PROTECTION_THRESHOLD } from '../core/constants.js';
import { createSpecimen } from '../data/species.js';
import { unassignBirdFromCurrentLocation } from './foragers.js';

export function updateSurveyProgress(dt) {
  if (!gameState) return;

  const now = Date.now();

  gameState.surveys.forEach(survey => {
    if (!survey.assistantId) return;

    const assistant = getBirdById(survey.assistantId);
    if (!assistant || assistant.vitalityPercent <= 0) return;

    // Protection: Don't spend Seeds if below threshold
    if (gameState.seeds < SURVEY_PROTECTION_THRESHOLD) return;

    // Calculate how many observations happen in this time period
    const tapRate = ASSISTANT_TAP_RATE[assistant.distinction] || 0;
    const timeSinceLastUpdate = survey.lastUpdateTime ? (now - survey.lastUpdateTime) : dt;
    const tapsInPeriod = (tapRate * timeSinceLastUpdate) / 1000;

    if (tapsInPeriod >= 1) {
      const wholeTaps = Math.floor(tapsInPeriod);
      for (let i = 0; i < wholeTaps; i++) {
        if (gameState.seeds >= survey.observationCost && survey.progress < 100) {
          if (spendSeeds(survey.observationCost)) {
            survey.progress += survey.progressPerTap;
            survey.progress = Math.min(100, survey.progress);
          }
        }
      }
    }

    survey.lastUpdateTime = now;

    // Check for completion
    if (survey.progress >= 100) {
      completeSurvey(survey.id);
    }
  });
}

export function observeSurvey(biomeId) {
  if (!gameState) return false;

  const survey = gameState.surveys.find(s => s.id === biomeId);
  if (!survey) return false;

  if (spendSeeds(survey.observationCost)) {
    survey.progress += survey.progressPerTap;
    survey.progress = Math.min(100, survey.progress);

    console.log(`Manual observation on ${biomeId}: ${survey.progress}%`);

    // Check for completion
    if (survey.progress >= 100) {
      completeSurvey(biomeId);
    }

    return true;
  }

  return false;
}

export function completeSurvey(biomeId) {
  if (!gameState) return;

  const survey = gameState.surveys.find(s => s.id === biomeId);
  if (!survey) return;

  console.log(`Survey completed: ${biomeId}`);

  // Determine distinction (assistant ⭐ ±1)
  let distinction = 1;
  if (survey.assistantId) {
    const assistant = getBirdById(survey.assistantId);
    if (assistant) {
      const baseDistinction = assistant.distinction;
      const roll = Math.random();
      if (roll < 0.50) {
        distinction = baseDistinction; // 50% match
      } else if (roll < 0.80) {
        distinction = Math.min(5, baseDistinction + 1); // 30% +1
      } else {
        distinction = Math.max(1, baseDistinction - 1); // 20% -1
      }
    }
  }

  // Create new specimen
  const newBird = createSpecimen(biomeId, distinction);
  if (newBird) {
    gameState.specimens.push(newBird);

    // Add to catalogued species if new
    if (!gameState.cataloguedSpecies.includes(newBird.speciesName)) {
      gameState.cataloguedSpecies.push(newBird.speciesName);
    }

    console.log(`New bird discovered: ${newBird.speciesName} (${distinction}⭐)`);

    // Show celebration overlay
    import('../ui/wilds.js').then(module => {
      module.showSurveyCelebration(newBird, biomeId);
    });
  }

  // Reset survey
  survey.progress = 0;
  survey.lastUpdateTime = null;
}

export function assignAssistant(biomeId, birdId) {
  if (!gameState) return false;

  const survey = gameState.surveys.find(s => s.id === biomeId);
  if (!survey) return false;

  const bird = getBirdById(birdId);
  if (!bird) return false;

  // Unassign bird from current location
  unassignBirdFromCurrentLocation(bird);

  // Unassign any bird currently in this survey
  if (survey.assistantId) {
    unassignAssistant(biomeId);
  }

  // Update bird location and assign to survey
  bird.location = `assistant_${biomeId}`;
  survey.assistantId = birdId;
  survey.lastUpdateTime = Date.now();

  console.log(`Assigned ${bird.speciesName} to ${biomeId} survey`);
  return true;
}

export function unassignAssistant(biomeId) {
  if (!gameState) return false;

  const survey = gameState.surveys.find(s => s.id === biomeId);
  if (!survey || !survey.assistantId) return false;

  const bird = getBirdById(survey.assistantId);
  if (bird) {
    bird.location = 'collection';
  }

  survey.assistantId = null;
  survey.lastUpdateTime = null;

  console.log(`Unassigned assistant from ${biomeId} survey`);
  return true;
}
