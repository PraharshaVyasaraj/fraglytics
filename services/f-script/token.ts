export enum TokenType {
  // Single-character tokens
  LEFT_PAREN, RIGHT_PAREN, LEFT_BRACE, RIGHT_BRACE, LEFT_BRACKET, RIGHT_BRACKET,
  COMMA, DOT, MINUS, PLUS, SEMICOLON, SLASH, STAR,

  // One or two character tokens
  BANG, BANG_EQUAL,
  EQUAL, EQUAL_EQUAL,
  GREATER, GREATER_EQUAL,
  LESS, LESS_EQUAL,
  PIPE_RIGHT, // |>

  // Literals
  IDENTIFIER, STRING, NUMBER,

  // Keywords
  AND, FALSE, LET, OR, TRUE, NULL, 

  // Global Context Variables (Special)
  GLOBAL_TEAMS,    // $TEAMS
  GLOBAL_PLAYERS,  // $PLAYERS
  GLOBAL_MATCHES,  // $MATCHES

  EOF
}

export interface Token {
  type: TokenType;
  lexeme: string;
  literal: any;
  line: number;
}
