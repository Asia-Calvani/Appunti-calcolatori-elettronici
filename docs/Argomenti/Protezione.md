# Protezione

Con i calcolatori siamo arrivati a voler fare sempre più cose:

Agli inizi, i calcolatori erano enormi e quindi ce ne erano pochi e quindi venivano usati in modalità batch:\
Gli utenti, ricercatori o studenti, preparavano i programmi a casa su fogli di carta scrivendoli in linguaggio macchina o in FORTRAN. Portavano poi i loro fogli al centro di calcolo, dove alcuni impiegati potevano trascriverli su nastro o su schede perforate. Ogni pacco di schede, contenente il programma di un utente, rappresentava un job. L’utente consegnava poi il suo job agli operatori del calcolatore e in un secondo momento sarebbe dovuto ritornare a ritirare i risultati, tipicamente sotto forma di un tabulato stampato su carta.

Gli operatori erano gli unici ad avere accesso alla sala del calcolatore, e aspettavano di avere un mazzo (batch) di job e poi lo caricavano sul lettore di schede.

Questo eseguiva i job uno alla volta. Quando il primo job terminava, veniva caricato automaticamente il successivo. In questi sistemi era quindi importante cercare di massimizzare il numero di job completati ogni ora, così da sfruttare il costosissimo processore nel modo più efficiente possibile.

Guardiamo adesso la seguente situazione che poteva tranquillamente capitare:

Supponiamo che un job1 debba caricare una serie di dati da un nastro magnetico a controllo di programma. Il nastro magnetico va però riavvolto, operazione che richiede diversi secondi. Il costosissimo processore viene così sprecato in un banale ciclo di istruzioni che legge ripetutamente i registri del controllore del nastro, per attendere che il nastro raggiunga la posizione desiderata. La “vera” elaborazione del job1, quella che ha davvero bisogno delle piene capacità della CPU, comincerà infatti solo quando tutti i dati saranno stati letti.

Per gli operatori del calcolatore sarebbe molto meglio se il controllore del nastro fosse programmato per inviare una richiesta di interruzione dopo il riavvolgimento. In questo modo, durante il tempo di riavvolgimento, si potrebbe utilizzare la CPU per cominciare ad eseguire il prossimo job del batch. All’arrivo della richiesta di interruzione si potrebbe poi ritornare al job1.

Potremmo quindi pensare di utilizzare due routine:

- `Routine1`: avvia il riavvolgimento del nastro e cede il controllo ad un altro job
- `Routine2`: (da associare alle richieste di interruzione provenienti dal controllore del nastro) restituisce il controllo al job che aveva invocato la `Routine1`

Questo però lasciato così limiterebbe drasticamente cosa potrebbero fare i job; ne nostro esempio i problemi che si presentano sono:

- Costringere l’utente 1 a scrivere il programma tramite routine invece di dialogare direttamente con il controllore
- Costringere l’utente 2 a non disattivare le interruzioni

Per risolvere potremmo delegare ad un programma il controllo sulla disattivazione delle interruzioni o lo svolgimento di processi I/O, ma resta impossibile come soluzioni in quanto i programmatori potrebbero tranquillamente mascherare le loro azioni.

La soluzione a questo problema ha obbligato a modificare l'hardware stesso per poter imporre al processore di vietare alcune operazioni in determinati contesti; in particolare distinguiamo in due contesti: contesto `utente` e contesto `sistema`.

Il contesto in cui mi trovo è indicato dal contenuto del registro `CS` (code selector) registro da un singolo bit in cui `1` equivale a contesto `sistema` e `0` a contesto `utente`

Nel contesto utente sono vietate le istruzioni `IN`, `OUT`, `CLI`, `STI`; per cui, prima di eseguire queste istruzioni, il processore controllerà se nel contesto attuale si possono usare.

## Come funziona adesso il sistema

$$
\begin{array}{cc}
\boxed{\text{Accenzione}}\\\darr\\\boxed{bootstrap}&\dashrightarrow \color{green}{\text{contesto sistema}}\\\darr\\ \boxed{\text{Inizio job}}&\dashrightarrow \color{red}{\text{contesto utente}}\\\darr\\\boxed{\text{generata interruzione}}&\dashrightarrow \color{green}{\text{contesto sistema}}\\\darr\\\boxed{\text{interruzione gestita, ritorno al job}}&\dashrightarrow \color{red}{\text{contesto utente}}
\end{array}
$$

Per far funzionare ciò dobbiamo quindi togliere agli utenti la possibilità di poter sfruttare le interruzioni, permettendo loro però di poter comunque chiamare le routine e utilizzarle.

Uno dei modi per poterlo fare è quello di __sfruttare le eccezioni__: permetteremo all’utente di utilizzare una determinata eccezione (non modificabile nella memoria), salvando in un registro quale routine si vuole chiamare.

La intel ha adottato un sistema diverso, introducendo un nuovo operando assembler `INT $tipo` che fa da gate per chiamare la routine (primitiva di sistema) e passare in modalità sistema. $tipo è un numero tra 0 e 255, ed ha lo stesso significato del tipo delle eccezioni e delle interruzioni esterne.

Per fare il passaggio inverso da sistema a utente l’unica istruzione utilizzabile è la `IRETQ`, chiamata alla fine della routine.

## Come questo cambiamento ha toccato la memoria

Non si può far 30 senza passare dal 29; anche se noi limitiamo l'utilizzo diretto delle istruzioni nulla vieta ai programmatori di toccare e modificare le routine e la tabella IDT.\
Per questo motivo è necessario poter "dividere" la memoria vietando l'accesso all'utente ad alcuni indirizzi di memoria specifici.

