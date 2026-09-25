// QUANTENSALAT – Kapitel 3: Der Katzensprung
import { audio } from './audio.js';
import { drawCounter1524, drawBench, drawDesk } from './art.js';
import { trainingDuel, finalDuel, learnedIn } from './duel.js';

const C = { kai: '#ffffff', prof: '#d7b4ff', hildegard: '#b8f0a0', mehmed: '#ffc864', sigmund: '#ff9f7f', bernhard: '#ff9f9f', schreiber: '#e0d8c0', ratsherr: '#f0f0f0', glanz: '#7fe3ff', radio: '#ffe89a' };

async function lines(E, list) { for (const [who, text, o] of list) await E.say(who, text, o || {}); }
const radio = (E, text) => E.say('__narr', `📻 Prof. Brandl: „${text}“`, { color: C.prof });

export function newState3() {
  return {
    ch: 3, v: 1, scene: 'labor3', inv: ['namensschild', 'rudi'], learned: [],
    kai: { x: 60, y: 172, dir: 1 },
    flags: { catOut: true, karteTaken: true, boxInLab: true, lockdownOff: true, profStable: true, profBack: true, spiessFixed: true, kittelTaken: true, brotzeitTaken: true, motorTaken: true, drawerOpen: true },
  };
}

export function chapter3(ch1) {
  const scenes = {};

  // ===================== LABOR (Gegenwart) =====================
  scenes.labor3 = {
    art: 'labor', title: 'Institut · Labor', music: 'labor',
    walk: ch1.labor.walk,
    entries: { ...ch1.labor.entries, portal: [110, 176, 1] },
    actors: (S) => [{ id: 'prof', who: 'prof', x: 236, y: 172, dir: -1, color: C.prof, pitch: 1.3 }],
    async enter(E) {
      if (E.F.intro3) return;
      E.F.intro3 = true;
      await E.narrate('KAPITEL 3: Der Katzensprung', 2600);
      await E.narrate('Einen Monat später.');
      await lines(E, [
        ['kai', 'Ich heiße Kai Wimmer, und ich leite die Abteilung für Unwahrscheinlichkeitsabwehr!'],
        ['kai', 'Mitarbeiter: ich. Und Schrödinger, in Teilzeit. Er arbeitet hauptsächlich im Liegen.'],
        ['prof', 'Kai, kommen Sie mal. Schauen Sie sich Schrödinger an.'],
        ['kai', 'Er schläft auf der Q-Box. Wie immer.'],
        ['prof', 'UND auf der Pro Max. Gleichzeitig. Seit drei Tagen.'],
        ['prof', 'Ich fürchte, er hat die beiden Boxen … verschränkt.'],
        ['kai', 'Ist das schlimm?'],
      ]);
      audio.zap();
      E.shake(1.2);
      E.F.portalOpen = true;
      await E.narrate('*WUMMMMM*', 1200);
      await E.say('prof', 'Das ist schlimm.');
      await E.narrate('Schrödinger gähnt, streckt sich – und springt mitten in das leuchtende Loch.');
      E.F.catGone = true;
      audio.sweep(1200, 200, 0.5, 'sine', 0.1);
      await lines(E, [
        ['kai', 'SCHRÖDINGER!'],
        ['prof', 'Die Anzeige! Zeitkoordinate … 1524! Gleicher Ort!'],
        ['prof', 'Ein Zeitriss! Und 1524 stand genau hier … die Kräuterhütte meiner Ahnin. Hildegard die Kräuterfrau.'],
        ['prof', 'Hier, die Stadtchronik. „1524: Die Kräuterfrau Hildegard wird …“'],
        ['prof', 'Der Text flackert! Er schreibt sich gerade neu! „… wegen einer vom Himmel gefallenen Hexenkatze angeklagt.“'],
        ['kai', 'Die Hexenkatze ist SCHRÖDINGER?!'],
        ['prof', 'Wird Hildegard verurteilt, verlässt meine Familie Wasserburg. Dann gibt es mich hier nicht. Kein Institut. Keine Abteilung. Keine Stelle für Sie.'],
        ['kai', 'Und der Kaffeeautomat?'],
        ['prof', 'Der wäre vermutlich trotzdem kaputt. Manche Dinge sind universelle Konstanten.'],
        ['prof', 'Nehmen Sie die Chronik mit. Sie zeigt Ihnen, ob Sie die Geschichte wieder geradebiegen.'],
      ]);
      E.addItem('chronik');
      await lines(E, [
        ['prof', 'Und Rudi haben Sie ja dabei. Über den Riss müssten wir funken können. Ich bleibe hier und halte ihn offen.'],
        ['kai', 'Funk durch die Zeit. Die Bundesnetzagentur wird durchdrehen.'],
        ['prof', 'Und Kai: Machen Sie nichts kaputt. Die Geschichte ist empfindlich.'],
        ['kai', 'Ich bin Hausmeister. Ich mache Dinge HEIL.'],
      ]);
    },
    hotspots: [
      {
        id: 'portal', name: 'Zeitriss', rect: [88, 118, 44, 64], at: [112, 178], exit: ['huette', 'portal'],
        visible: (S) => !!S.flags.portalOpen && !S.flags.catBack,
        async canExit(E) {
          if (!E.F.jumped) { E.F.jumped = true; await E.say('kai', 'Okay. Tief durchatmen. Wie war das mit den Quanten … einfach durchgehen.'); }
          return true;
        },
      },
      {
        id: 'prof', name: 'Prof. Brandl', actor: 'prof', use: null,
        look: 'Die Frau Professor. Sie hält den Zeitriss mit einem Schraubenzieher und purer Willenskraft offen.',
        talk: (E) => talkProf3(E),
        anyItem: () => [['prof', 'Keine Zeit, Kai! Also … genau genommen haben wir 500 Jahre davon. Aber trotzdem!']],
      },
      { id: 'boxen', name: 'Q-Box & Pro Max', rect: [140, 80, 70, 64], at: [150, 176], look: 'Die Q-Box und die Pro Max. Sie summen im Duett. Irgendwo zwischen ihnen tut die Raumzeit gerade sehr weh.', use: 'Ich fasse da nichts an. Beim letzten Mal habe ich kurz Portugiesisch gesprochen.' },
      { id: 'tuer', name: 'Zum Flur', rect: [0, 54, 20, 87], at: [26, 160], look: 'Die Tür zum Flur.', use: 'Nicht jetzt. Schrödinger braucht mich. Irgendwo im 16. Jahrhundert.' },
    ],
  };

  // ===================== HÜTTE (1524) =====================
  scenes.huette = {
    title: '1524 · Hildegards Kräuterhütte', music: 'huette', tint: 'past',
    walk: [56, 152, 304, 192],
    entries: { portal: [206, 178, -1], draussen: [60, 172, 1] },
    actors: () => [{ id: 'hildegard', who: 'hildegard', x: 132, y: 170, dir: 1, color: C.hildegard, pitch: 1.2 }],
    async enter(E) {
      if (E.F.sawHut) return;
      E.F.sawHut = true;
      await lines(E, [
        ['kai', 'Uff. Das Mittelalter riecht … sehr nach Mittelalter.'],
        ['hildegard', 'Heilige Muttergottes! NOCH einer! Erst fällt eine schwarze Katze aus dem Nichts, und jetzt ein Mann in weißem Gewand!'],
        ['kai', 'Keine Angst! Ich bin … ein Gelehrter. Kai. Aus … Rosenheim.'],
        ['hildegard', 'Aus Rosenheim. Das erklärt einiges.'],
        ['hildegard', 'Seid Ihr wegen der Katze hier? Der Büttel hat sie heute früh geholt. Sigmund von Glanz erzählt überall, sie sei eine Hexenkatze. Und ich eine Hexe!'],
        ['hildegard', 'Mittags ist Gericht im Rathaus. Wenn der Rat ihm glaubt, muss ich die Stadt verlassen.'],
        ['kai', 'Das lasse ich nicht zu. Versprochen.'],
      ]);
    },
    hotspots: [
      { id: 'tuer', name: 'Nach draußen', rect: [10, 64, 44, 78], at: [58, 170], exit: ['bruecke1524', 'huette'] },
      {
        id: 'portal', name: 'Zeitriss (nach Hause)', rect: [192, 118, 44, 60], at: [206, 180], useLabel: 'Hindurchgehen',
        look: (E) => E.F.catFree ? 'Der Zeitriss. Dahinter das Labor. Zeit, heimzugehen.' : 'Der Zeitriss. Dahinter, verschwommen, das Labor – und die Frau Professor, die nervös winkt.',
        use: (E) => E.F.catFree ? goHome(E) : E.say('kai', 'Nicht ohne Schrödinger!'),
      },
      {
        id: 'hildegard', name: 'Hildegard', actor: 'hildegard', use: null,
        look: 'Hildegard die Kräuterfrau. Sie sieht aus wie die Frau Professor. Nur 500 Jahre jünger. Also … älter. Es ist kompliziert.',
        talk: (E) => talkHildegard(E),
        items: {
          zucker: [['hildegard', 'Zucker?! Das ist ein Vermögen! Gebt das lieber dem Mehmed an der Brücke. Der jammert ständig, sein Gebräu sei zu bitter.']],
          rudi: [['kai', 'Das ist ein Funkgerät. Man kann damit mit Leuten reden, die weit weg sind.'], ['hildegard', 'So wie Beten?'], ['kai', '… So ähnlich. Nur mit Rauschen.']],
          amulett: [['hildegard', 'Eines von Sigmunds Amuletten? Schaut unten drauf. Da klebt noch Innsand dran.']],
          chronik: [['hildegard', 'Ein Buch! Mit so vielen Seiten! Ihr müsst sehr reich sein.']],
          namensschild: [['hildegard', '„Leiter“? Ihr seid ein Anführer? Von wie vielen Männern?'], ['kai', 'Einem. Mir. Und einer Katze. In Teilzeit.']],
        },
        anyItem: () => [['hildegard', 'Das braucht Ihr sicher selbst, Gelehrter.']],
      },
      {
        id: 'kerze', name: 'Kerze', rect: [124, 98, 10, 20], at: [126, 170], useLabel: 'Nehmen',
        visible: (S) => !S.flags.kerzeTaken,
        look: 'Eine Bienenwachskerze. Sie riecht nach Honig.',
        use: async (E) => { E.F.kerzeTaken = true; E.addItem('kerze'); await lines(E, [['kai', 'Darf ich mir die Kerze leihen?'], ['hildegard', 'Nehmt sie. Ich hab noch zwei. Und die Sonne scheint ja auch.']]); },
      },
      {
        id: 'baldrian', name: 'Baldrianwurzel', rect: [288, 86, 16, 16], at: [270, 172], useLabel: 'Nehmen',
        visible: (S) => !S.flags.baldrianTaken,
        look: 'Getrocknete Wurzeln in einer Schale. Riecht streng. Wie alte Socken mit Ambitionen.',
        use: async (E) => {
          E.F.baldrianTaken = true;
          E.addItem('baldrian');
          await lines(E, [['kai', 'Was ist das?'], ['hildegard', 'Baldrian! Menschen schlafen davon wie ein Stein. Katzen dagegen … die werden ganz verrückt vor Glück.'], ['kai', 'Den nehme ich mit. Ich habe da eine Idee.']]);
        },
      },
      {
        id: 'zucker', name: 'Würfelzucker', rect: [214, 166, 20, 14], at: [222, 180], useLabel: 'Nehmen',
        visible: (S) => !!S.flags.zuckerInHut && !S.flags.zuckerTaken,
        look: 'Eine Packung Würfelzucker aus der Institutsküche. Durch 500 Jahre geworfen. Das Mindesthaltbarkeitsdatum ist … kompliziert.',
        use: async (E) => { E.F.zuckerTaken = true; E.addItem('zucker'); await lines(E, [['hildegard', 'Was ist DAS? Weiße Würfel? Aus dem leuchtenden Loch?'], ['kai', 'Zucker. Ein Geschenk aus Rosenheim.'], ['hildegard', 'Rosenheim muss ein Paradies sein.']]); },
      },
      { id: 'kraeuter', name: 'Kräuterbündel', rect: [86, 10, 180, 26], at: [160, 172], look: 'Getrocknete Kräuter: Salbei, Kamille, Johanniskraut. Hildegard ist im Grunde eine Apothekerin. Vor 500 Jahren reicht das offenbar für einen Hexenprozess.', use: 'Ich lasse die Kräuter hängen. Die sind hier die Hauptdarsteller.' },
      { id: 'regal', name: 'Tiegel', rect: [240, 56, 64, 48], at: [270, 172], look: 'Tiegel mit Salben und Tinkturen. Auf einem steht in krakeliger Schrift: „Gegen Kopfweh. Drei Heller.“', use: 'Ich öffne einen Tiegel. Es riecht nach Pfefferminze. Tatsächlich wirksam. Kein Wunder, dass Sigmund neidisch ist.' },
      { id: 'kamin', name: 'Kamin', rect: [264, 108, 50, 42], at: [270, 176], look: 'Ein kleiner Kamin. Das Feuer knistert gemütlich.', use: 'Ich wärme mir die Hände. Das Mittelalter hat auch seine guten Seiten.' },
      { id: 'moerser', name: 'Mörser', rect: [98, 102, 18, 16], at: [106, 170], look: 'Ein Mörser mit Stößel. Die Küchenmaschine des 16. Jahrhunderts.', use: 'Ich zerstoße ein paar Kräuter. Hildegard nickt anerkennend. Mein erster wissenschaftlicher Erfolg im Mittelalter.' },
      { id: 'fenster', name: 'Fenster', rect: [176, 16, 40, 38], at: [196, 172], look: 'Durch das Fenster sieht man den Inn in der Sonne glitzern. Ohne Autos, ohne Handys. Nur Enten, die in die richtige Richtung schwimmen.' },
    ],
  };

  // ===================== INNBRÜCKE (1524) =====================
  scenes.bruecke1524 = {
    title: '1524 · Innbrücke', music: 'mittelalter', tint: 'past',
    walk: [8, 154, 312, 192],
    entries: { huette: [18, 174, 1], platz: [258, 166, -1] },
    actors: () => [{ id: 'mehmed', who: 'mehmed', x: 80, y: 146, dir: 1, fixedDir: true, color: C.mehmed, pitch: 0.8, after: drawCounter1524 }],
    hotspots: [
      { id: 'zurHuette', name: 'Zu Hildegards Hütte', rect: [0, 140, 14, 60], at: [10, 174], exit: ['huette', 'draussen'] },
      { id: 'brucktor', name: 'Brucktor (zum Marktplatz)', rect: [244, 80, 26, 70], at: [257, 158], exit: ['platz1524', 'bruecke'] },
      {
        id: 'mehmed', name: 'Mehmed Efendi', actor: 'mehmed', at: [84, 170], use: null,
        look: 'Mehmed Efendi. Gelehrter aus Konstantinopel, Kaffeehändler, Schnurrbartträger. Die Ähnlichkeit zu Mehmet ist … auffällig.',
        talk: (E) => talkMehmed(E),
        items: {
          zucker: (E) => giveSugar(E),
          amulett: [['mehmed', 'Ein Amulett vom Sigmund? Ich habe eins aufgeschnitten. Innen: Kieselstein. Außen: Farbe. Dazwischen: sehr viel Frechheit.']],
          rudi: [['mehmed', 'Ein Kästchen, das spricht? In Konstantinopel haben wir Papageien. Die sind billiger.']],
        },
        anyItem: () => [['mehmed', 'Danke, mein Freund. Aber was mir wirklich fehlt, ist etwas Süßes für meinen Kahve.']],
      },
      { id: 'kanne', name: 'Kupferkanne', rect: [88, 100, 26, 26], at: [96, 170], look: 'Eine Kupferkanne mit Kahve. Das erste Café Bayerns steht auf einer Brücke. Ich sollte das dem Heimatverein melden.', use: [['mehmed', 'Vorsicht, heiß! Und bitter. Sehr bitter. Das ist das Problem.']] },
      { id: 'schiff', name: 'Salzschiff', rect: [184, 110, 46, 22], at: [200, 164], look: 'Eine Salzplätte auf dem Weg nach Norden. Salz aus Reichenhall. Damit ist Wasserburg reich geworden. Heimatkunde, 4. Klasse. Ich hab aufgepasst.', use: 'Ich winke den Schiffern. Sie winken zurück und bekreuzigen sich. Liegt vermutlich am Kittel.' },
      { id: 'inn', name: 'Der Inn', rect: [0, 112, 180, 20], at: [140, 160], look: 'Der Inn. Er fließt in die richtige Richtung. Wenigstens einer, der sich an die Regeln hält.' },
      { id: 'fackel', name: 'Fackel', rect: [168, 44, 18, 106], at: [184, 170], look: 'Eine Fackel. Die Straßenbeleuchtung von 1524. Energieeffizient ist was anderes.' },
    ],
  };

  // ===================== MARKTPLATZ (1524) =====================
  scenes.platz1524 = {
    art: 'platz1524', title: '1524 · Marktplatz vor dem Rathaus', music: 'mittelalter', tint: 'past',
    walk: [8, 158, 312, 194],
    entries: { bruecke: [18, 176, 1] },
    actors: () => [
      { id: 'bernhard', who: 'bernhard', x: 96, y: 174, dir: -1, color: C.bernhard, pitch: 0.6 },
      { id: 'schreiber', who: 'schreiber', x: 125, y: 154, dir: 1, color: C.schreiber, pitch: 1.1, after: drawDesk },
      { id: 'sigmund', who: 'sigmund', x: 262, y: 166, dir: -1, color: C.sigmund, pitch: 0.95 },
    ],
    async enter(E) {
      if (E.F.sawPlatz) return;
      E.F.sawPlatz = true;
      await lines(E, [
        ['sigmund', 'Amulette! GLÜCKSAMULETTE! Schützen vor Hexen, Hagel und schlechter Laune! Nur drei Heller!'],
        ['kai', 'Diese Stimme. Dieses Grinsen. Diese Frisur unter dem Hut. Das muss Sigmund von Glanz sein.'],
        ['kai', 'Und da – Schrödinger! Im Käfig am Pranger!'],
      ]);
    },
    hotspots: [
      { id: 'zurueck', name: 'Zur Innbrücke', rect: [0, 140, 12, 60], at: [10, 176], exit: ['bruecke1524', 'platz'] },
      {
        id: 'kaefig', name: 'Schrödinger im Käfig', rect: [50, 86, 32, 26], at: [70, 172],
        look: (E) => E.F.catCalm ? 'Schrödinger schnurrt im Käfig und reibt den Kopf an den Gitterstäben. Die Leute auf dem Markt sind verwirrt.' : 'Schrödinger! Im Käfig am Pranger. Er faucht jeden an, der vorbeikommt. Ich kann’s ihm nicht verdenken.',
        use: [['bernhard', 'Finger weg! Das ist ein Beweisstück! Und es faucht!']],
        talk: [['kai', 'Halt durch, Kumpel. Ich hol dich da raus.'], ['__narr', 'Schrödinger schaut dich an. Zum ersten Mal wirkt er, als würde er dich vermissen.']],
        items: {
          baldrian: async (E) => {
            if (E.F.catCalm) return E.say('kai', 'Er ist schon im siebten Himmel.');
            E.F.catCalm = true;
            await E.say('kai', 'Ich halte die Baldrianwurzel an die Gitterstäbe …');
            audio.win();
            await lines(E, [
              ['__narr', 'Schrödinger schnuppert, schnurrt wie ein Spinnrad und wälzt sich auf den Rücken.'],
              ['bernhard', 'Sie … sie SCHNURRT? Dämonen schnurren doch nicht!'],
              ['bernhard', '… Oder?'],
              ['kai', 'Merken Sie sich das, Bernhard. Für nachher.'],
            ]);
          },
        },
      },
      {
        id: 'bernhard', name: 'Bernhard der Büttel', actor: 'bernhard', use: null,
        look: 'Bernhard der Büttel. Breit wie ein Scheunentor. Er erinnert mich stark an jemanden. Vielleicht liegt es in der Familie.',
        talk: (E) => talkBernhard(E),
        items: { baldrian: [['bernhard', 'Baldrian? Nein danke. Ich muss wach bleiben. Ich bewache eine Hexenkatze!']], zucker: [['bernhard', 'Zucker? Für MICH? … Nein. Ich bin im Dienst. Und auf Diät.']] },
        anyItem: () => [['bernhard', 'Ich nehme nichts an. Ich bin ein ehrlicher Büttel. Außer jemand bringt mir einmal so ein … Fleisch vom Spieß im Fladen. Das träum ich manchmal. Seltsam, oder?']],
      },
      {
        id: 'schreiber', name: 'Stadtschreiber Ulrich', actor: 'schreiber', use: null,
        look: 'Ulrich, der Stadtschreiber. Er hat Tinte an den Fingern und die Aura eines Mannes, der Formulare liebt.',
        talk: (E) => talkSchreiber(E),
        items: {
          brief: [['schreiber', 'Ein prächtiges Siegel! „LEITER ABT. UNWAHRSCH…“ – das ist gewiss Latein. Damit dürft Ihr vor dem Rat sprechen.']],
          pergament: [['schreiber', 'Ohne Siegel ist das nur ein Stück Tierhaut mit Meinung. Siegelt es!']],
          namensschild: [['schreiber', 'Ein Schild mit Buchstaben, so gleichmäßig wie von Engelshand! Wer hat das geschrieben?'], ['kai', 'Ein Drucker.'], ['schreiber', 'Ein … Drucker. Ich habe davon gehört. Teufelszeug aus Mainz.']],
        },
        anyItem: () => [['schreiber', 'Das gehört nicht in meine Akten.']],
      },
      {
        id: 'sigmund', name: 'Sigmund von Glanz', actor: 'sigmund', use: null,
        look: 'Sigmund von Glanz. Federhut, Samtwams, Grinsen wie ein Werbeprospekt. Der Apfel fällt nicht weit vom Stammbaum.',
        talk: (E) => talkSigmund(E),
        items: {
          amulett: [['sigmund', 'Umtausch ausgeschlossen! Steht im Kleingedruckten! … Das ich noch nicht erfunden habe!']],
          baldrian: [['sigmund', 'Baldrian? Hexenkraut! Weg damit!']],
        },
        anyItem: () => [['sigmund', 'Tauschgeschäfte? Nur gegen Heller. Oder gegen Euren seltsamen weißen Mantel. Der würde sich gut verkaufen.']],
      },
      {
        id: 'rathaus', name: 'Rathaustür', rect: [150, 114, 30, 38], at: [165, 162], useLabel: 'Hineingehen',
        look: 'Die Tür zum Rathaus. Mittags tagt hier das Gericht.',
        use: (E) => enterTrial(E),
        items: { brief: (E) => enterTrial(E) },
      },
      { id: 'stand', name: 'Amulettstand', rect: [232, 104, 58, 50], at: [250, 172], look: 'Sigmunds Stand. „AMULETTE! Glück garantiert!“ Klein darunter: „Garantie gilt nicht bei Unglück.“', use: [['sigmund', 'Nicht anfassen! Das Glück nutzt sich ab!']] },
      { id: 'pranger', name: 'Pranger', rect: [40, 112, 50, 44], at: [70, 172], look: 'Der Pranger. Hier werden Betrüger zur Schau gestellt. Heute nur eine unschuldige Katze. Die Ironie ist dem Mittelalter entgangen.' },
    ],
  };

  // ===================== RATSSAAL (1524) =====================
  scenes.saal1524 = {
    title: '1524 · Ratssaal – Gericht', music: 'saal', tint: 'past',
    walk: [30, 168, 200, 190],
    entries: { start: [60, 180, 1] },
    enterOnRestore: true,
    actors: (S) => [
      { id: 'ratsherr', who: 'ratsherr', x: 262, y: 124, dir: -1, color: C.ratsherr, pitch: 0.7, after: drawBench },
      { id: 'sigmund', who: 'sigmund', x: 140, y: 124, dir: 1, color: C.sigmund, pitch: 0.95 },
      { id: 'hildegard', who: 'hildegard', x: 36, y: 178, dir: 1, color: C.hildegard, pitch: 1.2 },
      { id: 'mehmed', who: 'mehmed', x: 104, y: 190, visible: false, color: C.mehmed, pitch: 0.8 },
    ],
    async enter(E) { await trialScene(E); },
    hotspots: [
      {
        id: 'kaefig', name: 'Käfig mit Schrödinger', rect: [198, 80, 32, 26], at: [196, 178],
        visible: (S) => !S.flags.catFree,
        look: 'Schrödinger im Käfig auf dem Richtertisch. Er faucht den Ratsherrn an. Das hilft uns gerade nicht.',
        use: 'Ich kann ihn nicht einfach rausholen. Der Rat muss sehen, dass er harmlos ist.',
        items: { baldrian: (E) => catProof(E) },
      },
      { id: 'sigmund', name: 'Sigmund von Glanz', actor: 'sigmund', use: null, look: 'Sigmund. Er zupft nervös an seinem Glücksamulett.', talk: [['sigmund', 'Beweist doch, dass sie kein Dämon ist! HA!']] },
      { id: 'ratsherr', name: 'Ratsherr', actor: 'ratsherr', use: null, look: 'Der Ratsherr. Er hat einen Bart, einen schwarzen Talar und den Gesichtsausdruck eines Mannes, der zum Mittagessen will.', talk: [['ratsherr', 'Fürsprech, habt Ihr noch etwas vorzubringen? Einen Beweis vielleicht?']] },
      { id: 'hildegard', name: 'Hildegard', actor: 'hildegard', use: null, look: 'Hildegard. Sie hält die Hände gefaltet und schaut mich hoffnungsvoll an.', talk: [['hildegard', 'Ich vertraue Euch, Gelehrter.']] },
      { id: 'teppich', name: 'Wandteppich', rect: [94, 24, 132, 80], at: [150, 176], look: 'Ein Wandteppich mit dem Stadtwappen. Die Wellen stehen für den Inn. Oder für die Laune des Ratsherrn.' },
    ],
  };

  // ===================== FLUR (Epilog) =====================
  scenes.flur3 = {
    art: 'flur', title: 'Institut · Flur', music: 'ende',
    walk: ch1.flur.walk,
    entries: { start: [150, 172, 1] },
    actors: () => [{ id: 'prof', who: 'prof', x: 176, y: 166, dir: 1, color: C.prof, pitch: 1.3 }],
    hotspots: [],
  };

  return scenes;
}

