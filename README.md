<div align="center">
    <img src="./src/app/assets/images/logo/pokemon-logo.png" width="400" alt="Pokemon Logo Banner"/>
<p>by thecodemeor</p>
</div>

Built during my free time as a playground to experiment with API calls. What started as “just trying things out” turned into a fun little Pokédex project.

🌐 Live Demo: https://thecodemeor.github.io/pokemon/

## Features

### Visual Design
- **Pixel Art Styling**: All sprites and UI elements use pixelated rendering for authentic retro feel
- **Responsive Layout**: Three-panel design that adapts to different screen sizes

### Interactive Features
- **Search Functionality**: Search Pokémon by name or Pokédex number
- **Click Selection**: Click any Pokémon sprite in the grid to view its data
- **Live Data**: All data fetched from PokéAPI in real-time
- **Audio Playback**: Play authentic Pokémon cries from the official API
- **Smooth Animations**: Floating sprites, pulsing outlines, blinking cursors, and bouncing pointers

## Technology Stack

- **Frontend Framework**: Angular
- **Build Tool**: Vite
- **Styling**: Mozek (https://thecodemeor.github.io/mozek-website)
- **API**: PokéAPI (https://pokeapi.co/)
- **Font**: Press Start 2P (pixel font)

## Installation & Setup

```bash
# Install dependencies
npm install

# Start development server
ng serve
```

## API Integration

The application uses the free and open-source PokéAPI:

- **Pokémon Data**: `https://pokeapi.co/api/v2/pokemon/{id}`
- **Species Data**: `https://pokeapi.co/api/v2/pokemon-species/{id}` (for descriptions)
- **Sprites**: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/{id}.png`
- **Cries**: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/{id}.ogg`

## Browser Compatibility

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Credits

- **Pokémon Data**: [PokéAPI](https://pokeapi.co/)
- **Sprites**: [PokeAPI/sprites](https://github.com/PokeAPI/sprites)
- **Cries**: [PokeAPI/cries](https://github.com/PokeAPI/cries)
- **Font**: [Press Start 2P](https://fonts.google.com/specimen/Press+Start+2P)

## License

This project is created for educational and fan purposes. Pokémon is a trademark of The Pokémon Company International.

---

**Version**: 1.0.0  
**Last Updated**: March 2026