const { createApp } = Vue;

// dummy stats
const BLANK = {
  id: 2,
  name: "Bulbasaur",
  flavor:
    "It carries a seed on its back right from birth. As it grows older, the seed also grows larger.",
  typeA: "grass",
  typeB: "poison",
  // typeB: null,
  stats: [
    { name: "hp", value: 45 },
    { name: "attack", value: 49 },
    { name: "defense", value: 49 },
    { name: "special-attack", value: 65 },
    { name: "special-defense", value: 65 },
    { name: "speed", value: 45 },
  ],
  evolution: [],
  moves: [],
};
// dummy stats

const isValidId = (id) => {
  return id > 0 && id <= 151;
};

const transformStats = (statsData) => {
  return statsData.map((stat) => ({
    name: stat.stat.name,
    value: stat.baseStat,
  }));
};

const extractIdFromUrl = (url) => {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
};

const buildEvolutionChain = (node, allPokemon) => {
  const chain = [];

  function traverse(currentNode) {
    const id = extractIdFromUrl(currentNode.species.url);

    if (id <= 151) {
      const found = allPokemon.find((p) => p.id === id);
      if (found) {
        chain.push({
          id: found.id,
          name: found.name,
          types: [found.typeA, found.typeB].filter(Boolean),
        });
      }
    }

    currentNode.evolvesTo.forEach(traverse);
  }

  traverse(node);
  return chain;
};

const App = {
  data() {
    return {
      pokemon: [],
      current: 0,
      loading: false,
      failure: null,
    };
  },
  computed: {
    currentPokemon() {
      return this.pokemon[this.current] || BLANK;
    },
  },
  methods: {
    async fetchDetails(id) {
      const detailsResponse = await fetch(
        `https://pokeapi.co/api/v2/pokemon/${id}`,
      );
      const details = await detailsResponse.json();
      const speciesResponse = await fetch(details.species.url);
      const species = await speciesResponse.json();

      const evolutionChainResponse = await fetch(species.evolutionChain.url);
      const evoChain = await evolutionChainResponse.json();

      return {
        id: details.id,
        name: details.name,
        flavor: species.flavorTextEntries[0].flavorText,
        typeA: details.types[0].type.name,
        typeB: details.types[1]?.type?.name || null,
        stats: transformStats(details.stats),
        evoChainRaw: evoChain.chain,
        moves: [],
      };
    },
    async fetchPokemon(id) {
      const promises = [];

      for (let id = 1; id <= 151; id++) {
        promises.push(this.fetchDetails(id));
      }

      this.loading = true;
      this.failure = null;

      try {
        const allPokemon = await Promise.all(promises);

        allPokemon.forEach((pokemon) => {
          pokemon.evolution = buildEvolutionChain(
            pokemon.evoChainRaw,
            allPokemon,
          );
          delete pokemon.evoChainRaw;
        });

        this.pokemon = allPokemon;
        this.loading = false;

        localStorage.setItem("pokemon", JSON.stringify(this.pokemon));
      } catch (error) {
        console.error("Failed to fetch Pokemon:", error);
        this.failure = error.message;
        this.loading = false;
      }
    },
  },
  mounted() {
    if (localStorage.getItem("pokemon")) {
      this.pokemon = JSON.parse(localStorage.getItem("pokemon"));
    } else {
      this.fetchPokemon();
    }
  },

  template: `
    <div class="pokedex">
      <div v-if="loading">Loading...</div>
      <div v-else-if="failure">Error: {{ failure }}</div>
      <template v-else>
        <div class="panel-left">
          <PokemonName
            :name="currentPokemon.name"
            :id="currentPokemon.id"
          />
          <PokemonImage :id="currentPokemon.id"/>
          <PokemonText :text="currentPokemon.flavor"/>
        </div>
        <div class="panel-hinge"/>
        <div class="panel-right">
          <div class="panel-bar">
            <PokemonStats :stats="currentPokemon.stats"/>
            <PokemonTypes
              :typeA="currentPokemon.typeA"
              :typeB="currentPokemon.typeB"
            />
          </div>
          <div class="evolution-box">
            <div class ="panel-bar">
              <Evolution stage="I" :pokemon="currentPokemon.evolution[0]"/>
              <Evolution stage="II" :pokemon="currentPokemon.evolution[1]"/>
              <Evolution stage="III" :pokemon="currentPokemon.evolution[2]"/>
            </div>
          </div>
        </div>
      </template>
    </div>
  `,
};

const PokemonName = {
  props: {
    name: {
      type: String,
      required: true,
    },
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
  },
  computed: {
    formattedId() {
      return `#${this.id.toString().padStart(3, "0")}`;
    },
  },
  template: `
    <div id="pokemon-name" class="box bg-green is-flex is-spaced">
      <span v-text="name"/>
      <span v-text="formattedId"/>
    </div>
  `,
};

