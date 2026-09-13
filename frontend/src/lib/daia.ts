// Localização geográfica do Distrito Agroindustrial de Anápolis (DAIA/Anápolis-GO).
// Centro: 16°23'04"S 48°56'34"W (fonte: CODEGO / Wikimapia). Área ~593 hectares.
export const DAIA_CENTER: [number, number] = [-48.9428, -16.3844] // [lng, lat]

// Bounding box (sudoeste, nordeste) usado pra travar o mapa de tráfego só na
// região do distrito — cobre o DAIA e as vias de acesso mais próximas, sem
// entrar na área urbana de Anápolis (~6,5km ao norte do centro do distrito).
// Deliberadamente maior que o distrito em si (~9km x 7km): um maxBounds
// justo demais em relação ao viewport faz o mapbox-gl/TomTom SDK "travar"
// o arrasto perto da borda (efeito elástico feio, parece bug de mouse) —
// essa folga garante espaço real pra arrastar em qualquer tamanho de card.
export const DAIA_BOUNDS: [[number, number], [number, number]] = [
  [-48.985, -16.416], // sudoeste [lng, lat]
  [-48.901, -16.353], // nordeste [lng, lat]
]

export const DAIA_DEFAULT_ZOOM = 15
// >= 14 pra nunca deixar a área travada (DAIA_BOUNDS) menor que o viewport —
// se isso acontecer, o SDK trava o pan por completo (impossível arrastar).
export const DAIA_MIN_ZOOM = 14
export const DAIA_MAX_ZOOM = 18
