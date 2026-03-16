import { Component, OnInit, AfterViewInit, inject, ViewChild, ElementRef, DestroyRef, computed, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin } from 'rxjs';
import Chart from 'chart.js/auto';

import { MozDivider } from 'mozek-angular';
import { ResponsiveService } from 'src/app/services/responsive.service';

interface PokemonLibrary {
  id: number;
  name: string;
  sprite: string;
}

interface Pokemon {
  name: string;
  height: number;
  weight: number;
  stats: PokemonStats[];
  abilities: { ability: { name: string}}[];
  types: {
    slot: number;
    type: {
      name: string;
      url: string;
    };
  }[];
  sprites: {
    front_default: string;
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

interface PokemonStats {
  base_stat: number;
  effort: number;
  stat: {
    name: string;
    url: string;
  };
}

interface PokemonSpeciesRef {
  name: string;
  url: string;
}

interface EvolutionNode {
  species: PokemonSpeciesRef;
  evolves_to: EvolutionNode[];
}

interface EvolutionChainResponse {
  chain: EvolutionNode;
}

interface EvolutionCard {
  name: string;
  image: string;
  gif: string;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MozDivider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss', '../../assets/scss/bat.scss'],
})
export class Home implements OnInit, AfterViewInit {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  private _radarCanvas?: ElementRef<HTMLCanvasElement>;
  private readonly responsive = inject(ResponsiveService);
  readonly screen = computed(() => this.responsive.breakpoint());

  @ViewChild('radarCanvas')
  set radarCanvasSetter(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    this._radarCanvas = canvas;

    if (canvas && this.pokemon?.stats) {
      this.createRadarChart();
    }
  }

  loading: boolean = false;
  libraryError: string = '';
  loadingPokemon: boolean = false;
  pokemonError: string = '';

  pokemonLibrary: PokemonLibrary[] = [];
  pokemon!: Pokemon;
  nameJapan: string = '';
  description: string = '';
  gif: string = '';

  startset = 0;
  limit = 24;

  private chart?: Chart;
  private viewReady = false;

  constructor() {
    effect(() => {
      const currentScreen = this.screen();

      if (currentScreen === 'mobile') {
        this.mobilePokemonLibrary = true;
        this.mobilePokemonData = false;
      } else {
        this.mobilePokemonLibrary = true;
        this.mobilePokemonData = true;
      }
    });
  }

  ngOnInit() {
    this.loadPokemonLibrary()
  }

