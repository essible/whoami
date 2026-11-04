/**
 * Helpers for the request/response panel. The panel and the files it requests are built
 * from the same lines, so what the panel shows is byte for byte what the server sends.
 */

/** A piece of a line; `cls` picks the highlight colour (k, str, num, lit, h). */
export interface Token {
  text: string;
  cls?: string;
}

export type Line = Token[];

export interface Endpoint {
  id: string;
  /** Tab text. Defaults to the path. */
  label?: string;
  method?: string;
  path: string;
  status: number;
  statusText: string;
  headers?: { name: string; value: string }[];
  body?: Line[];
  /** Size of the response body, shown in the panel's footer. */
  bytes?: number;
}

type Json = string | number | boolean | null | Json[] | { [key: string]: Json | undefined };

const INLINE_MAX = 48;

function isPlain(value: Json | undefined): value is string | number | boolean | null {
  return value === null || ['string', 'number', 'boolean'].includes(typeof value);
}

function plain(value: string | number | boolean | null): Token {
  if (typeof value === 'string') return { text: JSON.stringify(value), cls: 'str' };
  return { text: String(value), cls: typeof value === 'number' ? 'num' : 'lit' };
}

const width = (tokens: Token[]) => tokens.reduce((n, t) => n + t.text.length, 0);

/** Pretty-printed JSON with two-space indents. Short arrays of plain values stay on one line. */
export function jsonLines(value: Json): Line[] {
  const lines: Line[] = [];
  const walk = (node: Json, depth: number, key: string | undefined, comma: boolean) => {
    const indent: Token[] = depth > 0 ? [{ text: '  '.repeat(depth) }] : [];
    const head: Token[] = key === undefined ? indent : [...indent, { text: JSON.stringify(key), cls: 'k' }, { text: ': ' }];
    const tail: Token[] = comma ? [{ text: ',' }] : [];

    if (isPlain(node)) {
      lines.push([...head, plain(node), ...tail]);
      return;
    }
    if (Array.isArray(node) && node.every(isPlain)) {
      const inline: Token[] = [{ text: '[' }];
      node.forEach((item, i) => inline.push(...(i > 0 ? [{ text: ', ' }] : []), plain(item)));
      inline.push({ text: ']' });
      if (width([...head, ...inline, ...tail]) <= INLINE_MAX) {
        lines.push([...head, ...inline, ...tail]);
        return;
      }
    }
    const entries: [string | undefined, Json][] = Array.isArray(node)
      ? node.map((item) => [undefined, item])
      : Object.entries(node).filter((entry): entry is [string, Json] => entry[1] !== undefined);
    const [open, close] = Array.isArray(node) ? ['[', ']'] : ['{', '}'];
    lines.push([...head, { text: open }]);
    entries.forEach(([k, item], i) => walk(item, depth + 1, k, i < entries.length - 1));
    lines.push([...indent, { text: close }, ...tail]);
  };
  walk(value, 0, undefined, false);
  return lines;
}

/** "Field: value" lines, as in security.txt. */
export function fieldLines(text: string): Line[] {
  return text
    .trimEnd()
    .split('\n')
    .map((line) => {
      const field = /^([\w-]+):(.*)$/.exec(line);
      return field ? [{ text: `${field[1]}:`, cls: 'h' }, { text: field[2] }] : [{ text: line }];
    });
}

/** HTML source lines: tags in one colour, attribute values in another. */
export function markupLines(source: string[]): Line[] {
  return source.map((line) =>
    line
      .split(/(<[^>]*>)/)
      .filter(Boolean)
      .flatMap((part): Token[] =>
        part.startsWith('<')
          ? part
              .split(/("[^"]*")/)
              .filter(Boolean)
              .map((piece) => ({ text: piece, cls: piece.startsWith('"') ? 'str' : 'h' }))
          : [{ text: part }],
      ),
  );
}

export function linesToText(lines: Line[]): string {
  return lines.map((line) => line.map((t) => t.text).join('')).join('\n') + '\n';
}

export function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

/** A static JSON file whose bytes match the panel. */
export function jsonResponse(value: Json): Response {
  return new Response(linesToText(jsonLines(value)), {
    headers: { 'Content-Type': 'application/json' },
  });
}
