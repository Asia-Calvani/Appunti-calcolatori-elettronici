<!-- KaTeX CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.css" integrity="sha384-sA+qwHio6+GI5B0lBrXZcQh8vsDN6cE0nfg1fdrabZzDXhIcuq2T4iggUvuB+0d1" crossorigin="anonymous">
<!-- KaTeX JS -->
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/katex.min.js" integrity="sha384-4nyKPOU9MXVgMWu/6WBQunSKcAw/FTdgW4CssEPan7iPBoJroWX92INpwKGVz5Sx" crossorigin="anonymous"></script>
<!-- KaTeX auto-render extension -->
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.9/dist/contrib/auto-render.min.js" integrity="sha384-tsQFqpEReu7ZLhBV2z0KLc2t5aL1Pb1jByk7pZTPW+Urae9on52IyQ4GalLpFUwT" crossorigin="anonymous"></script>
<script>
  document.addEventListener("DOMContentLoaded", function() {
    renderMathInElement(document.body, {
      delimiters: [
        {left: "$$", right: "$$", display: true},
        {left: "$", right: "$", display: false}
      ]
    });
  });
</script>

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