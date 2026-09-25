// Das Peer-Review-Duell – frei nach dem Beleidigungsfechten, aber mit Argumenten.
import { audio } from './audio.js';

export const RETORTS = {
  korrelation: {
    retort: 'Und seit ich Socken trage, geht jeden Morgen die Sonne auf. Korrelation ist keine Kausalität.',
    mehmet: 'Seit ich Hafermilch trinke, steigen meine Aktien. Hafermilch macht reich!',
    glanz: 'Seit wir unser Logo blau gemacht haben, steigt der Umsatz. Blau wirkt!',
  },
  n1: {
    retort: 'n gleich eins? Das ist keine Studie, das ist ein Tagebucheintrag.',
    mehmet: 'Meine Diät funktioniert! Ich habe sie an einer Person getestet: an mir!',
    glanz: 'Ich habe die Q-Box an mir selbst getestet. Ich fühle mich großartig. Beweis erbracht!',
  },
  blackbox: {
    retort: 'Was niemand überprüfen darf, ist keine Wissenschaft, sondern ein Zaubertrick.',
    mehmet: 'Wie mein Algorithmus funktioniert, ist geheim. Aber er ist sehr, sehr teuer!',
    glanz: 'Wie die Box genau funktioniert, ist Betriebsgeheimnis. Vertrauen Sie mir einfach!',
  },
  phacking: {
    retort: 'So lange rechnen, bis es passt? Das nennt man p-Hacking.',
    mehmet: 'Nach nur 47 Versuchen war mein Ergebnis endlich signifikant!',
    glanz: 'Unsere Daten sind signifikant – nachdem wir die unpassenden Werte rausgenommen haben!',
  },
  falsifizierbar: {
    retort: 'Eine Theorie, die nichts ausschließt, erklärt auch nichts. Sie ist nicht falsifizierbar.',
    mehmet: 'Meine Theorie ist unwiderlegbar! Egal was passiert, sie stimmt immer!',
    glanz: 'Egal, wie das Experiment ausgeht: Es bestätigt meine Vision!',
  },
  beliebt: {
    retort: 'Die Erde war auch nicht flach, nur weil es alle glaubten. Beliebtheit ist kein Beweis.',
    mehmet: 'Mein Video hat eine Million Likes. Also habe ich recht!',
    glanz: 'Zwei Millionen Follower können nicht irren!',
  },
  buzzword: {
    retort: 'Bingo! Und jetzt bitte einen Satz mit Inhalt.',
    mehmet: 'Quanten-KI-Blockchain-Synergie für nachhaltige Disruption!',
    glanz: 'Die Q-Box ist KI-gestützte, quantenbasierte, disruptive Next-Level-Synergie!',
  },
  autoritaet: {
    retort: 'Titel sind keine Argumente. In der Wissenschaft zählen Belege, nicht Visitenkarten.',
    mehmet: 'Ich bin Professor. Also stimmt, was ich sage!',
    glanz: 'Ich bin CEO. Ich war auf dem Cover eines Wirtschaftsmagazins. Das genügt!',
  },
};

const DUDS = ['Äh … selber!', 'Das sagt meine Oma auch immer.', 'Ich … hab mein Argument im Bus vergessen.', 'Na und? Ich kann Linoleum polieren!'];

function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function score(E, me, them, foe) {
  E.setScore(`Kai ${me} : ${them} ${foe}`);
}

// Übungsduell mit Mehmet. Liefert true bei Sieg.
export async function trainingDuel(E) {
  const S = E.S;
  let me = 0, them = 0;
  audio.play('duell');
  score(E, me, them, 'Mehmet');
  const keys = Object.keys(RETORTS);
  let last = null;
  while (me < 3 && them < 3) {
    const unknown = keys.filter((k) => !S.learned.includes(k) && k !== last);
    const known = keys.filter((k) => S.learned.includes(k) && k !== last);
    const pool = unknown.length && (Math.random() < 0.6 || !known.length) ? unknown : known.length ? known : keys;
    const k = pool[Math.floor(Math.random() * pool.length)];
    last = k;
    E.duelKey = k;
    await E.say('mehmet', RETORTS[k].mehmet);
    const pick = await chooseRetort(E);
    await E.say('kai', pick.text);
    if (pick.key === k) {
      me++; audio.point(true);
      await E.say('mehmet', E.pick(['Autsch! Gut gekontert.', 'Touché! Das saß.', 'Hmpf. Korrekt.', 'Ha! Karl Popper wäre stolz.']));
    } else {
      them++; audio.point(false);
      await E.say('mehmet', E.pick(['Nein, nein, nein.', 'Schwach!', 'Das war kein Argument, das war ein Geräusch.', 'Falsch, mein Freund.']));
      await E.say('mehmet', `Richtig wäre gewesen: „${RETORTS[k].retort}“`);
      E.learn(k);
    }
    score(E, me, them, 'Mehmet');
  }
  E.setScore('');
  audio.play('bruecke');
  return me >= 3;
}

// Finale gegen Glanz. Mehmet flüstert aus dem Publikum, wenn Kai danebenliegt.
export async function finalDuel(E) {
  let me = 0, them = 0;
  audio.play('duell');
  score(E, me, them, 'Glanz');
  const order = shuffle(Object.keys(RETORTS));
  let i = 0;
  while (me < 3 && them < 3) {
    const k = order[i++ % order.length];
    E.duelKey = k;
    await E.say('glanz', RETORTS[k].glanz);
    const pick = await chooseRetort(E);
    await E.say('kai', pick.text);
    if (pick.key === k) {
      me++; audio.point(true);
      await E.say('glanz', E.pick(['Was?! Das … das hat gesessen.', 'Grmpf! Das war … ein Argument!', 'Ich … äh … das nehme ich in den nächsten Podcast mit.', 'Aua. Meine Aktie!']));
    } else {
      them++; audio.point(false);
      await E.say('glanz', E.pick(['Ha! Das Publikum liebt mich!', 'Sehen Sie? Keine Gegenargumente!', 'Wie disruptiv von Ihnen.']));
      await E.say('mehmet', `(flüstert) Kai! Sag: „${RETORTS[k].retort}“`);
      E.learn(k);
    }
    score(E, me, them, 'Glanz');
  }
  E.setScore('');
  return me >= 3;
}

async function chooseRetort(E) {
  const opts = E.S.learned.map((k) => ({ id: k, text: RETORTS[k].retort }));
  const duds = shuffle(DUDS.slice()).slice(0, opts.length >= 6 ? 1 : 2).map((t, i) => ({ id: 'dud' + i, text: t }));
  const all = shuffle(opts.concat(duds));
  const id = await E.choose(all);
  const o = all.find((x) => x.id === id);
  return { key: RETORTS[id] ? id : null, text: o.text };
}
