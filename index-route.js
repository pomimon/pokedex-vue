const { createApp } = Vue;

// dummy stats
const BLANK = {
  id: 1,
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

const MAX_POKEMON = 151;

const isValidId = (id) => {
  return id > 0 && id <= MAX_POKEMON;
};

const transformStats = (statsData) => {
  return statsData.map((stat) => ({
    name: stat.stat.name,
    value: stat.base_stat,
  }));
};

const extractIdFromUrl = (url) => {
  const parts = url.split("/").filter(Boolean);
  return Number(parts[parts.length - 1]);
};

const buildEvolutionChain = (node) => {
  const chain = [];

  function traverse(currentNode) {
    const id = extractIdFromUrl(currentNode.species.url);

    if (id <= MAX_POKEMON) {
      chain.push(id)
    }

    for (const node of currentNode.evolves_to) {
      traverse(node);
    }
  }

  traverse(node);

  return chain;
};

const clamp = (min, max, value) => {
  return Math.min(max, Math.max(min, value));
}

const Pokedex = {
  data() {
    return {
      pokemon: [],
      loading: false,
      failure: null,
    };
  },
  computed: {
    current() {
      return parseInt(this.$route.params.id, 10) || 1
    },
    currentPokemon() {
      return this.pokemon[this.current - 1] || BLANK;
    },
  },
  methods: {
    async fetchDetails(id) {
      const detailsResponse = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
      const details = await detailsResponse.json();

      const speciesResponse = await fetch(details.species.url);
      const species = await speciesResponse.json();

      const evolutionChainResponse = await fetch(species.evolution_chain.url);
      const evoChain = await evolutionChainResponse.json();

      const moves = details
        .moves
        .filter((move) => {
          const VERSIONS = ["blue-japan", "red-blue", "red-green-japan"]

          for (const vgd of move.version_group_details) {
            if (VERSIONS.includes(vgd.version_group.name)) {
              console.log("including move", move)
              return true;
            }
          }

          return false;
        })
        .map(m => m.move.name)

      return {
        id: details.id,
        name: details.name,
        flavor: species.flavor_text_entries[0].flavor_text,
        typeA: details.types[0].type.name,
        typeB: details.types[1]?.type?.name || null,
        stats: transformStats(details.stats),
        evolution: buildEvolutionChain(evoChain.chain),
        moves,
      };
    },
    async fetchPokemon(id) {
      const promises = [];

      for (let id = 1; id <= MAX_POKEMON; id++) {
        promises.push(this.fetchDetails(id));
      }

      this.loading = true;
      this.failure = null;

      try {
        this.pokemon = await Promise.all(promises);
        this.loading = false;

        // const allMoves = {}

        // for (const pokemon of this.pokemon) {
        //   for (const move of pokemon.movesRaw) {
        //     for (const vgd of move.version_group_details) {
        //       const name = vgd.version_group.name

        //       if (allMoves[name] == undefined) {
        //         allMoves[name] = 1;
        //       } else {
        //         allMoves[name] += 1;
        //       }
        //     }
        //   }
        // }

        // console.log("allMoves", allMoves)

        localStorage.setItem("pokemon", JSON.stringify(this.pokemon));
      } catch (error) {
        console.error("Failed to fetch Pokemon:", error);
        this.failure = error.message;
        this.loading = false;
      }
    },
    evoPokemon(id) {
      const current = this.pokemon[id - 1]

      if (!current) {
        return null;
      }

      return {
        id,
        name: current.name,
      }
    },
    prevPokemon() {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, this.current - 1)}`)
    },
    nextPokemon() {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, this.current + 1)}`)
    },
    viewPokemon(id) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, id)}`)
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
              <Evolution
                stage="I"
                :pokemon="evoPokemon(currentPokemon.evolution[0])"
                @view="viewPokemon"
              />

              <Evolution
                stage="II"
                :pokemon="evoPokemon(currentPokemon.evolution[1])"
                @view="viewPokemon"
              />

              <Evolution
                stage="III"
                :pokemon="evoPokemon(currentPokemon.evolution[2])"
                @view="viewPokemon"
              />
            </div>
          </div>

          <div class="panel-bar">
            <PokemonMoves :moves="currentPokemon.moves.slice(0,5)"/>
          </div>

          <div class="panel-bar">
            <div @click="prevPokemon">prev</div>
            <div @click="nextPokemon">next</div>
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
      this.$refs.audio.play();
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
      <audio :src="cryUrl" ref="audio"/>

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
  emit: ["view"],
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
      if (!this.pokemon) {
        return null;
      }

      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${this.pokemon.id}.gif`;
    },
  },
  methods: {
    emitView() {
      if (!this.pokemon) {
        return null;
      }

      this.$emit("view", this.pokemon.id)
    },
  },
  template: `
    <div id="evolution-bar" @click="emitView">
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

const PokemonMoves = {
  props: {
    moves: {
      type: Array,
      required: true,
    },
  },
  template: `
    <div id="pokemon-stats" class="box bg-green">
      <div v-for="move in moves">
        <span v-text="move"/>
      </div>
    </div>
  `,
};

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/pokemon/1"
    },
    {
      name: "pokedex",
      path: "/pokemon/:id",
      component: Pokedex,
    },
  ],
})

router.beforeEach((to, from) => {
  if (to.name != "pokedex") {
    return true;
  }

  const id = parseInt(to.params.id, 10)

  if (isValidId(id)) {
    return true;
  }

  return {
    name: "pokedex",
    params: {
      id: 1,
    },
  };
})

const App = {
  template: `
    <div>
      <RouterView />
    </div>
  `,
}

createApp(App)
  .component("PokemonName", PokemonName)
  .component("PokemonImage", PokemonImage)
  .component("PokemonText", PokemonText)
  .component("PokemonStats", PokemonStats)
  .component("PokemonTypes", PokemonTypes)
  .component("Evolution", Evolution)
  .component("PokemonMoves", PokemonMoves)
  .use(router)
  .mount("#app");

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

// OTHER WAY OF WRITING POKEMONNAME
// const PokemonName = {
//   props: {
//     name: {
//       type: String,
//       required: true,
//     },
//     id: {
//       type: Number,
//       required: true,
//       validator(value, props) {
//         return value >= 1 && value <= MAX_POKEMON;
//       },
//     },
//   },
//   computed: {
//     content() {
//       return `This is Pokemon: ${this.name} #${this.id}`;
//     },
//   },
//   template: `
//     <span v-text="content"/>
//   `,
// };
