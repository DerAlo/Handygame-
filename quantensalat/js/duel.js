// Das Peer-Review-Duell – frei nach dem Beleidigungsfechten, aber mit Argumenten.
import { audio } from './audio.js';

// Kapitel 1: Mehmet trainiert, Glanz im Finale
export const RETORTS = {
  korrelation: {
    retort: 'Und seit ich Socken trage, geht jeden Morgen die Sonne auf. Korrelation ist keine Kausalität.',
    train: 'Seit ich Hafermilch trinke, steigen meine Aktien. Hafermilch macht reich!',
    final: 'Seit wir unser Logo blau gemacht haben, steigt der Umsatz. Blau wirkt!',
  },
  n1: {
    retort: 'n gleich eins? Das ist keine Studie, das ist ein Tagebucheintrag.',
    train: 'Meine Diät funktioniert! Ich habe sie an einer Person getestet: an mir!',
    final: 'Ich habe die Q-Box an mir selbst getestet. Ich fühle mich großartig. Beweis erbracht!',
  },
  blackbox: {
    retort: 'Was niemand überprüfen darf, ist keine Wissenschaft, sondern ein Zaubertrick.',
    train: 'Wie mein Algorithmus funktioniert, ist geheim. Aber er ist sehr, sehr teuer!',
    final: 'Wie die Box genau funktioniert, ist Betriebsgeheimnis. Vertrauen Sie mir einfach!',
  },
  phacking: {
    retort: 'So lange rechnen, bis es passt? Das nennt man p-Hacking.',
    train: 'Nach nur 47 Versuchen war mein Ergebnis endlich signifikant!',
    final: 'Unsere Daten sind signifikant – nachdem wir die unpassenden Werte rausgenommen haben!',
  },
  falsifizierbar: {
    retort: 'Eine Theorie, die nichts ausschließt, erklärt auch nichts. Sie ist nicht falsifizierbar.',
    train: 'Meine Theorie ist unwiderlegbar! Egal was passiert, sie stimmt immer!',
    final: 'Egal, wie das Experiment ausgeht: Es bestätigt meine Vision!',
  },
  beliebt: {
    retort: 'Die Erde war auch nicht flach, nur weil es alle glaubten. Beliebtheit ist kein Beweis.',
    train: 'Mein Video hat eine Million Likes. Also habe ich recht!',
    final: 'Zwei Millionen Follower können nicht irren!',
  },
  buzzword: {
    retort: 'Bingo! Und jetzt bitte einen Satz mit Inhalt.',
    train: 'Quanten-KI-Blockchain-Synergie für nachhaltige Disruption!',
    final: 'Die Q-Box ist KI-gestützte, quantenbasierte, disruptive Next-Level-Synergie!',
  },
  autoritaet: {
    retort: 'Titel sind keine Argumente. In der Wissenschaft zählen Belege, nicht Visitenkarten.',
    train: 'Ich bin Professor. Also stimmt, was ich sage!',
    final: 'Ich bin CEO. Ich war auf dem Cover eines Wirtschaftsmagazins. Das genügt!',
  },
};

