# Periferiche e spazio di IO

Per la macchia virtuale che abbiamo (QEMU) abbiamo delle periferiche dello standard ISA simulate; in particolare abbiamo la tastiera (PC AT), Video (standard VGA), timer (PC AT), HardDisk (PC AT quando inserito)

Analizziamo queste periferiche:

## La Tastiera

Rileva i tasti premuti e rilasciati per comunicarli al pc.

A quasi ogni tasto vi è associato un codice di scansione che si divide in make e brake code (premo e rilascio); dopo un determinato lasso di tempo, se tenuto continuamente premuto, viene interpretata come una sequenza di caratteri uguali.

### Come è fatta fisicamente

All'interno la tastiera è composta da 3 fogli di plastica, dove il foglio più in alto ha tracce verticali, il foglio più in basso tracce orizzontali, mentre il foglio centrale è bucato in corrispondenza dei tasti.

Quando premiamo un tasto, un pulsantino comprime i fogli e mette in conduzione un traccia orizzontale e una verticale.

Collegato alle tracce (sia verticali che orrizontali) si trova un microcontrollore (ROM e piccolo chip con processore e RAM). Il microcontrollore invia migliaia di impulsi al secondo sulle tracce di uno dei due fogli

Se non ci sono pulsanti premuti non ha segnale di ritorno, altrimenti lo ha in corrispondenza della traccia incolonnata.

A questo punto aggiornerà la RAM con la chiave selezionata e manderà segnale di pressione/sollevamento a seconda che la chiave sia stata aggiunta o rimossa.

Sulla scheda madre si trova un’ulteriore microcontrollore con 4 registri (RBR, TBR, STR, CMD). Il segnale in entrata salva l’ultimo codice di scansione in RBR aggiornando opportunamente il registro di stato STR.

È possibile comunicare alla tastiera diverse informazioni, alcune delle quali sono: typemeter (ogni quanto leggo un nuovo codice) ed eventuali led della tastiera.
Il software si occupa di convertire i codici di scansione inviati dalla tastiera in codice ASCII:

## Il video

Per come lo studieremo noi, avremo a che fare con la tecnologia vga, più semplice da comprendere; questo avrà una sua memoria (memoria video) a cui possiamo accedervi normalmente

Questa memoria può essere più o meno grande, ma in qualsiasi caso abbastanza da poter contenere tutta la pagina mostrata a schermo.

La memoria video è particolare dal punto di vista hardware, poiché ha 2 porte di accesso (invece di una sola come la RAM):

- 1 verso la CPU (identica alla RAM)
- 1 verso l’adattatore video

L’adattatore video può leggere tutta la memoria, e lo fa un numero diverso di volte al secondo (30, 60, 90, 120, …).

La teconologia VGA permette l’interpretazione da parte dell’adattatore della memoria in due modi:

Modalità Testo e Modalità Video, andiamo a vedere come funzionano.

### Modalità testo

è la modalità base in cui si accende il calcolatore; memoria e display vengono trattati come caratteri ASCII; l'adattatore ha per questo una sua memoria ROM che associa ad ogni codice ASCII un font che verrà mostrato in video.

In memoria però il carattere non viene definito solo dal codice Ascii ma anche da degli attributi, in paricolare:

![tabella valori tastiera](../assets/text%20mode.png)

Per noi la memoria video parte dal'indirizzo `0xB8000`

### modalità grafica

Il progammatore può accedervi al pixel per modificarne il colore; la modalità più semplice per l’utilizzo è quella tramite frame-buffer, nella quale si può decidere il colore di ogni pixel nell’indirizzo corretto inserendo il colore su 8bit (così da avere una matrice di byte).

Il passaggio tra modalità è estremamente complesso e quello che vedremo noi è semplificato dalla virtualizzazione della macchina.

Tolto questo accorgimento, la modalità gradica funziona in maniera analoga alla modalità testo.

Nelle moderne schede video si trova inoltre un coprocessore grafico, che si occupa escusivamente di fare i disegni in parallelo al processore che esegue altre operazioni. Nel nostro caso non utilizzeremo il coprocessore ma faremo tutto da software.

## Timer

Interfaccia utile per contare il tempo passato, viene implementata tramite un'interfaccia più generale che conta degli eventi (gli impulsi elettrici); in particolare quello che usiamo noi ha 3 interfacce di conteggio:

|N. Contatore|A cosa serve|
|----|----|
|Contatore 0| per le interruzioni|
|Contatore 1| usato per fare refresh della RAM, oggi in disuso|
|Contatore 2| collegato al dispositivo audio del pc|

Ogni contatore ha 4 registri (2 di sola lettura [dello stato corrente del contatore STR_LSB e STR_MSB], 2 di sola scrittura [per impostare parte alta e parte bassa del contatore CTR_LSB E CTR_MSB]), inoltre i tre contatori hanno un registro a comune (CWR)

Il chip occupa gli indirizzi 0x40-0x43 (ha solo 2 piedini), 0x40  per tutto il contatore 0, 0x41 per il contatore 1 e 0x42 per il contatore 2, mentre 0x43 è per CWR

Iniziamo analizzando il Contatore 2

È importante intanto dire che il contatore non è collegato direttamente allo speaker ma prima passa una porta AND con il registro SPR all’indirizzo 0x61. Questa struttura permetteva il mute qual’ora venisse inserito 0 all’intenro di SPR, oltre a poter fare dei giochetti particolari con l’audio.

## Hard disk

è una memoria di massa; il processore (per incompatibilità nelle interfacce) non può eseguire i programmi presenti lì dentro.

Gli hard disk operano a blocchi (tendenzialmente 512Byte), e possono trasferire solo multipli del blocco. La comunicazione viene comunque effettuata tramita un’interfaccia con il bus, che deve essere gestita da software.

Quelli che studiamo noi sono gli HDD, che sono formati da diversi dischi di materiale ferromagnetico che girano costantemente ad una certa velocità (rpm) e che vegono letti da una testina estesa da un braccio che si muove ruotando attorno ad un perno. Le informazioni possono essere salvate su entrambe le facce di un disco. L’insieme di queste parti si chiama drive.

L’informazione su questi dischi è organizzata in settori (spicchi) e tracce (corridoi concentrici). L’intersezione tra un settore e una traccia si dice blocco.

Nella lettura la testina recupera un blocco e lo invia all’interfaccia. Successivamente tramite software verrà recuperato. Nella scrittura si scrive via software su un blocco che poi verrà trasmesso alla traccia e successivamente salvato nel blocco desiderato nei dischi.
