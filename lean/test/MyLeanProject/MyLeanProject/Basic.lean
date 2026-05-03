import Lean

open Lean Elab Command Term Meta

def hello := "world"

-- ─── PRE-ELABORATION: Macro (syntax → syntax transformation) ───────────────

macro "swap_add" a:term "," b:term : term => `($b + $a)

#eval swap_add 3, 10

macro "#assert" e:term : command => `(#eval if $e then "ok" else "FAIL")

#assert (1 + 1 == 2)

-- ─── POST-ELABORATION: elaboration hook via `elab` ─────────────────────────

elab "#show_type" e:term : command => do
  let expr ← liftTermElabM (elabTerm e none)
  let ty   ← liftTermElabM (inferType expr)
  logInfo m!"type of ({e}) is: {ty}"

#show_type (1 + 1)
#show_type ([1, 2, 3])

-- ─── POST-ELABORATION: MetaM to inspect Expr ───────────────────────────────

elab "#whnf" e:term : command => do
  let expr ← liftTermElabM (elabTerm e none)
  let reduced ← liftTermElabM (whnf expr)
  logInfo m!"whnf: {reduced}"

#whnf (List.length [1, 2, 3])

-- ─── POST-ELABORATION: IO at compile time ──────────────────────────────────

elab "#compile_write" path:str content:str : command => do
  let p := path.getString
  let c := content.getString
  liftIO (IO.FS.writeFile p c)
  logInfo m!"wrote {c.length} bytes to {p} at compile time"

#compile_write "/tmp/lean_compile_output.txt" "hello from compile time!"

elab "#compile_read" path:str : command => do
  let content ← liftIO (IO.FS.readFile path.getString)
  logInfo m!"read back: {content}"

#compile_read "/tmp/lean_compile_output.txt"

-- ─── COMPILER MESSAGES: info / warning / error ─────────────────────────────

elab "#careful" e:term : command => do
  let expr ← liftTermElabM (elabTerm e none)
  let ty   ← liftTermElabM (inferType expr)
  if expr.isConst then
    logWarning m!"'{e}' is a bare constant — did you mean to apply it?"
  logInfo m!"[info]  {e} : {ty}"

#careful Nat.add
#careful (1 + 1)

-- ─── INITIALIZE: fires once when the module is loaded into the compiler ──────

initialize do
  IO.println ">>> Basic.lean module loaded into compiler <<<"

-- ─── EVENT-TRIGGERED ELAB: fires every time `traced_def` is used ────────────
-- (attributes registered in a file can't be used in that same file,
--  so we use a custom elab command as the trigger instead)

elab "traced_def" name:ident ":=" val:term : command => do
  logInfo  m!"[event] 'traced_def {name}' triggered — compiling now"
  elabCommand (← `(def $name := $val))
  let env ← getEnv
  let decl := env.find? name.getId
  logInfo m!"[event] {name} compiled successfully, value type: {decl.map (·.type)}"

traced_def myTracedDef := 42
traced_def anotherTracedDef := "lean is wild"

-- ─── Original theorems ─────────────────────────────────────────────────────

-- ─── JAI-STYLE: walk the raw Syntax AST (fires at parse time) ───────────────

private partial def walkSyntax (s : Syntax) (depth : Nat) : String :=
  let pad := "".pushn ' ' (depth * 2)
  match s with
  | .atom _ val       => s!"{pad}ATOM({val})\n"
  | .ident _ _ name _ => s!"{pad}IDENT({name})\n"
  | .node _ kind args =>
    args.foldl (fun acc arg => acc ++ walkSyntax arg (depth + 1))
               s!"{pad}NODE[{kind}]\n"
  | .missing          => s!"{pad}MISSING\n"

elab "#walk_syntax" e:term : command => logInfo (walkSyntax e 0)

#walk_syntax (1 + 2 * 3)

-- ─── JAI-STYLE: walk the typed Expr AST (fires after typecheck) ──────────────

private partial def walkExpr (ex : Expr) (depth : Nat) : String :=
  let pad := "".pushn ' ' (depth * 2)
  match ex with
  | .const name _    => s!"{pad}CONST({name})\n"
  | .app f a         => s!"{pad}APP\n" ++ walkExpr f (depth+1) ++ walkExpr a (depth+1)
  | .lam n _ b _     => s!"{pad}LAM({n})\n" ++ walkExpr b (depth+1)
  | .forallE n _ b _ => s!"{pad}PI({n})\n"  ++ walkExpr b (depth+1)
  | .lit (.natVal n) => s!"{pad}NAT_LIT({n})\n"
  | .lit (.strVal s) => s!"{pad}STR_LIT({s})\n"
  | .bvar i          => s!"{pad}BVAR({i})\n"
  | .fvar _          => s!"{pad}FVAR\n"
  | .mvar _          => s!"{pad}MVAR\n"
  | .sort _          => s!"{pad}SORT\n"
  | .letE n _ v b _  => s!"{pad}LET({n})\n" ++ walkExpr v (depth+1) ++ walkExpr b (depth+1)
  | .proj n i s      => s!"{pad}PROJ({n}.{i})\n" ++ walkExpr s (depth+1)
  | .mdata _ e       => walkExpr e depth

elab "#walk_expr" e:term : command => do
  let expr ← liftTermElabM (elabTerm e none)
  logInfo (walkExpr expr 0)

#walk_expr (fun x : Nat => x + 1)
#walk_expr (1 + 2 * 3)

-- ─── Original theorems ─────────────────────────────────────────────────────

/-- A simple theorem: if A and B are true, then A is true. -/
theorem and_elim_left (A B : Prop) : A ∧ B → A := by
  -- In tactic mode (after 'by'), we can use step-by-step commands
  intro h  -- Assume the hypothesis 'h : A ∧ B'
  exact h.left -- The 'left' field of the conjunction 'h' provides a proof of 'A'

/-- A simple induction proof: adding zero to a number is that number itself. -/
theorem add_zero_eq (n : Nat) : n + 0 = n := by
  -- For natural numbers, we often use induction
  induction n with
  | zero =>
    -- Base case: 0 + 0 = 0
    rfl      -- 'rfl' is a tactic for proving equality by definition
  | succ n ih =>
    -- Step case: (n + 1) + 0 = (n + 1)
    -- 'simp' alone works here as n + 0 = n is a basic property
    simp

/-- Lean 4 allows us to use 'match' directly in proofs, which is very idiomatic. -/
theorem and_commutative (A B : Prop) : A ∧ B ↔ B ∧ A := by
  constructor
  -- Case 1: A ∧ B → B ∧ A
  · intro ⟨ha, hb⟩ -- Destructure the 'And' directly
    exact ⟨hb, ha⟩ -- Re-construct it in the other order
  -- Case 2: B ∧ A → A ∧ B
  · intro ⟨hb, ha⟩
    exact ⟨ha, hb⟩

