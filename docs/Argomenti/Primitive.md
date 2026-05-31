# Primitive

Sono quelle che faremo all'esame.

Devono lavorare su un insieme di __strutture dati globali__, come `descrittori di processo` e `code dei processi`.

## Le interruzioni danno fastidio?

Cosa succede se, mentre una primitiva sta lavorando su una di queste strutture `S`, una interruzione (di qualsiasi tipo) causasse un salto ad un’altra primitiva che cerca di accedere alla medesima `S`?

Pensiamo, per esempio, ad una primitiva che sta cercando di inserire un nuovo `des_proc *d1`, nella coda `pronti` (supponiamo in testa).

Per eseguire questa operazione la primitiva esegue __due operazioni__:

1. Copiare `pronti` in `d1->puntatore`
2. Scrivere `d1` in `pronti`.

Supponiamo a questo punto che, tra la prima e la seconda scrittura, il processore salti ad un’altra routine di sistema per effetto di una interruzione. Questa nuova routine cerca anch’essa di inserire un altro `des_proc *d2` in testa alla coda `pronti`.

Questa seconda primitiva copierà quindi `pronti` in `d2->puntatore` e appenderà `d2` in testa a `pronti`.

Al termine della seconda primitiva __si ritornerà__ quindi __alla prima__, che __proseguirà dal punto in cui si era interrotta__. Il problema che sorge è che in questo momento la primitiva appenderà d1 in testa a `pronti`, __cancellando__ quanto vi aveva scritto la seconda, poiché nella `pronti` salvata in d1->puntatore non è presente d2.

Perciò l’effetto è che il `des_proc* d2` __non è più puntato da niente__.

Non vogliamo che questo accada, ma questo è solo _uno degli infiniti_ problemi che si potrebbero presentare (si pensi, per esempio, ad una salva_stato interrotta da un’altra salva_stato).

Più in generale, quello che abbiamo descritto è un problema di __interferenza tra due flussi di esecuzione__ che lavorano __su una stessa struttura dati__. La causa di queste interferenze è dovuta alle __interruzioni__, poiché rende visibili ad altri processi gli stati inconsistenti __dovute a espressioni non atomiche__.

Infatti, quando si provano ad eseguire più istruzioni che _singolarmente_ possono essere considerate _atomiche_ (poiché i vari stati inconsistenti che comportano vengono risolti al termine della loro esecuzione), a casusa delle interruzioni è possibile per un altro processo inserirsi tra queste espressioni.

In generale, noi vogliamo che ogni struttura dati si trovi in __uno stato consistente__. (Per esempio, una lista è in uno stato consistente se tutti e soli i suoi elementi sono raggiungibili dalla testa)

In un sistema che _non prevede interruzioni_, le operazioni che manipolano le strutture dati vengono scritte __assumendo__ che <u>la struttura dati si trovi sempre in uno stato consistente quando l'operazione inizia</u>, e assicurandosi <u>di portarla in un nuovo stato consistente alla fine dell’operazione</u>. __Nel mezzo__ dell’operazione, però, __sono ammessi delle transizioni temporanee della struttura dati attraverso stati non consistenti__. Ripensiamo all’operazione di inserimento in testa alla coda pronti eseguita dalla prima primitiva:\
 Subito dopo la copia di pronti in d1->puntatore, __la lista non è in uno stato consistente__, in quanto d1 ne fa concettualmente parte, __ma non è ancora puntato__ da pronti.

Questo stato inconsistente _non è un problema in un sistema senza interruzioni_, in quanto non è osservabile da nessun’altra operazione sulla coda.\
__In presenza di interruzioni__, però, _lo stato inconsistente diventa improvvisamente visibile da un’altra operazione_, che era stata __scritta assumendo che ciò non potesse mai accadere__, e che dunque non è preparata per affrontare la situazione.

Per evitare i malfunzionamenti causati dalle interferenze possiamo fare in 2 modi:

1. Scrivere tutte le routine in modo da __tener conto di tutti i modi in cui queste si possono mescolare__, in modo che funzionino in ogni caso. (possibile e anzi desiderabile, ma molto complesso);
2. Prevenire a priori l’interferenza, __eliminando tutte le sorgenti di interruzione durante l’esecuzione delle primitive__, o almeno delle loro parti critiche.

Per l’intera durata di tutte primitive del modulo sistema della nostra macchina __adotteremo la seconda soluzione__, rilasseremo solo nel modulo io. (Da considerare che alcuni testi d’esame considerano il caso di rilassamento anche nel modulo sistema.)

In particolare per quanto riguarda sistema, __tutti i gate saranno del tipo interrupt, con disabilitazione automatica delle interruzioni esterne mascherabili.__ Durante la scrittura delle primitive, staremo inoltre attenti a non causare eccezioni e a non chiaramare altre primitive tramite `int`.

Utilizzando questi accorgimenti, le nostre primitive gireranno in un __contesto atomico__: una volta iniziate saranno portate a compimento, _senza che niente le possa interrompere_.

Diventeranno in questo modo molto simili alle singole istruzioni di linguaggio macchina, la cui atomiticà è garantita dal processore. Si noti che in molti sistemi reali l’atomicità viene considerata un prezzo troppo alto da pagare e viene rilassata in vari modi, come ad esempio in Linux.

## Come summonarle

