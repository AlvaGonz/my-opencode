## Session Memory Protocol (Mandatory)

**AL INICIAR cualquier objetivo nuevo:**
1. Ejecutar `pnpm run agent:session` — esto crea `.agents/sessions/<YYYYMMDD-HHMM>/`
2. El path activo está en `.agents/sessions/ACTIVE_SESSION`
3. Leer `.agents/sessions/<ACTIVE_SESSION>/progress.md` antes de cualquier acción
4. Usar ÚNICAMENTE los archivos de la sesión activa para task_plan, findings y progress

**PROHIBIDO:**
- Escribir en `tasks/task_plan.md`, `tasks/findings.md`, `tasks/progress.md` directamente
- Crear archivos de memoria fuera del namespace de sesión activa
- Usar `.agents/loop-run-counter.txt` para controlar bucles — eso lo hace `CircuitBreaker`
