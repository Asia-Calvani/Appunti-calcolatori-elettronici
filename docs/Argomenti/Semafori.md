# Semafori

Per quanto riguarda la condivisione della memoria, nel nostro sistema i processi utente:

- __Condividono__: le sezioni `.text`, `.data`, `.bus` del modulo `utente` e lo `heap`.
- __Non condividono__: la `pila utente`
  
(Questo tipo di condivisione può essere ottenuta evitando di rimpiazzare la parte di memoria condivisa quando si salta da un processo ad un altro.)

Un sistema del genere ha senso se __i processi__ appartengono __tutti__ allo __stesso utente__ e fanno parte di __un’unica applicazione__, che l’utente ha deciso di strutturare in più attività concorrenti. Il nostro è esattamente questo caso.

L’utente che scrive un’applicazione strutturata su più processi concorrenti deve affrontare dei problemi molto simili a quelli già affrontati a livello `sistema`.

In particolare, anche l’utente deve affrontare il problema _dell’interferenza_: Infatti, mentre un processo sta eseguendo delle modifiche su una struttura dati comune, un altro processo potrebbe inserirsi e cominciare anche lui a modificare la stessa struttura dati. Se l’utente non scrive il codice con attenzione, questo può causare malfunzionamenti come abbiamo già visto.

Si noti che, mentre nel codice di `sistema` abbiamo risolto il problema ricorrendo all’atomicità realizzata disabilitando le interruzioni mentre il codice è in esecuzione, __qui non possiamo fare la stessa cosa__, in quanto le interruzioni devono restare abilitate mentre il codice utente è in esecuzione.

Definiamo quindi due problemi quando ci sono __più attività che vogliono essere eseguite in contemporanea__:

- __Mutua esclusione__: _l’ordine nel quale eseguiamo le varie attività non è rilevante, basta che siano eseguiti uno per volta_. 
- __Sincronizzazione__: alcune attività devono comunque essere eseguite prima di altre, ma sempre una per volta. Un caso comune è quello in cui un processo produce dei dati e li scrive in un buffer intermedio, da cui in altro processo li preleva per svolgere ulteriori elaborazioni. In questo caso, finché il primo processo non ha prodotto i dati, il secondo non deve andare in esecuzione leggendoli. Allo stesso tempo chi scrive deve assicurarsi che l’altro ha letto correttamente tutti i dati, poiché li andrebbe a sovrascrivere.

Per risolvere i problemi di __mutua esclusione__ e __sincronizzazione__, si suppone di avere delle scatore, chiamate `semafori` che possono contenere degli oggetti, chiamati _gettoni,_ tutti uguali. Questo nome fu dato da Dijkstra in relazione al fatto che nella prima formulazione ogni semaforo poteva assumere solo due stati:

- “Rosso” $\rightarrow$ nessun gettone
- “Verde” $\rightarrow$ un gettone presente
  
Nei `semafori` possono essere eseguite __solo due operazioni__ con i gettoni: __Inserimento e Prelievo__. Per quanto riguarda l’inserimento, _non è necessario_ che il processo che insersce il gettone lo abbia _precedentemente prelevato_ da qualche parte, può infatti crearlo sul momento.\
Nel caso  del __prelievo__ del gettone, _se_ questo _non è presente_, il processo __deve aspettare che qualcun altro ne inserisca uno, entrando in uno stato di attesa__ dove non può fare nient’altro.

## Esempio Mutua Esclusione

Vediamo un classico esempio di ___mutua esclusione.___

Abbiamo:

- Persone `P1`, …, `Pn`
- Azioni `A1`, …, `An`
- Regola: <u>le azioni non possano mai essere eseguite contemporaneamente.</u>

Per risolvere questo problema è sufficente avere __un semaforo__ che inizialmente contiene un gettone __e imporre la regola che__:

>“Solo chi ha il gettone può compiere una delle azioni. Al termine dell’azione è obbligatorio reinserire il gettone”

In questo modo, se una persona vuole compiere un’azione __deve prendere il gettone__, _svuotando la scatola_. Se una seconda persona volesse compiere la stessa azione troverà _il semaforo vuoto_, e si troverà costretta _attendere che la prima termini_ la sua.