A livello `Assembler`, per invocare una primitiva non è come invocare una semplice __è necessario__ passare attraverso un gate con una istruzione `INT`.

Tuttavia è possibile utilizzare le routine a livello del C++ come una qualunque funzione, per maggior comodità dell’utente.

Ricordando che il gate di una primitiva è così formato:

```cpp
P = 1               // bit presenza //
L = SISTEMA         // livello di privilegio della routine //
DPL = UTENTE        // livello di privilegio necessario //
ROUTINE = &routine  // indirizzo della routine //
I/T = INTERRUPT     // disabilita le interruzioni esterne //
```

Le routine avranno quindi __tutte lo stesso formato__. Nel file sistema.cpp avremo:

```cpp
//...
extern "C" returnType c_primitiva_i(/*Parametri Formali*/);
//...
```

Nel file `sistema.s` avremo invece il corpo della primitiva e la sua “gemella” in assembler:

```assembly
    .global a_primitiva_i
a_primitiva_i:
    CALL salva_stato
    CALL c_primitiva;
    CALL carica_stato
    IRETQ

; ...

    .global c_primitiva_i
c_primitiva_i:
    pushq %rbp
    movq %rsp, %rbp
    ; ...
    
    ; Usa i parametri attuali in
    ; %rdi, %rsi, etc...
    
    ; ...
    leave
    ret
```

Per permettere l’invocazione di una primitiva esistono nel nostro modulo `sistema` delle _label_ globali che chiamano i gate della `IDT`.

Per poter utilizzare le primitive, esse vengono dichiarate nel file `sys.h:`

```cpp
//...
extern "C" returnType primitiva_i(/*parametri formali*/);
//...
```

Successivamente potranno essere utilizzate all’interno del file `utente.cpp`:

``` cpp
#include <sys.h>
//...
    primitiva_i(/*parametri attuali*/);
//...
```

Che verrà tradotta in assembler in qualcosa del tipo:

```assembly
; Passo i parametri nei registri adeguati
; %rdi, %rsi, ...

CALL primitiva_i
```

Successivamente l’utente si preoccuperà di inserire in `utente.s`:

```assembly
    .global primitiva_i
primitiva_i:
    INT $tipo_i
    RET
```

## Scrivere una primitiva

Per scrivere una primitiva dobbiamo eseguire una serie di passaggi, alcuni obbligati altri semplicemente utili.

Il primo passaggio utile (ma non necessario) è creare una nuova costante nel file costanti.h così da potervi riferire per nome e non per valore:

// ...
#define TIPO_I  0x29    /// tipo inutile
// ...
A questo punto il primo passaggi obbligatorio è inserirla nel sys.h:

// ...
extern "C" int inutile(int a, int b);
// ...
Adesso l’utente può dichiararne il corpo e successivamente utilizzarla.

Vediamo quindi come aggiungerla:

Nel file utente.s aggiungiamo le stab:
; ...
    .global inutile
inutile:
    .cfi_startproc      ; per il debugger
    int $TIPO_I
    RET
    .cfi_endproc        ; per il debugger
; ...
Definiamo e descriviamo quindi la funzione:

sistema.s

;...

; Aggiungiamo alla tabella IDT
init_idt:
    ;...
    carica_gate TIPO_I  a_inutile   LIV_UTENTE
    ;...
; ...
.extern c_inutile
a_inutile:
    CALL salva_stato
    CALL c_inutile
    CALL carica_stato
    IRETQ

;...
sistema.cpp

// ...
/**
* Funzione inutile che somma a, b e la priorità del processo che l'ha invocata
* @param a numero intero
* @param b numero intero
* @return la somma tra i parametri e la priorità del processo in esecuzione.
*/
extern "C" void c_inutile(int a, int b){
    // Nella variabile esecuzione si trova l'id del processo che l'ha invocata
    int r = a + b + esecuzione->precedenza;

    // Per restituire r non possiamo fare return, ma scriviamo:
    esecuzione->contesto[I_RAX] = r;
    // Questo sovrascrive il contenuto del registro %rax che avevamo 
    // salvato con la `salva_stato`, così da recuperarlo quando
    // chiameremo la `carica_stato`
}
L’utente a questo punto può utilizzare la nuova primitiva nel file utente.cpp:

#include<all.h>

int main(){
    printf("inutile(2,3) = %d\n", inutile(2,3));
    pause();
    terminate_p();
}
inutile(2, 3) = 1028

4.1. Funzioni di supporto
Le seguenti funzioni sono già definite in sistema.cpp e possono essere utilizzare nel definire nuove primitive:

void schedulatore(): sceglie il prossimo processo da mettere in esecuzione, estraendolo dalla pila pronti e salvandolo nella variabile esecuzione

void inserimento_lista(des_proc*& p_lista, des_proc* p_elem): Inserisce p_elem nella lista p_lista, mantenendo l’ordinamento basato sul campo precedenza. Se la lista contiene altri elementi che hanno la stessa precedenza del nuovo, il nuovo viene inserito come ultimo tra questi.

des_proc* rimozione_lista(des_proc*& p_lista): Estrae l’elemento in testa alla p_lista e ne restituisce un puntatore (nullptr se la lista è vuota).

void inspronti(): Inserisce il des_proc puntato da esecuzione in testa alla coda pronti senza effettuare controlli sulla priorità.

void c_abort_p(): Distrugge il processo puntato da esecuzione e chiama schedulatore()