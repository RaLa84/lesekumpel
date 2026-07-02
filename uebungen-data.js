/* ============================================================
   Lesekumpel · uebungen-data.js
   Handkuratierter Übungs-Content für die Lernpfad-Lektionen.
   Reines Daten-Modul (kein DOM, keine Abhängigkeiten).
   Gerendert von uebungen.js (window.Uebungen).

   Quellen der Lernziele: docs/leseapp_konzeption.md (Z. 1282–1558)
   + prompts/stufen-regeln.md (Beispielwortlisten je Stufe).

   Item-Typen:
   - word:   { id, type:'word', wort, silben?, mark?, markAt?:'end' }
             mark = hervorgehobener Teilstring (wie Graphem-Highlight)
   - build:  { id, type:'build', teile:['ver','laufen'], hi?:0 }
             hi = Index des farbig markierten Teils
   - choice: { id, type:'choice', satz?, frage, optionen:[richtig, f, f] }
             ERSTE Option ist immer die richtige — die Engine mischt!
   - satz:   { id, type:'satz', satz:'Er [macht] die Tür [zu].',
               frage?:{frage, optionen} }   [] = Highlight
   - dialog: { id, type:'dialog', zeilen:[{sprecher, text}],
               frage?:{frage, optionen} }
   - text:   { id, type:'text', titel, text, fragen:[choice, choice] }

   Ids stabil halten — sie sind Persistenz-Schlüssel (child.lernpfad).
   Lektion 1.1 (Top-100) hat hier KEINE Items: Runden kommen zur
   Laufzeit aus der CSV (Lernpfad.loadTop100).
   ============================================================ */
