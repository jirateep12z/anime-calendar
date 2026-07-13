import * as React from 'react';
import {
  createHighlighterCore,
  type GrammarState,
  type HighlighterCore
} from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';

// Add the languages you need. Each one loads the first time it is used.
const LANGUAGE_LOADERS = {
  bash: () => import('shiki/langs/shellscript.mjs'),
  css: () => import('shiki/langs/css.mjs'),
  diff: () => import('shiki/langs/diff.mjs'),
  html: () => import('shiki/langs/html.mjs'),
  javascript: () => import('shiki/langs/javascript.mjs'),
  json: () => import('shiki/langs/json.mjs'),
  jsx: () => import('shiki/langs/jsx.mjs'),
  markdown: () => import('shiki/langs/markdown.mjs'),
  python: () => import('shiki/langs/python.mjs'),
  sql: () => import('shiki/langs/sql.mjs'),
  tsx: () => import('shiki/langs/tsx.mjs'),
  typescript: () => import('shiki/langs/typescript.mjs'),
  yaml: () => import('shiki/langs/yaml.mjs')
};

const LANGUAGE_ALIASES: Record<string, keyof typeof LANGUAGE_LOADERS> = {
  js: 'javascript',
  md: 'markdown',
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  shellscript: 'bash',
  ts: 'typescript',
  yml: 'yaml',
  zsh: 'bash'
};

let highlighter_promise: Promise<HighlighterCore> | undefined;

function GetHighlighter() {
  highlighter_promise ??= createHighlighterCore({
    themes: [
      import('shiki/themes/github-light.mjs'),
      import('shiki/themes/github-dark.mjs')
    ],
    langs: [],
    engine: createJavaScriptRegexEngine({ forgiving: true })
  });

  return highlighter_promise;
}

function GetLanguage(language: string) {
  const normalized_language = language.toLowerCase();

  if (normalized_language === 'ansi') {
    return normalized_language;
  }

  if (normalized_language in LANGUAGE_LOADERS) {
    return normalized_language as keyof typeof LANGUAGE_LOADERS;
  }

  return LANGUAGE_ALIASES[normalized_language] ?? null;
}

// Loads a language and returns a highlighter for it, or null for a language
// that is not listed.
export async function LoadHighlighter(language: string) {
  const resolved_language = GetLanguage(language);

  if (!resolved_language) {
    return null;
  }

  const shiki_highlighter = await GetHighlighter();

  if (
    resolved_language !== 'ansi' &&
    !shiki_highlighter.getLoadedLanguages().includes(resolved_language)
  ) {
    await shiki_highlighter.loadLanguage(LANGUAGE_LOADERS[resolved_language]);
  }

  return {
    // Returns one React node per line, and the grammar state after the last
    // line. Pass that state back to continue where the code left off.
    Highlight(code: string, state?: GrammarState) {
      const Tokenize = (text: string) =>
        shiki_highlighter.codeToTokens(text, {
          lang: resolved_language,
          themes: { light: 'github-light', dark: 'github-dark' },
          defaultColor: false,
          grammarState: state
        }).tokens;

      // ANSI has no grammar state, so each line is tokenized on its own and
      // gets the same colors whether it arrives in one piece or streams.
      const token_lines =
        resolved_language === 'ansi'
          ? code.split('\n').flatMap(line_code => Tokenize(line_code))
          : Tokenize(code);

      return {
        lines: token_lines.map(line_tokens =>
          line_tokens.map((token, token_index) => (
            <span
              key={token_index}
              style={token.htmlStyle as React.CSSProperties}
              className="text-(--shiki-light) dark:text-(--shiki-dark)"
            >
              {token.content}
            </span>
          ))
        ),
        state: shiki_highlighter.getLastGrammarState(token_lines)
      };
    }
  };
}

// Returns one React node per line, or null for a language that is not listed.
export async function HighlightCode(code: string, language: string) {
  const highlighter = await LoadHighlighter(language);

  return highlighter ? highlighter.Highlight(code).lines : null;
}
