# Reglas de Planificación y Cero Regresiones (Obligatorias)

Este documento contiene las reglas fundamentales que todo agente debe internalizar y respetar rigurosamente en cada prompt y sesión de trabajo.

## 1. Planificación Previa (Obligatoria)
*   **Antes de gestionar cualquier prompt/solicitud**, se debe crear o actualizar un plan en formato `.md` (dentro del directorio de artefactos o de la sesión correspondiente).
*   El plan debe incluir:
    *   El **nombre de la solicitud**.
    *   La **parte más destacada** o crítica de la tarea.
    *   Los **pasos exactos** que se darán para aceptar, modificar e iniciar la ejecución de la tarea.
*   No se debe modificar código fuente ni realizar cambios estructurales antes de que el plan esté documentado.

## 2. Cero Regresiones (Garantía de Funcionamiento Anterior)
*   Ningún cambio, refactorización o funcionalidad nueva debe, bajo ningún motivo, romper o dañar el funcionamiento de los procesos y código trabajados anteriormente.
*   **Adaptación permitida**: Se pueden adaptar, corregir, modificar o reacondicionar componentes preexistentes si la nueva petición lo requiere o si comparten lógica/detalles de uso.
*   **Límite infranqueable**: **NUNCA** se debe comprometer o degradar el funcionamiento de una función, bloque o flujo que ya era operativo para dar paso a una sesión, bloque o característica nueva.
*   **Verificación estricta**: Se deben correr pruebas automáticas (si están configuradas) y realizar verificaciones manuales exhaustivas para garantizar que los procesos existentes sigan funcionando exactamente igual o mejor que antes.
