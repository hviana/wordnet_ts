# wordnet_ts

The Open English Wordnet with methods for using their relations, implemented in
TypeScript.

## How to use

### import lib and initialize (Deno)

```typescript
//import { Wordnet } from "https://deno.land/x/wordnet_ts/mod.ts";
import { Wordnet } from "https://raw.githubusercontent.com/hviana/wordnet_ts/main/mod.ts";
const wordnet = new Wordnet();
await wordnet.init(); //will download the database if it does not exist.
const w = wordnet.logic(); //get logic functions
```

This library depends on another logical processing library:

```typescript
import { and, lvar, run } from "https://deno.land/x/logic_ts/mod.ts";
```

### Examples

#### Synsets of a lemma "dark"

```typescript
const y = lvar("y");
const synsets = run([y], w.lemmas(y, "dark"));
console.log(synsets);
```

#### Lemmas of a synset 105976849

```typescript
const lemmas = run([y], w.lemmas(105976849, y));
```

#### Synset pos of a synset 105976849

```typescript
const pos = run([y], w.pos(105976849, y));
```

#### Synset definition of a synset 105976849

```typescript
const definition = run([y], w.definition(105976849, y));
```

#### Synsets related to the synset 105976849

```typescript
const links = run([y], w.links(105976849, lvar(), y));
```

#### Synsets related to the synsets of the lemma "dark"

```typescript
const links = run([y], () => {
  const z = lvar();
  return and(
    () => w.lemmas(z, "dark"),
    () => w.links(z, lvar(), y), //Arrow notation is needed to delay execution and calculate variables
  );
});
```

#### All Synsets lemmas that are antonyms of synsets that contain the "dark" lemma

```typescript
const antonyms = run([y], () => {
  const z = lvar();
  const zy = lvar();
  return and(
    () => w.lemmas(z, "dark"),
    () => w.links(z, lvar(), zy, "antonym"),
    () => w.lemmas(zy, y),
  );
});
```

### All types of relationships

```typescript
type LinkTypes =
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
```

## About Wordnet relations

Words that are synonyms into synsets. All synsets are connected to other synsets
by means of semantic relations:

**Nouns**

- hypernyms: Y is a hypernym of X if every X is a (kind of) Y (canine is a
  hypernym of dog)
- hyponyms: Y is a hyponym of X if every Y is a (kind of) X (dog is a hyponym of
  canine)
- coordinate terms: Y is a coordinate term of X if X and Y share a hypernym
  (wolf is a coordinate term of dog, and dog is a coordinate term of wolf)
- meronym: Y is a meronym of X if Y is a part of X (window is a meronym of
  building)
- holonym: Y is a holonym of X if X is a part of Y (building is a holonym of
  window)

**Verbs**

- hypernym: the verb Y is a hypernym of the verb X if the activity X is a (kind
  of) Y (to perceive is an hypernym of to listen)
- troponym: the verb Y is a troponym of the verb X if the activity Y is doing X
  in some manner (to lisp is a troponym of to talk)
- entailment: the verb Y is entailed by X if by doing X you must be doing Y (to
  sleep is entailed by to snore)
- coordinate terms: those verbs sharing a common hypernym (to lisp and to yell)

## About

Author: Henrique Emanoel Viana, a Brazilian computer scientist, enthusiast of
web technologies, cel: +55 (41) 99999-4664. URL:
https://sites.google.com/view/henriqueviana

Improvements and suggestions are welcome!