// Kapitel 2: Glanzi trainiert, der böse Glanz im Finale
export const RETORTS2 = {
  strohmann: {
    retort: 'Das habe ich nie gesagt. Sie widerlegen einen Strohmann, nicht mein Argument.',
    train: 'Du willst also, dass wir alle zurück in die Steinzeit gehen und mit Stöcken rechnen?!',
    final: 'Sie wollen also, dass Wasserburg für immer im Mittelalter bleibt? Mit Pest und so?!',
  },
  whatabout: {
    retort: 'Andere Fehler machen Ihre nicht richtig. Das ist Whataboutism.',
    train: 'Und was ist mit den Fehlern von DEINEM Institut? Hm? HM?',
    final: 'Und was ist mit Ihrem Kaffeeautomaten? Der war fünf Jahre kaputt! Hm?!',
  },
  anekdote: {
    retort: 'Eine Anekdote ist kein Datensatz. Wie viele haben NICHTS gewonnen?',
    train: 'Mein Onkel hat die Box benutzt und im Lotto gewonnen!',
    final: 'Mein Cousin hat die Pro Max berührt und am nächsten Tag einen Parkplatz in der Altstadt gefunden!',
  },
  natur: {
    retort: 'Natürlich heißt nicht harmlos. Knollenblätterpilze sind auch natürlich.',
    train: 'Meine Energydrinks sind aus 100 % natürlichen Zutaten – also gesund!',
    final: 'Die Pro Max nutzt nur natürliche Quanten! Also ist sie völlig ungefährlich!',
  },
  survivor: {
    retort: 'Sie zählen nur die Gewinner. Von den Tausenden, die gescheitert sind, redet keiner.',
    train: 'Alle erfolgreichen Gründer haben ihr Studium abgebrochen. Abbrechen ist das Erfolgsrezept!',
    final: 'Alle Milliardäre sind früh aufgestanden! Wer früh aufsteht, wird Milliardär!',
  },
  spieler: {
    retort: 'Zufall hat kein Gedächtnis. Das ist der Spielerfehlschluss.',
    train: 'Ich hab zehnmal verloren – jetzt MUSS ich einfach gewinnen!',
    final: 'Die Box ist zehnmal abgestürzt – beim elften Mal MUSS es klappen, rein statistisch!',
  },
  dilemma: {
    retort: 'Es gibt mehr als zwei Möglichkeiten. Das ist ein falsches Dilemma.',
    train: 'Entweder du bist für meine Idee – oder du hasst den Fortschritt!',
    final: 'Entweder Sie investieren in die Pro Max – oder Sie wollen, dass Wasserburg untergeht!',
  },
  torpfosten: {
    retort: 'Erst das Ziel festlegen, dann messen. Nicht die Torpfosten verschieben.',
    train: 'Okay, der Test ist gescheitert – aber das war ja auch nie das eigentliche Ziel!',
    final: 'Gut, der Inn fließt rückwärts. Aber das war von Anfang an der Plan! Äh … ein Feature!',
  },
};

const DUDS = ['Äh … selber!', 'Das sagt meine Oma auch immer.', 'Ich … hab mein Argument im Bus vergessen.', 'Na und? Ich kann Linoleum polieren!', 'Ihre Mutter ist ein … äh … Quant!'];

const CH = {
  1: {
    set: RETORTS, trainer: 'mehmet', trainerName: 'Mehmet', trainMusic: 'bruecke', foe: 'glanz', whisper: 'mehmet', whisperText: '(flüstert) Kai! Sag:',
    good: ['Autsch! Gut gekontert.', 'Touché! Das saß.', 'Hmpf. Korrekt.', 'Ha! Karl Popper wäre stolz.'],
    bad: ['Nein, nein, nein.', 'Schwach!', 'Das war kein Argument, das war ein Geräusch.', 'Falsch, mein Freund.'],
    foeHit: ['Was?! Das … das hat gesessen.', 'Grmpf! Das war … ein Argument!', 'Ich … äh … das nehme ich in den nächsten Podcast mit.', 'Aua. Meine Aktie!'],
    foeWin: ['Ha! Das Publikum liebt mich!', 'Sehen Sie? Keine Gegenargumente!', 'Wie disruptiv von Ihnen.'],
  },
  2: {
    set: RETORTS2, trainer: 'glanzi', trainerName: 'Glanzi', trainMusic: 'bruecke', foe: 'glanz', whisper: 'glanzi', whisperText: '(flüstert) Kai, ich kenne mich! Sag:',
    good: ['Oh, gut! Genau so würde ich mich widerlegen!', 'Autsch. Das hätte mir damals gutgetan.', 'Treffer! Ich bin stolz auf dich. Und ein bisschen beleidigt.', 'Perfekt!'],
    bad: ['Hm, nein. Da hätte ich mich rausgeredet.', 'Nicht ganz. Ich bin leider sehr glitschig.', 'Das hätte mir nur ein müdes Lächeln entlockt.', 'Knapp daneben!'],
    foeHit: ['Argh! Woher kennen Sie diesen Konter?!', 'Das … war nicht im Podcast!', 'Unmöglich! Ich habe drei Wochen trainiert!', 'Nein! Mein Narrativ!'],
    foeWin: ['Ha! Drei Wochen Podcasts zahlen sich aus!', 'Sprachlos, Wimmer?', 'Disruption schlägt Argument!'],
  },
};

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
const setScore = (E, me, them, foe) => E.setScore(`Kai ${me} : ${them} ${foe}`);
export const learnedIn = (E, ch = 1) => E.S.learned.filter((k) => CH[ch].set[k]).length;

