import { Token } from "./token";

export interface Visitor<R> {
  visitExprStmt(stmt: ExprStmt): R;
  visitVarDecl(stmt: VarDecl): R;
  
  visitBinaryExpr(expr: BinaryExpr): R;
  visitLiteralExpr(expr: LiteralExpr): R;
  visitVariableExpr(expr: VariableExpr): R;
  visitGlobalExpr(expr: GlobalExpr): R;
  visitCallExpr(expr: CallExpr): R;
  visitPipelineExpr(expr: PipelineExpr): R;
  visitIdentifierExpr(expr: IdentifierExpr): R; // Used for property access inside pipelines like `kills`
}

export abstract class Stmt {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class ExprStmt extends Stmt {
  constructor(public expression: Expr) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitExprStmt(this); }
}

export class VarDecl extends Stmt {
  constructor(public name: Token, public initializer: Expr) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitVarDecl(this); }
}

export abstract class Expr {
  abstract accept<R>(visitor: Visitor<R>): R;
}

export class BinaryExpr extends Expr {
  constructor(public left: Expr, public operator: Token, public right: Expr) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitBinaryExpr(this); }
}

export class LiteralExpr extends Expr {
  constructor(public value: any) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitLiteralExpr(this); }
}

export class VariableExpr extends Expr {
  constructor(public name: Token) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitVariableExpr(this); }
}

export class GlobalExpr extends Expr {
  constructor(public name: Token) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitGlobalExpr(this); }
}

export class CallExpr extends Expr {
  constructor(public callee: Token, public args: Expr[]) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitCallExpr(this); }
}

export class PipelineExpr extends Expr {
  constructor(public left: Expr, public right: CallExpr) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitPipelineExpr(this); }
}

// Special expression for unquoted variable names passed into pipeline functions (e.g. `filter(kills > 5)`)
export class IdentifierExpr extends Expr {
  constructor(public name: Token) { super(); }
  accept<R>(visitor: Visitor<R>): R { return visitor.visitIdentifierExpr(this); }
}
