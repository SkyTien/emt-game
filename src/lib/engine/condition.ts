/**
 * 中文 outcome 條件解析器:支援 `正確率>=0.9`、`已電擊`、`且 / 或`、`預設`。
 *
 * Grammar(簡化、左結合):
 *   expr   := term ('或' term)*
 *   term   := atom ('且' atom)*
 *   atom   := '預設' | '(' expr ')' | comparison | flag
 *   comparison := metric op number      // 例:正確率>=0.9、惡化等級<2
 *   flag   := /[^\s且或><=()]+/         // 例:已電擊
 */
export type ConditionContext = {
	correctRate: number;
	worsenLevel: number;
	flags: Set<string>;
};

const METRIC_MAP: Record<string, keyof ConditionContext> = {
	正確率: 'correctRate',
	惡化等級: 'worsenLevel'
};

const COMPARISON_RE = /^(正確率|惡化等級)\s*(>=|<=|>|<|==|=)\s*(-?\d+(?:\.\d+)?)$/;

export function evaluateCondition(expr: string, ctx: ConditionContext): boolean {
	const cleaned = expr.trim();
	if (cleaned === '預設' || cleaned === '') return true;
	const tokens = tokenize(cleaned);
	const parser = new Parser(tokens, ctx);
	return parser.parseExpr();
}

export function validateConditionExpression(expr: string): boolean {
	const tokens = tokenize(expr.trim());
	if (tokens.length === 0) return false;
	let pos = 0;
	const atom = (): boolean => {
		const token = tokens[pos];
		if (!token) return false;
		if (token.kind === 'lparen') {
			pos += 1;
			if (!expression() || tokens[pos]?.kind !== 'rparen') return false;
			pos += 1;
			return true;
		}
		if (token.kind !== 'atom') return false;
		pos += 1;
		if (token.value.startsWith('正確率') || token.value.startsWith('惡化等級')) {
			return COMPARISON_RE.test(token.value);
		}
		return token.value.length > 0;
	};
	const term = (): boolean => {
		if (!atom()) return false;
		while (tokens[pos]?.kind === 'and') {
			pos += 1;
			if (!atom()) return false;
		}
		return true;
	};
	const expression = (): boolean => {
		if (!term()) return false;
		while (tokens[pos]?.kind === 'or') {
			pos += 1;
			if (!term()) return false;
		}
		return true;
	};
	return expression() && pos === tokens.length;
}

type Token = { kind: 'or' | 'and' | 'lparen' | 'rparen' | 'atom'; value: string };

function tokenize(input: string): Token[] {
	const tokens: Token[] = [];
	let i = 0;
	while (i < input.length) {
		const ch = input[i];
		if (ch === ' ' || ch === '\t') {
			i += 1;
			continue;
		}
		if (ch === '或') {
			tokens.push({ kind: 'or', value: '或' });
			i += 1;
			continue;
		}
		if (ch === '且') {
			tokens.push({ kind: 'and', value: '且' });
			i += 1;
			continue;
		}
		if (ch === '(' || ch === '(') {
			tokens.push({ kind: 'lparen', value: '(' });
			i += 1;
			continue;
		}
		if (ch === ')' || ch === ')') {
			tokens.push({ kind: 'rparen', value: ')' });
			i += 1;
			continue;
		}
		let end = i;
		while (
			end < input.length &&
			input[end] !== ' ' &&
			input[end] !== '\t' &&
			input[end] !== '或' &&
			input[end] !== '且' &&
			input[end] !== '(' &&
			input[end] !== '(' &&
			input[end] !== ')' &&
			input[end] !== ')'
		) {
			end += 1;
		}
		tokens.push({ kind: 'atom', value: input.slice(i, end) });
		i = end;
	}
	return tokens;
}

class Parser {
	private pos = 0;
	constructor(
		private tokens: Token[],
		private ctx: ConditionContext
	) {}

	parseExpr(): boolean {
		let left = this.parseTerm();
		while (this.peek()?.kind === 'or') {
			this.consume();
			const right = this.parseTerm();
			left = left || right;
		}
		return left;
	}

	private parseTerm(): boolean {
		let left = this.parseAtom();
		while (this.peek()?.kind === 'and') {
			this.consume();
			const right = this.parseAtom();
			left = left && right;
		}
		return left;
	}

	private parseAtom(): boolean {
		const tok = this.peek();
		if (!tok) return false;
		if (tok.kind === 'lparen') {
			this.consume();
			const v = this.parseExpr();
			const close = this.peek();
			if (close?.kind === 'rparen') this.consume();
			return v;
		}
		if (tok.kind === 'atom') {
			this.consume();
			return this.evalAtom(tok.value);
		}
		this.consume();
		return false;
	}

	private evalAtom(raw: string): boolean {
		if (raw === '預設') return true;
		const m = COMPARISON_RE.exec(raw);
		if (m) {
			const [, metric, op, numStr] = m;
			const ctxKey = METRIC_MAP[metric];
			const lhs = this.ctx[ctxKey] as number;
			const rhs = Number(numStr);
			switch (op) {
				case '>=':
					return lhs >= rhs;
				case '<=':
					return lhs <= rhs;
				case '>':
					return lhs > rhs;
				case '<':
					return lhs < rhs;
				case '==':
				case '=':
					return lhs === rhs;
			}
		}
		return this.ctx.flags.has(raw);
	}

	private peek(): Token | undefined {
		return this.tokens[this.pos];
	}

	private consume(): Token | undefined {
		return this.tokens[this.pos++];
	}
}
