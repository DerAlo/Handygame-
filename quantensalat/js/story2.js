// QUANTENSALAT – Kapitel 2: Der Unwahrscheinlichkeitssturm
import { audio } from './audio.js';
import { drawCounter } from './art.js';
import { trainingDuel, finalDuel, learnedIn } from './duel.js';

const C = { kai: '#ffffff', prof: '#d7b4ff', mehmet: '#ffc864', glanz: '#ff8fa8', glanzi: '#7fe3ff', guard: '#ff9f9f', karl: '#9dff9d', radio: '#ffe89a' };

async function lines(E, list) { for (const [who, text, o] of list) await E.say(who, text, o || {}); }
const pickHs = (scene, ...ids) => scene.hotspots.filter((h) => ids.includes(h.id));
const evilAlpha = () => 0.55 + Math.random() * 0.4;

export function newState2() {
  return {
    ch: 2, v: 1, scene: 'flur2', inv: ['besenstiel', 'handy'], learned: [],
    kai: { x: 70, y: 172, dir: 1 },
    // Die Welt nach Kapitel 1
    flags: { catOut: true, karteTaken: true, boxInLab: true, lockdownOff: true, profStable: true, profBack: true, spiessFixed: true, kittelTaken: true, brotzeitTaken: true, motorTaken: true, drawerOpen: true },
  };
}