(function () {
  'use strict';

  var LESSONS = {

    /* ---------- 2.2 STOLPERSTEINE ----------
       Ziel: harte Anlaute/Konsonantenhäufungen flüssig sprechen
       (ohne Vokal-Einschub): bl, gr, kn, pf, str, schr, spr, chs, tsch */
    '2.2': { items: [
      { id: 'st1', type: 'word', wort: 'Pflanze', silben: 'Pflan·ze', mark: 'Pfl' },
      { id: 'st2', type: 'word', wort: 'Strumpf', silben: 'Strumpf', mark: 'Str' },
      { id: 'st3', type: 'word', wort: 'Knopf', silben: 'Knopf', mark: 'Kn' },
      { id: 'st4', type: 'word', wort: 'Gras', silben: 'Gras', mark: 'Gr' },
      { id: 'st5', type: 'word', wort: 'blau', silben: 'blau', mark: 'bl' },
      { id: 'st6', type: 'word', wort: 'Fuchs', silben: 'Fuchs', mark: 'chs' },
      { id: 'st7', type: 'word', wort: 'Quatsch', silben: 'Quatsch', mark: 'tsch' },
      { id: 'st8', type: 'word', wort: 'Schrank', silben: 'Schrank', mark: 'Schr' },
      { id: 'st9', type: 'word', wort: 'Sprung', silben: 'Sprung', mark: 'Spr' },
      { id: 'st10', type: 'word', wort: 'Brille', silben: 'Bril·le', mark: 'Br' }
    ] },

    /* ---------- 2.3 ENDUNGEN ----------
       Ziel: Endungen -en/-er/-el/-chen rhythmisch verschleifen
       (kein Roboter-Lesen) — zweisilbige Wörter */
    '2.3': { items: [
      { id: 'en1', type: 'word', wort: 'laufen', silben: 'lau·fen', mark: 'en', markAt: 'end' },
      { id: 'en2', type: 'word', wort: 'Vogel', silben: 'Vo·gel', mark: 'el', markAt: 'end' },
      { id: 'en3', type: 'word', wort: 'Lehrer', silben: 'Leh·rer', mark: 'er', markAt: 'end' },
      { id: 'en4', type: 'word', wort: 'Gabel', silben: 'Ga·bel', mark: 'el', markAt: 'end' },
      { id: 'en5', type: 'word', wort: 'Wasser', silben: 'Was·ser', mark: 'er', markAt: 'end' },
      { id: 'en6', type: 'word', wort: 'Garten', silben: 'Gar·ten', mark: 'en', markAt: 'end' },
      { id: 'en7', type: 'word', wort: 'Häschen', silben: 'Häs·chen', mark: 'chen', markAt: 'end' },
      { id: 'en8', type: 'word', wort: 'Blumen', silben: 'Blu·men', mark: 'en', markAt: 'end' },
      { id: 'en9', type: 'word', wort: 'Zimmer', silben: 'Zim·mer', mark: 'er', markAt: 'end' },
      { id: 'en10', type: 'word', wort: 'Apfel', silben: 'Ap·fel', mark: 'el', markAt: 'end' }
    ] },

    /* ---------- 2.4 LANGE WÖRTER ----------
       Ziel: Komposita in Sinn-Einheiten zerlegen (Lego-Prinzip) */
    '2.4': { items: [
      { id: 'lw1', type: 'build', teile: ['Baum', 'haus'] },
      { id: 'lw2', type: 'build', teile: ['Sonnen', 'blume'] },
      { id: 'lw3', type: 'build', teile: ['Haus', 'tür'] },
      { id: 'lw4', type: 'build', teile: ['Schul', 'hof'] },
      { id: 'lw5', type: 'build', teile: ['Hunde', 'hütte'] },
      { id: 'lw6', type: 'build', teile: ['Regen', 'bogen'] },
      { id: 'lw7', type: 'build', teile: ['Schlüssel', 'bund'] },
      { id: 'lw8', type: 'build', teile: ['Feuer', 'wehr', 'auto'] },
      { id: 'lw9', type: 'build', teile: ['Fuß', 'ball', 'platz'] },
      { id: 'lw10', type: 'build', teile: ['Marmeladen', 'brot'] }
    ] },

    /* ---------- 3.1 ERZÄHLZEIT (Präteritum) ----------
       Ziel: veränderte Wortformen erkennen (sehen → sah) */
    '3.1': { items: [
      { id: 'ez1', type: 'choice', frage: 'Gestern ___ ich einen Hund im Park.', optionen: ['sah', 'sehte', 'sieht'] },
      { id: 'ez2', type: 'choice', frage: 'Es ___ einmal eine mutige Prinzessin.', optionen: ['war', 'ist', 'wird'] },
      { id: 'ez3', type: 'choice', frage: 'Der Drache ___ hoch in die Luft.', optionen: ['flog', 'fliegte', 'fliegt'] },
      { id: 'ez4', type: 'choice', frage: 'Mia ___ gestern zur Schule.', optionen: ['ging', 'gehte', 'geht'] },
      { id: 'ez5', type: 'choice', frage: 'Plötzlich ___ ein Zug an.', optionen: ['kam', 'kommt', 'kommte'] },
      { id: 'ez6', type: 'choice', frage: 'Ben ___ im Garten einen Schatz.', optionen: ['fand', 'findet', 'findete'] },
      { id: 'ez7', type: 'choice', frage: 'Wir ___ zusammen ein Lied.', optionen: ['sangen', 'singen', 'singten'] },
      { id: 'ez8', type: 'choice', frage: 'Oma ___ uns eine Geschichte.', optionen: ['erzählte', 'erzählt', 'erzählen'] },
      { id: 'ez9', type: 'choice', frage: 'Der Hund ___ die ganze Nacht.', optionen: ['bellte', 'bellt', 'gebellt'] },
      { id: 'ez10', type: 'choice', frage: 'Danach ___ ich sehr müde.', optionen: ['war', 'bin', 'werde'] }
    ] },

    /* ---------- 3.2 VORSILBEN ----------
       Ziel: erkennen, wie die Vorsilbe den Sinn ändert */
    '3.2': { items: [
      { id: 'vs1', type: 'build', teile: ['ver', 'laufen'], hi: 0 },
      { id: 'vs2', type: 'build', teile: ['weg', 'laufen'], hi: 0 },
      { id: 'vs3', type: 'build', teile: ['auf', 'machen'], hi: 0 },
      { id: 'vs4', type: 'build', teile: ['zu', 'machen'], hi: 0 },
      { id: 'vs5', type: 'build', teile: ['be', 'malen'], hi: 0 },
      { id: 'vs6', type: 'build', teile: ['ent', 'decken'], hi: 0 },
      { id: 'vs7', type: 'build', teile: ['ver', 'gessen'], hi: 0 },
      { id: 'vs8', type: 'build', teile: ['ge', 'winnen'], hi: 0 },
      { id: 'vs9', type: 'choice', frage: 'Was bedeutet „sich verlaufen"?', optionen: ['den Weg verlieren', 'schnell rennen', 'laut rufen'] },
      { id: 'vs10', type: 'choice', frage: 'Was bedeutet „entdecken"?', optionen: ['etwas Neues finden', 'etwas zudecken', 'etwas aufessen'] }
    ] },

    /* ---------- 3.3 NACHSILBEN ----------
       Ziel: Nomen erkennen, die keine Gegenstände sind (-ung, -heit, -keit, -nis) */
    '3.3': { items: [
      { id: 'ns1', type: 'build', teile: ['Frei', 'heit'], hi: 1 },
      { id: 'ns2', type: 'build', teile: ['Zeit', 'ung'], hi: 1 },
      { id: 'ns3', type: 'build', teile: ['Freund', 'schaft'], hi: 1 },
      { id: 'ns4', type: 'build', teile: ['Möglich', 'keit'], hi: 1 },
      { id: 'ns5', type: 'build', teile: ['Wohn', 'ung'], hi: 1 },
      { id: 'ns6', type: 'build', teile: ['Dunkel', 'heit'], hi: 1 },
      { id: 'ns7', type: 'build', teile: ['Ergeb', 'nis'], hi: 1 },
      { id: 'ns8', type: 'build', teile: ['Krank', 'heit'], hi: 1 },
      { id: 'ns9', type: 'choice', frage: 'Welches Wort kann man NICHT anfassen?', optionen: ['Freiheit', 'Gabel', 'Apfel'] },
      { id: 'ns10', type: 'choice', frage: 'Aus „möglich" wird mit -keit:', optionen: ['Möglichkeit', 'Möglichung', 'Möglichheit'] }
    ] },

    /* ---------- 3.4 BINDEWÖRTER ----------
       Ziel: Sätze verbinden und Gründe verstehen (weil, dass, aber, denn) */
    '3.4': { items: [
      { id: 'bw1', type: 'choice', frage: 'Ich lese gern, ___ Geschichten spannend sind.', optionen: ['weil', 'oder', 'ob'] },
      { id: 'bw2', type: 'choice', frage: 'Erst regnete es, ___ dann kam die Sonne.', optionen: ['aber', 'weil', 'ob'] },
      { id: 'bw3', type: 'choice', frage: 'Mia weiß, ___ ihr Hund gern spielt.', optionen: ['dass', 'weil', 'oder'] },
      { id: 'bw4', type: 'choice', frage: 'Wir bleiben drinnen, ___ es regnet.', optionen: ['weil', 'dass', 'oder'] },
      { id: 'bw5', type: 'choice', frage: 'Ben ist müde, ___ er schläft nicht.', optionen: ['aber', 'weil', 'dass'] },
      { id: 'bw6', type: 'choice', frage: 'Ich nehme den Schirm mit, ___ ich nicht nass werde.', optionen: ['damit', 'aber', 'dass'] },
      { id: 'bw7', type: 'choice', frage: 'Papa kocht, ___ Mama den Tisch deckt.', optionen: ['während', 'weil', 'dass'] },
      { id: 'bw8', type: 'choice', frage: 'Der Ausflug findet statt, ___ es regnet.', optionen: ['obwohl', 'weil', 'damit'] }
    ] },

    /* ---------- 4.1 SATZKLAMMER ----------
       Ziel: das Satzende vorausahnen (trennbare Verben: macht … zu) */
    '4.1': { items: [
      { id: 'sk1', type: 'satz', satz: 'Er [macht] die Tür [zu].' },
      { id: 'sk2', type: 'satz', satz: 'Mia [räumt] ihr Zimmer [auf].' },
      { id: 'sk3', type: 'satz', satz: 'Wir [kaufen] im Supermarkt [ein].' },
      { id: 'sk4', type: 'satz', satz: 'Ben [zieht] seine Jacke [an].' },
      { id: 'sk5', type: 'satz', satz: 'Der Zug [fährt] gleich [los].' },
      { id: 'sk6', type: 'satz', satz: 'Die Kinder [steigen] am Bahnhof [aus].' },
      { id: 'sk7', type: 'satz', satz: 'Opa [schließt] die Gartentür [auf].',
        frage: { frage: 'Was macht Opa mit der Gartentür?', optionen: ['aufschließen', 'zuschließen', 'anmalen'] } },
      { id: 'sk8', type: 'satz', satz: 'Lena [nimmt] ihren Rucksack [mit].',
        frage: { frage: 'Was nimmt Lena mit?', optionen: ['ihren Rucksack', 'ihre Jacke', 'ihr Buch'] } }
    ] },

    /* ---------- 4.2 DIALOGE ----------
       Ziel: Betonung anpassen — lesen wie ein Schauspieler */
    '4.2': { items: [
      { id: 'dl1', type: 'dialog', zeilen: [
          { sprecher: 'Mia', text: '„Los geht’s, wir sind spät dran!"' },
          { sprecher: 'Ben', text: '„Warte auf mich, ich binde nur den Schuh!"' }
        ],
        frage: { frage: 'Wer soll warten?', optionen: ['Mia', 'Ben', 'der Hund'] } },
      { id: 'dl2', type: 'dialog', zeilen: [
          { sprecher: 'Papa', text: '„Wer möchte Pfannkuchen?"' },
          { sprecher: 'Emma', text: '„Ich! Mit Apfelmus, bitte!"' }
        ],
        frage: { frage: 'Was möchte Emma zu den Pfannkuchen?', optionen: ['Apfelmus', 'Ketchup', 'Honig'] } },
      { id: 'dl3', type: 'dialog', zeilen: [
          { sprecher: 'Tom', text: '„Hast du mein Buch gesehen?"' },
          { sprecher: 'Ida', text: '„Ja, es liegt unter dem Tisch."' }
        ],
        frage: { frage: 'Wo liegt das Buch?', optionen: ['unter dem Tisch', 'im Regal', 'in der Tasche'] } },
      { id: 'dl4', type: 'dialog', zeilen: [
          { sprecher: 'Fuchs', text: '„Ich bin der Schnellste im ganzen Wald!"' },
          { sprecher: 'Igel', text: '„Dann lauf doch um die Wette mit mir!"' }
        ],
        frage: { frage: 'Was schlägt der Igel vor?', optionen: ['ein Wettrennen', 'ein Versteckspiel', 'ein Mittagessen'] } },
      { id: 'dl5', type: 'dialog', zeilen: [
          { sprecher: 'Mama', text: '„Psst, leise — das Baby schläft!"' },
          { sprecher: 'Jonas', text: '„Okay", flüsterte er ganz leise.' }
        ],
        frage: { frage: 'Warum sollen alle leise sein?', optionen: ['das Baby schläft', 'der Hund bellt', 'es ist dunkel'] } }
    ] },

    /* ---------- 4.3 RELATIVSÄTZE ----------
       Ziel: Einschübe verarbeiten, ohne den Faden zu verlieren */
    '4.3': { items: [
      { id: 'rs1', type: 'choice', satz: 'Der Hund, [der laut bellt], heißt Rex.',
        frage: 'Wer bellt laut?', optionen: ['der Hund Rex', 'die Katze', 'das Kind'] },
      { id: 'rs2', type: 'choice', satz: 'Das Mädchen, [das den Drachen zähmte], hieß Juna.',
        frage: 'Wer zähmte den Drachen?', optionen: ['Juna', 'der Drache', 'die Lehrerin'] },
      { id: 'rs3', type: 'choice', satz: 'Der Baum, [der im Garten steht], trägt Äpfel.',
        frage: 'Was trägt der Baum?', optionen: ['Äpfel', 'Kirschen', 'Nüsse'] },
      { id: 'rs4', type: 'choice', satz: 'Die Frau, [die nebenan wohnt], hat drei Katzen.',
        frage: 'Wie viele Katzen hat die Frau?', optionen: ['drei', 'zwei', 'keine'] },
      { id: 'rs5', type: 'choice', satz: 'Das Auto, [das rot glänzt], gehört Papa.',
        frage: 'Welche Farbe hat Papas Auto?', optionen: ['rot', 'blau', 'grün'] },
      { id: 'rs6', type: 'choice', satz: 'Der Junge, [der die Brille trägt], liest gern.',
        frage: 'Wer liest gern?', optionen: ['der Junge mit der Brille', 'der Junge mit der Mütze', 'die Oma'] },
      { id: 'rs7', type: 'choice', satz: 'Die Blume, [die am Fenster steht], blüht gelb.',
        frage: 'Wo steht die Blume?', optionen: ['am Fenster', 'im Garten', 'auf dem Tisch'] },
      { id: 'rs8', type: 'choice', satz: 'Der Schatz, [den wir fanden], lag unter dem Baum.',
        frage: 'Wo lag der Schatz?', optionen: ['unter dem Baum', 'im Haus', 'am Strand'] }
    ] },

    /* ---------- 4.4 VERGLEICHE ----------
       Ziel: Sprachbilder, Komparativ und Superlativ verstehen */
    '4.4': { items: [
      { id: 'vg1', type: 'choice', frage: '„Stark wie ein Bär" bedeutet:', optionen: ['sehr stark', 'ein echter Bär', 'sehr müde'] },
      { id: 'vg2', type: 'choice', frage: '„Schnell wie der Blitz" bedeutet:', optionen: ['sehr schnell', 'es gewittert', 'sehr hell'] },
      { id: 'vg3', type: 'choice', frage: '„Leise wie eine Maus" bedeutet:', optionen: ['sehr leise', 'sehr klein', 'ganz grau'] },
      { id: 'vg4', type: 'choice', satz: 'Der Riese war [größer als] das Haus.',
        frage: 'Wer ist größer?', optionen: ['der Riese', 'das Haus', 'beide gleich'] },
      { id: 'vg5', type: 'choice', satz: 'Mia rennt [schneller als] Ben.',
        frage: 'Wer gewinnt das Wettrennen?', optionen: ['Mia', 'Ben', 'keiner'] },
      { id: 'vg6', type: 'choice', frage: '„Schlau wie ein Fuchs" bedeutet:', optionen: ['sehr schlau', 'rot wie ein Fuchs', 'im Wald wohnen'] },
      { id: 'vg7', type: 'choice', satz: 'Das ist das [schönste] Bild von allen.',
        frage: 'Wie viele Bilder sind noch schöner?', optionen: ['keins', 'eins', 'alle'] },
      { id: 'vg8', type: 'choice', frage: '„Müde wie ein Murmeltier" bedeutet:', optionen: ['sehr müde', 'sehr laut', 'sehr hungrig'] }
    ] },

    /* ---------- 5.1 SYNONYME ----------
       Ziel: für jedes Wort ein Zauberwort — Wortschatz erweitern */
    '5.1': { items: [
      { id: 'sy1', type: 'choice', frage: 'Welches Wort bedeutet fast dasselbe wie „rennen"?', optionen: ['flitzen', 'schlafen', 'malen'] },
      { id: 'sy2', type: 'choice', frage: 'Welches Wort passt zu „schön"?', optionen: ['wunderbar', 'eklig', 'laut'] },
      { id: 'sy3', type: 'choice', frage: 'Welches Wort bedeutet fast dasselbe wie „rufen"?', optionen: ['schreien', 'flüstern', 'schweigen'] },
      { id: 'sy4', type: 'choice', frage: 'Ganz langsam und gemütlich gehen heißt:', optionen: ['schlendern', 'rasen', 'springen'] },
      { id: 'sy5', type: 'choice', frage: 'Ganz leise sprechen heißt:', optionen: ['flüstern', 'brüllen', 'trompeten'] },
      { id: 'sy6', type: 'choice', frage: 'Welches Wort bedeutet „schnell irgendwohin gehen"?', optionen: ['eilen', 'trödeln', 'warten'] },
      { id: 'sy7', type: 'choice', frage: 'Welches Wort passt zu „glücklich"?', optionen: ['froh', 'traurig', 'wütend'] },
      { id: 'sy8', type: 'choice', frage: 'Welches Wort bedeutet fast dasselbe wie „schauen"?', optionen: ['blicken', 'hören', 'riechen'] },
      { id: 'sy9', type: 'choice', frage: 'Sehr, sehr müde sein heißt:', optionen: ['erschöpft sein', 'munter sein', 'hungrig sein'] },
      { id: 'sy10', type: 'choice', frage: 'Welches Wort passt zu „reden"?', optionen: ['erzählen', 'essen', 'rechnen'] }
    ] },

    /* ---------- 5.2 REDEWENDUNGEN ----------
       Ziel: verstehen, was wirklich gemeint ist */
    '5.2': { items: [
      { id: 'rw1', type: 'choice', frage: '„Tomaten auf den Augen haben" heißt:', optionen: ['etwas nicht sehen', 'Gemüse essen', 'rote Augen haben'] },
      { id: 'rw2', type: 'choice', frage: '„Da steppt der Bär" heißt:', optionen: ['da ist viel los', 'ein Bär tanzt', 'es ist gefährlich'] },
      { id: 'rw3', type: 'choice', frage: '„Jemandem die Daumen drücken" heißt:', optionen: ['Glück wünschen', 'fest zupacken', 'Zahlen zählen'] },
      { id: 'rw4', type: 'choice', frage: '„Ins Fettnäpfchen treten" heißt:', optionen: ['etwas Peinliches sagen', 'in Butter treten', 'kochen lernen'] },
      { id: 'rw5', type: 'choice', frage: '„Ein Herz aus Gold haben" heißt:', optionen: ['sehr lieb sein', 'reich sein', 'krank sein'] },
      { id: 'rw6', type: 'choice', frage: '„Auf Wolke sieben schweben" heißt:', optionen: ['sehr glücklich sein', 'fliegen können', 'hoch klettern'] },
      { id: 'rw7', type: 'choice', frage: '„Hals über Kopf" heißt:', optionen: ['ganz schnell und hektisch', 'kopfüber hängen', 'Halsschmerzen haben'] },
      { id: 'rw8', type: 'choice', frage: '„Reden wie ein Wasserfall" heißt:', optionen: ['sehr viel reden', 'beim Reden spucken', 'im Wasser stehen'] }
    ] },

    /* ---------- 5.3 ABSTRAKTE WÖRTER ----------
       Ziel: Wörter für Dinge, die man nur fühlen kann */
    '5.3': { items: [
      { id: 'ab1', type: 'choice', frage: 'Was ist „Mut"?', optionen: ['sich etwas trauen', 'ein Tier', 'etwas zum Essen'] },
      { id: 'ab2', type: 'choice', frage: '„Freundschaft" bedeutet:', optionen: ['gern zusammen sein', 'ein Schiff', 'ein Spielzeug'] },
      { id: 'ab3', type: 'choice', frage: 'Was ist „Glück"?', optionen: ['ein schönes Gefühl', 'eine Farbe', 'ein Ort'] },
      { id: 'ab4', type: 'choice', frage: '„Geduld haben" heißt:', optionen: ['ruhig warten können', 'schnell rennen', 'laut singen'] },
      { id: 'ab5', type: 'choice', frage: 'Was ist „Angst"?', optionen: ['ein mulmiges Gefühl', 'ein Kleidungsstück', 'eine Pflanze'] },
      { id: 'ab6', type: 'choice', frage: '„Vertrauen" bedeutet:', optionen: ['sich auf jemanden verlassen können', 'vor jemandem weglaufen', 'etwas Neues kaufen'] },
      { id: 'ab7', type: 'choice', frage: 'Was ist „Stolz"?', optionen: ['Freude über etwas Geschafftes', 'ein hoher Turm', 'eine Frisur'] },
      { id: 'ab8', type: 'choice', frage: '„Hoffnung" bedeutet:', optionen: ['an etwas Gutes glauben', 'hoch springen', 'tief schlafen'] }
    ] },

    /* ---------- 5.4 SACHTEXTE ----------
       Ziel: echtes Wissen lesen und verstehen */
    '5.4': { items: [
      { id: 'sx1', type: 'text', titel: 'Wie schlafen Delfine?',
        text: 'Delfine schlafen nur mit einer Hälfte vom Gehirn. Die andere Hälfte bleibt wach. So können sie weiter atmen und aufpassen. Ein Auge bleibt dabei oft offen.',
        fragen: [
          { frage: 'Womit schlafen Delfine?', optionen: ['mit einer Gehirnhälfte', 'mit beiden Augen zu', 'gar nicht'] },
          { frage: 'Warum bleibt eine Hälfte wach?', optionen: ['damit sie weiter atmen können', 'weil sie Angst haben', 'weil es hell ist'] }
        ] },
      { id: 'sx2', type: 'text', titel: 'Warum ist der Himmel blau?',
        text: 'Das Licht der Sonne hat viele Farben. In der Luft wird das blaue Licht am stärksten verteilt. Darum sehen wir den Himmel blau. Am Abend ist der Weg des Lichts länger — dann leuchtet der Himmel rot.',
        fragen: [
          { frage: 'Welches Licht wird in der Luft am meisten verteilt?', optionen: ['das blaue', 'das grüne', 'das schwarze'] },
          { frage: 'Wann leuchtet der Himmel rot?', optionen: ['am Abend', 'am Mittag', 'nie'] }
        ] },
      { id: 'sx3', type: 'text', titel: 'Ameisen sind superstark',
        text: 'Eine Ameise kann viel mehr tragen, als sie selbst wiegt. Das wäre so, als würdest du ein Auto hochheben! Ameisen leben zusammen in einem Bau mit vielen tausend Tieren. Jede Ameise hat dort eine Aufgabe.',
        fragen: [
          { frage: 'Was können Ameisen besonders gut?', optionen: ['schwere Dinge tragen', 'schnell fliegen', 'laut singen'] },
          { frage: 'Wie leben Ameisen?', optionen: ['zusammen mit vielen anderen', 'ganz allein', 'immer nur zu zweit'] }
        ] }
    ] }
  };

  window.UebungenData = {
    LESSONS: LESSONS,
    get: function (lessonId) { return LESSONS[lessonId] || null; },
    itemCount: function (lessonId) {
      var l = LESSONS[lessonId];
      return l ? l.items.length : 0;
    }
  };
})();