L’attesa del gettone nella scatola vuota è quello che avevamo precedentemente chiamato come stato `bloccato` delle procedure.

Possiamo notare come in casi come questo può avvenire preemption. Quando un processo riesce finalmente a recuperare il gettone, torna nella pila pronti, ed è quasi certo che abbia una priorità più elevata del processo attualmente in esecuzione, forzandone lo scambio.

## Esempio sincronizzazione

Vediamo un classico esempio di ___sincronizzazione___.

Abbiamo due persone:

- `Pa` che deve compiere l’azione `A`
- `Pb` che deve compiere l’azione `B`.
- Regola: Vogliamo inoltre che l’azione `B` venga __eseguita sempre dopo__ l’azione `A`.

È sufficiente in questo caso utilizzare __due semafori__:

- Uno che eviti che `A` e `B` avvengano in contemporanea, _inizializzata con 1 gettone_
- Uno che indichi che `A` è stata eseguita e che `B` ancora no, _inizializzata vuota_

Operativamente questo significa che:

1. `Pa` __deve lasciare un gettone nel secondo semaforo__ <u>dopo</u> aver eseguito l’azione `A`.
2. Prima di eseguire l’azione `B`, `Pb` _deve prendere un gettone dal secondo semaforo_.

Se `Pa` arriva per primo alla scatola, vi lascia il gettone così che `Pb` possa prenderlo e proseguire. Se invece arriva per primo `Pb`, troverà la scatola vuota e dovrà aspettare che `Pa` vi inserisca un gettone.

In entrambi i casi l’azione `B` __non potrà essere eseguita se prima non è finita l’azione__ `A`.

## Comandi dei semafori

```cpp
/**
 * Crea un nuovo semaforo con n gettoni
 * @param n : numero gettoni
 * @return identificatore (0xFFFFFFFF se non è stato possibile crearlo)
 */
sem = sem_ini(n);     
/**
 * Prende un gettone. Blocca il processo se il semaforo è vuoto
 * @param sem : numero del semaforo
 */
sem_wait(sem);
/**
 * Inserisce un gettone, risvegliando uno dei processi bloccati in attesa
 * @param sem: numero del semaforo 
 */
sem_signal(sem);
```

Per gli esempi di prima il codice viene come segue

__Mutua esclusione__

```cpp
natl mutex = sem_ini(1);
sem_wait(sem);
A_i();        // Azioni di A_i
sem_signal(sem);
```

__Sincronizzazione__

```cpp
natl mutex = sem_ini(1);
natl sync = sem_ini(0);

void A(){
    sem_wait(mutex);
    // ...
    sem_signal(sync);
    sem_signal(mutex);
}

void B(){
    sem_wait(sync);
    sem_wait(mutex);
    // ...
    sem_signal(mutex);
}
```

Il caso di sincronizzazione può essere sviluppato ulteriormente fino ad arrivare un funzionamento molto simile ad un handshake dav_/rfd (il primo vi può scrivere solo quando il secondo ha già letto, il secondo può leggerlo solo quando il primo ha finito di scrivere)

``` cpp

natl S1 = sem_ini(1);
natl S2 = sem_ini(0);
void scrittura(){
    sem_wait(S1);
    // corpo
    sem_signal(S2);
}
void lettura(){
    sem_wait(S2);
    // corpo
    sem_signal(S1);
}
```

## Come è realizzato nel codice

Vediamo come è definita nel modulo sistema:
```cpp
struct des_sem {
	/// se >= 0, numero di gettoni contenuti;
	/// se < 0, il valore assoluto è il numero di processi in coda
	int counter;
	/// coda di processi bloccati sul semaforo
	des_proc* pointer;
};
```

Dove:

- `counter`: conta i gettoni contenuti nel semaforo (se $\ge$ a 0). Gli permettiamo di andare sotto zero, indicando il numero di processi in attesa a quel semaforo.
- `pointer`: è la coda dei processi _in attesa_ al semaforo, ordinati per precedenza decrescente (come lo è la coda pronti). _Verrano rimessi in coda pronti quando riceveranno il gettone_, per effetto di `sem_signal()`

Come tutte le primitive, anche `sem_ini()`, `sem_wait()` e `sem_signal()` sono invocate tramite una istruzione `INT`, con tutte le conseguenze che abbiamo visto fin’ora.

