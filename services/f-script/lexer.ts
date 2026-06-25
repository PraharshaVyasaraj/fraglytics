import { Token, TokenType } from "./token";

const keywords: Record<string, TokenType> = {
  "and": TokenType.AND,
  "false": TokenType.FALSE,
  "let": TokenType.LET,
  "or": TokenType.OR,
  "true": TokenType.TRUE,
  "null": TokenType.NULL,
};

const globals: Record<string, TokenType> = {
  "$TEAMS": TokenType.GLOBAL_TEAMS,
  "$PLAYERS": TokenType.GLOBAL_PLAYERS,
  "$MATCHES": TokenType.GLOBAL_MATCHES,
};

export class Lexer {
  private source: string;
  private tokens: Token[] = [];
  private start: number = 0;
  private current: number = 0;
  private line: number = 1;

  constructor(source: string) {
    this.source = source;
  }

  tokenize(): Token[] {
    while (!this.isAtEnd()) {
      this.start = this.current;
      this.scanToken();
    }

    this.tokens.push({ type: TokenType.EOF, lexeme: "", literal: null, line: this.line });
    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();
    switch (c) {
      case "(": this.addToken(TokenType.LEFT_PAREN); break;
      case ")": this.addToken(TokenType.RIGHT_PAREN); break;
      case "{": this.addToken(TokenType.LEFT_BRACE); break;
      case "}": this.addToken(TokenType.RIGHT_BRACE); break;
      case "[": this.addToken(TokenType.LEFT_BRACKET); break;
      case "]": this.addToken(TokenType.RIGHT_BRACKET); break;
      case ",": this.addToken(TokenType.COMMA); break;
      case ".": this.addToken(TokenType.DOT); break;
      case "-": this.addToken(TokenType.MINUS); break;
      case "+": this.addToken(TokenType.PLUS); break;
      case ";": this.addToken(TokenType.SEMICOLON); break;
      case "*": this.addToken(TokenType.STAR); break;
      case "!":
        this.addToken(this.match("=") ? TokenType.BANG_EQUAL : TokenType.BANG);
        break;
      case "=":
        this.addToken(this.match("=") ? TokenType.EQUAL_EQUAL : TokenType.EQUAL);
        break;
      case "<":
        this.addToken(this.match("=") ? TokenType.LESS_EQUAL : TokenType.LESS);
        break;
      case ">":
        this.addToken(this.match("=") ? TokenType.GREATER_EQUAL : TokenType.GREATER);
        break;
      case "|":
        if (this.match(">")) {
          this.addToken(TokenType.PIPE_RIGHT);
        } else {
          // Unsupported character (single pipe) - could log error, but for F we ignore or log.
          console.error(`Unexpected character at line ${this.line}`);
        }
        break;
      case "/":
        if (this.match("/")) {
          // A comment goes until the end of the line.
          while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        } else {
          this.addToken(TokenType.SLASH);
        }
        break;
      case " ":
      case "\r":
      case "\t":
        // Ignore whitespace.
        break;
      case "\n":
        this.line++;
        break;
      case '"':
      case "'":
        this.string(c);
        break;
      case "$":
        this.globalIdentifier();
        break;
      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          console.error(`Unexpected character ${c} at line ${this.line}`);
        }
        break;
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let type = keywords[text];
    if (type === undefined) type = TokenType.IDENTIFIER;
    
    this.addToken(type);
  }

  private globalIdentifier() {
    // Collect the whole $GLOBAL name
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let type = globals[text];
    
    if (type === undefined) {
       // Just treat it as a standard identifier if we don't recognize the global
       type = TokenType.IDENTIFIER;
    }
    
    this.addToken(type);
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    // Look for a fractional part.
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // Consume the "."
      this.advance();

      while (this.isDigit(this.peek())) this.advance();
    }

    this.addToken(TokenType.NUMBER, parseFloat(this.source.substring(this.start, this.current)));
  }

  private string(quoteChar: string) {
    while (this.peek() !== quoteChar && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      console.error(`Unterminated string at line ${this.line}`);
      return;
    }

    // The closing quote.
    this.advance();

    // Trim the surrounding quotes.
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING, value);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "\0";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "\0";
    return this.source.charAt(this.current + 1);
  }

  private isAlpha(c: string): boolean {
    return (c >= "a" && c <= "z") ||
           (c >= "A" && c <= "Z") ||
            c === "_";
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    return c >= "0" && c <= "9";
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal: any = null) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push({ type, lexeme: text, literal, line: this.line });
  }
}
