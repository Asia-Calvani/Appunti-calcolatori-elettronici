# Memoria cache

Con la RAM abbiamo un problema: è molto più lenta di un processore, ed il processore quindi viene messo in attesa.

è possibile vedere quanto tempo ci mette il processore ad accedere alla RAM in base alla dimensione della lettura:
![grafico letture](../assets/cache_graf.png)

In nostro aiuto arriva la cache che è molto più veloce della RAM dinamica,(per informazioni  di dimensioni "piccole" arriva all'odine della velocità del clock).

Una RAM più veloce è la RAM statica( conserva l’informazione tramite Flip-Flop, e sono realizzabile con 6/7 transistor. Le RAM Dinamiche invece utilizzano microcondensatori che necessitano che l’informazione venga periodicamente “rinfrescata”), il problema è il costo elevato per la piccola quantità della RAM statica, per cui non si usa la statica.

Esiste tuttavia un modo per poter utilizzare RAM grandi, economiche e veloci. Infatti, nonostante l’accesso del programmatore alla memoria sia per definizione casuale, ovvero non predeterminato, in realtà nella maggior parte dei casi non lo è realmente.

Il codice infatti si distribuisce in locazioni di memoria sequenziali, e, statisticamente, raramente effettua salti casuali tra istruzioni. Su questa assunzione di base si fondano i due Principi di Località:

>Principio di località Temporale: visto un dato è probabile che molto presto si voglia utilizzare di nuovo.
>
>Principio di località Spaziale: visto un indirizzo è probabile che a breve ci si ritorni.

La cache si basa proprio su questi principi: quando accederemo alla RAM, la cache sarà in ascolto di letture e scritture, salvandosi in locale tutti quei dati che, per i principi sopra detti, ci serviranno.

La sua posizione nello schema a blocchi è:

![]()

La sua esecuzione è gestita da un controllore che lavora in modo trasparente (il processore e il programmatore ignorano la sua esistenza -non la vedono-)

Ciò che succede nel normale flusso degli eventi è che: quando la CPU richiede un dato, il controllore controlla se lo ha già salvato, in caso positivo ritorna subito il dato, altrimenti inoltra la richiesta di lettura alla ram e quando arriva la risposta, prima di rimandarla alla CPU se la salva localmente (nel caso sostituendo i dati che l'architettura determina).