// const SpriteType = {
//   Front: 0,
//   FrontShiny: 1,
//   Back: 2,
//   BackShiny: 3,

//   url(type, id) {
//     const BASE_URL =
//       "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";

//     let path = "/";

//     switch (type) {
//       case SpriteType.Front:
//         break;
//       case SpriteType.FrontShiny:
//         path = "/shiny/";
//         break;
//       case SpriteType.Back:
//         path = "/back/";
//         break;
//       case SpriteType.BackShiny:
//         path = "/back/shiny/";
//         break;
//       default:
//         throw new Error("unreachable");
//     }

//     return `${BASE_URL}${path}${id}.gif`;
//   },
// };

const PokemonImage = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
  },
  data() {
    return {
      front: true,
      shiny: false,
    };
  },
  computed: {
    imageUrl() {
      const BASE_URL =
        "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated";
      const front = this.front ? "" : "back/";
      const shiny = this.shiny ? "shiny/" : "";

      // return SpriteType.url(this.type, this.id);
      return `${BASE_URL}/${front}${shiny}${this.id}.gif`;
    },
    cryUrl() {
      return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${this.id}.ogg`;
    },
  },
  methods: {
    playCry() {
      const audio = new Audio(this.cryUrl);
      audio.play();
    },
  },
  mounted() {
    feather.replace();
  },
  updated() {
    feather.replace();
  },
  template: `
    <div>
      <div id="pokemon-image" class="box is-flex bg-grey">
        <img class="is-pixelated" :src="imageUrl"/>
      </div>
      <div id="pokemon-effects" class="inlineBox">
        <div class="effectbutton" @click="playCry"><i data-feather="volume-2"></i></div>
        <div class="toggle" @click="shiny = !shiny">shiny</div>
        <div class="effectbutton" @click="front = !front"><i data-feather="refresh-cw"></i></div>
      </div>
    </div>
  `,
};

const PokemonText = {
  props: {
    text: {
      type: String,
      required: true,
    },
  },
  template: `
    <div id="pokemon-text" class="box bg-green">
      <span v-text="text"/>
    </div>
  `,
};

const PokemonStats = {
  props: {
    stats: {
      type: Object,
      required: true,
      validator(value) {
        return Array.isArray(value);
      },
    },
  },
  template: `
    <div id="pokemon-stats" class="box bg-green">
      <div v-for="stat in stats">
        <span v-text="stat.name"/>
        <span v-text="stat.value"/>
      </div>
    </div>
  `,
};

const PokemonTypes = {
  props: {
    typeA: {
      type: String,
      required: true,
    },
    typeB: {
      type: [String, null],
      required: true,
    },
  },
  template: `
    <div class="box bg-green">
      <div class="type">TYPES</div>
      <div class="pill" v-text="typeA"/>
      <div class="pill" v-text="typeB" v-if="typeB"/>
    </div>
  `,
};

const Evolution = {
  props: {
    stage: {
      type: String,
      required: true,
    },
    pokemon: {
      type: Object,
      default: null,
    },
  },

  computed: {
    imageUrl() {
      if (!this.pokemon) return null;
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${this.pokemon.id}.gif`;
    },
  },
  template: `
    <div id="evolution-bar">
      <div class="inlineBox">
        <p>{{ stage }}</p>
      </div>
      <div class="evolution">
        <img v-if="imageUrl" class="is-pixelated" :src="imageUrl"/>
        <span v-else>—</span>
      </div>
      <div class="box bg-green inlineBox">
        <p v-if="pokemon">{{ pokemon.name }}</p>
        <p v-else>—</p>
      </div>
    </div>
  `,
};

createApp(App)
  .component("PokemonName", PokemonName)
  .component("PokemonImage", PokemonImage)
  .component("PokemonText", PokemonText)
  .component("PokemonStats", PokemonStats)
  .component("PokemonTypes", PokemonTypes)
  .component("Evolution", Evolution)
  .mount("#app");

// // OTHER WAY OF WRITING POKEMONNAME
// // const PokemonName = {
// //   props: {
// //     name: {
// //       type: String,
// //       required: true,
// //     },
// //     id: {
// //       type: Number,
// //       required: true,
// //       validator(value, props) {
// //         return value >= 1 && value <= 151;
// //       },
// //     },
// //   },
// //   computed: {
// //     content() {
// //       return `This is Pokemon: ${this.name} #${this.id}`;
// //     },
// //   },
// //   template: `
// //     <span v-text="content"/>
// //   `,
// // };
