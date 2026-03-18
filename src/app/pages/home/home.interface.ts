export interface PokemonLibrary {
  id: number;
  name: string;
  sprite: string;
}

export interface Pokemon {
  name: string;
  height: number;
  weight: number;
  stats: PokemonStats[];
  abilities: { ability: { name: string } }[];
  species: {
    name: string;
    url: string;
  };
  types: {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }[];
  sprites: {
    front_default: string;
    other?: {
      'official-artwork'?: {
        front_default: string;
      };
    };
    versions: {
      'generation-v': {
        'black-white': {
          animated: {
            front_default: string;
          };
        };
      };
    };
  };
}

export interface PokemonStats {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

export interface PokemonSpeciesRef {
  name: string;
  url: string;
}

export interface EvolutionNode {
  species: PokemonSpeciesRef;
  evolves_to: EvolutionNode[];
}

export interface EvolutionChainResponse {
  chain: EvolutionNode;
}

export interface EvolutionCard {
  name: string;
  image: string;
  gif: string;
}

export interface PokemonSpecies {
  flavor_text_entries: {
    flavor_text: string;
    language: { name: string };
  }[];
  names: {
    name: string;
    language: { name: string };
  }[];
  evolution_chain?: {
    url: string;
  };
}

export interface PokemonType {
  name: string;
  url: string;
}