
// =============================================================================
// Utilities
// =============================================================================

const MAX_POKEMON = 151;

const IMAGES = {
  gif: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated",
}

const isValidId = (id) => {
  return id > 0 && id <= MAX_POKEMON;
};

const getImageUrl = (id) => {
  return `${IMAGES.gif}/${id}.gif`;
};

const clamp = (min, max, value) => {
  return Math.min(max, Math.max(min, value));
}

// =============================================================================
// Components
// =============================================================================

const App = {
  data() {
    return {
      pokemon: [],
    };
  },

  methods: {
    getName(id) {
      return this.pokemon[id - 1]?.name || "";
    },
    prevPokemon(currentId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, currentId - 1)}`)
    },
    nextPokemon(currentId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, currentId + 1)}`)
    },
    viewPokemon(pokemonId) {
      this.$router.push(`/pokemon/${clamp(1, MAX_POKEMON, pokemonId)}`)
    },
  },

  created() {
    this.pokemon = JSON.parse(localStorage.getItem("pokemon"));
  },

  template: `
    <RouterView />
  `,
}

const Pokedex = {
  computed: {
    currentId() {
      return parseInt(this.$route.params.id, 10);
    },
    currentPokemon() {
      return this.$root.pokemon[this.currentId - 1];
    },
  },

  template: `
    <div class="pokedex">
      <div class="layout-header">
        <Header />
      </div>

      <div class="layout-panels">
        <div class="layout-panel lhs">
          <Preview :id="currentId"/>
          <Control :id="currentId"/>
        </div>

        <div class="layout-spine"></div>

        <div class="layout-panel rhs">
          <Evolution
            :pokemon1="currentPokemon.evolution[0]"
            :pokemon2="currentPokemon.evolution[1]"
            :pokemon3="currentPokemon.evolution[2]"
          />

          <ButtonGrid />
          <PillBar />
          <ButtonMoves />
          <PokeInfo/>
        </div>
      </div>
    </div>
  `,
}

const Header = {
  template: `
    <div class="block" id="header">
      <div class="bar">
        <div class="button circle bg-blue"></div>
        <div class="status">
          <div class="dot is-med bg-red" ></div>
          <div class="dot is-med bg-yellow" ></div>
          <div class="dot is-med bg-green" ></div>
        </div>
      </div>
    </div>
  `,
};

const Preview = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
  },
  computed: {
    imageUrl() {
      return getImageUrl(this.id);
    },
  },
  template: `
    <div class="block" id="preview">
      <div class="bar">
        <div class="dot"></div>
        <div class="dot"></div>
      </div>
      <div class="bar">
        <div class="image">
          <img class="is-pixelated" :src="imageUrl"/>
        </div>
      </div>
      <div class="bar">
        <div class="dot is-big"></div>
      </div>
    </div>
  `,
};

const Control = {
  props: {
    id: {
      type: Number,
      required: true,
      validator: isValidId,
    },
  },
  template: `
    <div class="block" id="control">
      <div class="column lhs">
        <div class="bar">
          <div class="button circle"></div>
          <div class="button pill bg-red"></div>
          <div class="button pill bg-blue"></div>
        </div>
        <div class="bar">
          <div class="info"></div>
        </div>
      </div>
      <div class="column rhs">
        <div id="d-pad">
          <div class="btn up"></div>
          <div class="btn left" @click="$root.prevPokemon(id)"></div>
          <div class="btn center"></div>
          <div class="btn right" @click="$root.nextPokemon(id)"></div>
          <div class="btn down"></div>
        </div>
      </div>
    </div>
  `,
};

const Evolution = {
  props: {
    pokemon1: {
      type: Number,
      required: true,
    },
    pokemon2: Number,
    pokemon3: Number,
  },

  computed: {
    pokemon1Name() {
      return this.$root.getName(this.pokemon1)
    },
    pokemon2Name() {
      return this.$root.getName(this.pokemon2)
    },
    pokemon3Name() {
      return this.$root.getName(this.pokemon3)
    },
    pokemon1Image() {
      return getImageUrl(this.pokemon1)
    },
    pokemon2Image() {
      return getImageUrl(this.pokemon2)
    },
    pokemon3Image() {
      return getImageUrl(this.pokemon3)
    },
  },

  template: `
    <div class="block" id="evolution">
      <div class="info">
        <div class="poke-group">
          <div class="image" @click="$root.viewPokemon(pokemon1)">
            <img class="is-pixelated" :src="pokemon1Image">
          </div>
          <p v-text="pokemon1Name"/>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image" v-if="pokemon2" @click="$root.viewPokemon(pokemon2)">
            <img class="is-pixelated" :src="pokemon2Image">
          </div>
          <div class="pokeball" v-else/>

          <p v-text="pokemon2Name"/>
        </div>

        <div class="arrow"></div>

        <div class="poke-group">
          <div class="image" v-if="pokemon3" @click="$root.viewPokemon(pokemon3)">
            <img class="is-pixelated" :src="pokemon3Image">
          </div>
          <div class="pokeball" v-else/>

          <p v-text="pokemon3Name"/>
        </div>
      </div>
    </div>
  `,
};

const ButtonGrid = {
  template: `
    <div class="block" id="button-grid">
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>

      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
      <div class="square"></div>
    </div>
  `,
};

const PillBar = {
  template: `
    <div class="block" id="pill-bar">
      <div class="bar">
        <div class="button pill"></div>
        <div class="button pill"></div>
      </div>
    </div>
  `,
};

const ButtonMoves = {
  template: `
    <div class="block" id="button-moves">
      <div class="bar">
        <div class="square"></div>
        <div class="square"></div>
      </div>
      <div class="button circle"></div>
    </div>
  `,
};

const PokeInfo = {
  template: `
    <div class="block" id="poke-info">
      <div class="info"></div>
      <div class="info"></div>
    </div>
  `,
};


// =============================================================================
// Vue Setup
// =============================================================================

const router = VueRouter.createRouter({
  history: VueRouter.createWebHashHistory(),
  routes: [
    {
      path: "/",
      redirect: "/pokemon/1",
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

// =============================================================================
// Entrypoint
// =============================================================================

Vue.createApp(App)
  .component("ButtonGrid", ButtonGrid)
  .component("ButtonMoves", ButtonMoves)
  .component("Control", Control)
  .component("Evolution", Evolution)
  .component("Header", Header)
  .component("PillBar", PillBar)
  .component("PokeInfo", PokeInfo)
  .component("Preview", Preview)
  .use(router)
  .mount("#app");