  mobilePokemonLibrary: boolean = true
  mobilePokemonData: boolean = true
  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.pokemon) {
      this.createRadarChart();
    }
  }

  loadPokemonLibrary() {
    this.loading = true;
    this.libraryError = '';

    this.http.get<any>('https://pokeapi.co/api/v2/pokemon?limit=1000')
      .subscribe({
        next: (data) => {
          this.pokemonLibrary = data.results.map((p: any) => {
            const id = this.extractPokemonId(p.url);

            return {
              id,
              name: p.name,
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`
            };
          });

          this.filteredPokemon = [...this.pokemonLibrary];
          this.loading = false;
        },
        error: (error) => {
          console.error('Failed to load Pokémon library:', error);
          this.libraryError = 'Failed to load Pokémon library.';
          this.loading = false;
        }
      });
  }

  extractPokemonId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  formatPokemonName(name: string): string {
    return name.replaceAll('-', ' ');
  }

  filteredPokemon = [...this.pokemonLibrary];
  searchTerm: string = '';
  searchPokemon() {
    const keyword = this.searchTerm.toLowerCase().trim();

    if (!keyword) {
      this.filteredPokemon = [...this.pokemonLibrary];
      return;
    }

    this.filteredPokemon = this.pokemonLibrary.filter(pokemon =>
      pokemon.name.toLowerCase().includes(keyword) ||
      pokemon.id.toString() === keyword
    );
  }

  loadPokemonData(pokemon: PokemonLibrary) {
    const pokemonReq = this.http.get<Pokemon>(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`);
    const speciesReq = this.http.get<any>(`https://pokeapi.co/api/v2/pokemon-species/${pokemon.name}`);
    
    forkJoin([pokemonReq, speciesReq])
    .pipe(takeUntilDestroyed(this.destroyRef)) 
    .subscribe(([pokeData, speciesData]) => {
      this.pokemon = pokeData;
      this.gif = pokeData.sprites.versions['generation-v']['black-white'].animated.front_default;
      if(!this.gif) {
        this.gif = `https://play.pokemonshowdown.com/sprites/ani/${pokemon.name}.gif`
      }
      console.log(this.gif, this.pokemon)

        const entry = speciesData.flavor_text_entries.find((e: any) => e.language.name === 'en');
        const nameJa = speciesData.names.find((e: any) => e.language.name === 'ja');

        this.description = entry?.flavor_text.replace(/\f/g, ' ') || '';
        this.nameJapan = nameJa?.name || '';

        const evolutionUrl = speciesData.evolution_chain?.url;
        if (evolutionUrl) {
          this.loadEvolutionChain(evolutionUrl);
        }

        if (this.viewReady) {
          this.createRadarChart();
        }
      });
    if (this.screen() === 'mobile') {
      this.mobilePokemonLibrary = false
      this.mobilePokemonData = true
    }
  }

  formatLabel(label: string): string {
    return label.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  scaleAdjustment(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return (value * 0.1).toFixed(1);
  }

  createRadarChart(): void {
    setTimeout(() => {
      if (!this._radarCanvas || !this.pokemon?.stats) return;

      const labels = this.pokemon.stats.map(item => this.formatStatName(item.stat.name));
      const values = this.pokemon.stats.map(item => item.base_stat);

      this.chart?.destroy();

      this.chart = new Chart(this._radarCanvas.nativeElement, {
        type: 'radar',
        data: {
          labels,
          datasets: [{
            label: 'Stats',
            data: values,
            backgroundColor: 'rgba(255, 207, 84, 0.2)',
            borderColor: '#ffce54',
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false,
            },
          },
          scales: {
            r: {
              angleLines: {
                color: 'rgba(255, 255, 255, 0.3)',
              },
              grid: {
                color: 'rgba(255, 255, 255, 0.2)',
              },
              pointLabels: {
                display: true,
                color: '#ffffff',
                font: {
                  family: "'CutePixel', sans-serif",
                  size: 14
                }
              },
              ticks: {
                color: 'rgba(255, 255, 255, 0.2)',
                backdropColor: '#2a2a2a',
                stepSize: 20,
                font: {
                  family: "'CutePixel', sans-serif",
                  size: 10
                }
              },
            },
          },
        }
      });
    }, 0);
  }

  formatStatName(name: string): string[] {
    return name.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  getEmptySlots(length: number): number[] {
    return Array(Math.max(0, 3 - length)).fill(0);
  }

  evolutions: EvolutionCard[] = [];
  loadEvolutionChain(url: string) {
    this.http.get<EvolutionChainResponse>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((data) => {
        const names = this.extractEvolutionNames(data.chain);
        this.loadEvolutionImages(names);
      });
  }

  loadEvolutionImages(names: string[]) {
    const requests = names.map(name =>
      this.http.get<any>(`https://pokeapi.co/api/v2/pokemon/${name}`)
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((results) => {
        this.evolutions = results.map((pokemon) => ({
          name: pokemon.name,
          image: pokemon.sprites.other['official-artwork'].front_default || pokemon.sprites.front_default,
          gif: `https://play.pokemonshowdown.com/sprites/ani/${pokemon.name}.gif`
        }));
      });
  }

  extractEvolutionNames(node: EvolutionNode): string[] {
    let result: string[] = [node.species.name];
    for (const next of node.evolves_to) {
      result = [...result, ...this.extractEvolutionNames(next)];
    }

    return result;
  }

  openMenu() {
    
  }

  closeData() {
    this.searchTerm = ''
    this.mobilePokemonLibrary = true
    this.mobilePokemonData = false
  }
}