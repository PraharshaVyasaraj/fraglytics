import { Token, TokenType } from "./token";
import { 
  Stmt, ExprStmt, VarDecl, 
  Expr, BinaryExpr, LiteralExpr, VariableExpr, GlobalExpr, 
  CallExpr, PipelineExpr, IdentifierExpr 
} from "./ast";

export class Parser {
  private tokens: Token[];
  private current: number = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      const stmt = this.declaration();
      if (stmt) statements.push(stmt);
    }
    return statements;
  }

  private declaration(): Stmt | null {
    try {
      if (this.match(TokenType.LET)) return this.varDeclaration();
      return this.statement();
    } catch (error) {
      this.synchronize();
      return null;
    }
  }

  private varDeclaration(): Stmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect variable name.");
    this.consume(TokenType.EQUAL, "Expect '=' after variable name.");
    const initializer = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after variable declaration.");
    return new VarDecl(name, initializer);
  }

  private statement(): Stmt {
    const expr = this.expression();
    this.consume(TokenType.SEMICOLON, "Expect ';' after expression.");
    return new ExprStmt(expr);
  }

  private expression(): Expr {
    return this.pipeline();
  }

  private pipeline(): Expr {
    let expr = this.equality();

    while (this.match(TokenType.PIPE_RIGHT)) {
      const operator = this.previous();
      const right = this.equality();
      
      if (right instanceof CallExpr) {
        expr = new PipelineExpr(expr, right);
      } else {
        throw this.error(operator, "Right side of pipeline must be a function call.");
      }
    }

    return expr;
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.BANG_EQUAL, TokenType.EQUAL_EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.term();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    // Only basic math for now, can expand later
    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    if (this.match(TokenType.LEFT_PAREN)) {
      if (!(expr instanceof IdentifierExpr)) {
         throw this.error(this.previous(), "Can only call identifiers.");
      }
      const callee = (expr as IdentifierExpr).name;
      const args: Expr[] = [];
      if (!this.check(TokenType.RIGHT_PAREN)) {
        do {
          args.push(this.expression());
        } while (this.match(TokenType.COMMA));
      }
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");
      return new CallExpr(callee, args);
    }

    return expr;
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new LiteralExpr(false);
    if (this.match(TokenType.TRUE)) return new LiteralExpr(true);
    if (this.match(TokenType.NULL)) return new LiteralExpr(null);

    if (this.match(TokenType.NUMBER, TokenType.STRING)) {
      return new LiteralExpr(this.previous().literal);
    }

    if (this.match(TokenType.GLOBAL_TEAMS, TokenType.GLOBAL_PLAYERS, TokenType.GLOBAL_MATCHES)) {
      return new GlobalExpr(this.previous());
    }

    if (this.match(TokenType.IDENTIFIER)) {
      return new IdentifierExpr(this.previous());
    }

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return expr;
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }
    return false;
  }

  private consume(type: TokenType, message: string): Token {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), message);
  }

  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  private peek(): Token {
    return this.tokens[this.current];
  }

  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, message: string): Error {
    console.error(`[line ${token.line}] Error at '${token.lexeme}': ${message}`);
    return new Error(message);
  }

  private synchronize(): void {
    this.advance();

    while (!this.isAtEnd()) {
      if (this.previous().type === TokenType.SEMICOLON) return;

      switch (this.peek().type) {
        case TokenType.LET:
          return;
      }

      this.advance();
    }
  }
}