export function chapter2(ch1) {
  const scenes = {};

  // ===================== FLUR =====================
  scenes.flur2 = {
    art: 'flur', title: 'Institut · Flur', music: 'flur',
    walk: ch1.flur.walk,
    entries: { ...ch1.flur.entries, start: [70, 172, 1] },
    actors: () => [],
    async enter(E) {
      if (E.F.intro2) return;
      E.F.intro2 = true;
      await E.narrate('KAPITEL 2: Der Unwahrscheinlichkeitssturm', 2600);
      await E.narrate('Drei Wochen später. 6:15 Uhr morgens.');
      await lines(E, [
        ['kai', 'Ich heiße Kai Wimmer, und ich BIN Wissenschaftler!'],
        ['kai', 'Doktorand, um genau zu sein. Mit eigenem Kittel. Und eigenem Namensschild.'],
        ['kai', 'Da steht zwar „Kai Wimmer, Hausmeister (Doktorand)“ drauf. Aber hey.'],
        ['kai', 'Zeit für meinen Morgenkaffee aus dem Automaten. Haha. Kleiner Insider-Witz. Der ist seit 2019 kaputt.'],
      ]);
      await E.walkTo(220, 160);
      E.face(1);
      await E.say('kai', '*drückt auf „Espresso“*');
      audio.pickup();
      await E.narrate('*Blubb-blubb … ZISCH … pling!*', 1600);
      await lines(E, [
        ['kai', '…'],
        ['kai', 'Er … er hat „pling“ gemacht.'],
        ['kai', 'Das Display sagt: „BITTE BECHER EINSTELLEN“.'],
        ['kai', 'Der Kaffeeautomat FUNKTIONIERT?!'],
        ['kai', 'Das ist das Unwahrscheinlichste, was in diesem Gebäude je passiert ist.'],
      ]);
      await E.say('__narr', 'Prof. Brandl (aus dem Labor): „KAI! Ins Labor! SOFORT!“', { color: C.prof });
      await E.say('kai', 'Ich hatte befürchtet, dass sie das sagt.');
    },
    hotspots: [
      { id: 'laborTuer', name: 'Labortür', rect: [18, 54, 48, 87], at: [42, 154], exit: ['labor2', 'flur'] },
      { id: 'bueroTuer', name: 'Büro Prof. Brandl', rect: [148, 52, 46, 89], at: [171, 152], exit: ['buero2', 'flur'] },
      {
        id: 'ausgang', name: 'Ausgang', rect: [258, 50, 54, 91], at: [284, 154], exit: ['bruecke2', 'institut'],
        async canExit(E) {
          if (!E.F.briefed) { await E.say('kai', 'Erst mal hören, was die Frau Professor will. Wenn sie „SOFORT“ schreit, meint sie „gestern“.'); return false; }
          return true;
        },
      },
      {
        id: 'brett', name: 'Schwarzes Brett', rect: [78, 58, 54, 38], at: [104, 158],
        look: [['kai', 'Ein neuer Aushang: „Doktorand Kai Wimmer. Sprechstunde: nie. Er wischt.“'], ['kai', 'Wieder der Postdoc mit der Fliege. Ich schwöre, eines Tages …']],
        use: 'Ich hänge einen Zettel darunter: „Die Fliege ist schief.“ Rache ist ein Gericht, das man kalt serviert. Wie Institutskaffee.',
      },
      {
        id: 'kaffee', name: 'Kaffeeautomat', rect: [206, 78, 30, 63], at: [220, 158],
        look: (E) => E.F.coffeeBroken ? 'Wieder kaputt. Die Welt ist in Ordnung.' : 'Er funktioniert. Er leuchtet grün. Er summt. Ich traue ihm nicht.',
        use: (E) => E.F.coffeeBroken ? 'Er macht das Sterbender-Wal-Geräusch. Herrlich vertraut.' : [['kai', 'Das Display sagt: „BITTE BECHER EINSTELLEN“.'], ['kai', 'Wir haben keine Becher mehr. Der letzte wurde 2019 benutzt. Von wem, weiß keiner. Es ist eine Institutslegende.']],
        items: {
          tasse: async (E) => {
            E.removeItem('tasse');
            await E.say('kai', 'Ich stelle die Tasse der Frau Professor hinein …');
            audio.pickup();
            await E.narrate('*Blubb-blubb … ZISCH … pling!*', 1400);
            E.addItem('kaffee');
            await E.say('kai', 'Kaffee! Echter, dampfender Institutskaffee! Ich sollte das filmen. Das glaubt mir sonst keiner.');
          },
          eimer: 'Einen ganzen Eimer Kaffee? Verlockend. Aber der Automat will einen Becher, keinen Eimer.',
        },
      },
      {
        id: 'putzwagen', name: 'Putzwagen', rect: [102, 126, 38, 36], at: [120, 170], useLabel: 'Durchsuchen',
        look: 'Mein alter Putzwagen. Ich konnte mich nicht von ihm trennen. Mein Nachfolger benutzt einen Wischroboter. Verräter.',
        use: (E) => {
          if (E.F.cartTaken) return 'Leer. Nur noch ein Lappen und die Erinnerung an bessere Zeiten.';
          E.F.cartTaken = true;
          E.addItem('massband');
          E.addItem('eimer');
          return 'Ein Maßband und mein alter Eimer. Die nehme ich mit. Ein Doktorand ist auch nur ein Hausmeister mit Kittel.';
        },
      },
    ],
  };

  // ===================== LABOR =====================
  scenes.labor2 = {
    art: 'labor', title: 'Institut · Labor', music: 'labor',
    walk: ch1.labor.walk,
    entries: ch1.labor.entries,
    actors: () => [{ id: 'prof', who: 'prof', x: 196, y: 168, dir: -1, color: C.prof, pitch: 1.3 }],
    async enter(E) {
      if (E.F.briefed) return;
      E.F.briefed = true;
      await lines(E, [
        ['prof', 'Kai! Endlich! Schauen Sie sich das an!'],
        ['prof', 'Der Unwahrscheinlichkeitsindex von ganz Wasserburg steigt und steigt!'],
        ['prof', 'Seit heute früh fließt der Inn rückwärts. Die Tauben am Rathaus gurren auf Latein. Und im Einwohnermeldeamt hat ein Drucker beim ersten Versuch gedruckt.'],
        ['kai', '… Und der Kaffeeautomat funktioniert.'],
        ['prof', 'WAS?!'],
        ['prof', '… Dann ist es ernster, als ich dachte.'],
        ['kai', 'Ist unsere Q-Box kaputt?'],
        ['prof', 'Nein. Unsere Box ist kalibriert und schläft. Also – Schrödinger schläft auf ihr. Das ist ungefähr dasselbe.'],
        ['prof', 'Das muss eine ZWEITE Box sein. Glanz hat vor drei Wochen meine Baupläne kopiert.'],
        ['kai', 'Glanz? Der hängt doch in Superposition fest.'],
        ['prof', 'Nicht mehr. Die Superposition hat sich aufgelöst. Leider in zwei Richtungen.'],
        ['prof', 'Es gibt jetzt ZWEI Sven Glanz. Einer ist spurlos verschwunden.'],
        ['kai', 'Und der andere?'],
        ['prof', 'Arbeitet bei Mehmet am Kebabstand. Er sagt, er hatte schon immer das Bedürfnis, Flure zu wischen.'],
        ['kai', 'Oh nein. Das war mein Satz. Den hab ich ihm angehext.'],
        ['prof', 'Die zweite Box funkt Störsignale auf 145 Megahertz. Wir machen eine Fuchsjagd!'],
        ['kai', 'Wir jagen Füchse? Um sechs Uhr früh?'],
        ['prof', 'Funkpeilung, Kai! Man peilt den Sender mit einer Richtantenne von zwei verschiedenen Orten an. Wo sich die beiden Linien auf der Karte kreuzen, steckt der Fuchs.'],
        ['prof', 'Mein altes Handfunkgerät liegt im Büro auf dem Funktisch. Und die Antenne … Funkamateure bauen Peilantennen aus Maßbändern. Kein Witz!'],
        ['kai', 'Ich habe ein Maßband im Putzwagen! Und einen Besenstiel! Den hab ich immer dabei. Aus Gründen.'],
        ['prof', 'Perfekt. Und jetzt entschuldigen Sie mich – ohne Kaffee kann ich nicht denken. Ich trinke seit drei Wochen Tee. TEE, Kai!'],
      ]);
    },
    hotspots: [
      { id: 'tuer', name: 'Zum Flur', rect: [0, 54, 20, 87], at: [26, 160], exit: ['flur2', 'labor'] },
      {
        id: 'prof', name: 'Prof. Brandl', actor: 'prof', use: null,
        look: (E) => E.F.gotMap ? 'Die Frau Professor. Frisch koffeiniert. Ihre Augen leuchten wie Kolben mit grüner Flüssigkeit.' : 'Die Frau Professor. Zu 100 % anwesend. Zu 0 % koffeiniert. Eine gefährliche Kombination.',
        talk: (E) => talkProf2(E),
        items: {
          kaffee: async (E) => {
            E.removeItem('kaffee');
            E.F.gotMap = true;
            await lines(E, [
              ['prof', 'Ist das … KAFFEE? Aus dem AUTOMATEN?!'],
              ['prof', '*schlürf*'],
              ['prof', 'Oh. Oh, Kai. Ich kann wieder DENKEN. Ich sehe Farben. Ich höre Formeln.'],
              ['prof', 'Hier – mein Stadtplan von Wasserburg. Zeichnen Sie Ihre Peilungen darauf ein. Und dann: Fuchs fangen!'],
            ]);
            E.addItem('stadtplan');
          },
          tasse: [['prof', 'Meine Tasse! Aber … leer. Kai, eine leere Tasse ist das Traurigste auf der Welt.']],
          peiler: [['prof', 'Nicht hier drin peilen! Das Institut ist abgeschirmt. Gehen Sie raus – zwei Standorte, schön weit auseinander.']],
          yagi: [['prof', 'Eine Maßband-Yagi! Wunderschön! Jetzt noch ein Empfänger dran.']],
          funkgeraet: [['prof', 'Mein Handfunkgerät! Der Akku ist aber sicher leer. Das lag drei Jahre in der Schublade.']],
          besenstiel: [['prof', 'Sie tragen den immer noch mit sich herum? Rührend.']],
        },
        anyItem: () => [['prof', 'Interessant. Aber ich brauche vor allem eins: Kaffee.']],
      },
      {
        id: 'box', name: 'Q-Box mit Schrödinger', rect: [144, 80, 32, 30], at: [140, 168],
        look: [['kai', 'Die Q-Box. Schrödinger schläft darauf.'], ['kai', 'Er schnurrt in einer Frequenz, die mir Angst macht.']],
        use: 'Ich wecke keine schlafende Katze auf einer Quantenmaschine. Aus Kapitel 1 habe ich gelernt.',
        talk: [['kai', 'Morgen, Schrödinger.'], ['__narr', 'Schrödinger öffnet ein Auge. Dann schließt er es wieder. Er existiert gerade nur für sich selbst.']],
      },
      {
        id: 'tafel', name: 'Whiteboard', rect: [112, 30, 86, 50], at: [150, 166],
        look: [['kai', 'Eine neue Formel, dreimal unterstrichen: „P(Kaffeeautomat funktioniert) = 1 ?!?!“'], ['kai', 'Daneben hat jemand einen weinenden Smiley gemalt.']],
        use: 'Ich male einen Fuchs dazu. Für die Moral.',
      },
      ...pickHs(ch1.labor, 'laser', 'kolben', 'dewar'),
      { id: 'kittel', name: 'Kleiderhaken', rect: [28, 64, 30, 10], at: [40, 158], look: 'Mein Kittel hing hier. Jetzt hängt er an mir. Das ist Karriere.' },
      { id: 'karton', name: 'Karton', rect: [246, 138, 38, 34], at: [238, 176], look: 'Schrödingers alter Karton. Er ist umgezogen. Auf die Q-Box. Besserer Ausblick.', use: 'Leer. Nur ein paar Haare und ein leicht angesabberter Leberkäs-Krümel von damals.' },
    ],
  };

  // ===================== BÜRO =====================
  scenes.buero2 = {
    art: 'buero', title: 'Institut · Büro Prof. Brandl', music: 'buero',
    walk: ch1.buero.walk,
    entries: ch1.buero.entries,
    actors: () => [],
    hotspots: [
      { id: 'tuer', name: 'Zum Flur', rect: [4, 52, 34, 90], at: [34, 166], exit: ['flur2', 'buero'] },
      {
        id: 'hfg', name: 'Handfunkgerät', rect: [244, 92, 14, 20], at: [236, 160], useLabel: 'Nehmen',
        visible: (S) => !S.flags.hfgTaken,
        look: 'Ein altes Handfunkgerät. Zwei-Meter-Band. Die Frau Professor hat es „Rudi“ getauft.',
        use: async (E) => {
          E.F.hfgTaken = true;
          E.addItem('funkgeraet');
          await E.say('kai', 'Ich schalte Rudi ein … nichts. Rot blinkende Batterie. Dann blinkt auch die nicht mehr. Akku leer.');
        },
      },
      {
        id: 'tasse', name: 'Tasse', rect: [98, 102, 12, 12], at: [104, 162], useLabel: 'Nehmen',
        visible: (S) => !S.flags.tasseTaken,
        look: 'Eine Tasse mit der Aufschrift „Weltbeste Professorin“. Innen ein Tee-Rand. Das Porzellan wirkt traurig.',
        use: (E) => { E.F.tasseTaken = true; E.addItem('tasse'); return 'Die Tasse nehme ich mit. Sie hat Besseres verdient als Tee.'; },
      },
      {
        id: 'computer', name: 'Computer', rect: [72, 86, 32, 26], at: [88, 160],
        look: [['kai', 'Auf dem Bildschirm: „Unwahrscheinlichkeitsindex Wasserburg“.'], ['kai', 'Die Kurve geht steil nach oben. Ganz rechts steht „!!!“ und ein Emoji, das schreit.']],
        use: 'Ich klicke auf „Aktualisieren“. Die Kurve steigt weiter. Ich klicke nicht mehr auf „Aktualisieren“.',
      },
      {
        id: 'funk', name: 'Funkstation', rect: [196, 92, 46, 22], at: [216, 160],
        look: 'Die große Kurzwellenstation der Frau Professor.',
        use: async (E) => {
          if (E.F.radio2) return E.say('kai', 'Lieber nicht noch mal. Die Bundesnetzagentur hat bestimmt schon eine Akte über mich.');
          E.F.radio2 = true;
          audio.radio();
          await E.say('kai', 'Ich drehe am Knopf … Rauschen … dann eine bekannte Stimme:');
          await E.say('__narr', '„Hier DO5ALO aus Wasserburg. Ich höre, ihr macht eine Fuchsjagd?“', { color: C.radio });
          await E.say('kai', 'Äh … ja? Woher wissen Sie das?');
          await E.say('__narr', '„Es ist Wasserburg. Hier weiß jeder alles. Tipp vom OM: Maßband-Yagi, drei Elemente, und dann ganz langsam drehen. Wo es am lautesten piept, da sitzt der Fuchs. 73!“', { color: C.radio });
          audio.morse('MOE');
          await E.say('kai', 'M-O-E? Das piept der Fuchs? Ich lerne heute so viel.');
        },
      },
      ...pickHs(ch1.buero, 'qsl', 'lampe', 'fenster', 'regal'),
      { id: 'schublade', name: 'Schreibtischschublade', rect: [96, 118, 32, 18], at: [112, 164], look: 'Die Schublade.', use: 'Immer noch der Gummibär von 2011. Er hat Kapitel 1 überlebt. Respekt.' },
    ],
  };

  // ===================== INNBRÜCKE =====================
  scenes.bruecke2 = {
    art: 'bruecke', title: 'Innbrücke vor dem Brucktor', music: 'bruecke',
    walk: ch1.bruecke.walk,
    entries: ch1.bruecke.entries,
    actors: () => [
      { id: 'mehmet', who: 'mehmet', x: 80, y: 146, dir: 1, fixedDir: true, color: C.mehmet, pitch: 0.8, after: drawCounter },
      { id: 'glanzi', who: 'glanzi', x: 150, y: 170, dir: -1, color: C.glanzi, pitch: 1.1 },
    ],
    async enter(E) {
      if (E.F.sawInn) return;
      E.F.sawInn = true;
      await lines(E, [['kai', 'Der Inn … fließt wirklich rückwärts. Richtung Rosenheim.'], ['kai', 'Die Enten schwimmen im Kreis und schauen sich gegenseitig vorwurfsvoll an.']]);
    },
    hotspots: [
      { id: 'zumInstitut', name: 'Zum Institut', rect: [0, 140, 14, 60], at: [10, 174], exit: ['flur2', 'ausgang'] },
      { id: 'brucktor', name: 'Brucktor (zur Altstadt)', rect: [244, 80, 26, 70], at: [257, 158], exit: ['platz2', 'bruecke'] },
      {
        id: 'mehmet', name: 'Mehmet', actor: 'mehmet', at: [84, 170], use: null,
        look: 'Mehmet. Kebabmeister, Philosoph, Arbeitgeber des besseren Sven Glanz.',
        talk: (E) => talkMehmet2(E),
        items: {
          eimer: [['mehmet', 'Einen Eimer Döner? Kai, ich respektiere den Ehrgeiz. Aber nein.']],
          kaffee: [['mehmet', 'Kaffee aus dem Automaten vom Institut? Den trinke ich nicht. Der ist mir zu unwahrscheinlich.']],
        },
        anyItem: () => [['mehmet', 'Behalt das, mein Freund. Bei mir zahlt man mit Freundschaft. Und manchmal mit Euro.']],
      },
      {
        id: 'glanzi', name: 'Glanzi', actor: 'glanzi', use: null,
        look: 'Sven Glanz. Also die gute Hälfte. Mit Schürze. Er wischt die Theke mit einer Hingabe, die mir Tränen in die Augen treibt.',
        talk: (E) => talkGlanzi(E),
        items: {
          eimer: [['glanzi', 'Ein Eimer! Oh, darf ich …? Nein. Konzentration. Wir haben eine Stadt zu retten.']],
          handy: [['glanzi', 'Bitte keine Fotos. Ich bin gerade in meiner Demut-Phase.']],
          besenstiel: [['glanzi', 'Ein Besenstiel ohne Mopp. Wie ein Mensch ohne Sinn. Ich verstehe ihn.']],
        },
        anyItem: () => [['glanzi', 'Das ist lieb gemeint. Aber ich besitze jetzt nur noch eine Schürze und meine Würde. Und bei der Würde bin ich mir nicht sicher.']],
      },
      {
        id: 'spiess', name: 'Dönerspieß', rect: [88, 92, 24, 36], at: [96, 170],
        look: 'Der Spieß dreht sich … rückwärts. Mehmet sagt, es schmeckt trotzdem. Nur die Soße läuft nach oben.',
        use: [['mehmet', 'Finger weg, Kai. Auch rückwärts ist es noch ein Kunstwerk.']],
      },
      {
        id: 'inn', name: 'Der Inn', rect: [0, 112, 230, 20], at: [140, 160],
        look: 'Der Inn fließt rückwärts. Die Wasserwacht hat ein Schild aufgestellt: „Bitte nicht schwimmen. Oder nur rückwärts.“',
        use: 'Mit bloßen Händen schöpfe ich kein Wasser. Ich bräuchte ein Gefäß.',
        items: {
          eimer: async (E) => {
            E.removeItem('eimer');
            E.addItem('wassereimer');
            await E.say('kai', 'Ich schöpfe einen Eimer Innwasser. Es dreht sich im Eimer langsam gegen den Uhrzeigersinn. Das tut normales Wasser nicht.');
          },
          tasse: 'Die Tasse ist für Kaffee. Innwasser in der Tasse der Frau Professor wäre ein Verbrechen.',
        },
      },
      ...pickHs(ch1.bruecke, 'mond', 'laterne'),
    ],
  };

  // ===================== RATHAUSPLATZ =====================
  scenes.platz2 = {
    art: 'platz', title: 'Rathausplatz, Altstadt', music: 'platz',
    walk: ch1.platz.walk,
    entries: { ...ch1.platz.entries, burg: [292, 176, -1] },
    actors: () => [{ id: 'karl', who: 'kai', x: 64, y: 168, visible: false, color: C.karl, pitch: 1.6 }],
    hotspots: [
      { id: 'zurueck', name: 'Zur Innbrücke', rect: [0, 140, 12, 60], at: [10, 176], exit: ['bruecke2', 'platz'] },
      {
        id: 'zurBurg', name: 'Weg zur Burg', rect: [284, 128, 36, 60], at: [300, 176], exit: ['burghof', 'platz'],
        async canExit(E) {
          if (E.F.burgKnown) return true;
          await E.say('kai', 'Zur Burg hoch? Ich weiß ja noch gar nicht, wo der Fuchs steckt. Erst peilen, dann laufen.');
          return false;
        },
      },
      {
        id: 'auto', name: 'KARL (GlanzMobil)', rect: [28, 152, 72, 28], at: [110, 176],
        look: (E) => E.F.karlWashed ? 'KARL glänzt. Er summt zufrieden. Ich glaube, er ist verliebt. In einen Eimer.' : 'KARL, das GlanzMobil. Seit drei Wochen hier geparkt. Verstaubt, mit Taubenspuren. Er sieht traurig aus. Für ein Auto.',
        use: [['kai', 'Ich ruckle am Türgriff.'], ['karl', 'Bitte nicht. Ich bin im Moment emotional sehr verletzlich.']],
        talk: (E) => talkKarl2(E),
        items: {
          wassereimer: async (E) => {
            E.removeItem('wassereimer');
            E.addItem('eimer');
            E.F.karlWashed = true;
            await E.say('kai', 'Ich wasche KARL mit Innwasser. Das Wasser läuft an ihm hoch statt runter, aber es wird trotzdem sauber.');
            audio.win();
            await lines(E, [
              ['karl', 'Oh … OH! Eine Handwäsche! Mit echten Händen!'],
              ['karl', 'Das ist … das Schönste, was mir in meinem ganzen Softwareleben passiert ist.'],
              ['karl', 'Als Dank steht Ihnen mein USB-Anschluss jederzeit zur Verfügung. Das sage ich nicht zu jedem.'],
            ]);
          },
          eimer: [['karl', 'Ein leerer Eimer? Trockenwäsche? Wie … minimalistisch.'], ['kai', '(Ich sollte ihn wohl erst mit Wasser füllen.)']],
          funkgeraet: async (E) => {
            if (!E.F.karlWashed) return lines(E, [['karl', 'Strom? Für Sie? Ich stehe hier seit drei Wochen im Taubendreck und keiner hat mich je gefragt, wie es MIR geht.'], ['karl', 'Wer Strom will, muss auch Zuwendung geben. Eine Wäsche zum Beispiel. Nur so ein Gedanke.']]);
            E.removeItem('funkgeraet');
            E.addItem('funkgeraetVoll');
            audio.pickup();
            await lines(E, [['karl', 'Bitte sehr. 100 Prozent. Ich habe Ihnen sogar ein paar meiner Lieblingselektronen mitgegeben.'], ['kai', 'Danke, KARL. Du bist ein guter Wagen.'], ['karl', '*piep* Das … hat noch nie jemand zu mir gesagt.']]);
          },
          funkgeraetVoll: [['karl', 'Das ist schon voll. Mehr Liebe passt da nicht rein.']],
        },
      },
      {
        id: 'tauben', name: 'Tauben', rect: [110, 176, 44, 18], at: [134, 180],
        look: 'Tauben. Sie gurren auf Latein. „Cogito, ergo gurr.“ Die Unwahrscheinlichkeit wird wirklich schlimm.',
        talk: [['kai', 'Salve?'], ['__narr', 'Taube: „Gurrum. Veni, vidi, gurri.“'], ['kai', 'Ich brauche einen Urlaub.']],
        use: 'Die sind zu gebildet, um sich anfassen zu lassen.',
      },
      { id: 'rathaus', name: 'Rathaus', rect: [100, 0, 130, 116], at: [150, 170], look: 'Das Rathaus. Ohne GlanzTech-Banner – aber mit Absperrband. Da drin hat heute ein Drucker beim ersten Versuch gedruckt. Die Verwaltung steht unter Schock.', use: 'Geschlossen. Die Mitarbeiter sind in psychologischer Betreuung. Wegen des Druckers.' },
      { id: 'schild', name: 'Wegweiser', rect: [282, 130, 36, 12], at: [292, 176], look: 'Ein Wegweiser: „BURG →“. Die Burg thront über der Altstadt. Alt, verwinkelt, perfekt für Bösewichte.' },
    ],
  };

  // ===================== BURGHOF =====================
  scenes.burghof = {
    title: 'Burghof', music: 'burg',
    walk: [30, 158, 300, 194],
    entries: { platz: [34, 176, 1] },
    actors: (S) => [
      S.flags.bernPause
        ? { id: 'guard', who: 'guard', x: 94, y: 176, dir: 1, color: C.guard, pitch: 0.6 }
        : { id: 'guard', who: 'guard', x: 216, y: 166, dir: -1, color: C.guard, pitch: 0.6 },
    ],
    async enter(E) {
      if (E.F.sawBurg) return;
      E.F.sawBurg = true;
      await lines(E, [
        ['kai', 'Die Burg. Und im Turm leuchtet es verdächtig rosa.'],
        ['guard', 'Halt! Kein Zutritt! Anweisung vom Chef!'],
        ['kai', 'Bernd?!'],
        ['guard', 'Frau Professor?! … Nein. Moment. Sie sind der Typ vom Zukunftsgipfel. Der mit dem Moppkopf.'],
        ['kai', 'Äh …'],
        ['guard', 'Keine Sorge. Ich fand’s mutig. Aber rein kommen Sie trotzdem nicht.'],
      ]);
    },
    hotspots: [
      { id: 'zurueck', name: 'Zum Rathausplatz', rect: [0, 96, 28, 104], at: [30, 176], exit: ['platz2', 'burg'] },
      {
        id: 'guard', name: 'Bernd', actor: 'guard', use: null,
        look: (E) => E.F.bernPause ? 'Bernd isst seinen Döner. Mit geschlossenen Augen. Er ist gerade woanders. An einem besseren Ort.' : 'Bernd. Früher Security beim Zukunftsgipfel, heute Security bei GlanzTech Burg. Breit wie der Burgturm.',
        talk: (E) => talkBernd(E),
        items: {
          doener: async (E) => {
            if (E.F.bernPause) return E.say('guard', 'Ich hab doch schon einen. Ich bin glücklich.');
            E.removeItem('doener');
            await lines(E, [
              ['guard', 'Ist das … ein Döner? Vom Mehmet?'],
              ['kai', 'Mit allem. Und scharf.'],
              ['guard', '…'],
              ['guard', 'Döner ist kein Geschenk. Döner ist ein Grundrecht.'],
              ['guard', 'Ich mache jetzt meine gesetzlich vorgeschriebene Pause. Fünfzehn Minuten. Ich sehe nichts. Ich höre nichts. Ich kaue.'],
            ]);
            E.F.bernPause = true;
            const g = E.actors.guard;
            await E.walkTo(94, 176, 'guard');
            g.dir = 1;
          },
          handy: [['guard', 'Keine Fotos. Ich bin undercover. Also … so undercover, wie man mit dieser Statur sein kann.']],
        },
        anyItem: () => [['guard', 'Ich lasse mich nicht bestechen. Außer mit Döner. Döner ist keine Bestechung, Döner ist Kultur.']],
      },
      {
        id: 'tuer', name: 'Turmtür mit Zahlenschloss', rect: [222, 112, 46, 42], at: [240, 168], useLabel: 'Code eingeben',
        look: 'Eine schwere Holztür mit einem modernen Zahlenschloss. Mittelalter trifft Start-up.',
        use: async (E) => {
          if (!E.F.bernPause) return lines(E, [['guard', 'Finger weg vom Tastenfeld, Doktor Moppkopf.']]);
          if (!E.F.knowsCode) return lines(E, [['kai', 'Vier Ziffern. Ich probiere 0000 … nein. 1111 … nein. 2026 … nein.'], ['kai', 'So stehe ich hier noch bis Kapitel 3. Wer könnte den Code kennen?']]);
          if (!E.F.ready2) return lines(E, [['kai', 'Ich kenne den Code. Aber da oben wartet Glanz – mit neuen Tricks.'], ['kai', 'Ich sollte erst mit Glanzi am Kebabstand trainieren. Sonst zerlegt er mich in seine Buzzwords.']]);
          await E.say('kai', '1 … 2 … 3 … 4.');
          audio.pickup();
          await E.narrate('*Klick*', 900);
          await E.say('kai', 'Ernsthaft.');
          await E.goto('turm', 'start');
        },
      },
      { id: 'turm', name: 'Burgturm', rect: [196, 0, 86, 110], at: [240, 170], look: 'Der Burgturm. Aus den Fenstern flackert rosa Licht, und oben blinkt eine Antenne. Subtil wie ein Tech-Bro auf einem Mittelaltermarkt.', use: 'Hochklettern? Ich bin Doktorand, nicht Spider-Man.' },
      { id: 'banner', name: 'Banner', rect: [204, 94, 70, 12], at: [240, 170], look: '„GLANZTECH BURG – Mittelalter trifft Zukunft.“ Das Mittelalter wurde nicht gefragt.' },
      { id: 'brunnen', name: 'Burgbrunnen', rect: [46, 108, 48, 48], at: [96, 176], look: 'Ein alter Brunnen. Das Wasser darin kreiselt rückwärts. Sogar das Grundwasser ist verwirrt.', use: 'Ich werfe eine Münze hinein und wünsche mir, dass der Kaffeeautomat wieder kaputtgeht. Seltsamer Wunsch. Seltsame Zeiten.', items: { eimer: 'Das Brunnenwasser ist mir zu tief. Der Inn ist näher an der Oberfläche.' } },
    ],
  };

  // ===================== TURM =====================
  scenes.turm = {
    title: 'Burgturm · Serverraum', music: 'turm',
    walk: [70, 166, 290, 194],
    entries: { start: [80, 180, 1] },
    enterOnRestore: true,
    actors: (S) => {
      const list = [];
      if (!S.flags.merged) {
        list.push({ id: 'glanz', who: 'glanzEvil', x: 214, y: 176, dir: -1, color: C.glanz, alpha: evilAlpha, glitch: true, pitch: 0.9 });
        list.push({ id: 'glanzi', who: 'glanzi', x: 96, y: 186, dir: 1, color: C.glanzi, pitch: 1.1 });
      } else {
        list.push({ id: 'glanz', who: 'glanz', x: 200, y: 178, dir: -1, color: '#7fe3ff' });
      }
      return list;
    },
    async enter(E) { await turmScene(E); },
    hotspots: [
      {
        id: 'glanz', name: 'Sven Glanz', actor: 'glanz', use: null,
        look: (E) => E.F.merged ? 'Sven Glanz. Wieder eins. Er wirkt … normal. Fast sympathisch. Fast.' : 'Der böse Sven Glanz. Er flackert rosa und grinst wie ein Werbebanner.',
        talk: (E) => E.F.merged ? lines(E, [['glanz', 'Ziehen Sie den Stecker, Wimmer. Bitte. Ich halte meine eigene Box nicht mehr aus.']]) : lines(E, [['glanz', 'HAHAHA! Overdrive! Das Unwahrscheinliche wird wahrscheinlich! Das Wahrscheinliche wird … äh … auch irgendwas!']]),
        items: { handy: (E) => mergeGlanz(E), besenstiel: [['glanz', 'Wollen Sie mich mit einem Besenstiel bedrohen? Wie … analog.']] },
        anyItem: () => [['glanz', 'Dafür habe ich keine Zeit! Ich disruptiere gerade!']],
      },
      {
        id: 'glanzi', name: 'Glanzi', actor: 'glanzi', use: null,
        look: 'Glanzi. Er sieht seinen bösen Zwilling an wie ein Mensch, der ein altes Foto von sich mit Frosted Tips findet.',
        talk: [['glanzi', 'Kai! Solange wir zwei getrennt sind, bleibt die Wellenfunktion offen. Du musst uns … beobachten. Richtig beobachten!']],
        items: { handy: (E) => mergeGlanz(E) },
      },
      {
        id: 'promax', name: 'Q-Box Pro Max', rect: [140, 110, 42, 48], at: [150, 176],
        look: (E) => E.F.proMaxOff ? 'Die Pro Max. Aus. Still. Nur noch ein sehr teurer Briefbeschwerer.' : 'Die Q-Box Pro Max. Doppelt so groß wie das Original, dreimal so rosa, null Prozent kalibriert.',
        use: (E) => E.F.proMaxOff ? 'Aus ist aus.' : E.F.overdrive ? [['kai', 'Ich fasse sie an – und plötzlich spreche ich fließend Portugiesisch. Für drei Sekunden.'], ['kai', 'Die Box selbst kann ich nicht anfassen. Aber irgendwo muss sie ja Strom herbekommen …']] : 'Nicht, solange Glanz danebensteht.',
      },
      {
        id: 'stecker', name: 'Stecker', rect: [286, 116, 18, 18], at: [276, 176], useLabel: 'Ziehen',
        visible: (S) => !S.flags.proMaxOff,
        look: 'Das Stromkabel der Pro Max, eingesteckt in eine ganz normale Steckdose. Für eine Weltuntergangsmaschine erstaunlich bodenständig.',
        use: (E) => pullPlug(E),
      },
      {
        id: 'tuba', name: 'Tuba', rect: [264, 150, 24, 26], at: [256, 182],
        visible: (S) => !!S.flags.overdrive,
        look: 'Eine Tuba. Übrig geblieben von einer höchst unwahrscheinlichen Blaskapelle.',
        use: async (E) => { audio.bad(); await E.say('kai', 'Ich blase hinein. Es klingt exakt wie der Kaffeeautomat im Jahr 2019.'); },
      },
      { id: 'monitor', name: 'Monitor', rect: [184, 28, 44, 30], at: [206, 176], look: 'Ein Diagramm: „Unwahrscheinlichkeit Wasserburg“. Der letzte Balken ist so hoch, dass er aus dem Monitor ragt. Wie macht er das?!' },
      { id: 'server', name: 'Serverschränke', rect: [8, 70, 78, 82], at: [80, 180], look: 'Serverschränke im Burgturm. Die Ritter hätten gestaunt. Oder sie abgefackelt.' },
    ],
  };

  return scenes;
}

