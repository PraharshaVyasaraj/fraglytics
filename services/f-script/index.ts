import { Lexer } from "./lexer";
import { Parser } from "./parser";
import { Interpreter } from "./interpreter";
import { Session } from "../../types";

export interface FScriptResult {
  output: any[];
  error?: string;
}

/**
 * Executes a raw F Script string against the provided tournament session context.
 * 
 * @param code The F Script source code
 * @param session The current FragLab tournament session
 * @returns FScriptResult containing emitted output or an error
 */
export function executeFScript(code: string, session?: Session): FScriptResult {
  try {
    const lexer = new Lexer(code);
    const tokens = lexer.tokenize();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    const interpreter = new Interpreter(session);
    const output = interpreter.interpret(statements);

    // If an error was raised in interpret, it returns an array containing `{ error: ... }`
    if (output.length > 0 && output[0]?.error) {
      return { output: [], error: output[0].error };
    }

    return { output };
  } catch (err: any) {
    return { output: [], error: err.message || "Unknown error occurred" };
  }
}
