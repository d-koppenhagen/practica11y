/**
 * Represents an external reference link for a challenge.
 */
export interface ChallengeLink {
  text: string;
  url: string;
}

/**
 * Represents the starter code provided with a challenge.
 */
export interface StarterCode {
  html: string;
  js: string;
  css: string;
  vtt: string;
}

/**
 * Represents a fully loaded and parsed challenge.
 */
export interface Challenge {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  points: number;
  description: string; // Parsed Markdown → HTML
  starter: StarterCode;
  validatorIds: string[];
  /** Custom preview title for the iframe. Defaults to "Challenge: {title} | Preview" */
  previewTitle: string;
  /** External reference links (APG patterns, MDN, Deque, etc.) */
  links: ChallengeLink[];
  /** Whether this challenge is disabled and not yet available */
  disabled?: boolean;
  /** Optional URL to the GitHub Discussions thread for this challenge */
  discussionUrl?: string;
}

/**
 * Represents the frontmatter metadata of a challenge markdown file.
 */
export interface ChallengeMeta {
  id: string;
  title: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
  points: number;
  starter: {
    html: string; // Dateipfad
    js?: string; // Dateipfad
    css?: string; // Dateipfad
    vtt?: string; // Dateipfad
  };
  validators: string[];
  /** Optional custom title for the preview iframe. Defaults to "Challenge: {title} | Preview" */
  previewTitle?: string;
  /** Optional external reference links */
  links?: { text: string; url: string }[];
  /** Optional URL to the GitHub Discussions thread for this challenge */
  discussionUrl?: string;
}
