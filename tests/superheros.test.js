"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const SuperHeros = require("../js/superheros.js");

const stats = (intelligence, strength, speed, durability, power, combat) => ({
  intelligence, strength, speed, durability, power, combat,
});

const HEROES = [
  { id: 70, name: "Batman", powerstats: stats(100, 26, 27, 50, 47, 100), biography: { fullName: "Bruce Wayne", publisher: "DC Comics", alignment: "good" } },
  { id: 644, name: "Superman", powerstats: stats(94, 100, 100, 100, 100, 85), biography: { fullName: "Clark Kent", publisher: "DC Comics", alignment: "good" } },
  { id: 370, name: "Joker", powerstats: stats(100, 10, 12, 60, 43, 70), biography: { fullName: "Jack Napier", publisher: "DC Comics", alignment: "bad" } },
  { id: 638, name: "Storm", powerstats: stats(88, 10, 50, 60, 100, 84), biography: { fullName: "Ororo Munroe", publisher: "Marvel Comics", alignment: "good" } },
  { id: 309, name: "Éclair", powerstats: stats(10, 10, 90, 10, 10, 10), biography: { fullName: "", publisher: null, alignment: "-" } },
];

test("la recherche ignore la casse et les accents", () => {
  assert.deepEqual(SuperHeros.searchHeroes(HEROES, "ECLAIR").map((h) => h.id), [309]);
  assert.deepEqual(SuperHeros.searchHeroes(HEROES, "  bat ").map((h) => h.id), [70]);
});

test("la recherche porte aussi sur le nom civil", () => {
  assert.deepEqual(SuperHeros.searchHeroes(HEROES, "wayne").map((h) => h.name), ["Batman"]);
});

test("une recherche vide ne renvoie rien", () => {
  assert.deepEqual(SuperHeros.searchHeroes(HEROES, "   "), []);
});

test("le matcher garde les personnages qui atteignent chaque minimum, du plus puissant au moins puissant", () => {
  const result = SuperHeros.matchHeroes(HEROES, { intelligence: 85, power: 40 });
  assert.deepEqual(result.map((h) => h.name), ["Superman", "Storm", "Batman", "Joker"]);
});

test("le matcher accepte les valeurs des curseurs sous forme de texte", () => {
  assert.deepEqual(SuperHeros.matchHeroes(HEROES, { speed: "90" }).map((h) => h.name), ["Superman", "Éclair"]);
});

test("un minimum à 0 ne filtre pas", () => {
  assert.equal(SuperHeros.matchHeroes(HEROES, { combat: 0 }).length, HEROES.length);
});

test("filtres par éditeur et par camp, tri par puissance", () => {
  const dcGood = SuperHeros.filterHeroes(HEROES, { publisher: "DC Comics", alignment: "good", sort: "power" });
  assert.deepEqual(dcGood.map((h) => h.name), ["Superman", "Batman"]);
  assert.deepEqual(SuperHeros.filterHeroes(HEROES).map((h) => h.name), ["Batman", "Éclair", "Joker", "Storm", "Superman"]);
});

test("éditeurs classés par nombre de personnages, sans valeur vide", () => {
  assert.deepEqual(SuperHeros.publishers(HEROES), [
    { name: "DC Comics", count: 3 },
    { name: "Marvel Comics", count: 1 },
  ]);
});

test("total des statistiques", () => {
  assert.equal(SuperHeros.totalStats(HEROES[1]), 579);
});

test("identifiants valides", () => {
  assert.ok(SuperHeros.isValidId("70"));
  for (const id of ["0", "-1", "abc", "70; alert(1)", "", null, "123456"]) {
    assert.equal(SuperHeros.isValidId(id), false, String(id));
  }
});

test("affichage des valeurs manquantes", () => {
  assert.equal(SuperHeros.display("-"), "Non renseigné");
  assert.equal(SuperHeros.display(["-", ""]), "Non renseigné");
  assert.equal(SuperHeros.display(["Rick Jones", "A-Bomb"]), "Rick Jones, A-Bomb");
  assert.equal(SuperHeros.alignmentLabel("bad"), "Méchant");
  assert.equal(SuperHeros.alignmentLabel("-"), "Inconnu");
  assert.equal(SuperHeros.genderLabel("Female"), "Femme");
  assert.equal(SuperHeros.genderLabel("-"), "Non renseigné");
});

test("lien vers la fiche", () => {
  assert.equal(SuperHeros.detailsUrl(70), "details.html?id=70");
});