Per il momento immaginiamo dunque di avere un registro nel processore che contiene l’ultimo indirizzo valido di memoria utilizzabile dagli utenti. Ogni qualvolta che il processore effettuerà un accesso in memoria, prima controllerà il contesto e, nel caso fosse nel contesto utente, controllerà che l’indirizzo desiderato sia maggiore o uguale a quello contenuto nel registro.

Da ora in poi chiameremo M1 la parte di memoria ad indirizzi superiori al limite (system-only), e M2 la rimanente. Il registro contenente l’indirizzo di separazione viene inizializzato tramite il programma di bootstrap, lo stesso che carica IDT e il corpo delle varie routine e strutture dati.

## Passaggio tra contesti

Per passare tra i due contesti c'è un solo modo:

- tramite i __gate della IDT__ per passare da utente a sistema;
  - per passare è necessario che si verifichino __eccezioni/interruzioni/operazioni INT__
  - Ogni gate occupa 16 Byte e contiene le seguenti info:
    - Il puntatore alla Routine a cui saltare (8 Byte)
    - P (Presenza): indica se la riga contiene bit significativi
    - I/T: indica se il gate è di tipo Interrupt (azzera IF) o Trap (mantiene IF invariato).
    - L (Livello): indica il livello di privilegio al quale portare il processore dopo aver passato il gate. Nel nostro caso sarà sempre settato a sistema.
    - DPL (Descriptor Privilege Level): specifica il livello di privilegio minimo che deve avere il processore prima di passare il gate. Può vietare l’utilizzo di alcuni gate attraverso l’istruzione INT generando un’eccezione di protezione 13. I programmatori di sistema possono settarlo come:
      - sistema: nei gate delle interruzioni esterne, così che possano essere attraversati solo da codice protetto
      - utente: nei gate delle primitive, per permetterne l’utilizzo da parte degli utenti

### Come funziona la IDT

La IDT viene inizializzata tramite il programma di bootstrap, in particolare utilizzando l’istruzione LIDTR che carica l’indirizzo della IDT nel registro IDTR che il processore utilizza per accedere ala tabella e allocando IDT nella memoria M1. Per non permettere la modifica di IDT da parte dell’utente l’istruzione LIDTR è anch’essa vietata nel contesto utente.

Quando il processore accede all’IDT accadono questi passaggi:

1. Innanzitutto il processore si procura il tipo dell’interruzione
   - In caso di eccezione il tipo è implicito;
   - In caso di interruzione esterna, riceve il tipo dall’APIC;
   - In caso di interruzione software è l’argomento specificato nell’istruzione INT $tipo.
2. Verifica se il bit P associato al tipo è zero, generando un’eccezione di gate non presente 11 in caso positivo, negli altri casi procede.
3. Se sta gestendo una interruzione software o int3, confronta il livello corrente con il campo DPL del gate. Se il livello corrente è meno privilegiato di DPL si genera una eccezione di protezione 13.
4. Altrimenti, confronta CS con L. Se L è inferiore, si genera ancora un’eccezione di protezione 13. Questo perché attraverso la IDT non è possibile abbassare il livello di privilegio ma solamente mantenerlo o aumentarlo.
5. Negli altri casi, il processore salva in un registro di appoggio (chiamiamolo SRSP) il contenuto corrente di RSP
6. Se CS è diverso da L esegue un cambio di pila (pila sistema/utente nel nostro caso), caricando un nuovo valore in RSP (vedremo più avanti dove si trova questo valore)
7. Salva in pila 5 long word. In ordine:
   - [0] SS: 1 long word non significativa (rimasuglio della segmentazione, …)
   - [1] SRSP: pila salvata al passo 5. Nel caso di cambio pila è quella utente, altrimenti punta alla pila sistema stessa
   - [2] RFLAGS: registro dei flag
   - [3] CS: vecchio valore del CS da ripristinare successivamente
   - [4] RIP: indirizzo della prima istruzione da eseguire all’uscita del gate. Nel caso di interruzioni software INT $tipo questo contiene l’istruzione immediatamente successiva
8. Il processore poi azzera:
   - TF in ogni caso;
   - IF solo se il gate è di tipo Interrupt.
9. Salta infine all’indirizzo della routine puntata dal gate.

Le interruzioni di protezione sono progetatte per poter solamente mantenere o alzare il livello di privilegio.

Il cambio di pila è necessario, è ha due motivazioni:

Il processore deve garantire di poter scrivere le 5 long word senza sovrascrivere altre cose, e non può quindi fidarsi di RSP che è completamente a servizio dell’utente.
Queste informazioni sono salvate nella memoria di sistema, in modo che l’utente non le possa corrompere. In particolare, è bene che l’utente non possa modificare il valore salvato di CS.
Quando si chiama la IRETQ per tornare indietro, si effettua un’accesso alla pila di sistema:

Confronta il valore corrente di CS con quello salvato in pila, generando un eccezione di protezione 13 qualora quello salvato fosse più alto;
Ripristina i valori di RIP, CS, RFLAGS e RSP leggendo i corrispondenti valori dalla pila.

La IRETQ è progettata per poter solamente abbassare il livello di privilegio.

Nei primi processori intel ogni job aveva un proprio segmento di un registro chiamato TSS, che indicava la pila a disposizione del job. Per identificare la pila sistema si accedeva prima ad un’altro registro, TR (Task Register), che indicava quale segmento era associato a quel job.