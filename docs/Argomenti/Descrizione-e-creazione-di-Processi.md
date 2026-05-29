# Descrizione Processi

Vediamo di preciso cosa si intende nell'avere un contesto diverso per ogni processo.

Il contesto non è altro una struttura dati salvata in M2, ed è formato da:

- id : descrittore processo
- corpo: contenuto dei registri del processore
- priorità: indica il livello di priorità del processo

Sappiamo già che il processore lavora per stati. Anche i processi seguono la stessa logica e, durante la loro vita, si trovano costantemente in uno degli stati di esecuzione:

![stati dei processi](../assets/schema_stati_processi.png)