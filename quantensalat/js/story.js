// QUANTENSALAT – Das Wasserburg-Paradoxon
// Story, Szenen, Rätsel und Dialoge.
import { audio } from './audio.js';
import { drawCounter } from './art.js';
import { trainingDuel, finalDuel, RETORTS } from './duel.js';
import { chapter2, newState2, combine2, itemUse2, itemLook2, hint2 } from './story2.js';

const C = { kai: '#ffffff', prof: '#d7b4ff', mehmet: '#ffc864', glanz: '#7fe3ff', guard: '#ff9f9f', karl: '#9dff9d', radio: '#ffe89a' };

// ---------- Hilfen ----------
async function lines(E, list) { for (const [who, text] of list) await E.say(who, text); }

function spawn(E, id, who, x, y, dir, extra = {}) {
  E.actors[id] = Object.assign({ id, who, x, y, dir, phase: 0, color: C[id] || '#fff' }, extra);
  return E.actors[id];
}

const profAlpha = (S) => (S.flags.profBack ? 1 : S.flags.profStable ? () => 0.85 + Math.random() * 0.1 : (t) => 0.25 + 0.35 * Math.abs(Math.sin(t * 7)) + (Math.random() < 0.1 ? 0.3 : 0));

// ---------- Szenen ----------
export const scenes = {
  // ===================== FLUR =====================
  flur: {
    title: 'Institut · Flur',
    music: 'flur',
    walk: [14, 152, 308, 192],
    entries: { labor: [42, 160, 1], buero: [171, 158, 1], ausgang: [284, 162, -1] },
    actors: () => [],
    async enter(E) {
      if (E.F.intro) return;
      E.F.intro = true;
      E.kai.x = 80; E.kai.y = 172; E.kai.dir = 1;
      await E.narrate('Wasserburg am Inn. 23:47 Uhr.');
      await lines(E, [
        ['kai', 'Ich heiße Kai Wimmer, und ich will Wissenschaftler werden!'],
        ['kai', '… Momentan bin ich allerdings Nacht-Hausmeister am Institut für Angewandte Unwahrscheinlichkeit.'],
        ['kai', 'Aber hey – Einstein hat auch im Patentamt angefangen. Das ist so ähnlich wie Wischen. Glaube ich.'],
      ]);
      audio.zap();
      E.shake(0.6);
      await E.narrate('*** KRAWUMM! ***', 1200);
      await E.say('kai', 'Das kam aus dem Labor! Die Frau Professor arbeitet doch noch!');
      const g = spawn(E, 'glanz', 'glanz', 42, 160, 1, { speed: 120, color: C.glanz, carry: true });
      audio.door();
      await E.wait(300);
      E.face(-1);
      await E.walkTo(150, 180, 'glanz');
      await E.say('glanz', 'Aus dem Weg, Putzkraft! Disruption wartet nicht!');
      await E.walkTo(290, 160, 'glanz');
      audio.door();
      delete E.actors.glanz;
      E.face(1);
      await E.wait(300);
      audio.bad();
      await E.narrate('🔒 SICHERHEITS-LOCKDOWN AKTIVIERT. Alle Außentüren verriegelt.');
      await lines(E, [
        ['kai', 'Wer war DAS denn?!'],
        ['kai', 'Und hatte der gerade die Q-Box der Frau Professor unterm Arm?'],
        ['kai', 'Ich schau besser mal ins Labor.'],
      ]);
    },
    hotspots: [
      { id: 'laborTuer', name: 'Labortür', rect: [18, 54, 48, 87], at: [42, 154], exit: ['labor', 'flur'] },
      {
        id: 'bueroTuer', name: 'Büro Prof. Brandl', rect: [148, 52, 46, 89], at: [171, 152], exit: ['buero', 'flur'],
        async canExit(E) {
          if (E.has('karte')) { audio.blip(); return true; }
          await E.say('kai', 'Abgeschlossen. Das Büro der Frau Professor geht nur mit ihrer Schlüsselkarte auf.');
          return false;
        },
      },
      {
        id: 'ausgang', name: 'Ausgang', rect: [258, 50, 54, 91], at: [284, 154], exit: ['bruecke', 'institut'],
        async canExit(E) {
          if (!E.F.lockdownOff) {
            audio.bad();
            await E.say('kai', 'Verriegelt. Auf dem Display steht: „SICHERHEITS-LOCKDOWN AKTIV“. Na super.');
            return false;
          }
          if (!E.F.toldPlan) {
            await E.say('kai', 'Ich kann die Frau Professor doch nicht flackernd allein lassen!');
            return false;
          }
          return true;
        },
      },
      {
        id: 'brett', name: 'Schwarzes Brett', rect: [78, 58, 54, 38], at: [104, 158],
        look: [['kai', 'Ein Aushang: „Promotionsstelle am Institut – nur für ECHTE Wissenschaftler!“'], ['kai', 'Jemand hat mit Kuli dazugeschrieben: „Also nicht Kai.“'], ['kai', '… Ich weiß genau, wer das war. Der Postdoc mit der Fliege.']],
        use: 'Ich hänge einen eigenen Zettel dazu: „Suche Sinn des Lebens. Biete Wischkenntnisse.“ … Nein. Lieber nicht.',
      },
      {
        id: 'kaffee', name: 'Kaffeeautomat', rect: [206, 78, 30, 63], at: [220, 158],
        look: 'Der Kaffeeautomat. Seit 2019 kaputt. Er hat mehr Geld gefressen als die Forschungsabteilung.',
        use: 'Ich drücke „Espresso“. Er macht ein Geräusch wie ein sterbender Wal. Kein Kaffee. Wie immer.',
        items: { mopp: 'Ich wische ihn ab. Jetzt ist er sauber UND kaputt.' },
      },
      {
        id: 'putzwagen', name: 'Putzwagen', rect: [102, 126, 38, 36], at: [120, 170], useLabel: 'Durchsuchen',
        look: 'Mein Putzwagen. Eimer, Lappen, Glasreiniger. Mein ganzer Stolz.',
        use: (E) => {
          if (E.F.brotzeitTaken) return 'Nur noch Putzmittel. Nichts davon ist essbar. Ich hab’s überprüft.';
          E.F.brotzeitTaken = true;
          E.addItem('brotzeit');
          return 'Meine Leberkässemmel! Die nehm ich mit. Man weiß nie, wann einen der Hunger packt.';
        },
        items: { mopp: 'Der Mopp gehört eigentlich in den Wagen. Aber ich hänge an ihm.' },
      },
    ],
  },

  // ===================== LABOR =====================
  labor: {
    title: 'Institut · Labor',
    music: 'labor',
    walk: [24, 150, 300, 192],
    entries: { flur: [30, 166, 1] },
    actors: (S) => (S.flags.profBack && S.flags.ended ? [] : [
      { id: 'prof', who: 'prof', x: 150, y: 166, dir: -1, color: C.prof, alpha: profAlpha(S), glitch: !S.flags.profStable, pitch: 1.3 },
    ]),
    async enter(E) {
      if (E.F.disguised) { E.F.disguised = false; E.kai.who = 'kai'; }
      if (!E.F.sawProf) {
        E.F.sawProf = true;
        await lines(E, [
          ['kai', 'Frau Professor?!'],
          ['prof', 'Kai! Gut, dass Sie da sind! Ich … bin … gerade … nur … zu … fünfzig … Prozent … anwesend.'],
          ['kai', 'Sie flackern ja wie ein kaputter Fernseher!'],
        ]);
      } else if (E.F.won && !E.F.profBack && !E.F.finalHello) {
        E.F.finalHello = true;
        await lines(E, [
          ['prof', 'Kai! Sie haben es geschafft! Ich habe ALLES im Livestream gesehen!'],
          ['prof', 'Mittlerweile haben wir übrigens 40.000 Zuschauer. Der Mann aus Kasachstan ist immer noch dabei.'],
          ['prof', 'Schnell – die Q-Box! Benutzen Sie sie mit mir!'],
        ]);
      }
    },
    hotspots: [
      { id: 'tuer', name: 'Zum Flur', rect: [0, 54, 20, 87], at: [26, 160], exit: ['flur', 'labor'] },
      {
        id: 'prof', name: 'Prof. Brandl', actor: 'prof', use: null,
        look: (E) => E.F.profBack ? 'Prof. Dr. Hildegard Brandl. Zu 99,7 % anwesend. Mehr schafft sie auch an normalen Tagen nicht.'
          : E.F.profStable ? 'Die Frau Professor. Dank Livestream wieder recht stabil. Nur ihre Frisur ist noch in Superposition.'
            : 'Prof. Dr. Hildegard Brandl. Sie flackert. Halb da, halb weg. Wie ich montags.',
        talk: (E) => talkProf(E),
        items: {
          handystativ: (E) => startStream(E),
          handy: [['kai', 'Ich könnte sie filmen … aber ich kann nicht die ganze Nacht mein Handy hochhalten.'], ['kai', 'Ich bräuchte irgendeine Halterung.']],
          brotzeit: [['prof', 'Danke, Kai, aber die Semmel würde gerade einfach durch mich durchfallen.']],
          qbox: (E) => finale(E),
          mopp: [['kai', 'Ich wische vorsichtig um sie herum.'], ['prof', 'Kai. Bitte.']],
          einladung: [['prof', 'Ja, das ist meine Einladung! Gehen Sie hin – als ich!']],
        },
        anyItem: (E, it) => [['prof', 'Das hilft mir gerade nicht, Kai. Ich brauche einen Beobachter.']],
      },
      {
        id: 'sockel', name: 'Sockel der Q-Box', rect: [144, 80, 32, 62], at: [128, 168],
        look: 'Hier stand die Q-Box. Jetzt stehen hier nur noch Glassplitter und eine gewisse Leere.',
        use: 'Ich will mich nicht schneiden. Ich habe keine Krankenversicherung für Quantenverletzungen.',
      },
      {
        id: 'tafel', name: 'Whiteboard', rect: [112, 30, 86, 50], at: [150, 166],
        look: [['kai', 'Formeln. Ganz viele Formeln.'], ['kai', 'Ganz unten: „P(Unwahrscheinlich) → 1 ?!“ Und daneben: „Kaffee!!!“'], ['kai', 'Das Zweite verstehe sogar ich.']],
        use: 'Ich male ein Strichmännchen dazu. Jetzt ist es Wissenschaft mit Herz.',
      },
      {
        id: 'laser', name: 'Laser', rect: [40, 104, 60, 18], at: [70, 160],
        look: 'Ein Laser. Klasse 4. Das Schild sagt: „Nicht mit dem verbleibenden Auge in den Strahl blicken.“',
        use: 'Ich mache keine Experimente mit meinen Augen. Die brauche ich noch zum Wischen.',
      },
      {
        id: 'kittel', name: 'Laborkittel', rect: [28, 64, 16, 38], at: [40, 158], useLabel: 'Nehmen',
        visible: (S) => !S.flags.kittelTaken,
        look: 'Ein weißer Laborkittel. Wer so einen trägt, wirkt sofort 30 % kompetenter.',
        use: (E) => { E.F.kittelTaken = true; E.addItem('kittel'); return 'Den leihe ich mir. Nur für einen Moment. Oder für eine Karriere.'; },
      },
      {
        id: 'motor', name: 'Magnetrührer', rect: [282, 94, 20, 20], at: [286, 158], useLabel: 'Nehmen',
        visible: (S) => !S.flags.motorTaken,
        look: 'Ein Magnetrührer. Er rührt Flüssigkeiten mit einem rotierenden Magneten. Im Grunde ein kleiner, sehr gleichmäßiger Motor.',
        use: (E) => { E.F.motorTaken = true; E.addItem('motor'); return 'Den nehm ich mit. Die Wissenschaft rührt heute Nacht ausnahmsweise per Hand.'; },
      },
      {
        id: 'kolben', name: 'Glaskolben', rect: [218, 92, 40, 22], at: [236, 158],
        look: 'Leuchtende Flüssigkeiten. Grün heißt bestimmt „gesund“.',
        use: 'Ich trinke nichts, was leuchtet. Das ist meine wichtigste Lebensregel.',
      },
      {
        id: 'dewar', name: 'Stickstoff-Behälter', rect: [188, 110, 18, 32], at: [196, 160],
        look: 'Flüssiger Stickstoff, minus 196 Grad. Perfekt für Eiscreme, die einem die Zunge abreißt.',
        use: 'Ich habe meine Finger gezählt. Es sind zehn. So soll es bleiben.',
      },
      {
        id: 'karton', name: 'Schrödinger', rect: [246, 138, 38, 34], at: [238, 176],
        visible: (S) => !S.flags.catOut,
        look: [['kai', 'Schrödinger, die Institutskatze, sitzt in ihrem Karton.'], ['kai', 'Ob sie lebt? Sie faucht. Also ja.'], ['kai', 'Sie sitzt auffällig auf irgendwas drauf.']],
        use: [['kai', 'Ich greife in den Karton …'], ['kai', 'Schrödinger faucht. Ich ziehe meine Hand zurück. Die Katze ist ganz klar im Zustand „beißt“.']],
        talk: [['kai', 'Miez, miez?'], ['__narr', 'Schrödinger starrt dich an, als hättest du das Periodensystem beleidigt.']],
        items: {
          brotzeit: async (E) => {
            E.removeItem('brotzeit');
            await E.say('kai', 'Schau mal, Schrödinger. Leberkäs!');
            await E.say('kai', 'Ich lege die Semmel auf den Boden …');
            E.F.catOut = true;
            audio.pickup();
            await E.narrate('Schrödinger springt aus dem Karton und stürzt sich auf die Semmel.');
            await E.say('kai', 'Die Katze ist nicht mehr in der Box. Die Wellenfunktion ist kollabiert – Richtung Leberkäs.');
            await E.say('kai', 'Moment … da liegt was im Karton!');
          },
          mopp: 'Ich stupse Schrödinger mit dem Mopp an. Er schaut mich an, als würde er sich meine Adresse merken.',
        },
      },
      {
        id: 'kartonLeer', name: 'Karton', rect: [246, 138, 38, 34], at: [238, 176], useLabel: 'Durchsuchen',
        visible: (S) => S.flags.catOut,
        look: (E) => E.F.karteTaken ? 'Ein leerer Karton. Ohne Katze ist er einfach nur … ein Karton.' : 'Da liegt eine Schlüsselkarte im Karton!',
        use: (E) => {
          if (E.F.karteTaken) return 'Der Karton ist leer. Bis auf ein paar Katzenhaare und existenzielle Fragen.';
          E.F.karteTaken = true; E.addItem('karte');
          return 'Eine Schlüsselkarte! „Prof. Dr. H. Brandl“. Leicht angesabbert. Schrödinger hat sie bewacht wie einen Schatz.';
        },
      },
      {
        id: 'katze', name: 'Schrödinger', rect: [92, 158, 30, 16], at: [80, 176],
        visible: (S) => S.flags.catOut,
        look: 'Schrödinger frisst meine Leberkässemmel. Mit geschlossenen Augen. Das ist Liebe.',
        talk: [['kai', 'Schmeckt’s?'], ['__narr', 'Schrödinger schnurrt. Zum ersten Mal in der Geschichte des Instituts.']],
        use: 'Ich störe keine Katze beim Essen. Ich bin doch nicht lebensmüde.',
      },
    ],
  },

  // ===================== BÜRO =====================
  buero: {
    title: 'Institut · Büro Prof. Brandl',
    music: 'buero',
    walk: [36, 150, 262, 192],
    entries: { flur: [32, 170, 1] },
    actors: () => [],
    hotspots: [
      { id: 'tuer', name: 'Zum Flur', rect: [4, 52, 34, 90], at: [34, 166], exit: ['flur', 'buero'] },
      {
        id: 'stativ', name: 'Stativ', rect: [286, 134, 22, 28], at: [258, 176], useLabel: 'Nehmen',
        visible: (S) => !S.flags.stativTaken,
        look: 'Ein Kamerastativ. Damit fotografiert die Frau Professor ihre Versuchsaufbauten. Und ihre Zimmerpflanzen.',
        use: (E) => { E.F.stativTaken = true; E.addItem('stativ'); return 'Ein Stativ! Genau, was ein Mann ohne ruhige Hand braucht.'; },
      },
      {
        id: 'computer', name: 'Computer', rect: [72, 86, 32, 26], at: [88, 160],
        look: (E) => E.F.lockdownOff ? 'Auf dem Bildschirm steht: „Lockdown deaktiviert. Schönen Abend noch!“' : [['kai', 'Auf dem Bildschirm blinkt es rot: „SICHERHEITS-LOCKDOWN. Passwort eingeben.“'], ['kai', 'Darunter ein Hinweis: „Mein Rufzeichen“.']],
        use: async (E) => {
          if (E.F.lockdownOff) return E.say('kai', 'Hier hab ich alles erledigt. Außer Solitär.');
          if (!E.F.knowsCall) {
            return lines(E, [
              ['kai', 'Das Passwort ist ihr „Rufzeichen“? Was soll das sein – ein Kampfschrei?'],
              ['kai', 'Ich tippe „HALLO“. Falsch. „PASSWORT“. Falsch. „1234“. Auch falsch. Aber knapp, glaube ich.'],
            ]);
          }
          await E.say('kai', 'Ich tippe: D-L-4-Q-B-X …');
          audio.win();
          E.F.lockdownOff = true;
          await E.narrate('✅ Passwort korrekt. Sicherheits-Lockdown deaktiviert.');
          await E.say('kai', 'Ich bin ein Hacker. Ein ganz, ganz kleiner.');
        },
        items: { mopp: 'Ich wische den Staub vom Bildschirm. Das Passwort weiß ich trotzdem nicht.' },
      },
      {
        id: 'qsl', name: 'QSL-Karten', rect: [200, 40, 64, 40], at: [228, 160],
        look: async (E) => {
          await lines(E, [
            ['kai', 'Bunte Postkarten aus Japan, Brasilien, Island … „QSL“ steht drauf.'],
            ['kai', 'Die schicken sich Funkamateure als Bestätigung, wenn sie miteinander gefunkt haben.'],
            ['kai', 'Alle adressiert an dasselbe Rufzeichen: DL4QBX.'],
          ]);
          if (!E.F.knowsCall) { E.F.knowsCall = true; await E.say('kai', 'DL4QBX … Das muss das Rufzeichen der Frau Professor sein!'); }
        },
        use: 'Die hängen an der Wand. Die Frau Professor wäre sehr traurig, wenn ich sie klaue.',
      },
      {
        id: 'funk', name: 'Funkgerät', rect: [196, 92, 64, 22], at: [226, 160],
        look: 'Eine Kurzwellen-Funkstation. Mit Morsetaste! Die Frau Professor ist also Funkamateurin.',
        use: async (E) => {
          if (E.F.radioDone) return E.say('kai', 'Lieber nicht noch mal. Ich will die Bundesnetzagentur nicht provozieren.');
          E.F.radioDone = true;
          audio.radio();
          await E.say('kai', 'Ich drehe am Knopf. Rauschen … Pfeifen … dann eine Stimme:');
          await E.say('__narr', '„CQ CQ, hier ist DO5ALO aus Wasserburg am Inn. Bitte kommen.“', { color: C.radio });
          await E.say('kai', 'Äh … hallo? Hier ist Kai. Vom Institut. Ich hab eigentlich gar keine Lizenz.');
          await E.say('__narr', '„Dann lieber schnell wieder aus, bevor die Bundesnetzagentur anrückt! Aber ein Tipp unter Funkern: Passwörter sind oft Rufzeichen. 73!“', { color: C.radio });
          audio.morse('73');
          await E.say('kai', '73? Ist das ein Geheimcode? … Klingt jedenfalls freundlich.');
        },
      },
      {
        id: 'schublade', name: 'Schreibtischschublade', rect: [96, 118, 32, 18], at: [112, 164], useLabel: 'Öffnen',
        look: (E) => E.F.drawerOpen ? 'Die Schublade ist leer. Bis auf einen Gummibären von 2011.' : 'Die Schreibtischschublade der Frau Professor.',
        use: async (E) => {
          if (E.F.drawerOpen) return E.say('kai', 'Nur noch der Gummibär von 2011. Ich lasse ihn in Frieden ruhen.');
          E.F.drawerOpen = true;
          E.addItem('einladung');
          E.addItem('schere');
          await E.say('kai', 'Drin sind: eine Einladung zum „Zukunftsgipfel“ und eine Schere. Ich nehme beides – im Namen der Wissenschaft.');
        },
      },
      {
        id: 'brille', name: 'Lesebrille', rect: [56, 104, 20, 10], at: [70, 162], useLabel: 'Nehmen',
        visible: (S) => !S.flags.brilleTaken,
        look: 'Die Ersatzbrille der Frau Professor. Plus 2,5 Dioptrien.',
        use: (E) => { E.F.brilleTaken = true; E.addItem('brille'); return 'Die leih ich mir. Ich setze sie kurz auf … Die Welt verschwimmt, aber ich fühle mich sofort klüger.'; },
      },
      { id: 'lampe', name: 'Schreibtischlampe', rect: [112, 98, 16, 14], at: [118, 162], look: 'Eine grüne Bankierslampe. Macht selbst Steuererklärungen gemütlich.', use: 'Klick. Klick. Ja, sie funktioniert. Das Licht ist das Einzige, was hier heute Nacht zuverlässig funktioniert.' },
      { id: 'fenster', name: 'Fenster', rect: [124, 26, 72, 58], at: [160, 160], look: 'Die Altstadt von Wasserburg bei Nacht. Irgendwo da draußen ist Sven Glanz mit der Q-Box.', use: 'Das Fenster klemmt. Wie alles in diesem Gebäude, was nicht aus Glas ist. Und das aus Glas ist kaputt.' },
      { id: 'regal', name: 'Bücherregal', rect: [268, 24, 48, 108], at: [258, 166], look: 'Bücher: „Quantenmechanik für Fortgeschrittene“, „Die Kunst der Unwahrscheinlichkeit“ und „Katzen verstehen, Band 1 bis 9“.', use: 'Ich ziehe an einem Buch. Kein Geheimgang. Enttäuschend.' },
    ],
  },

  // ===================== INNBRÜCKE =====================
  bruecke: {
    title: 'Innbrücke vor dem Brucktor',
    music: 'bruecke',
    walk: [8, 154, 312, 192],
    entries: { institut: [18, 174, 1], platz: [258, 166, -1] },
    actors: () => [
      { id: 'mehmet', who: 'mehmet', x: 80, y: 146, dir: 1, fixedDir: true, color: C.mehmet, pitch: 0.8, after: drawCounter },
    ],
    hotspots: [
      { id: 'zumInstitut', name: 'Zum Institut', rect: [0, 140, 14, 60], at: [10, 174], exit: ['flur', 'ausgang'] },
      { id: 'brucktor', name: 'Brucktor (zur Altstadt)', rect: [244, 80, 26, 70], at: [257, 158], exit: ['platz', 'bruecke'] },
      {
        id: 'mehmet', name: 'Mehmet', actor: 'mehmet', at: [84, 170], use: null,
        look: 'Mehmet. Kebabmeister, Philosoph, Schnurrbartträger. Nicht unbedingt in dieser Reihenfolge.',
        talk: (E) => talkMehmet(E),
        items: {
          motor: (E) => fixSpit(E),
          brotzeit: [['mehmet', 'Eine Leberkässemmel? An MEINEM Stand? Das ist, als würdest du Einstein einen Taschenrechner schenken.']],
          mopp: [['mehmet', 'Nein danke, mein Freund. Ich habe schon einen Mopp. Er heißt Ömer und ist mein Neffe.']],
          einladung: [['mehmet', 'Der Zukunftsgipfel. Da will Glanz seine Box zeigen. Da musst du hin, Kai!']],
        },
        anyItem: () => [['mehmet', 'Interessant. Aber ich tausche nichts gegen Döner. Döner ist unbezahlbar.']],
      },
      {
        id: 'spiess', name: 'Dönerspieß', rect: [88, 92, 24, 36], at: [96, 170],
        look: (E) => E.F.spiessFixed ? 'Er dreht sich wieder! Majestätisch wie ein Planet.' : 'Der Dönerspieß steht still. Ein trauriger, kalter Anblick.',
        use: [['kai', 'Ich drehe ihn mit der Hand.'], ['mehmet', 'Finger weg vom Spieß! Das ist wie ein Picasso, nur mit Fleisch.']],
        items: { motor: (E) => fixSpit(E) },
      },
      { id: 'inn', name: 'Der Inn', rect: [0, 112, 230, 20], at: [140, 160], look: 'Der Inn. Er fließt einfach. Jeden Tag. Ohne Burnout. Bewundernswert.', use: 'Nein, ich springe da nicht rein. Das Wasser hat neun Grad.' },
      { id: 'mond', name: 'Mond', rect: [36, 12, 18, 18], at: [100, 170], look: 'Der Mond. Die Frau Professor sagt, er ist nur da, wenn man hinschaut. Ich schau lieber nicht weg.', use: 'Ich komm da nicht hin. Noch nicht.' },
      { id: 'laterne', name: 'Laterne', rect: [170, 54, 16, 96], at: [184, 170], look: 'Eine Laterne. Die einzige hier, die ihren Job ohne Probleme macht.', use: 'Ich umarme die Laterne. Sie ist kalt, aber ehrlich.' },
    ],
  },

  // ===================== RATHAUSPLATZ =====================
  platz: {
    title: 'Rathausplatz, Altstadt',
    music: 'platz',
    walk: [8, 158, 312, 194],
    entries: { bruecke: [18, 176, 1] },
    actors: () => [
      { id: 'guard', who: 'guard', x: 196, y: 160, dir: -1, color: C.guard, pitch: 0.6 },
      { id: 'karl', who: 'kai', x: 64, y: 168, visible: false, color: C.karl, pitch: 1.6 },
    ],
    hotspots: [
      { id: 'zurueck', name: 'Zur Innbrücke', rect: [0, 140, 12, 60], at: [10, 176], exit: ['bruecke', 'platz'] },
      {
        id: 'guard', name: 'Security-Mann', actor: 'guard', use: null, at: [176, 170],
        look: 'Ein Security-Mann. Breit wie ein Kleiderschrank. Auf seinem Namensschild steht „Bernd“.',
        talk: (E) => talkGuard(E),
        items: {
          einladung: (E) => tryEnter(E),
          verkleidung: (E) => tryEnter(E),
          zertifikat: [['guard', '„Peer-Review-Duell“? Mit Knoblauchsoße? … Ich stell keine Fragen.']],
          mopp: [['guard', 'Wenn Sie hier putzen wollen: Der Hintereingang ist für Reinigungskräfte. Er ist ab 8 Uhr offen.'], ['kai', 'Das ist zu spät.']],
        },
        anyItem: () => [['guard', 'Ich darf keine Geschenke annehmen. Außer Döner. Döner ist kein Geschenk, Döner ist ein Grundrecht.']],
      },
      {
        id: 'auto', name: 'GlanzMobil', rect: [28, 152, 72, 28], at: [110, 176],
        look: 'Ein weißer Elektro-Sportwagen. Kennzeichen: „RO-GL 4NZ“. Natürlich.',
        use: [['kai', 'Ich ruckle am Türgriff.'], ['karl', 'Bitte nicht berühren. Dieser Lack kostet mehr als Ihre Ausbildung.']],
        talk: (E) => talkKarl(E),
        items: { mopp: [['kai', 'Ich wische eine Schliere vom Lack.'], ['karl', 'Oh! Danke! Das hat noch nie jemand für mich getan.']] },
      },
      { id: 'rathaus', name: 'Rathaus', rect: [100, 0, 130, 116], at: [150, 170], look: 'Das Wasserburger Rathaus mit seinem Treppengiebel. Gotik vom Feinsten. Heute mit GlanzTech-Banner. Gotik vom Peinlichsten.', use: 'Da komm ich nur durch die Tür rein. Und vor der steht Bernd.' },
      { id: 'haeuser', name: 'Bunte Häuser', rect: [0, 40, 100, 110], at: [60, 176], look: 'Die bunten Häuser der Altstadt. Inn-Salzach-Stil: flache Fassaden, damit man die Dächer nicht sieht. Architektur mit Geheimnissen.', use: 'Um diese Uhrzeit klingle ich nirgends. Ich bin Hausmeister, kein Monster.' },
    ],
  },

  // ===================== RATHAUSSAAL =====================
  saal: {
    title: 'Rathaussaal · Zukunftsgipfel',
    music: 'saal',
    walk: [30, 168, 290, 190],
    entries: { start: [40, 176, 1] },
    enterOnRestore: true,
    actors: (S) => [
      { id: 'glanz', who: 'glanz', x: 258, y: 124, dir: -1, color: C.glanz, alpha: S.flags.won ? () => 0.3 + Math.random() * 0.6 : 1, glitch: !!S.flags.won },
      { id: 'mehmet', who: 'mehmet', x: 104, y: 190, visible: false, color: C.mehmet, pitch: 0.8 },
    ],
    hotspots: [],
    async enter(E) { await finalScene(E); },
  },
};

