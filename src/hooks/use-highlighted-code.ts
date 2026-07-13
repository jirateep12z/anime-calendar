import * as React from 'react';

import { LoadHighlighter } from '@/lib/highlighter';

export function UseHighlightedCode(code_value: string, language: string) {
  // A trailing newline would render as an extra empty line.
  const code = code_value.endsWith('\n') ? code_value.slice(0, -1) : code_value;
  const [loaded_state, SetLoadedState] = React.useState<{
    language: string;
    highlighter: Awaited<ReturnType<typeof LoadHighlighter>>;
  } | null>(null);
  const highlighter =
    loaded_state?.language === language ? loaded_state.highlighter : null;

  React.useEffect(() => {
    let is_cancelled = false;

    LoadHighlighter(language)
      .then(next_highlighter => {
        if (!is_cancelled) {
          SetLoadedState({ language, highlighter: next_highlighter });
        }
      })
      .catch(() => {});

    return () => {
      is_cancelled = true;
    };
  }, [language]);

  // The complete lines, highlighted. While the code streams, only the new
  // lines are tokenized, starting from the grammar state of the last one.
  const [completed_state, SetCompletedState] = React.useState<{
    highlighter: typeof highlighter;
    text: string;
    lines: React.ReactNode[];
    state?: Parameters<NonNullable<typeof highlighter>['Highlight']>[1];
  }>({ highlighter: null, text: '', lines: [] });

  let next_state = completed_state;

  if (
    next_state.highlighter !== highlighter ||
    !code.startsWith(next_state.text)
  ) {
    next_state = { highlighter, text: '', lines: [] };
  }

  const line_end = code.lastIndexOf('\n') + 1;

  if (highlighter && line_end > next_state.text.length) {
    const highlight_result = highlighter.Highlight(
      code.slice(next_state.text.length, line_end - 1),
      next_state.state
    );

    next_state = {
      highlighter,
      text: code.slice(0, line_end),
      lines: [...next_state.lines, ...highlight_result.lines],
      state: highlight_result.state
    };
  }

  if (next_state !== completed_state) {
    SetCompletedState(next_state);
  }

  // The last line is still being written, so it is tokenized on every render.
  const trailing_line = code.slice(line_end);

  return React.useMemo(() => {
    if (!highlighter) {
      return code.split('\n');
    }

    return [
      ...next_state.lines,
      highlighter.Highlight(trailing_line, next_state.state).lines[0]
    ];
  }, [code, highlighter, next_state, trailing_line]);
}
