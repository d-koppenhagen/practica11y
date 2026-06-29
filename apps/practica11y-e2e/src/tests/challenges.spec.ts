import {
  test,
  expect,
  getRegisteredChallenges,
  type EditorTab,
} from '../fixtures/challenge.fixture';

const challenges = getRegisteredChallenges();

for (const challenge of challenges) {
  test.describe(`Challenge: ${challenge.id}`, () => {
    test('starter code should produce validation errors', async ({
      challengeHelpers,
    }) => {
      await challengeHelpers.navigateToChallenge(challenge.id);
      const scoreBefore = await challengeHelpers.getScore();
      await challengeHelpers.clickCheckSolution();
      expect(await challengeHelpers.hasValidationErrors()).toBe(true);
      expect(await challengeHelpers.getScore()).toBe(scoreBefore);
    });

    if (Object.keys(challenge.solution).length > 0) {
      test('solution code should pass validation', async ({
        challengeHelpers,
      }) => {
        await challengeHelpers.navigateToChallenge(challenge.id);

        for (const [tab, filename] of Object.entries(challenge.solution)) {
          const content = challengeHelpers.readSolutionFile(
            challenge.id,
            filename,
          );
          await challengeHelpers.setEditorContent(tab as EditorTab, content);
        }

        const scoreBefore = await challengeHelpers.getScore();
        await challengeHelpers.clickCheckSolution();

        expect(await challengeHelpers.hasValidationErrors()).toBe(false);
        expect(await challengeHelpers.getScore()).toBeGreaterThan(scoreBefore);
      });
    }
  });
}