// ---------- Dialoge ----------
async function talkProf3(E) {
  for (;;) {
    const opts = [
      { id: 'hilde', text: 'Was wissen Sie über Hildegard?' },
      { id: 'paradox', text: 'Was, wenn ich in der Vergangenheit etwas kaputt mache?' },
      { id: 'funk', text: 'Wie funken wir durch die Zeit?' },
      { id: 'bye', text: 'Ich hole Schrödinger zurück!' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('prof', 'Viel Glück, Kai! Und bringen Sie mir was Schönes mit!');
    if (c === 'hilde') await lines(E, [
      ['prof', 'Hildegard die Kräuterfrau. In meiner Familie gilt sie als die erste Wissenschaftlerin der Brandls. Sie hat Kräuter getestet, statt Gerüchten zu glauben.'],
      ['prof', 'Laut alter Chronik hatte sie einen Feind: einen Amuletthändler. Den Namen hat die Chronik leider nicht behalten.'],
      ['kai', 'Ich hab da so eine Ahnung.'],
    ]);
    if (c === 'paradox') await lines(E, [
      ['prof', 'Dann ändert sich die Gegenwart. Das ist ja gerade das Problem.'],
      ['kai', 'Und wenn ich aus Versehen meinen eigenen Ur-ur-urgroßvater treffe?'],
      ['prof', 'Kai, Ihre Familie kam 1987 aus Mühldorf. Ich habe nachgeschaut. Sie sind historisch völlig ungefährlich.'],
      ['kai', 'Das ist das Netteste, was je über mich gesagt wurde.'],
    ]);
    if (c === 'funk') await lines(E, [['prof', 'Rudi auswählen und „▶ Funken“. Der Riss wirkt wie ein Relais. Rufen Sie, wenn Sie etwas brauchen – ich kann kleine Dinge durchwerfen.']]);
  }
}

async function talkHildegard(E) {
  E.F.metHilde = true;
  for (;;) {
    const opts = [];
    if (!E.F.knowsFuersprech) opts.push({ id: 'gericht', text: 'Wie kann ich Euch vor Gericht helfen?' });
    opts.push({ id: 'sigmund', text: 'Wer ist dieser Sigmund von Glanz?' });
    if (!E.F.baldrianTaken) opts.push({ id: 'katze', text: 'Wie war die Katze, als sie hier ankam?' });
    if (!E.F.metMehmed) opts.push({ id: 'streit', text: 'Kennt Ihr jemanden, der gut streiten kann?' });
    if (E.F.catFree) opts.push({ id: 'danke', text: 'Es ist vorbei, Hildegard. Ihr seid frei.' });
    opts.push({ id: 'bye', text: 'Ich kümmere mich darum.' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('hildegard', E.F.catFree ? 'Geht mit Gott, Gelehrter. Und grüßt mir Rosenheim.' : 'Gott schütze Euch, Gelehrter.');
    if (c === 'gericht') {
      E.F.knowsFuersprech = true;
      await lines(E, [
        ['hildegard', 'Vor dem Rat darf eine Frau nicht für sich selbst sprechen. Nur ein Gelehrter als Fürsprech.'],
        ['hildegard', 'Dafür braucht Ihr einen Brief vom Stadtschreiber auf dem Marktplatz. Mit Siegel.'],
        ['kai', 'Ich hab zwar kein Siegel, aber ich habe … ein Namensschild.'],
      ]);
    }
    if (c === 'sigmund') await lines(E, [
      ['hildegard', 'Ein Händler aus der Fremde. Er verkauft Glücksamulette auf dem Markt.'],
      ['hildegard', 'Seit ich Kräuter gegen Kopfweh verkaufe, kaufen die Leute weniger Amulette. Also muss ich weg. So einfach ist das für ihn.'],
      ['kai', 'Sigmund von GLANZ. Natürlich heißt er Glanz.'],
    ]);
    if (c === 'katze') {
      E.F.knowsBaldrian = true;
      await lines(E, [
        ['hildegard', 'Sie fiel heute früh vom Himmel, mitten in meinen Kräuterkorb. Direkt in den Baldrian.'],
        ['hildegard', 'Sie hat geschnurrt wie ein Spinnrad! Erst als der Büttel kam, hat sie gefaucht. Kein Wunder bei dem Gesicht.'],
        ['kai', 'Baldrian macht Katzen glücklich … Das merke ich mir.'],
      ]);
    }
    if (c === 'streit') await lines(E, [
      ['hildegard', 'Mehmed Efendi! Ein Gelehrter aus Konstantinopel. Er verkauft an der Brücke ein schwarzes, bitteres Gebräu.'],
      ['hildegard', 'Er hat drei Tage lang mit dem Pfarrer über die Seele gestritten. Und gewonnen. Der Pfarrer trinkt seitdem auch das schwarze Zeug.'],
    ]);
    if (c === 'danke') await lines(E, [
      ['hildegard', 'Dank Euch, Kai von Rosenheim. Ich werde diese Stadt niemals verlassen. Und meine Kinder und Kindeskinder auch nicht.'],
      ['kai', 'Darauf zähle ich. Sehr sogar.'],
    ]);
  }
}

async function talkMehmed(E) {
  if (!E.F.metMehmed) {
    E.F.metMehmed = true;
    await lines(E, [
      ['mehmed', 'Selam, Fremder! Ihr seht aus wie ein Mann, der eine Tasse Kahve braucht. Oder neue Kleider.'],
      ['kai', 'Kaffee! Im Jahr 1524?!'],
      ['mehmed', 'Kahve! Ein neues Getränk aus dem Jemen. Die Leute hier nennen es Teufelszeug. Sie trinken lieber Bier. Zum Frühstück.'],
      ['kai', 'Das wird sich ändern. Glaubt mir. SEHR sogar.'],
    ]);
  }
  for (;;) {
    const opts = [];
    if (!E.F.needSugar) opts.push({ id: 'kahve', text: 'Kann ich einen Kahve probieren?' });
    if (E.F.metHilde) opts.push({ id: 'duell', text: E.F.ready3 ? 'Lasst uns noch einmal üben!' : 'Bringt Ihr mir das Streiten bei? Ich muss vor Gericht gegen Sigmund von Glanz reden.' });
    opts.push({ id: 'kinder', text: 'Habt Ihr eigentlich Nachfahren?' });
    opts.push({ id: 'bye', text: 'Bis später, Mehmed Efendi.' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('mehmed', E.F.ready3 ? 'Wir sehen uns bei Gericht. Ich sitze in der ersten Reihe!' : 'Güle güle! Geht mit Gott.');
    if (c === 'kahve') {
      E.F.needSugar = true;
      await lines(E, [
        ['kai', '*schlürf*'],
        ['kai', 'Oh. Oh wow. Das ist … bitter. Sehr, sehr bitter.'],
        ['mehmed', 'Ich weiß. Mit Zucker wäre es ein Traum. Aber Zucker ist hier teurer als Gold.'],
        ['mehmed', 'Ein Königreich für ein Stück Zucker!'],
      ]);
    }
    if (c === 'kinder') await lines(E, [
      ['mehmed', 'Inşallah viele! Und ich hoffe, einer davon eröffnet eines Tages einen Stand genau hier an der Brücke.'],
      ['kai', 'Ich habe da so ein Gefühl, dass das klappt.'],
    ]);
    if (c === 'duell') {
      if (!E.F.sugarGiven) {
        E.F.needSugar = true;
        await lines(E, [
          ['mehmed', 'Gegen Sigmund, den Amulettkrämer? Mit dem größten Vergnügen!'],
          ['mehmed', 'Aber mein Kopf arbeitet nur mit süßem Kahve. Bringt mir Zucker, dann lehre ich Euch die Kunst der Disputation.'],
        ]);
        continue;
      }
      await lines(E, [['mehmed', 'Also: Ich behaupte etwas Dummes. Ihr widerlegt es. Wer zuerst drei Treffer hat, gewinnt!'], ['__narr', '⚔ DISPUTATION: Kai gegen Mehmed Efendi']]);
      const won = await trainingDuel(E, 3);
      const n = learnedIn(E, 3);
      if (!won) await E.say('mehmed', `Verloren! Aber Ihr kennt nun ${n} von 8 Erwiderungen. Noch einmal!`);
      else if (n < 6) await lines(E, [['mehmed', 'Gewonnen! Gut!'], ['mehmed', `Aber Ihr kennt erst ${n} von 8 Erwiderungen. Sigmund ist listig wie ein Fuchs. Noch eine Runde!`]]);
      else if (!E.F.ready3) {
        E.F.ready3 = true;
        await lines(E, [
          ['mehmed', 'Maşallah! Ihr seid bereit, Kai Efendi!'],
          ['mehmed', 'Nehmt diese Kahve-Bohnen als Geschenk. Wer weiß – vielleicht trinkt man eines Tages sogar in Eurem Rosenheim Kahve.'],
        ]);
        E.addItem('bohnen');
        await E.say('kai', 'Die ersten Kaffeebohnen Bayerns. Ich weiß schon genau, wem ich die schenke.');
      } else await E.say('mehmed', 'Wieder gewonnen! Sigmund wird zittern.');
    }
  }
}

async function giveSugar(E) {
  if (E.F.sugarGiven) return E.say('mehmed', 'Ich habe noch Zucker für drei Wochen. Oder zwei Tassen.');
  E.removeItem('zucker');
  E.F.sugarGiven = true;
  E.F.needSugar = true;
  audio.win();
  await lines(E, [
    ['mehmed', 'ZUCKER?! Weiße Würfel?! Wo habt Ihr … nein. Ich frage nicht. Ein Gelehrter hat seine Geheimnisse.'],
    ['mehmed', '*rührt ein* … Mmmh! Jetzt ist es ein Getränk für Sultane!'],
    ['mehmed', 'Kai Efendi, Ihr seid ein Geschenk des Himmels. Jetzt lehre ich Euch alles über die Kunst der Disputation.'],
  ]);
}

async function talkBernhard(E) {
  if (!E.F.metBernhard) {
    E.F.metBernhard = true;
    await lines(E, [
      ['bernhard', 'Halt! Keinen Schritt näher an die Hexenkatze! Die hat mich angefaucht. Zweimal!'],
      ['kai', 'Bernd?!'],
      ['bernhard', 'BERNHARD. Bernhard der Büttel. Woher kennt Ihr meinen Namen?'],
      ['kai', 'Lange Geschichte. Sie spielt in der Zukunft.'],
    ]);
  }
  for (;;) {
    const opts = [
      { id: 'katze', text: 'Was passiert mit der Katze?' },
      { id: 'gericht', text: 'Wer darf ins Gericht?' },
      { id: 'hunger', text: 'Habt Ihr Hunger?' },
      { id: 'bye', text: 'Gehabt Euch wohl, Bernhard.' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('bernhard', 'Mhm.');
    if (c === 'katze') await lines(E, [['bernhard', 'Die wird mittags beim Gericht als Beweisstück vorgeführt.'], ['bernhard', 'Wenn der Rat sie für einen Dämon hält, kommt sie ins Kloster. Zu den Mönchen. Die haben Mäuse.']]);
    if (c === 'gericht') { await lines(E, [['bernhard', 'Ratsherren, die Angeklagte, das Volk auf den hinteren Bänken.'], ['bernhard', 'Und wer für die Angeklagte sprechen will, braucht einen gesiegelten Fürsprech-Brief vom Stadtschreiber.']]); }
    if (c === 'hunger') await lines(E, [
      ['bernhard', 'Immer. Aber seit Wochen träume ich von einem Essen, das es nicht gibt.'],
      ['bernhard', 'Fleisch … vom Spieß … in einem Fladen … mit weißer Soße …'],
      ['kai', 'Das ist … unheimlich.'],
      ['bernhard', 'Ich weiß. Ich sollte das dem Pfarrer beichten.'],
    ]);
  }
}

async function talkSchreiber(E) {
  for (;;) {
    const opts = [];
    if (E.F.knowsFuersprech && !E.has('pergament') && !E.has('brief')) opts.push({ id: 'brief', text: 'Ich brauche einen Fürsprech-Brief für das Gericht.' });
    opts.push({ id: 'sigmund', text: 'Was wisst Ihr über Sigmund von Glanz?' });
    opts.push({ id: 'beruf', text: 'Was macht ein Stadtschreiber so den ganzen Tag?' });
    opts.push({ id: 'bye', text: 'Danke, Meister Ulrich.' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('schreiber', 'Gott befohlen. Und vergesst nicht: Ordnung ist das halbe Leben. Die andere Hälfte sind Formulare.');
    if (c === 'sigmund') await lines(E, [['schreiber', 'Ein Händler aus der Fremde. Seit er hier ist, hat die Stadt viel mehr Glück. Sagt er.'], ['schreiber', 'Nachgezählt hat es niemand. Ich hätte die Listen dafür. Aber gefragt hat mich keiner.']]);
    if (c === 'beruf') await lines(E, [['schreiber', 'Ich schreibe auf, was geschieht. Wer geboren wird, wer heiratet, wer mit wem streitet.'], ['kai', 'Eine Art Chronik also.'], ['schreiber', 'Genau! Ohne mich wüsste in 500 Jahren niemand, was heute passiert ist.'], ['kai', '(Wenn der wüsste.)']]);
    if (c === 'brief') {
      await E.say('schreiber', 'Seid Ihr ein Gelehrter? Habt Ihr studiert?');
      const a = await E.choose([
        { id: 'ehrlich', text: 'Ich habe ein Studium abgebrochen. Jetzt bin ich Doktorand.' },
        { id: 'luege', text: 'Ich bin Professor der Quantenphysik, Ehrendoktor von Rosenheim!' },
      ]);
      if (a === 'luege') {
        await lines(E, [['kai', 'Ich bin Professor der Quantenphysik, Ehrendoktor von Rosenheim!'], ['schreiber', 'Der Quanten…? So etwas gibt es nicht. Ihr lügt. Das sehe ich an Eurer Nase.'], ['kai', '(Ehrlichkeit wäre vielleicht die bessere Methode gewesen.)']]);
        continue;
      }
      await lines(E, [
        ['kai', 'Ich habe ein Studium abgebrochen. Jetzt bin ich Doktorand.'],
        ['schreiber', 'Doktor-and? Ein halber Doktor! Und ehrlich dazu. Das genügt für den Fall einer Kräuterfrau.'],
      ]);
      E.addItem('pergament');
      await lines(E, [
        ['schreiber', 'Hier ist Euer Brief. Aber ohne Siegel ist er nichts wert. Habt Ihr ein Siegel?'],
        ['kai', 'Ich habe … ein Namensschild.'],
        ['schreiber', 'Dann drückt es in heißes Wachs, wie jeder anständige Mensch!'],
      ]);
    }
  }
}

async function talkSigmund(E) {
  for (;;) {
    const opts = [
      { id: 'wie', text: 'Wie funktionieren Eure Amulette?' },
      { id: 'hilde', text: 'Warum klagt Ihr Hildegard an?' },
    ];
    if (!E.has('amulett')) opts.push({ id: 'kaufen', text: 'Ich nehme ein Amulett.' });
    opts.push({ id: 'bye', text: 'Wir sehen uns vor Gericht.' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') return E.say('sigmund', 'Ha! Vor Gericht habe ich noch nie verloren! Ich war allerdings auch noch nie vor Gericht.');
    if (c === 'wie') await lines(E, [['sigmund', 'Mit GLÜCK! Die genaue Methode ist geheim. Streng geheim. Und sehr, sehr teuer.'], ['kai', 'Das kommt mir bekannt vor. Sehr bekannt.']]);
    if (c === 'hilde') await lines(E, [['sigmund', 'Weil sie eine Hexe ist! Sie verkauft Kräuter gegen Kopfweh. Die WIRKEN!'], ['sigmund', 'Billiger als meine Amulette UND sie wirken? Wenn das keine Hexerei ist, was dann?']]);
    if (c === 'kaufen') {
      await lines(E, [['sigmund', 'Drei Heller!'], ['kai', 'Nehmt Ihr … Euro?'], ['sigmund', 'Eine Münze mit einem Adler und der Aufschrift „Euro“? Das ist … zukunftsweisend. Angenommen!']]);
      E.addItem('amulett');
      await E.say('kai', 'Unten klebt Innsand dran. Ein bemalter Kieselstein. Unglaublich.');
    }
  }
}

async function enterTrial(E) {
  if (!E.has('brief')) {
    if (E.has('pergament')) return lines(E, [['bernhard', 'Ein Brief ohne Siegel? Da könnte ja jeder kommen.']]);
    return lines(E, [['bernhard', 'Halt! Ins Gericht nur mit gesiegeltem Fürsprech-Brief vom Stadtschreiber.']]);
  }
  if (!E.F.ready3) return E.say('kai', 'Ich habe den Brief. Aber gegen Sigmund brauche ich Übung. Mehmed Efendi an der Brücke kann mir das Streiten beibringen.');
  if (!E.has('baldrian')) return lines(E, [['kai', 'Moment. Wenn der Rat einen Beweis will, dass Schrödinger harmlos ist … brauche ich etwas, das ihn glücklich macht.'], ['kai', 'Hildegard hatte da was erwähnt.']]);
  audio.pickup();
  await E.narrate('Die Kirchenglocke schlägt zwölf. Das Gericht beginnt!');
  E.F.trialStarted = true;
  await E.goto('saal1524', 'start');
}

// ---------- Gericht ----------
async function trialScene(E) {
  if (E.F.catFree) return;
  if (E.F.trialDuelWon) return; // Spieler ist am Zug
  if (!E.F.trialIntro) {
    E.F.trialIntro = true;
    await E.narrate('Mittag. Der Rat der Stadt Wasserburg tagt.');
    await lines(E, [
      ['ratsherr', 'Ruhe! Das Gericht ist eröffnet! Angeklagt ist die Kräuterfrau Hildegard – der Hexerei mit einer schwarzen Katze!'],
      ['sigmund', 'Hohes Gericht! Diese Katze fiel vom HIMMEL! Sie faucht! Sie ist schwarz! Eindeutig ein Dämon!'],
      ['ratsherr', 'Wer spricht für die Angeklagte?'],
      ['kai', 'Ich! Kai Wimmer. Gelehrter aus … Rosenheim. Hier ist mein Brief.'],
      ['ratsherr', 'Ein Siegel mit … sehr seltsamen Zeichen. „Leiter Abt. Unwahrsch.“ … Nun gut. Sprecht!'],
      ['sigmund', 'Ha! Ein Duell der Worte? Ich habe auf jedem Jahrmarkt zwischen hier und Rosenheim das Volk überzeugt!'],
    ]);
  } else {
    await E.say('ratsherr', 'Die Verhandlung wird fortgesetzt!');
  }
  for (;;) {
    await E.narrate('⚔ PEER-REVIEW-DUELL 1524: Kai gegen Sigmund von Glanz', 1600);
    const won = await finalDuel(E, 3);
    if (won) break;
    audio.play('saal');
    await lines(E, [
      ['sigmund', 'Seht Ihr? Der Fremde hat keine Argumente!'],
      ['mehmed', '(aus dem Volk) Kai Efendi! Nicht aufgeben! Jetzt kennt Ihr seine Listen!'],
      ['ratsherr', 'Hm. Ich lasse noch eine Runde zu. Ich bin gespannt. Und hungrig.'],
    ]);
  }
  audio.play('saal');
  audio.win();
  E.F.trialDuelWon = true;
  await lines(E, [
    ['sigmund', 'Worte! Nur WORTE! Aber seht Euch doch die Katze an – sie faucht! Sie ist voller Bosheit!'],
    ['ratsherr', 'Hm. Der Fürsprech sagte, wer behauptet, muss beweisen. Das leuchtet mir ein.'],
    ['ratsherr', 'Aber ich gebe zu: Die Katze faucht wirklich sehr dämonisch. Fürsprech – habt Ihr einen Beweis für ihre Harmlosigkeit?'],
  ]);
}

async function catProof(E) {
  if (!E.F.trialDuelWon) return E.say('kai', 'Erst muss ich Sigmunds Argumente zerlegen. Dann der Beweis.');
  E.removeItem('baldrian');
  await E.say('kai', 'Hohes Gericht, ich bitte um ein kleines Experiment.');
  await E.walkTo(196, 176);
  E.face(1);
  audio.win();
  E.F.catCalm = true;
  await lines(E, [
    ['__narr', 'Schrödinger schnuppert am Baldrian, schnurrt wie ein Spinnrad, rollt sich auf den Rücken und streckt dem Rat den Bauch entgegen.'],
    ['ratsherr', 'Sie … schnurrt.'],
    ['sigmund', 'Ein Trick! HEXEREI!'],
    ['kai', 'Kein Trick. Baldrian. Den verkauft übrigens Hildegard. Für drei Heller weniger als Ihre Amulette.'],
  ]);
  E.F.catFree = true;
  await E.narrate('Schrödinger schlüpft aus dem Käfig, tappt über den Tisch – und reibt sich schnurrend an Sigmunds Bein.');
  await lines(E, [
    ['sigmund', 'Hilfe! Weg! Mein Glücksamulett schützt mich doch … nicht?!'],
    ['__narr', 'Das Amulett fällt zu Boden und zerbricht. Heraus kullert ein bemalter Kieselstein aus dem Inn.'],
    ['ratsherr', 'Ein … INNKIESEL?!'],
    ['ratsherr', 'Das Gericht hat entschieden! Die Kräuterfrau Hildegard ist frei!'],
    ['ratsherr', 'Und Sigmund von Glanz wird der Stadt verwiesen!'],
    ['sigmund', 'Wohin soll ich denn gehen?!'],
    ['ratsherr', 'Nach Rosenheim!'],
    ['sigmund', 'NEIN! Nicht nach ROSENHEIM!'],
    ['kai', '(Das erklärt so einiges über Sven.)'],
    ['mehmed', 'Maşallah! Das war die schönste Disputation seit Aristoteles!'],
    ['hildegard', 'Gelehrter … ich weiß nicht, wie ich Euch danken soll.'],
    ['kai', 'Bleibt einfach in Wasserburg. Das ist Dank genug. Wirklich.'],
    ['__narr', 'Schrödinger springt auf Kais Schulter und schnurrt ihm ins Ohr.'],
    ['kai', 'Zeit, nach Hause zu gehen, Kumpel. Zurück zur Hütte, zum Zeitriss.'],
  ]);
  audio.play('huette');
  await E.fade(1);
  E.enterScene('huette', 'draussen');
  await E.fade(0);
}

async function goHome(E) {
  await E.say('kai', 'Leb wohl, 1524. Du warst schmutzig, laut und wunderbar.');
  audio.zap();
  await E.fade(1);
  E.F.portalClosed = true;
  E.F.catBack = true;
  E.enterScene('labor3', 'portal');
  await E.fade(0);
  await epilogue(E);
}

async function epilogue(E) {
  audio.play('ende');
  await lines(E, [
    ['prof', 'KAI! Sie sind zurück! Und Schrödinger!'],
    ['__narr', 'Schrödinger springt auf die Q-Box, rollt sich zusammen und schläft sofort ein. Auf EINER Box. Nur einer.'],
    ['prof', 'Der Zeitriss schließt sich! Und die Chronik … hören Sie:'],
    ['prof', '„1524: Ein Gelehrter in weißem Gewand verteidigt die Kräuterfrau Hildegard mit einer neuen Kunst, die er ‚Argumente‘ nennt. Sie wird freigesprochen.“'],
    ['prof', '„Der Amulettkrämer Sigmund von Glanz wird nach Rosenheim verbannt.“'],
    ['kai', 'Nach Rosenheim … Moment. Dann ist die Familie Glanz ja …'],
  ]);
  const g = { id: 'glanz', who: 'glanz', x: 12, y: 164, dir: 1, color: C.glanz };
  E.actors.glanz = g;
  audio.door();
  await E.walkTo(64, 168, 'glanz');
  await lines(E, [
    ['glanz', 'Hallo! Sven Glanz, aus Rosenheim. Ich wollte mich auf die Doktorandenstelle bewerben.'],
    ['glanz', 'Ich habe gehört, hier gibt es eine Abteilung für Unwahrscheinlichkeitsabwehr?'],
    ['kai', '…'],
    ['prof', '…'],
    ['kai', 'Die Stelle ist besetzt.'],
    ['glanz', 'Oh. Schade. Dann … hole ich mir bei Mehmet an der Brücke einen Döner. Der soll legendär sein. Seit 500 Jahren.'],
  ]);
  await E.walkTo(-20, 166, 'glanz');
  delete E.actors.glanz;
  if (E.has('bohnen')) {
    await lines(E, [
      ['kai', 'Ach, Frau Professor – ich habe Ihnen etwas mitgebracht. Kaffeebohnen. Jahrgang 1524. Von Mehmed Efendi persönlich.'],
      ['prof', 'Kai … mit diesen Bohnen … könnte man es wagen.'],
    ]);
    E.removeItem('bohnen');
  }
  await E.fade(1);
  await E.narrate('Eine Stunde später im Flur. Die Frau Professor hat den Kaffeeautomaten mit Bohnen von 1524 befüllt – und zum ersten Mal seit 2019 entkalkt.');
  E.F.coffeeWorks = true;
  E.enterScene('flur3', 'start');
  E.kai.x = 214; E.kai.y = 160; E.kai.dir = 1;
  await E.fade(0);
  audio.pickup();
  await E.narrate('*Blubb-blubb … ZISCH … pling!*', 1600);
  await lines(E, [
    ['kai', 'Er funktioniert. Ganz ohne Unwahrscheinlichkeit.'],
    ['prof', 'Manchmal ist Wissenschaft ganz einfach, Kai: Man muss nur mal entkalken.'],
    ['kai', '*schlürf*'],
    ['kai', 'Ich heiße Kai Wimmer. Ich bin Wissenschaftler.'],
    ['kai', 'Und das hier … ist der beste Kaffee der Welt.'],
  ]);
  E.F.ended = true;
  E.onEnd?.();
}

// ---------- Gegenstände ----------
export function combine3(E, a, b) {
  const set = new Set([a, b]);
  const seal = () => {
    E.removeItem('pergament'); E.removeItem('kerze'); E.addItem('brief');
    return 'Ich tropfe Kerzenwachs auf den Brief und drücke mein Namensschild hinein. Ein Siegel! Man liest „…LEITER ABT. UNWAHRSCH…“. Sehr amtlich.';
  };
  if (set.has('pergament') && (set.has('namensschild') || set.has('kerze'))) {
    if (E.has('kerze') && E.has('namensschild')) return seal();
    if (!E.has('kerze')) return 'Mein Namensschild als Stempel – gute Idee. Aber ohne heißes Wachs hält da nichts. Ich brauche Wachs.';
    return 'Wachs habe ich. Jetzt brauche ich noch etwas zum Hineindrücken.';
  }
  if (set.has('kerze') && set.has('namensschild')) return 'Ein Stempel und Wachs. Jetzt fehlt nur noch etwas, das ich siegeln kann.';
  if (set.has('zucker') && set.has('bohnen')) return 'Die Kaffeebohnen gehören der Frau Professor. Und der Zucker ist ungefähr 500 Jahre zu früh dran.';
  if (set.has('baldrian')) return 'Den Baldrian mische ich nicht. Der ist für einen ganz bestimmten Kater.';
  return null;
}

export function itemUse3(E, id) {
  if (id === 'rudi') return funken(E);
  if (id === 'chronik') return readChronik(E);
  return null;
}

async function funken(E) {
  if (E.S.scene === 'labor3' || E.S.scene === 'flur3') return E.say('kai', 'Die Frau Professor steht direkt neben mir. Ich könnte auch einfach … reden.');
  audio.radio();
  await E.say('kai', 'Rudi an Labor! Rudi an Labor, bitte kommen!');
  if (E.F.needSugar && !E.F.zuckerInHut && !E.F.sugarGiven) {
    await E.say('kai', 'Frau Professor, ich brauche Zucker! Hier ist Zucker so teuer wie Gold!');
    await radio(E, 'Zucker? Moment … Würfelzucker aus der Teeküche! Ich werfe ihn durch den Riss. Er müsste in Hildegards Hütte landen!');
    E.F.zuckerInHut = true;
    audio.sweep(300, 1200, 0.4, 'sine', 0.08);
    return E.say('kai', 'Lieferung durch 500 Jahre. Kostenloser Versand.');
  }
  if (E.F.catFree) return radio(E, 'Kai, die Chronik hat sich stabilisiert! Kommen Sie nach Hause – durch den Riss in Hildegards Hütte!');
  await radio(E, 'Hier Labor! Die Chronik flackert immer noch. ' + hint3(E));
}

async function readChronik(E) {
  const F = E.F;
  if (F.catFree) return E.say('kai', '„1524: Hildegard die Kräuterfrau wird freigesprochen. Der Amulettkrämer Sigmund von Glanz wird nach Rosenheim verbannt.“ Die Schrift ist ruhig und fest. Geschafft!');
  const bits = ['„1524: Die Kräuterfrau Hildegard wird wegen einer vom Himmel gefallenen Hexenkatze angeklagt.'];
  if (E.has('brief')) bits.push('Ein fremder Gelehrter meldet sich als Fürsprech.');
  if (F.catCalm) bits.push('Der Büttel berichtet, die Katze habe geschnurrt.');
  if (F.ready3) bits.push('Der Gelehrte übt mit einem Kaffeehändler die Kunst der Disputation.');
  bits.push('Das Urteil: …“');
  await E.say('kai', bits.join(' '));
  await E.say('kai', 'Der Rest flackert. Die Geschichte ist noch nicht entschieden.');
}

export function itemLook3(E, id) {
  if (id === 'chronik') return 'Die Stadtchronik. Tippe auf „▶ Lesen“, um zu sehen, was über 1524 gerade drinsteht.';
  if (id === 'rudi') return 'Rudi. Funkgerät, Zeitreisebegleiter, Freund. Tippe auf „▶ Funken“, um die Frau Professor zu rufen.';
  return null;
}

// ---------- Tipps ----------
export function hint3(E) {
  const F = E.F, sc = E.S.scene;
  if (sc === 'labor3' && !F.catFree) return 'Geh durch den Zeitriss, um Schrödinger zurückzuholen.';
  if (sc === 'saal1524') {
    if (!F.trialDuelWon) return 'Gewinne das Duell. Liegst du daneben, flüstert Mehmed dir die richtige Erwiderung zu.';
    if (!F.catFree) return 'Beweise, dass Schrödinger kein Dämon ist: Benutze den Baldrian mit dem Käfig.';
  }
  if (F.catFree) return 'Geh in Hildegards Hütte und durch den Zeitriss nach Hause.';
  if (!F.metHilde) return 'Sprich mit Hildegard in der Hütte.';
  if (!F.knowsFuersprech) return 'Frag Hildegard, wie du ihr vor Gericht helfen kannst.';
  if (!E.has('pergament') && !E.has('brief')) return 'Der Stadtschreiber auf dem Marktplatz stellt Fürsprech-Briefe aus. Sei ehrlich zu ihm.';
  if (!E.has('brief')) return F.kerzeTaken ? 'Kombiniere den Brief mit deinem Namensschild – das Wachs der Kerze wird zum Siegel.' : 'Für ein Siegel brauchst du Wachs. In Hildegards Hütte brennt eine Kerze.';
  if (!F.sugarGiven) {
    if (!F.metMehmed) return 'Hildegard kennt jemanden, der gut streiten kann: Mehmed Efendi an der Innbrücke.';
    if (!F.needSugar) return 'Frag Mehmed, ob er dir das Streiten beibringt – oder probier seinen Kahve.';
    if (!F.zuckerInHut) return 'Mehmed braucht Zucker. 1524 ist der unbezahlbar – aber nicht in der Gegenwart! Wähle Rudi und tippe „▶ Funken“.';
    if (!F.zuckerTaken) return 'Der Zucker ist in Hildegards Hütte gelandet, direkt vor dem Zeitriss.';
    return 'Gib Mehmed den Zucker.';
  }
  if (!F.ready3) return `Trainiere mit Mehmed die Disputation. Du kennst ${learnedIn(E, 3)} von 8 Erwiderungen.`;
  if (!F.baldrianTaken) return F.knowsBaldrian ? 'Der Baldrian liegt in Hildegards Regal neben dem Kamin.' : 'Frag Hildegard, wie die Katze war, als sie ankam.';
  return 'Geh auf dem Marktplatz zur Rathaustür. Das Gericht wartet!';
}