// Übungsduell. Liefert true bei Sieg.
export async function trainingDuel(E, ch = 1) {
  const C = CH[ch], set = C.set;
  let me = 0, them = 0;
  audio.play('duell');
  setScore(E, me, them, C.trainerName);
  const keys = Object.keys(set);
  let last = null;
  while (me < 3 && them < 3) {
    const unknown = keys.filter((k) => !E.S.learned.includes(k) && k !== last);
    const known = keys.filter((k) => E.S.learned.includes(k) && k !== last);
    const pool = unknown.length && (Math.random() < 0.6 || !known.length) ? unknown : known.length ? known : keys;
    const k = pool[Math.floor(Math.random() * pool.length)];
    last = k;
    E.duelKey = k;
    await E.say(C.trainer, set[k].train);
    const pick = await chooseRetort(E, set);
    await E.say('kai', pick.text);
    if (pick.key === k) {
      me++; audio.point(true);
      await E.say(C.trainer, E.pick(C.good));
    } else {
      them++; audio.point(false);
      await E.say(C.trainer, E.pick(C.bad));
      await E.say(C.trainer, `Richtig wäre gewesen: „${set[k].retort}“`);
      E.learn(k);
    }
    setScore(E, me, them, C.trainerName);
  }
  E.setScore('');
  E.duelKey = null;
  audio.play(C.trainMusic);
  return me >= 3;
}

// Finale. Bei Fehlern flüstert jemand die richtige Antwort.
export async function finalDuel(E, ch = 1) {
  const C = CH[ch], set = C.set;
  let me = 0, them = 0;
  audio.play('duell');
  setScore(E, me, them, 'Glanz');
  const order = shuffle(Object.keys(set));
  let i = 0;
  while (me < 3 && them < 3) {
    const k = order[i++ % order.length];
    E.duelKey = k;
    await E.say(C.foe, set[k].final);
    const pick = await chooseRetort(E, set);
    await E.say('kai', pick.text);
    if (pick.key === k) {
      me++; audio.point(true);
      await E.say(C.foe, E.pick(C.foeHit));
    } else {
      them++; audio.point(false);
      await E.say(C.foe, E.pick(C.foeWin));
      await E.say(C.whisper, `${C.whisperText} „${set[k].retort}“`);
      E.learn(k);
    }
    setScore(E, me, them, 'Glanz');
  }
  E.setScore('');
  E.duelKey = null;
  return me >= 3;
}

async function chooseRetort(E, set) {
  const known = E.S.learned.filter((k) => set[k]);
  const opts = known.map((k) => ({ id: k, text: set[k].retort }));
  const duds = shuffle(DUDS.slice()).slice(0, opts.length >= 6 ? 1 : 2).map((t, i) => ({ id: 'dud' + i, text: t }));
  const all = shuffle(opts.concat(duds));
  const id = await E.choose(all);
  const o = all.find((x) => x.id === id);
  return { key: set[id] ? id : null, text: o.text };
}
