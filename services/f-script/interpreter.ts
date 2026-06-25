import { 
  Visitor, Stmt, ExprStmt, VarDecl, 
  Expr, BinaryExpr, LiteralExpr, VariableExpr, GlobalExpr, 
  CallExpr, PipelineExpr, IdentifierExpr 
} from "./ast";
import { Token, TokenType } from "./token";
import { Session, TeamData, PlayerDerived, MatchData } from "../../types";

export interface Environment {
  variables: Map<string, any>;
  session: Session | null;
  output: any[]; // Stack of emitted values
}

export class Interpreter implements Visitor<any> {
  public environment: Environment = {
    variables: new Map(),
    session: null,
    output: []
  };

  constructor(session?: Session) {
    if (session) this.environment.session = session;
  }

  interpret(statements: Stmt[]): any[] {
    try {
      for (const statement of statements) {
        this.execute(statement);
      }
      return this.environment.output;
    } catch (error: any) {
      console.error("Runtime Error:", error);
      return [{ error: error.message }];
    }
  }

  private execute(stmt: Stmt) {
    stmt.accept(this);
  }

  private evaluate(expr: Expr): any {
    return expr.accept(this);
  }

  visitExprStmt(stmt: ExprStmt): any {
    this.evaluate(stmt.expression);
    return null;
  }

  visitVarDecl(stmt: VarDecl): any {
    let value = null;
    if (stmt.initializer) {
      value = this.evaluate(stmt.initializer);
    }
    this.environment.variables.set(stmt.name.lexeme, value);
    return null;
  }

  visitBinaryExpr(expr: BinaryExpr): any {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.GREATER: return left > right;
      case TokenType.GREATER_EQUAL: return left >= right;
      case TokenType.LESS: return left < right;
      case TokenType.LESS_EQUAL: return left <= right;
      case TokenType.BANG_EQUAL: return left !== right;
      case TokenType.EQUAL_EQUAL: return left === right;
    }

    return null;
  }

  visitLiteralExpr(expr: LiteralExpr): any {
    return expr.value;
  }

  visitVariableExpr(expr: VariableExpr): any {
    return this.environment.variables.get(expr.name.lexeme);
  }

  visitIdentifierExpr(expr: IdentifierExpr): any {
    // Attempt to lookup variable first
    if (this.environment.variables.has(expr.name.lexeme)) {
      return this.environment.variables.get(expr.name.lexeme);
    }
    // Otherwise, treat as raw string metric key (useful for filters/sorts)
    return expr.name.lexeme;
  }

  visitGlobalExpr(expr: GlobalExpr): any {
    switch (expr.name.type) {
      case TokenType.GLOBAL_TEAMS:
        return this.environment.session?.teams || [];
      case TokenType.GLOBAL_PLAYERS:
        // Extract all players logically
        const allPlayers = this.environment.session?.teams.flatMap(t => t.players) || [];
        return allPlayers;
      case TokenType.GLOBAL_MATCHES:
        return this.environment.session?.matches || [];
    }
    return [];
  }

  visitCallExpr(expr: CallExpr): any {
    const calleeName = expr.callee.lexeme;

    // Built-in emit function
    if (calleeName === "emit") {
      const args = expr.args.map(a => this.evaluate(a));
      this.environment.output.push(args[0]);
      return null;
    }

    throw new Error(`Undefined function ${calleeName}`);
  }

  visitPipelineExpr(expr: PipelineExpr): any {
    // 1. Evaluate the left side. It must be an array (the collection)
    const collection = this.evaluate(expr.left);
    if (!Array.isArray(collection)) {
      throw new Error(`Left side of pipeline must be a collection, got ${typeof collection}`);
    }

    // 2. The right side must be a function call (e.g., filter, sort, take)
    const callee = expr.right.callee.lexeme;

    // Helper for AST evaluation inside higher order functions
    const evalCondition = (item: any, conditionExpr: Expr): boolean => {
      // Very naive dynamic scoping injection mapping item keys to a fresh evaluator scope.
      // E.g. `item.kills` becomes available if `conditionExpr` has an Identifier `kills`
      const localVariables = new Map(this.environment.variables);
      for (const key of Object.keys(item)) {
         localVariables.set(key, item[key]);
      }
      
      const subInterpreter = new Interpreter(this.environment.session || undefined);
      subInterpreter.environment.variables = localVariables;
      
      return subInterpreter.evaluate(conditionExpr);
    };

    switch (callee) {
      case "filter":
        const condition = expr.right.args[0];
        return collection.filter(item => evalCondition(item, condition));

      case "sort":
        const sortField = this.evaluate(expr.right.args[0]); // Returns string name of field
        const direction = expr.right.args[1] ? this.evaluate(expr.right.args[1]) : "DESC"; // Need to handle DESC
        
        return [...collection].sort((a, b) => {
          const valA = a[sortField] || 0;
          const valB = b[sortField] || 0;
          if (direction === "ASC") return valA > valB ? 1 : -1;
          return valB > valA ? 1 : -1; // Default DESC
        });

      case "take":
      case "limit":
        const n = this.evaluate(expr.right.args[0]);
        return collection.slice(0, n);

      case "pluck":
      case "select":
        const key = this.evaluate(expr.right.args[0]);
        return collection.map(item => item[key]);

      default:
        throw new Error(`Unsupported pipeline operation: ${callee}`);
    }
  }
}