// ---------- Dialoge ----------
async function talkProf2(E) {
  for (;;) {
    const opts = [
      { id: 'fuchs', text: 'Wie funktioniert die Fuchsjagd noch mal?' },
      { id: 'glanz', text: 'Zwei Glanz? Wie kann das sein?' },
    ];
    if (!E.F.gotMap) opts.push({ id: 'plan', text: 'Haben Sie einen Stadtplan für die Peilung?' });
    opts.push({ id: 'bye', text: 'Ich mach mich auf den Weg!' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('prof', 'Viel Glück! Und Kai – falls Sie unterwegs Kaffee sehen …');
    if (c === 'fuchs') await lines(E, [
      ['prof', 'Erst die Antenne: Maßband mit dem Besenstiel kombinieren. Dann das Funkgerät laden und beides zusammenstecken.'],
      ['prof', 'Draußen peilen Sie an zwei weit auseinanderliegenden Orten. Zum Beispiel auf der Innbrücke und auf dem Rathausplatz.'],
      ['prof', 'Beide Richtungen in den Stadtplan einzeichnen. Wo sich die Linien kreuzen: Fuchs!'],
    ]);
    if (c === 'glanz') await lines(E, [
      ['prof', 'Superposition heißt: zwei Zustände gleichzeitig. Normalerweise kollabiert das zu EINEM.'],
      ['prof', 'Bei Glanz ist es in zwei Richtungen gleichzeitig kollabiert. Das ist physikalisch extrem unwahrscheinlich.'],
      ['kai', 'Also genau unser Fachgebiet.'],
      ['prof', 'Genau. Ich vermute: Solange die zwei getrennt bleiben, hängt die Pro Max an dieser offenen Wellenfunktion.'],
    ]);
    if (c === 'plan') await lines(E, [
      ['prof', 'Ja, irgendwo … Ich weiß es nicht mehr. Ohne Kaffee finde ich nicht mal meine Brille.'],
      ['kai', 'Die sitzt auf Ihrem Kopf.'],
      ['prof', 'Sehen Sie? Kaffee, Kai. Der Automat will anscheinend einen Becher. Meine Tasse steht im Büro.'],
    ]);
  }
}

async function talkMehmet2(E) {
  if (!E.F.metMehmet2) {
    E.F.metMehmet2 = true;
    await lines(E, [
      ['mehmet', 'KAI! Der Held vom Rathaus! Hoş geldin!'],
      ['mehmet', 'Mein Spieß dreht sich seit heute früh rückwärts. Aber der Döner schmeckt trotzdem. Physik ist mir egal, solange die Soße stimmt.'],
    ]);
  }
  for (;;) {
    const opts = [];
    if (!E.F.gotDoener) opts.push({ id: 'doener', text: 'Kann ich einen Döner haben?' });
    opts.push({ id: 'glanzi', text: 'Wie macht sich Glanzi?' });
    opts.push({ id: 'inn', text: 'Warum fließt der Inn rückwärts?' });
    opts.push({ id: 'bye', text: 'Bis später!' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('mehmet', 'Görüşürüz! Und bring die Welt wieder in Ordnung – mein Spieß wird schwindlig.');
    if (c === 'doener') {
      E.F.gotDoener = true;
      await E.say('mehmet', 'Für den Helden von Wasserburg? Aufs Haus! Mit allem, scharf?');
      await E.say('kai', 'Mit allem.');
      E.addItem('doener');
      await E.say('mehmet', 'Afiyet olsun! Wobei … du siehst nicht hungrig aus. Du siehst aus wie jemand mit einem Plan.');
    }
    if (c === 'glanzi') await lines(E, [
      ['mehmet', 'Er ist der beste Mitarbeiter, den ich je hatte. Er entschuldigt sich bei den Zwiebeln, bevor er sie schneidet.'],
      ['mehmet', 'Gestern hat er einen Kunden gefragt, ob er „eine faire Chance für die Salatbeilage“ in Betracht zieht. Der Mann hat geweint.'],
    ]);
    if (c === 'inn') await lines(E, [
      ['mehmet', 'Weil das Universum gerade eine Midlife-Crisis hat. Oder weil irgendwer wieder mit Quanten spielt.'],
      ['mehmet', 'Ich tippe auf Letzteres. Das Universum hat keinen Grund zur Krise. Es hat ja Döner.'],
    ]);
  }
}

async function talkGlanzi(E) {
  if (!E.F.metGlanzi) {
    E.F.metGlanzi = true;
    await lines(E, [
      ['glanzi', 'Oh! Hallo! Sie sind Kai, oder? Ich … äh … möchte mich entschuldigen. Für alles.'],
      ['glanzi', 'Also, für die Hälfte von allem. Für die andere Hälfte ist mein Zwilling zuständig.'],
      ['kai', 'Sie sind … der gute Sven Glanz?'],
      ['glanzi', 'Nennen Sie mich Glanzi. Mehmet hat mich eingestellt. Ich wische die Theke. Ich LIEBE es.'],
      ['glanzi', 'Wussten Sie, dass eine Theke nach dem Wischen so ehrlich glänzt? Nicht wie ein Pitch-Deck. EHRLICH.'],
    ]);
  }
  for (;;) {
    const opts = [];
    opts.push({ id: 'wo', text: 'Weißt du, wo dein böser Zwilling steckt?' });
    opts.push({ id: 'tricks', text: E.F.ready2 ? 'Lass uns noch mal üben!' : 'Kannst du mir seine Argumentationstricks beibringen?' });
    opts.push({ id: 'code', text: 'Kennst du seine Passwörter oder Codes?' });
    opts.push({ id: 'bye', text: 'Bis später, Glanzi.' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('glanzi', E.F.ready2 ? 'Wenn du zu ihm gehst – ich komme mit. Er ist schließlich ein Teil von mir. Der unangenehme Teil.' : 'Tschüss! Ich wische dann mal weiter. Mit Liebe.');
    if (c === 'wo') await lines(E, [
      ['glanzi', 'Nein. Seit wir getrennt sind, blockiert er mich überall. Sogar auf LinkedIn.'],
      ['glanzi', 'Aber er hatte schon immer eine Schwäche für „Locations mit Storytelling“. Irgendwas Altes, Dramatisches.'],
      ['kai', 'In Wasserburg ist ALLES alt und dramatisch.'],
      ['glanzi', 'Ich weiß. Deshalb hat er die Stadt ja so geliebt.'],
    ]);
    if (c === 'code') {
      E.F.knowsCode = true;
      await lines(E, [
        ['glanzi', 'Oh, wir benutzen für alles denselben Code. Handy, Tresor, Haustür, Firmenkonto.'],
        ['glanzi', '1 – 2 – 3 – 4.'],
        ['kai', 'Ernsthaft?'],
        ['glanzi', 'Ich weiß. Ich schäme mich für uns beide.'],
      ]);
    }
    if (c === 'tricks') {
      await lines(E, [
        ['glanzi', 'Natürlich! Ich kenne jeden seiner Tricks – ich BIN seine Tricks. Also, die Hälfte.'],
        ['glanzi', 'Er hat in den drei Wochen bestimmt Podcasts gehört. Neue Denkfehler. Ich zeige sie dir, du konterst!'],
        ['__narr', '⚔ PEER-REVIEW-TRAINING: Kai gegen Glanzi'],
      ]);
      const won = await trainingDuel(E, 2);
      const n = learnedIn(E, 2);
      if (!won) await lines(E, [['glanzi', 'Verloren! Aber jetzt kennst du ' + n + ' von 8 Kontern. Noch eine Runde?']]);
      else if (n < 6) await lines(E, [['glanzi', 'Gewonnen! Stark!'], ['glanzi', 'Aber du kennst erst ' + n + ' von 8 Kontern. Mein Zwilling ist glitschig. Noch eine Runde!']]);
      else if (!E.F.ready2) {
        E.F.ready2 = true;
        await lines(E, [
          ['glanzi', 'Wow. Du hast mich komplett auseinandergenommen. Das war … befreiend.'],
          ['glanzi', 'Du bist bereit, Kai. Und wenn du zu ihm gehst – ich komme mit.'],
        ]);
      } else await E.say('glanzi', 'Wieder gewonnen! Mein Zwilling hat keine Chance.');
    }
  }
}

async function talkKarl2(E) {
  if (!E.F.metKarl2) {
    E.F.metKarl2 = true;
    await lines(E, [
      ['karl', 'Kai! Sie sind es! Endlich ein bekanntes Gesicht!'],
      ['karl', 'Mein Besitzer hat mich hier vor drei Wochen stehen lassen. Mein Akku ist bei 40 Prozent und meine Würde bei null.'],
    ]);
  }
  for (;;) {
    const opts = [
      { id: 'laden', text: 'Kannst du mein Funkgerät aufladen?' },
      { id: 'glanz', text: 'Wo ist dein Besitzer hin?' },
      { id: 'tauben', text: 'Was ist mit den Tauben los?' },
      { id: 'bye', text: 'Halt die Ohren steif, KARL.' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('karl', 'Ich habe keine Ohren. Aber danke. Ich halte meine Scheinwerfer steif.');
    if (c === 'laden') {
      if (E.F.karlWashed) await E.say('karl', 'Für Sie? Jederzeit. Einfach das Gerät an mich halten.');
      else await lines(E, [
        ['karl', 'Ich habe einen USB-Anschluss, ja.'],
        ['karl', 'Aber ich bin schmutzig, einsam und voller Taubenspuren. Wer mich lädt, muss mich auch lieben.'],
        ['karl', 'Oder wenigstens waschen. Ich bin da nicht wählerisch.'],
      ]);
    }
    if (c === 'glanz') await lines(E, [
      ['karl', 'Er kam vor drei Wochen. Flackernd. Hat Kabel und Baupläne aus meinem Kofferraum geholt.'],
      ['karl', 'Dann ist er mit einem E-Scooter davongefahren. Einem E-SCOOTER, Kai. Ich bin ein Sportwagen!'],
      ['karl', 'Er murmelte was von „altem Gemäuer“. In Wasserburg ist allerdings alles altes Gemäuer.'],
    ]);
    if (c === 'tauben') await lines(E, [
      ['karl', 'Seit heute Nacht gurren sie auf Latein. Ich habe versucht, sie zu übersetzen.'],
      ['karl', 'Bisher nur: „Der Mensch ist dem Menschen ein Brotkrümel.“ Ich glaube, das ist Philosophie.'],
    ]);
  }
}

async function talkBernd(E) {
  if (E.F.bernPause) return lines(E, [['guard', '*kau* Pause. *kau* Ich bin nicht im Dienst. *kau*']]);
  for (;;) {
    const opts = [
      { id: 'wer', text: 'Für wen arbeiten Sie jetzt?' },
      { id: 'rein', text: 'Kann ich in den Turm?' },
      { id: 'hunger', text: 'Sie sehen hungrig aus.' },
      { id: 'bye', text: 'Schönen Dienst noch.' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('guard', 'Mhm.');
    if (c === 'wer') await lines(E, [['guard', 'Für GlanzTech Burg. Also den bösen Herrn Glanz.'], ['guard', 'Der gute Herr Glanz zahlt nämlich nicht. Der macht Döner.']]);
    if (c === 'rein') await lines(E, [['guard', 'Keiner kommt in den Turm. Anweisung vom Chef.'], ['guard', 'Außerdem hab ich seit sechs Stunden nichts gegessen. Und hungrig bin ich besonders streng.']]);
    if (c === 'hunger') await lines(E, [['guard', 'Ich stehe hier seit Mitternacht. Der Chef hat „Verpflegung“ versprochen. Gekommen ist ein Proteinriegel mit Blockchain-Zertifikat.'], ['guard', 'Was würde ich jetzt für einen richtigen Döner geben …']]);
  }
}

// ---------- Finale im Turm ----------
async function turmScene(E) {
  if (E.F.proMaxOff) return;
  if (E.F.overdrive) return; // nach dem Duell: Spieler ist am Zug
  if (!E.F.turmIntro) {
    E.F.turmIntro = true;
    await lines(E, [
      ['glanz', 'Ah! Der Hausmeister! Oder sollte ich sagen: der Doktorand? Das ist ungefähr dasselbe, nur schlechter bezahlt.'],
      ['glanzi', 'Hallo, ich.'],
      ['glanz', 'DU! Meine … bessere Hälfte. Mit Schürze. Wie peinlich.'],
      ['glanzi', 'Ich wische jetzt. Es erfüllt mich. Du solltest es auch mal versuchen.'],
      ['glanz', 'Niemals! Darf ich vorstellen: die Q-BOX PRO MAX!'],
      ['glanz', 'Sie macht ALLES wahrscheinlich! Morgen gewinne ich den Innovationspreis, die Bürgermeisterwahl UND den Wasserburger Faschingszug!'],
      ['kai', 'Sie machen die ganze Stadt kaputt! Der Inn fließt rückwärts! Die Tauben sprechen Latein! Der Kaffeeautomat FUNKTIONIERT!'],
      ['glanz', 'Kollateralschäden. Man nennt das Disruption.'],
      ['kai', 'Herr Glanz – ich fordere Sie heraus. Peer-Review-Duell. Revanche!'],
      ['glanz', 'Ha! Ich habe dazugelernt, Wimmer. Drei Wochen Podcasts. Doppelte Geschwindigkeit. NEUE Tricks!'],
    ]);
  } else {
    await E.say('glanz', 'Sie schon wieder? Na gut. Noch eine Runde!');
  }
  for (;;) {
    await E.narrate('⚔ PEER-REVIEW-DUELL 2: Kai gegen Sven Glanz', 1600);
    const won = await finalDuel(E, 2);
    if (won) break;
    audio.play('turm');
    await lines(E, [
      ['glanz', 'Sehen Sie? Podcasts schlagen Promotion!'],
      ['glanzi', 'Kai! Nicht aufgeben! Ich wiederhole mich ständig – du kennst jetzt alle meine Tricks!'],
      ['kai', 'Herr Glanz. Noch eine Runde.'],
      ['glanz', 'Pff. Bitte. Mein nächster Podcast-Termin ist erst um zehn.'],
    ]);
  }
  audio.play('turm');
  audio.win();
  await lines(E, [
    ['glanz', 'Nein … NEIN! Das war … logisch einwandfrei!'],
    ['glanzi', 'Es ist okay, Sven. Verlieren tut gut. Man wächst daran. Ich wachse jeden Tag. Vor allem beim Wischen.'],
    ['glanz', 'Wenn ich nicht gewinnen kann … dann eben OVERDRIVE!'],
  ]);
  const g = E.actors.glanz;
  g.pose = 'reach';
  audio.zap();
  E.shake(1.4);
  E.F.overdrive = true;
  await E.wait(600);
  g.pose = null;
  await E.narrate('Die Unwahrscheinlichkeit explodiert! Aus dem Nichts erscheint eine komplette Blaskapelle und spielt den Radetzkymarsch.');
  await E.narrate('Dann verschwindet sie wieder. Nur die Tuba bleibt.');
  await lines(E, [
    ['kai', 'Die Box läuft Amok! Wie stoppe ich das?!'],
    ['glanzi', 'Kai! Die Pro Max hängt an uns! An mir und ihm. Solange wir getrennt sind, bleibt die Wellenfunktion offen!'],
    ['kai', 'Dann muss ich euch zwei … wieder zusammenkollabieren lassen.'],
    ['kai', 'Wie war das noch mal in Kapitel 1? Beobachtung bringt die Wellenfunktion zum Kollaps …'],
  ]);
}

async function mergeGlanz(E) {
  if (!E.F.overdrive) return E.say('kai', 'Nicht jetzt. Erst muss ich ihn argumentativ auseinandernehmen.');
  if (E.F.merged) return E.say('kai', 'Einer reicht. Wirklich.');
  await E.say('kai', 'Ich starte einen Livestream! Titel: „Zwei Glanz, ein Ziel“!');
  audio.win();
  await E.narrate('🔴 LIVE · 40.312 Zuschauer. Mama ist dabei. Der Mann aus Kasachstan auch.');
  await lines(E, [
    ['glanz', 'Was … was machen Sie da?! Ich werde … BEOBACHTET!'],
    ['glanzi', 'Es funktioniert! Ich spüre, wie ich … wieder … vollständig …'],
  ]);
  const a = E.actors.glanz, b = E.actors.glanzi;
  b.speed = 40;
  await E.walkTo(a.x - 4, a.y, 'glanzi');
  audio.zap();
  E.shake(0.8);
  await E.fade(0.8);
  delete E.actors.glanzi;
  a.who = 'glanz'; a.alpha = 1; a.glitch = false; a.color = '#7fe3ff';
  E.F.merged = true;
  await E.fade(0);
  await lines(E, [
    ['glanz', 'Ich … bin wieder … einer.'],
    ['glanz', 'Und ich fühle mich … mittelmäßig. Ist das … Demut? Das fühlt sich komisch an. Aber auch … gut?'],
    ['glanz', 'Wimmer … Kai. Es tut mir leid. Wirklich. Mit beiden Hälften.'],
    ['kai', 'Entschuldigung angenommen. Und jetzt: Wie stoppen wir das Ding?'],
    ['glanz', 'Ehrlich gesagt … ich habe nie einen Aus-Knopf eingebaut. Aus-Knöpfe sind so … Old Economy.'],
    ['kai', 'Aber sie hängt doch irgendwo am Strom.'],
  ]);
}

async function pullPlug(E) {
  if (!E.F.merged) {
    if (!E.F.overdrive) return E.say('kai', 'Glanz steht direkt daneben. Erst das Duell.');
    return lines(E, [['kai', 'Ich greife nach dem Stecker – und er rutscht mir weg. Dreimal. Die Wahrscheinlichkeit, dass ich ihn erwische, ist gerade null.'], ['glanzi', 'Solange wir zwei getrennt sind, spielt hier alles verrückt, Kai! Erst UNS!']]);
  }
  await E.say('kai', 'Die Weltuntergangsmaschine hängt an einer ganz normalen Steckdose. Manchmal ist Wissenschaft ganz einfach.');
  audio.sweep(800, 40, 1.2, 'sawtooth', 0.08);
  E.F.proMaxOff = true;
  E.shake(0.5);
  await E.wait(900);
  await lines(E, [
    ['__narr', 'Die Pro Max geht aus. Draußen hört man, wie der Inn sich räuspert – und wieder in die richtige Richtung fließt.'],
    ['glanz', 'Sie ist aus. Ich fühle mich … leicht. Als hätte man mir ein Podcast-Abo gekündigt.'],
    ['kai', 'Kommen Sie, Herr Glanz. Mehmet sucht bestimmt einen Mitarbeiter. Mit Erfahrung im Wischen.'],
  ]);
  await E.fade(1);
  await E.narrate('Eine Stunde später im Institut …');
  E.enterScene('flur2', 'start');
  E.kai.x = 150; E.kai.y = 172;
  await E.fade(0);
  await epilogue(E);
}

async function epilogue(E) {
  E.F.coffeeBroken = true;
  audio.play('ende');
  await E.walkTo(214, 160);
  E.face(1);
  await E.say('kai', '*drückt auf „Espresso“*');
  audio.bad();
  await E.narrate('*Röchel … KLONK.*', 1400);
  await lines(E, [
    ['kai', 'Der Kaffeeautomat ist wieder kaputt.'],
    ['kai', 'Die Welt ist wieder in Ordnung.'],
  ]);
  const p = { id: 'prof', who: 'prof', x: 42, y: 162, dir: 1, color: C.prof, pitch: 1.3 };
  E.actors.prof = p;
  audio.door();
  await E.walkTo(150, 168, 'prof');
  E.face(-1);
  await lines(E, [
    ['prof', 'Kai! Der Inn fließt wieder richtig herum! Die Tauben gurren wieder auf Deutsch! Na ja, auf Bairisch.'],
    ['prof', 'Der Stadtrat hat angerufen: Ab heute leiten Sie die neue Abteilung für Unwahrscheinlichkeitsabwehr!'],
    ['kai', 'Eine Abteilung! Wie viele Mitarbeiter?'],
    ['prof', 'Einen. Sie. Und Schrödinger, in Teilzeit.'],
    ['kai', 'Und Glanz?'],
    ['prof', 'Hat bei Mehmet ein Start-up gegründet. Döner-Logistik. Ganz ohne Blockchain. KARL macht die Auslieferung.'],
    ['kai', 'Das freut mich. Für KARL, meine ich.'],
    ['kai', 'Sagen Sie … wo ist eigentlich Schrödinger?'],
    ['prof', 'Auf der Q-Box.'],
    ['kai', 'Und die Pro Max? Die haben wir doch mitgenommen.'],
    ['prof', 'Da sitzt er auch drauf.'],
    ['kai', 'Auf beiden? Gleichzeitig?'],
    ['prof', 'Es ist eine Quantenkatze, Kai. Stellen Sie keine Fragen, auf die Sie die Antwort nicht wissen wollen.'],
  ]);
  E.F.ended = true;
  E.onEnd?.();
}

// ---------- Gegenstände ----------
export function combine2(E, a, b) {
  const pair = [a, b].sort().join('+');
  if (pair === 'besenstiel+massband') {
    E.removeItem('besenstiel'); E.removeItem('massband'); E.addItem('yagi');
    return (async () => {
      await E.say('kai', 'Ich schneide drei Stücke Maßband ab und mache sie quer am Besenstiel fest. Lang, mittel, kurz.');
      await E.say('kai', 'Fertig ist die Maßband-Yagi! Mein alter Mopp lebt weiter – als Antenne. Er wäre stolz.');
    })();
  }
  if (pair === 'funkgeraetVoll+yagi') {
    E.removeItem('funkgeraetVoll'); E.removeItem('yagi'); E.addItem('peiler');
    return 'Funkgerät an die Antenne, Kabel dran – ein echter Peilempfänger! Jetzt raus und den Fuchs suchen.';
  }
  if (pair === 'funkgeraet+yagi') return 'Antenne passt – aber der Akku ist leer. Rudi braucht erst Strom.';
  if (pair === 'kaffee+tasse' || pair === 'eimer+tasse') return 'Das bringt nichts.';
  if (a === 'doener' || b === 'doener') return 'Den Döner kombiniere ich mit nichts. Der ist komplett. Mit allem.';
  if (a === 'kaffee' || b === 'kaffee') return 'Den Kaffee rühre ich nicht an. Der ist für die Frau Professor. Und er ist heilig.';
  return null;
}

const BEARINGS = { bruecke2: ['peil1', 'nach Nordosten'], platz2: ['peil2', 'nach Südosten'] };

export function itemUse2(E, id) {
  if (id === 'peiler') return peilen(E);
  if (id === 'stadtplan') return kreuzpeilung(E, true);
  return null;
}

async function peilen(E) {
  const sc = E.S.scene;
  if (sc === 'burghof' || sc === 'turm') {
    audio.morse('MOE MOE');
    return E.say('kai', 'Der Peiler piept ohne Pause! Der Fuchs ist direkt hier – im Turm!');
  }
  const b = BEARINGS[sc];
  if (!b) return E.say('kai', 'Hier drinnen schirmen die Wände ab. Ich muss raus – am besten an zwei weit auseinanderliegende Orte.');
  await E.say('kai', 'Ich halte die Antenne hoch und drehe sie langsam im Kreis …');
  audio.morse('MOE');
  await E.narrate('Piep … piep … PIEP! … piep …', 1600);
  await E.say('kai', `Am lautesten ist es ${b[1]}!`);
  if (!E.F[b[0]]) {
    E.F[b[0]] = true;
    await E.say('kai', `Peilung ${b[0] === 'peil1' ? 'eins' : 'zwei'} notiert.`);
  }
  await kreuzpeilung(E, false);
}

async function kreuzpeilung(E, manual) {
  if (E.F.burgKnown) return manual ? E.say('kai', 'Die Linien kreuzen sich an der Burg. Eindeutig.') : null;
  const n = (E.F.peil1 ? 1 : 0) + (E.F.peil2 ? 1 : 0);
  if (n < 2) {
    if (manual) return E.say('kai', n ? 'Eine Peilung habe ich schon. Für einen Kreuzungspunkt brauche ich noch eine zweite – von einem anderen Ort.' : 'Ein Stadtplan. Um etwas einzuzeichnen, brauche ich erst Peilungen.');
    return E.say('kai', 'Mit einer einzigen Linie weiß ich nur die Richtung. Ich brauche noch eine zweite Peilung von woanders.');
  }
  if (!E.has('stadtplan')) return E.say('kai', 'Zwei Peilungen! Jetzt müsste ich die nur noch auf einem Stadtplan einzeichnen. Die Frau Professor hat bestimmt einen.');
  await E.say('kai', 'Ich zeichne beide Peilungen in den Stadtplan ein. Von der Innbrücke nach Nordosten … vom Rathausplatz nach Südosten …');
  audio.win();
  E.F.burgKnown = true;
  await E.say('kai', 'Die Linien kreuzen sich … an der BURG! Der Weg geht vom Rathausplatz aus hoch.');
}

export function itemLook2(E, id) {
  if (id === 'stadtplan') {
    const p = [E.F.peil1 && 'Innbrücke → Nordosten', E.F.peil2 && 'Rathausplatz → Südosten'].filter(Boolean);
    return `Mein Stadtplan. Eingezeichnete Peilungen: ${p.length ? p.join(', ') : 'noch keine'}.${E.F.burgKnown ? ' Kreuzungspunkt: die Burg!' : ''}`;
  }
  return null;
}

// ---------- Tipps ----------
export function hint2(E) {
  const F = E.F;
  if (!F.briefed) return 'Die Frau Professor ruft dich ins Labor.';
  if (E.S.scene === 'turm') {
    if (!F.overdrive) return 'Gewinne das Peer-Review-Duell. Wenn du danebenliegst, flüstert Glanzi dir die richtige Antwort zu.';
    if (!F.merged) return 'Beobachtung bringt die Wellenfunktion zum Kollaps – wie in Kapitel 1. Benutze dein Handy mit einem der beiden Glanz.';
    return 'Zieh den Stecker der Pro Max rechts an der Steckdose.';
  }
  const hasPeiler = E.has('peiler');
  if (!hasPeiler) {
    if (!F.cartTaken) return 'Im Putzwagen im Flur liegen ein Maßband und ein Eimer.';
    if (!E.has('yagi')) return 'Kombiniere das Maßband mit dem Besenstiel zu einer Richtantenne: erst das eine antippen, dann das andere.';
    if (!F.hfgTaken) return 'Das Handfunkgerät der Professorin liegt im Büro auf dem Funktisch.';
    if (!E.has('funkgeraetVoll')) {
      if (!F.karlWashed) {
        if (E.has('wassereimer')) return 'Benutze den Eimer mit Innwasser mit KARL auf dem Rathausplatz.';
        return 'KARL auf dem Rathausplatz hat einen USB-Anschluss – aber er will vorher gewaschen werden. Füll deinen Eimer im Inn an der Brücke.';
      }
      return 'Benutze das Handfunkgerät mit KARL, um es aufzuladen.';
    }
    return 'Kombiniere das geladene Funkgerät mit der Maßband-Yagi.';
  }
  if (!F.burgKnown) {
    if (!(F.peil1 && F.peil2)) return 'Peile draußen an zwei Orten: auf der Innbrücke und auf dem Rathausplatz. Peilempfänger antippen, dann „▶ Peilen“.';
    if (!E.has('stadtplan')) {
      if (E.has('kaffee')) return 'Bring der Frau Professor den Kaffee – dafür bekommst du ihren Stadtplan.';
      if (E.has('tasse')) return 'Stell die Tasse in den Kaffeeautomaten im Flur.';
      return 'Die Professorin gibt dir den Stadtplan nur gegen Kaffee. Der Automat braucht einen Becher – ihre Tasse steht im Büro.';
    }
    return 'Wähle den Stadtplan und tippe „▶ Einzeichnen“.';
  }
  if (!F.ready2) return `Lass dir von Glanzi am Kebabstand die neuen Tricks seines Zwillings beibringen. Du kennst ${learnedIn(E, 2)} von 8 Kontern.`;
  if (!F.knowsCode) return 'Frag Glanzi, ob er die Codes seines Zwillings kennt.';
  if (!F.bernPause) return F.gotDoener || E.has('doener') ? 'Gib Bernd im Burghof den Döner.' : 'Bernd hat Hunger. Mehmet am Kebabstand spendiert dir bestimmt einen Döner.';
  return 'Tippe im Burghof auf die Turmtür und gib den Code ein.';
}