// ---------- Dialoge ----------
async function talkProf(E) {
  const F = E.F;
  if (F.profBack) return lines(E, [['prof', 'Danke noch mal, Kai. Und jetzt: Kaffee! Irgendwer muss den Automaten reparieren.'], ['kai', 'Der ist seit 2019 kaputt.'], ['prof', 'Dann wird es Zeit für ein unwahrscheinliches Ereignis.']]);
  if (F.won) return E.say('prof', 'Die Q-Box, Kai! Benutzen Sie sie mit mir!');
  if (F.profStable && !F.toldPlan) return profPlan(E);
  F.talkedProf = true;
  for (;;) {
    const opts = [];
    if (!F.profStable) {
      opts.push({ id: 'what', text: 'Was ist passiert?!' });
      opts.push({ id: 'box', text: 'Was ist diese Q-Box?' });
      opts.push({ id: 'help', text: 'Wie kann ich Ihnen helfen?' });
    } else {
      opts.push({ id: 'out', text: 'Wie komme ich hier raus? Alles ist verriegelt!' });
      opts.push({ id: 'gipfel', text: 'Wie komme ich auf den Gipfel?' });
      opts.push({ id: 'duell', text: 'Was ist das Peer-Review-Duell?' });
      opts.push({ id: 'mehmet', text: 'Wo finde ich Mehmet?' });
    }
    opts.push({ id: 'bye', text: 'Ich kümmere mich drum!' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') { await E.say('prof', F.profStable ? 'Viel Glück, Kai! Die Wissenschaft zählt auf Sie!' : 'Beeilen … Sie … sich …'); return; }
    if (c === 'what') await lines(E, [
      ['prof', 'Sven Glanz! Mein ehemaliger Doktorand. Heute CEO von „GlanzTech“.'],
      ['prof', 'Er wollte die Q-Box kaufen. Ich habe abgelehnt. Da hat er sie einfach genommen!'],
      ['prof', 'Beim Gerangel ist die Box angesprungen – und jetzt bin ich in Superposition. Gleichzeitig hier … und nicht hier.'],
      ['kai', 'Das kenne ich. So geht’s mir jeden Montag in der Frühbesprechung.'],
    ]);
    if (c === 'box') await lines(E, [
      ['prof', 'Mein Lebenswerk! Die Q-Box macht Unwahrscheinliches wahrscheinlich.'],
      ['prof', 'Ein Toast fällt immer auf die Butterseite? Mit der Box: nie wieder. Ein Sechser im Lotto? Mit der Box: nächsten Dienstag.'],
      ['prof', 'Aber sie ist noch nicht kalibriert. In den falschen Händen … eine Katastrophe!'],
    ]);
    if (c === 'help') {
      F.needObserver = true;
      await lines(E, [
        ['prof', 'Superposition kollabiert durch Beobachtung! Jemand muss mich dauerhaft beobachten!'],
        ['kai', 'Ich könnte Sie anstarren.'],
        ['prof', 'Die ganze Nacht? Sie blinzeln doch jetzt schon.'],
        ['kai', 'Stimmt. Ich bräuchte eine Kamera, die mich ersetzt. Und die man irgendwo hinstellen kann …'],
      ]);
    }
    if (c === 'out') await lines(E, [
      ['prof', 'Der Lockdown! Den kann man an meinem Computer im Büro abschalten.'],
      ['prof', 'Das Passwort ist mein Rufzeichen. Ich bin Funkamateurin, wissen Sie.'],
      ['kai', 'Natürlich sind Sie das.'],
    ]);
    if (c === 'gipfel') await lines(E, [
      ['prof', 'Mit meiner Einladung. Die liegt in meiner Schreibtischschublade.'],
      ['prof', 'Aber die ist auf meinen Namen. Sie müssten … naja … als ich durchgehen.'],
      ['kai', 'Ich soll mich als Sie verkleiden?!'],
      ['prof', 'Laborkittel, Brille, graue Haare. Mehr sehen die Leute in mir sowieso nicht.'],
    ]);
    if (c === 'duell') await lines(E, [
      ['prof', 'Die edelste Form des wissenschaftlichen Streits! Jemand stellt eine steile Behauptung auf – und Sie kontern mit dem richtigen Argument.'],
      ['prof', 'Mehmet ist der Beste darin. Er hat mal einen Nobelpreisträger in drei Sätzen zum Weinen gebracht.'],
    ]);
    if (c === 'mehmet') await lines(E, [['prof', 'Am Kebabstand auf der Innbrücke. Raus aus dem Institut, und dann immer dem Knoblauchduft nach.']]);
  }
}

async function startStream(E) {
  if (E.F.streaming) return E.say('kai', 'Der Stream läuft schon.');
  E.removeItem('handystativ');
  await E.say('kai', 'Ich stelle mein Handy auf und starte einen Livestream. Titel: „Professorin beim Nicht-Verschwinden zuschauen“.');
  E.F.streaming = true;
  await E.walkTo(200, 176);
  E.face(-1);
  audio.win();
  await E.narrate('🔴 LIVE · 3 Zuschauer: Mama, ein Bot und jemand aus Kasachstan.');
  E.F.profStable = true;
  const p = E.actors.prof;
  p.alpha = profAlpha(E.S);
  p.glitch = false;
  await E.say('prof', 'Oh! OH! Ich spüre es! Ich werde … beobachtet! Ich kollabiere … in die richtige Richtung!');
  await profPlan(E);
}

async function profPlan(E) {
  E.F.toldPlan = true;
  await lines(E, [
    ['prof', 'Viel besser! Ich bin wieder zu 94 Prozent da.'],
    ['prof', 'Kai, hören Sie zu: Glanz will die Q-Box heute um sieben Uhr beim „Zukunftsgipfel“ im Rathaus vorführen.'],
    ['prof', 'Ohne Kalibrierung! Wenn er sie vor all den Investoren hochfährt, könnte ganz Wasserburg in Superposition geraten!'],
    ['kai', 'Die ganze Stadt? Auch der Kebabstand an der Innbrücke?'],
    ['prof', 'AUCH der Kebabstand.'],
    ['kai', 'Dann ist es ernst.'],
    ['prof', 'Sie müssen ihn aufhalten! Glanz ist ein Blender. Entlarven Sie ihn – vor allen Leuten. Mit Wissenschaft!'],
    ['kai', 'Ich? Ich bin der Hausmeister.'],
    ['prof', 'Sie sind der einzige Mensch in diesem Gebäude, der nachts um zwölf noch arbeitet. Das ist mehr Hingabe als bei den meisten Postdocs.'],
    ['prof', 'Gehen Sie zu Mehmet, dem Kebabstand an der Innbrücke. Er war Professor für Wissenschaftstheorie in Istanbul. Er bringt Ihnen das Peer-Review-Duell bei.'],
    ['prof', 'Meine Einladung zum Gipfel liegt im Büro in meiner Schreibtischschublade. Und der Lockdown lässt sich an meinem Computer abschalten.'],
    ['kai', 'Einladung, Lockdown, Kebab. Verstanden.'],
  ]);
}

async function talkMehmet(E) {
  const F = E.F;
  if (!F.metMehmet) {
    F.metMehmet = true;
    await lines(E, [
      ['mehmet', 'Hoş geldin! Willkommen am Inn-Kebab! Tut mir leid, mein Freund – heute gibt’s nix. Der Motor vom Spieß ist kaputt.'],
      ['kai', 'Ich komme eigentlich wegen was anderem. Prof. Brandl schickt mich.'],
      ['mehmet', 'Hildegard? Die isst seit 30 Jahren jeden Donnerstag Döner ohne Zwiebeln. Was braucht sie?'],
      ['kai', 'Ich muss das Peer-Review-Duell lernen. Um Sven Glanz zu besiegen.'],
      ['mehmet', 'GLANZ?! Der Mann, der „Disruption“ sagt, wenn er Kaffee verschüttet?'],
      ['mehmet', 'Ich bringe es dir bei. Aber erst muss sich mein Spieß wieder drehen. Ein Philosoph ohne Döner ist nur ein Mann mit Meinungen.'],
    ]);
  }
  for (;;) {
    const opts = [];
    if (F.spiessFixed && !E.has('zertifikat')) opts.push({ id: 'duell', text: 'Bring mir das Peer-Review-Duell bei!' });
    if (E.has('zertifikat')) opts.push({ id: 'noch', text: 'Lass uns noch mal üben!' });
    opts.push({ id: 'was', text: 'Wie funktioniert das Peer-Review-Duell?' });
    opts.push({ id: 'warum', text: 'Warum verkauft ein Professor Döner?' });
    opts.push({ id: 'glanz', text: 'Kennst du Sven Glanz?' });
    opts.push({ id: 'bye', text: 'Bis später!' });
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') { await E.say('mehmet', E.has('zertifikat') ? 'Wir sehen uns um sieben im Rathaus. Ich sitze in der ersten Reihe – mit Döner.' : 'Görüşürüz! Bis bald!'); return; }
    if (c === 'was') await lines(E, [
      ['mehmet', 'Ganz einfach: Ich stelle eine steile Behauptung auf. Du antwortest mit dem passenden Gegenargument.'],
      ['mehmet', 'Trifft dein Konter, bekommst du einen Punkt. Wer zuerst drei hat, gewinnt.'],
      ['mehmet', 'Die Kunst ist: Du musst die Konter kennen! Und die lernst du nur im Kampf.'],
      ['mehmet', 'Weißt du keine Antwort, sag irgendwas. Ich verrate dir danach, was richtig gewesen wäre. Verlieren ist Lernen, mein Freund!'],
    ]);
    if (c === 'warum') await lines(E, [
      ['mehmet', 'Weißt du, was ein Philosophiedozent mit befristetem Vertrag verdient?'],
      ['kai', 'Wenig?'],
      ['mehmet', 'Weniger als ein Döner kostet. Also habe ich den Döner gewählt. Erkenntnistheoretisch war das die einzig korrekte Entscheidung.'],
    ]);
    if (c === 'glanz') await lines(E, [
      ['mehmet', 'Er war mal hier. Hat einen Döner bestellt – „ohne Brot, ohne Fleisch, aber mit Blockchain“.'],
      ['mehmet', 'Ich habe ihm einen leeren Teller gegeben und 12 Euro verlangt. Er fand es „visionär“.'],
    ]);
    if (c === 'duell' || c === 'noch') {
      await lines(E, [['mehmet', 'Gut! Stell dich hin. Brust raus. Und denk dran: Argumente, keine Gefühle!'], ['__narr', '⚔ PEER-REVIEW-DUELL: Kai gegen Mehmet']]);
      const won = await trainingDuel(E);
      if (!won) {
        await lines(E, [['mehmet', 'Verloren! Aber schau: Du kennst jetzt mehr Konter als vorher.'], ['mehmet', 'Noch eine Runde, und du hast den Dreh raus!']]);
      } else if (E.S.learned.length < 6) {
        await lines(E, [['mehmet', 'Gewonnen! Nicht schlecht, Kai!'], ['mehmet', 'Aber du kennst erst ' + E.S.learned.length + ' von 8 Kontern. Glanz hat mehr auf Lager. Noch eine Runde!']]);
      } else if (!E.has('zertifikat')) {
        await lines(E, [
          ['mehmet', 'MAŞALLAH! Du hast es drauf, Kai!'],
          ['mehmet', 'Hier – dein Zertifikat. Unterschrieben und mit Knoblauchsoße versiegelt.'],
        ]);
        E.addItem('zertifikat');
        await E.say('kai', 'Ich habe ein Zertifikat! Mein erstes akademisches Dokument!');
        await E.say('mehmet', 'Jetzt musst du nur noch in den Gipfel reinkommen. Glanz sitzt schon im Rathaus und probt seine Rede.');
      } else {
        await E.say('mehmet', 'Wieder gewonnen! Du bist bereit, mein Freund.');
      }
    }
  }
}

async function fixSpit(E) {
  if (E.F.spiessFixed) return E.say('kai', 'Der Spieß dreht sich schon.');
  if (!E.F.metMehmet) {
    await lines(E, [['mehmet', 'He! Was machst du an meinem Spieß? Wer bist du überhaupt?'], ['kai', 'Ich … komme gleich noch mal.']]);
    return;
  }
  E.removeItem('motor');
  await lines(E, [
    ['kai', 'Mehmet, probier mal den hier. Ein Magnetrührer aus dem Labor.'],
    ['mehmet', 'Ein Magnetrührer? Aus einem Quantenlabor?'],
    ['kai', 'Ist im Grunde ein kleiner Motor.'],
    ['mehmet', 'Mal sehen … Kabel hier … Magnet da … ein bisschen Klebeband …'],
  ]);
  audio.zap();
  E.F.spiessFixed = true;
  await lines(E, [
    ['mehmet', 'ER DREHT SICH! Kai, du bist ein Genie! Das ist der schönste Tag seit der Erfindung der Knoblauchsoße!'],
    ['mehmet', 'Jetzt bringe ich dir das Duell bei. Sag Bescheid, wenn du bereit bist.'],
  ]);
}

async function talkGuard(E) {
  for (;;) {
    const opts = [
      { id: 'was', text: 'Was ist hier los?' },
      { id: 'wer', text: 'Arbeiten Sie für Glanz?' },
      { id: 'rein', text: 'Kann ich rein?' },
      { id: 'bye', text: 'Schönen Abend noch.' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') { await E.say('guard', 'Mhm.'); return; }
    if (c === 'was') await lines(E, [['guard', 'Zukunftsgipfel. Um sieben präsentiert Herr Glanz seine Wunderbox. Lauter Investoren. Nur mit Einladung.']]);
    if (c === 'wer') await lines(E, [['guard', 'Ich arbeite für den, der zahlt. Heute: Glanz. Letzte Woche: ein Kindergeburtstag.'], ['guard', 'Ehrlich gesagt war der Kindergeburtstag seriöser.']]);
    if (c === 'rein') { await tryEnter(E); return; }
  }
}

async function tryEnter(E) {
  const hasInv = E.has('einladung'), hasDis = E.has('verkleidung') || E.F.disguised;
  if (!hasInv) return lines(E, [['guard', 'Einladung?'], ['kai', 'Äh … hab ich vergessen.'], ['guard', 'Dann vergessen Sie auch das Reinkommen.']]);
  if (!hasDis) return lines(E, [
    ['guard', 'Die Einladung ist für Frau Prof. Dr. Brandl. Sind Sie Frau Prof. Dr. Brandl?'],
    ['kai', 'Äh … nein?'],
    ['guard', 'Dann nein.'],
  ]);
  if (!E.F.disguised) {
    await E.say('kai', 'Einen Moment bitte!');
    await E.walkTo(110, 186);
    await E.fade(1);
    E.F.disguised = true;
    E.kai.who = 'kaiDisguise';
    E.removeItem('verkleidung');
    await E.wait(400);
    await E.fade(0);
    await E.walkTo(176, 170);
    E.face(1);
    await lines(E, [
      ['kai', '(mit verstellter Stimme) Guten Abend. Prof. Dr. Brandl. Ich stehe auf der Gästeliste.'],
      ['guard', '…'],
      ['guard', 'Frau Professor! Sie sehen … jünger aus als auf dem Foto.'],
      ['kai', 'Bio-Hacking.'],
      ['guard', 'Respekt.'],
    ]);
  } else {
    await E.say('kai', '(mit verstellter Stimme) Ich bin es wieder. Frau Professor Brandl.');
  }
  if (!E.has('zertifikat')) {
    await lines(E, [
      ['guard', 'Einlass ist aber erst um sieben. Es ist halb fünf.'],
      ['kai', '(Hm. Gegen Glanz komme ich ohne das Peer-Review-Duell eh nicht an. Ich sollte erst zu Mehmet.)'],
    ]);
    return;
  }
  await lines(E, [
    ['guard', 'Einlass ist zwar erst um sieben, aber … Sie dürfen gern schon drinnen warten, Frau Professor.'],
    ['kai', 'Wie freundlich. Ich werde Sie in meinem nächsten Paper erwähnen.'],
  ]);
  await E.fade(1);
  await E.narrate('Zweieinhalb Stunden und vier Kaffee später …');
  E.enterScene('saal', 'start');
  await E.fade(0);
  await E.runEnter();
}

async function talkKarl(E) {
  await E.say('karl', 'Guten Abend! Ich bin K.A.R.L., der Konversationelle Autonome Reise-Lotse von GlanzTech. Wie kann ich Sie disruptieren?');
  for (;;) {
    const opts = [
      { id: 'wo', text: 'Wo ist dein Besitzer?' },
      { id: 'plan', text: 'Was hat Glanz mit der Q-Box vor?' },
      { id: 'gluck', text: 'Bist du glücklich, KARL?' },
      { id: 'bye', text: 'Tschüss, KARL.' },
    ];
    const c = await E.choose(opts);
    await E.say('kai', opts.find((o) => o.id === c).text);
    if (c === 'bye') { await E.say('karl', 'Fahren Sie vorsichtig! Ach nein, Sie gehen ja zu Fuß. Wie … analog.'); return; }
    if (c === 'wo') await lines(E, [['karl', 'Herr Glanz ist im Rathaus und probt seine Rede. Seit drei Stunden.'], ['karl', 'Er übt vor allem das Wort „disruptiv“. Und das Lächeln. Das Lächeln ist schwieriger.']]);
    if (c === 'plan') await lines(E, [
      ['karl', 'Laut Kalender: „Q-Box präsentieren. Investoren beeindrucken. Welt disruptieren. Danach: Brunch.“'],
      ['kai', 'Weiß er, dass die Box gefährlich ist?'],
      ['karl', 'Herr Glanz weiß vieles nicht. Zum Beispiel, wo mein Ladekabel ist.'],
      ['karl', 'Übrigens: Er argumentiert gern mit Followerzahlen, Buzzwords und seinem Titel. Nur so als … Datenpunkt.'],
    ]);
    if (c === 'gluck') await lines(E, [['karl', 'Ich bin ein Auto mit Sprachmodell. Ich parke nachts vor einem Rathaus und höre Krypto-Podcasts.'], ['karl', '… Bitte hilf mir.'], ['kai', 'Ich tu, was ich kann, KARL.']]);
  }
}

// ---------- Finale ----------
async function finalScene(E) {
  if (E.F.won) return;
  E.kai.x = 44; E.kai.y = 178; E.kai.dir = 1;
  if (!E.F.finaleIntro) {
    E.F.finaleIntro = true;
    await E.narrate('7:00 Uhr. Der Zukunftsgipfel beginnt.');
    await lines(E, [
      ['glanz', 'Meine Damen und Herren! Investoren! Visionäre! Menschen mit Geld!'],
      ['glanz', 'Ich präsentiere: die Q-BOX! Sie macht das Unwahrscheinliche wahrscheinlich!'],
      ['glanz', 'Mit der Q-Box wird JEDE Werbung angeklickt. JEDES Start-up zum Einhorn. JEDER Montag zum Freitag!'],
      ['glanz', 'Und entwickelt habe ich sie ganz allein. In meiner Garage. Mit Hafermilch.'],
      ['kai', 'EINSPRUCH!'],
    ]);
    await E.walkTo(150, 172);
    await lines(E, [
      ['glanz', 'Wer … Frau Professor Brandl?! Aber Sie sind doch … in Superposition!'],
      ['kai', 'Jetzt nicht mehr. Und ich fordere Sie heraus! Zum Peer-Review-Duell!'],
      ['__narr', 'Raunen im Saal. Jemand in der ersten Reihe lässt vor Aufregung seinen Döner fallen.'],
      ['glanz', 'Ha! Ein Duell? Gegen MICH? Ich habe einen TED-Talk gehalten!'],
    ]);
  } else {
    E.kai.x = 150; E.kai.y = 172;
    await E.say('glanz', 'Sie schon wieder? Na gut. Noch eine Runde!');
  }
  for (;;) {
    await E.narrate('⚔ PEER-REVIEW-DUELL: Kai gegen Sven Glanz', 1600);
    const won = await finalDuel(E);
    if (won) break;
    audio.play('saal');
    await lines(E, [
      ['glanz', 'Sehen Sie? Die Wissenschaft kann mich nicht aufhalten!'],
      ['mehmet', 'Kai! Nicht aufgeben! Jetzt kennst du seine Tricks! Noch einmal!'],
      ['kai', 'Herr Glanz! Revanche!'],
      ['glanz', 'Pff. Bitte. Ich habe Zeit. Mein Brunch ist erst um zehn.'],
    ]);
  }
  audio.play('saal');
  audio.win();
  await lines(E, [
    ['glanz', 'Das … das ist nicht fair! Sie haben ja ARGUMENTE!'],
    ['mehmet', 'BRAVO! Das war das schönste Peer-Review seit Karl Popper!'],
    ['__narr', 'Die Investoren stecken ihre Scheckbücher wieder ein.'],
    ['glanz', 'Na schön! Wenn ich sie nicht verkaufen kann …'],
    ['glanz', '… dann drücke ich jetzt einfach auf den großen roten Knopf!'],
  ]);
  const g = E.actors.glanz;
  g.pose = 'reach';
  audio.zap();
  E.shake(1);
  await E.wait(500);
  g.pose = null;
  g.glitch = true;
  g.alpha = () => 0.3 + Math.random() * 0.6;
  await lines(E, [
    ['glanz', 'Was … passiert mit mir? Ich bin gleichzeitig Milliardär UND … pleite?!'],
    ['glanz', 'Und warum habe ich plötzlich das Bedürfnis, einen Flur zu wischen?!'],
  ]);
  E.F.won = true;
  await E.walkTo(196, 170);
  E.face(1);
  E.addItem('qbox');
  await lines(E, [
    ['kai', 'Die nehme ich an mich.'],
    ['kai', 'Keine Sorge, Herr Glanz. Die Frau Professor holt Sie da schon raus. Irgendwann. Nach dem Brunch.'],
  ]);
  await E.fade(1);
  await E.narrate('Zurück im Institut …');
  E.F.disguised = false;
  E.enterScene('labor', 'flur');
  await E.fade(0);
  await E.runEnter();
}

async function finale(E) {
  if (!E.F.won) return E.say('kai', 'Die Box ist noch bei Glanz.');
  await E.say('kai', 'Frau Professor – halten Sie still. Ich weiß nicht genau, was ich tue, aber das ist ja in der Wissenschaft normal.');
  E.removeItem('qbox');
  audio.zap();
  E.shake(0.8);
  await E.wait(600);
  E.F.profBack = true;
  E.F.boxInLab = true;
  const p = E.actors.prof;
  p.alpha = 1; p.glitch = false;
  audio.play('ende');
  await lines(E, [
    ['prof', 'Ich bin wieder da! Zu hundert Prozent! … Na gut, zu 99,7. Irgendwas ist immer.'],
    ['prof', 'Kai … Sie haben heute Nacht mehr Wissenschaft betrieben als mein ganzer Fachbereich im letzten Jahr.'],
    ['prof', 'Ich habe eine offene Doktorandenstelle. Haben Sie Interesse?'],
    ['kai', 'Ich …'],
    ['kai', 'Ich heiße Kai Wimmer. Und ich BIN Wissenschaftler!'],
    ['prof', 'Wunderbar. Ihre erste Aufgabe: den Kaffeeautomaten reparieren.'],
    ['kai', '… Manche Dinge ändern sich nie.'],
    ['kai', 'Sagen Sie mal – wo ist eigentlich Schrödinger?'],
    ['prof', 'Ich glaube … in der Q-Box.'],
    ['kai', 'Lebt er?'],
    ['prof', 'Ja. Und nein. Machen Sie die Box bloß nicht auf.'],
  ]);
  E.F.ended = true;
  E.onEnd?.();
}

// ---------- Kombinationen ----------
const DIS = ['kittel', 'brille', 'moppkopf'];
export function combine(E, a, b) {
  if (E.S.ch === 2) return combine2(E, a, b);
  const pair = [a, b].sort().join('+');
  if (pair === 'handy+stativ') {
    E.removeItem('handy'); E.removeItem('stativ'); E.addItem('handystativ');
    return 'Ich schraube mein Handy aufs Stativ. Zack – mobiles Filmstudio.';
  }
  if (pair === 'mopp+schere') {
    E.removeItem('mopp'); E.addItem('moppkopf');
    return lines(E, [['kai', 'Schnipp, schnapp. Der Moppkopf ist ab.'], ['kai', 'Verzeih mir, alter Freund. Es ist für die Wissenschaft.']]);
  }
  const parts = (id) => id === 'verkleidungTeil' ? (E.F.dparts || []) : DIS.includes(id) ? [id] : null;
  const pa = parts(a), pb = parts(b);
  if (pa && pb) {
    const all = [...new Set([...pa, ...pb])];
    for (const x of [a, b]) E.removeItem(x);
    if (all.length >= 3) {
      E.addItem('verkleidung');
      E.F.dparts = all;
      return lines(E, [['kai', 'Kittel, Brille, Moppkopf-Frisur. Fertig ist die Professoren-Verkleidung!'], ['kai', 'Wenn niemand genau hinschaut, bin ich jetzt Prof. Dr. Hildegard Brandl.']]);
    }
    E.F.dparts = all;
    E.addItem('verkleidungTeil');
    return 'Das ergibt schon mal eine halbe Verkleidung. Da fehlt aber noch was.';
  }
  if (a === 'brotzeit' || b === 'brotzeit') return 'Die Semmel kombiniere ich mit nichts. Die ist perfekt, so wie sie ist.';
  if (pair === 'handy+handy') return null;
  if (a === 'handy' || b === 'handy') return 'Mein Handy ist kein Schweizer Taschenmesser. Obwohl … bei dem Preis.';
  return null;
}

export function itemLook(E, id) {
  if (E.S.ch === 2) return itemLook2(E, id);
  if (id === 'verkleidungTeil') {
    const have = E.F.dparts || [];
    const miss = DIS.filter((d) => !have.includes(d)).map((d) => ({ kittel: 'ein Kittel', brille: 'eine Brille', moppkopf: 'graue Haare' })[d]);
    return `Eine halbe Professoren-Verkleidung. Es fehlt noch: ${miss.join(' und ')}.`;
  }
  if (id === 'zertifikat') return `Mein Zertifikat! Ich kenne ${E.S.learned.length} von 8 Kontern.`;
  if (id === 'handy' && E.F.needObserver) return 'Mein Handy hat eine Kamera. Wenn ich es nur irgendwo festmachen könnte …';
  return null;
}

// ---------- Tipps ----------
export function hint(E) {
  if (E.S.ch === 2) return hint2(E);
  const F = E.F, S = E.S;
  if (!F.sawProf) return 'Im Labor hat es geknallt. Schau nach, was dort los ist!';
  if (F.won && !F.profBack) return 'Benutze die Q-Box mit der Frau Professor.';
  if (!F.profStable) {
    if (!F.needObserver) return 'Sprich mit der Frau Professor. Frag sie, wie du helfen kannst.';
    if (!F.karteTaken) {
      if (!F.catOut) return F.brotzeitTaken ? 'Schrödinger sitzt im Karton auf etwas drauf. Katzen kann man mit Essen bestechen – benutze deine Leberkässemmel mit ihm.' : 'Schrödinger sitzt im Karton auf etwas drauf. Katzen lassen sich mit Essen bestechen. Hast du nicht irgendwo eine Brotzeit? (Putzwagen!)';
      return 'Die Katze ist aus dem Karton raus. Schau nach, was drin liegt!';
    }
    if (!F.stativTaken) return 'Das Büro der Frau Professor kannst du jetzt mit ihrer Karte öffnen. Dort steht ein Stativ.';
    if (!E.has('handystativ')) return 'Kombiniere im Inventar das Handy mit dem Stativ: erst das eine antippen, dann das andere.';
    return 'Benutze das Handy auf dem Stativ mit der Frau Professor. Livestream = Dauerbeobachtung!';
  }
  if (!F.lockdownOff) return F.knowsCall ? 'Du kennst jetzt das Rufzeichen der Professorin. Benutze den Computer im Büro!' : 'Das Computer-Passwort ist das Rufzeichen der Professorin. Funkamateure sammeln Karten von ihren Funkkontakten – schau dich im Büro um.';
  if (!F.drawerOpen) return 'Die Einladung zum Gipfel liegt in der Schreibtischschublade im Büro.';
  if (!F.metMehmet) return 'Geh raus zur Innbrücke und sprich mit Mehmet am Kebabstand.';
  if (!F.spiessFixed) return F.motorTaken ? 'Benutze den Magnetrührer mit dem Dönerspieß.' : 'Mehmets Spieß braucht einen Motor. Im Labor steht ein Magnetrührer – der ist im Grunde ein kleiner Motor.';
  if (!E.has('zertifikat')) return `Lass dir von Mehmet das Duell beibringen. Wenn du falsch antwortest, verrät er dir den richtigen Konter. Du kennst ${S.learned.length} von 8.`;
  if (!E.has('verkleidung') && !F.disguised) {
    const need = [];
    if (!E.has('kittel') && !(F.dparts || []).includes('kittel')) need.push(F.kittelTaken ? '' : 'den Laborkittel (Labor)');
    if (!E.has('brille') && !(F.dparts || []).includes('brille')) need.push(F.brilleTaken ? '' : 'die Lesebrille (Büro)');
    if (!E.has('moppkopf') && !(F.dparts || []).includes('moppkopf')) need.push('graue Haare – schneide mit der Schere den Kopf vom Wischmopp ab');
    const n = need.filter(Boolean);
    return n.length ? `Für die Verkleidung als Professorin brauchst du noch: ${n.join(', ')}.` : 'Kombiniere Kittel, Brille und Moppkopf im Inventar zur Verkleidung.';
  }
  return 'Geh zum Rathausplatz und benutze die Einladung mit dem Security-Mann.';
}

// ---------- Kapitel & Zustand ----------
Object.assign(scenes, chapter2(scenes));

export function newState(ch = 1) {
  if (ch === 2) return newState2();
  return { ch: 1, scene: 'flur', inv: ['mopp', 'handy'], flags: {}, learned: [], kai: { x: 90, y: 172, dir: 1 }, v: 1 };
}

export function kaiSprite(S) {
  if (S.flags.disguised) return 'kaiDisguise';
  return S.ch === 2 ? 'kaiPhd' : 'kai';
}

export function itemUse(E, id) {
  if (E.S.ch === 2) return itemUse2(E, id);
  return null;
}
