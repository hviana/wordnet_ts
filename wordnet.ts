/*
Created by: Henrique Emanoel Viana
Githu: https://github.com/hviana
Page: https://sites.google.com/view/henriqueviana
cel: +55 (41) 99999-4664
*/

/*
This project uses a version of Open English Wordnet in Sqlite form made
available by: https://github.com/x-englishwordnet/sqlite
queries:
`SELECT s.synset2id, s.synset1id, link FROM semlinks AS s LEFT JOIN linktypes USING (linkid)`
`SELECT l.synset2id, l.synset1id, link FROM lexlinks AS l LEFT JOIN linktypes USING (linkid)`
`SELECT y.synsetid, y.pos, GROUP_CONCAT(DISTINCT sw2.lemma) as lemmas, definition FROM words AS sw LEFT JOIN senses AS s USING(wordid) LEFT JOIN synsets AS y USING (synsetid) LEFT JOIN senses AS s2 ON (y.synsetid = s2.synsetid) LEFT JOIN words AS sw2 ON (sw2.wordid = s2.wordid) GROUP BY y.synsetid`
*/

import { eq, ImmutableMap, LVar, membero, walk } from "./deps.ts";

export type LinkTypes =
  | "verb group"
  | "substance meronym"
  | "substance holonym"
  | "similar"
  | "pertainym"
  | "participle"
  | "part meronym"
  | "part holonym"
  | "member meronym"
  | "member holonym"
  | "member"
  | "is entailed by"
  | "is caused by"
  | "instance hyponym"
  | "instance hypernym"
  | "hyponym"
  | "hypernym"
  | "entail"
  | "domain usage"
  | "domain region"
  | "domain member usage"
  | "domain member region"
  | "domain member category"
  | "domain category"
  | "domain"
  | "derivation"
  | "cause"
  | "attribute"
  | "antonym"
  | "also";

export type Link = {
  synset: number;
  link: string;
};

//Nouns | verbs | adjectives | adverbs (s)
export type WordClass = "n" | "v" | "a" | "s";

export class Wordnet {
  //@ts-ignore
  #database: any;
  #adjetivesPositions: any[] = [];
  static downloadURL =
    "https://raw.githubusercontent.com/hviana/wordnet_ts/main/wordnet.data";
  async init(path: string = "./wordnet.data") {
    try {
      await Deno.stat(path);
    } catch (e) {
      const file = await Deno.open(path, {
        create: true,
        write: true,
      });
      console.log("Downloading the Wordnet database, please wait.");
      const res = await fetch(Wordnet.downloadURL);
      //@ts-ignore
      for await (const chunk of res.body) {
        await Deno.writeAll(file, chunk);
      }
    }
    this.#database = JSON.parse(await Deno.readTextFile(path));
  }
  logic(): any {
    const definitionsMap: any = {};
    const synsetToLemmas: any = {};
    const lemmasToSynset: any = {};
    const posMap: any = {};
    for (const s of this.#database.synsets) {
      definitionsMap[s.synsetId] = s.definition;
      synsetToLemmas[s.synsetId] = s.lemmas;
      posMap[s.synsetId] = s.pos;
      for (const l of s.lemmas) {
        const safeLemma = `lemma_${l}`;
        if (!lemmasToSynset[safeLemma]) {
          lemmasToSynset[safeLemma] = new Set();
        }
        lemmasToSynset[safeLemma].add(s.synsetId);
      }
    }
    for (const k in lemmasToSynset) {
      lemmasToSynset[k] = Array.from(lemmasToSynset[k]);
    }
    const linksMap: any = {};
    for (const link of this.#database.links) {
      if (!linksMap[link.link]) {
        linksMap[link.link] = {};
      }
      if (!linksMap[link.link][link.synsetId]) {
        linksMap[link.link][link.synsetId] = new Set();
      }
      linksMap[link.link][link.synsetId].add(link.synsetid_dest);
    }
    for (const type in linksMap) {
      for (const synsetId in linksMap[type]) {
        linksMap[type][synsetId] = Array.from(linksMap[type][synsetId]);
      }
    }
    const pos = (
      x: number | Link | LVar,
      y: LVar,
    ): (sMap: ImmutableMap) => Generator<ImmutableMap | null> => {
      return function* (sMap: ImmutableMap): Generator<ImmutableMap | null> {
        x = walk(x, sMap);
        if ((x as Link).link) {
          x = (x as Link).synset;
        }
        yield* eq(y, posMap[x as number])(sMap);
      };
    };
    const definition = (
      x: number | Link | LVar,
      y: LVar,
    ): (sMap: ImmutableMap) => Generator<ImmutableMap | null> => {
      return function* (sMap: ImmutableMap): Generator<ImmutableMap | null> {
        x = walk(x, sMap);
        if ((x as Link).link) {
          x = (x as Link).synset;
        }
        yield* eq(y, definitionsMap[x as number])(sMap);
      };
    };
    const links = (
      x: number | Link | LVar,
      y: number | Link | LVar,
      z: LVar,
      linkType?: LinkTypes,
    ): (sMap: ImmutableMap) => Generator<ImmutableMap | null> => {
      return function* (sMap: ImmutableMap): Generator<ImmutableMap | null> {
        x = walk(x, sMap);
        y = walk(y, sMap);
        var param = 0;
        if ((x as Link).link) {
          x = (x as Link).synset;
        }
        if ((y as Link).link) {
          y = (y as Link).synset;
        }
        if (typeof x === "number") {
          param = x;
        } else if (typeof y === "number") {
          param = y;
        }
        const links = [];
        if (!linkType) {
          for (const type in linksMap) {
            if (linksMap[type][param]) {
              links.push(...linksMap[type][param].map(
                function (l: number) {
                  return { link: type, synset: l };
                },
              ));
            }
          }
        } else {
          if (linksMap[linkType][param]) {
            links.push(...linksMap[linkType][param].map(
              function (l: number) {
                return { link: linkType, synset: l };
              },
            ));
          }
        }
        yield* membero(z, links)(sMap);
      };
    };
    const lemmas = (
      x: number | Link | LVar,
      y: string | LVar,
    ): (sMap: ImmutableMap) => Generator<ImmutableMap | null> => {
      return function* (sMap: ImmutableMap): Generator<ImmutableMap | null> {
        x = walk(x, sMap);
        y = walk(y, sMap);
        if ((x as Link).link) {
          x = (x as Link).synset;
        }
        if (typeof x === "number") {
          yield* membero(y, synsetToLemmas[x] || [])(sMap);
        } else if (typeof y === "string") {
          yield* membero(x, lemmasToSynset[`lemma_${y}`] || [])(sMap);
        }
      };
    };
    return {
      pos: pos,
      definition: definition,
      lemmas: lemmas,
      links: links,
    };
  }
}
