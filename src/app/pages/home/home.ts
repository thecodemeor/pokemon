import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  ViewChild,
  ElementRef,
  DestroyRef,
  computed,
  effect
} from '@angular/core';
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

interface PokemonSpecies {
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

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, MozDivider],
  templateUrl: './home.html',
  styleUrls: ['./home.scss', '../../assets/scss/bat.scss'],
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly responsive = inject(ResponsiveService);

  readonly screen = computed(() => this.responsive.breakpoint());

  private _radarCanvas?: ElementRef<HTMLCanvasElement>;
  private chart?: Chart;
  private viewReady = false;

  @ViewChild('radarCanvas')
  set radarCanvasSetter(canvas: ElementRef<HTMLCanvasElement> | undefined) {
    this._radarCanvas = canvas;

    if (canvas && this.pokemon?.stats) {
      this.createRadarChart();
    }
  }

  loading = false;
  libraryError = '';
  loadingPokemon = false;
  pokemonError = '';

  pokemonLibrary: PokemonLibrary[] = [];
  filteredPokemon: PokemonLibrary[] = [];
  evolutions: EvolutionCard[] = [];

  pokemon: Pokemon | null = null;
  nameJapan = '';
  description = '';
  gif = '';

  searchTerm = '';
  startset = 0;
  limit = 24;

  mobilePokemonLibrary = true;
  mobilePokemonData = true;

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

  ngOnInit(): void {
    this.loadPokemonLibrary();
  }

  ngAfterViewInit(): void {
    this.viewReady = true;

    if (this.pokemon) {
      this.createRadarChart();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  loadPokemonLibrary(): void {
    this.loading = true;
    this.libraryError = '';

    this.http.get<{ results: { name: string; url: string }[] }>('https://pokeapi.co/api/v2/pokemon?limit=1000')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.pokemonLibrary = data.results.map((p) => {
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

  loadPokemonData(pokemon: PokemonLibrary): void {
    this.loadingPokemon = true;
    this.pokemonError = '';
    this.evolutions = [];

    this.http.get<Pokemon>(`https://pokeapi.co/api/v2/pokemon/${pokemon.name}`).pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (pokeData) => {
        forkJoin([
          this.http.get<PokemonSpecies>(pokeData.species.url)
        ])
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: ([speciesData]) => {
            this.pokemon = pokeData;

            this.gif =
              pokeData.sprites.versions['generation-v']['black-white'].animated.front_default ||
              this.getPokemonGif(pokemon.name);

            const entry = speciesData.flavor_text_entries.find((e) => e.language.name === 'en');
            const nameJa = speciesData.names.find((e) => e.language.name === 'ja');

            this.description = entry?.flavor_text.replace(/\f/g, ' ') || '';
            this.nameJapan = nameJa?.name || '';

            const evolutionUrl = speciesData.evolution_chain?.url;
            if (evolutionUrl) {
              this.loadEvolutionChain(evolutionUrl);
            }

            if (this.viewReady) {
              this.createRadarChart();
            }

            this.loadingPokemon = false;
          },
          error: (error) => {
            console.error('Failed to load Pokémon species data:', error);
            this.pokemonError = 'Failed to load Pokémon species data.';
            this.loadingPokemon = false;
          }
        });
      },
      error: (error) => {
        console.error('Failed to load Pokémon data:', error);
        this.pokemonError = 'Failed to load Pokémon data.';
        this.loadingPokemon = false;
      }
    });

    if (this.screen() === 'mobile') {
      this.mobilePokemonLibrary = false;
      this.mobilePokemonData = true;
    }
  }

  searchPokemon(): void {
    const keyword = this.searchTerm.toLowerCase().trim();

    if (!keyword) {
      this.filteredPokemon = [...this.pokemonLibrary];
      return;
    }

    this.filteredPokemon = this.pokemonLibrary.filter((pokemon) =>
      pokemon.name.toLowerCase().includes(keyword) ||
      pokemon.id.toString().includes(keyword)
    );
  }

  extractPokemonId(url: string): number {
    const parts = url.split('/').filter(Boolean);
    return Number(parts[parts.length - 1]);
  }

  formatPokemonName(name: string): string {
    return name.replaceAll('-', ' ');
  }

  formatLabel(label: string): string {
    return label
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  scaleAdjustment(value: number | undefined): string {
    if (value === undefined || value === null) return '0';
    return (value * 0.1).toFixed(1);
  }

  createRadarChart(): void {
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
  }

  formatStatName(name: string): string[] {
    return name
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1));
  }

  getEmptySlots(length: number): number[] {
    return Array(Math.max(0, 3 - length)).fill(0);
  }

  loadEvolutionChain(url: string): void {
    this.http.get<EvolutionChainResponse>(url)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const names = this.extractEvolutionNames(data.chain);
          this.loadEvolutionImages(names);
        },
        error: (error) => {
          console.error('Failed to load evolution chain:', error);
          this.evolutions = [];
        }
      });
  }

  loadEvolutionImages(names: string[]): void {
    const requests = names.map(name =>
      this.http.get<Pokemon>(`https://pokeapi.co/api/v2/pokemon/${name}`)
    );

    forkJoin(requests)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          this.evolutions = results.map((pokemon) => ({
            name: pokemon.name,
            image:
              pokemon.sprites.other?.['official-artwork']?.front_default ||
              pokemon.sprites.front_default,
            gif: this.getPokemonGif(pokemon.name)
          }));
        },
        error: (error) => {
          console.error('Failed to load evolution images:', error);
          this.evolutions = [];
        }
      });
  }

  extractEvolutionNames(node: EvolutionNode): string[] {
    let result: string[] = [node.species.name];

    for (const next of node.evolves_to) {
      result = [...result, ...this.extractEvolutionNames(next)];
    }

    return result;
  }

  getPokemonGif(name: string): string {
    return `https://play.pokemonshowdown.com/sprites/ani/${name}.gif`;
  }

  get visiblePokemon(): PokemonLibrary[] {
    return this.filteredPokemon.slice(this.startset, this.startset + this.limit);
  }

  gettingLibraryLoading: boolean = false
  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const atBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (atBottom) {
      this.gettingLibraryLoading = true
      setTimeout(() => {
        this.loadMore();
        this.gettingLibraryLoading = false
      }, 1500);
    }
  }

  loadMore(): void {
    if (this.limit >= this.filteredPokemon.length) return;

    this.limit += 24;
  }

  menuOpen = false;
  openMenu(): void {
    this.menuOpen = true;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  closeData(): void {
    this.searchTerm = '';
    this.mobilePokemonLibrary = true;
    this.mobilePokemonData = false;
  }
}