Possiamo vedere di seguito la parte `C++` della primitiva `sem_ini()`:

```cpp
des_sem array_dess[MAX_SEM * 2];

extern "C" void c_sem_ini(int val){
    natl i = alloca_sem();
    if(i != 0xFFFFFFFF)
        array_dess[i].counter = val;
    esecuzione->contesto[I_RAX] = i;
}
```

Per l’allocazione dei semafori riserviamo un array di _strutture_ `des_sem`, chiamato `array_dess`. Ogni volta che l’utente ci chiede un nuovo semaforo, quello che facciamo è limitarci ad utilizzare una nuova struttura dall’array.

In questo modo, __l’array ci permette di risalire facilmente alla struttura `des_sem` corretta__ durante la ricerca dell’identificatore del semaforo passato nelle primitive `sem_wait()` e `sem_signal().`

Come vedremo, __anche il modulo io utilizza dei semafori__. Per evitare che l’utente possa erroneamente usare i semafori allocati dal modulo io, i semafori vengono idealmente distinti in

- `utente`: sono quelli che __si trovano nelle prime MAX_SEM posizioni__ dell’array
- `sistema`: sono i rimanenti
- 
La funzione `alloca_sem()` allocherà quindi un indice appartenente ad una delle due parti dell’array, in base al livello di privilegio che il processo aveva quando ha invocato la primitiva (nella pila sistema).

Vediamo ora la parte C++ della primitiva `sem_wait()`:

```cpp
extern "C" void c_sem_wait(natl sem){
    // una primitiva non deve mai fidarsi dei parametri
    if (!sem_valido(sem)) {
		flog(LOG_WARN, "sem_wait: semaforo errato: %u", sem);
		c_abort_p();
		return;
	}

	des_sem* s = &array_dess[sem];
	s->counter--;

	if (s->counter < 0) {
		inserimento_lista(s->pointer, esecuzione);
		schedulatore();
	}
}
```

Nel caso di semaforo senza gettoni, __il processo attualmente in esecuzione viene inserito nella coda del semaforo__ e ne viene scelto un altro invocando la funzione `schedulatore()`. Questa non fa altro che estrarre dalla coda pronti il processo a più alta priorità e lo fa puntare dalla variabile esecuzione. In questo modo, la routine `carica_stato` (che verrà eseguita subito dopo) farà saltare al nuovo processo, _di fatto bloccando il precedente._

Vediamo infine la parte C++ della primitiva `sem_signal()`:

```cpp
extern "C" void c_sem_signal(natl sem)
{
	// una primitiva non deve mai fidarsi dei parametri
	if (!sem_valido(sem)) {
		flog(LOG_WARN, "sem_signal: semaforo errato: %u", sem);
		c_abort_p();
		return;
	}

	des_sem* s = &array_dess[sem];
	s->counter++;

	if (s->counter <= 0) {
		des_proc* lavoro = rimozione_lista(s->pointer);
		inspronti();	// preemption
		inserimento_lista(pronti, lavoro);
		schedulatore();	// preemption
	}
}
```

Se ci sono processi in coda sul semaforo, __la primitiva estrae quello a priorità più alta__ attraverso la funzione `rimozione_lista()`. A questo punto la primitiva deve scegliere quale processo deve proseguire, tra quello in esecuzione e quello appena estratto. La cosa più semplice è di __inserire entrambi i processi in coda pronti__ e lasciar scegliere alla funzione `schedulatore()`, applicando la _preemption_.

Sia la `sem_wait()` che la `sem_signal()`, prima di usare sem, _controllano che questo sia un valido identificatore_ di semaforo, ovvero che sia stato precedentemente restituito da una `sem_ini()` per il livello corretto, e terminare forzatamente il processo in caso contrario.

## Utilizzo Debugger

Le estensioni del debugger che abbiamo nella nostra macchina `QEMU` contengono anche alcuni comandi relativi ai _semafori_:

- `sem`: mostra lo stato di tutti i semafori allocati
- `sem waiting`: mostra lo stato di tutti i semafori la cui coda non è vuota. È eseguito automaticamente ogni volta che il debugger riacquisisce controllo.
- 
Lo stato dei semafori è mostrato nella forma: `{counter, lista_processi}`.