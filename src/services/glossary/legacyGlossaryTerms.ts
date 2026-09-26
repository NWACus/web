import type { GlossaryTermSeed } from './seedGlossaryTerms'

// The legacy forecast widget's 82 terms (afp-public-widgets src/constants/glossaryTerms.js) as it
// shipped them: its first match string is the term, the rest are aliases. Only a stray trailing
// backslash-n and aliases repeating the term in another case were dropped.
export const LEGACY_GLOSSARY_TERMS: GlossaryTermSeed[] = [
  {
    term: 'Anchors',
    aliases: ['anchor', 'anchored', 'anchoring'],
    definition: 'Trees, bushes or rocks protruding though the slab that may help hold it in place.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/anchors/',
  },
  {
    term: 'Aspect',
    aliases: ['aspects'],
    definition: 'The compass direction a slope faces (i.e. North, South, East, or West.)',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/aspect/',
  },
  {
    term: 'Avalanche',
    aliases: ['avalanches', 'slide', 'slides'],
    definition: 'A mass of snow sliding, tumbling, or flowing down an inclined surface.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/',
  },
  {
    term: 'Avalanche Path',
    aliases: ['Avalanche Paths'],
    definition:
      'A terrain feature where an avalanche occurs. Composed of a Starting Zone, Track, and Runout Zone.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-path/',
  },
  {
    term: 'avalanche problem',
    aliases: ['avalanche problems'],
    definition:
      'Avalanches have a variety of personalities and are split up into nine distinct categories to better communicate the avalanche conditions.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/',
  },
  {
    term: 'transceiver',
    aliases: ['beacon', 'transceivers', 'beacons'],
    definition:
      'An electronic device worn on the body to aide in quickly finding buried avalanche victims. Also called an avalanche beacon, it has the ability to send and receive a 457khz radio signal.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/gear/transceiver-beacon/',
  },
  {
    term: 'Bed Surface',
    aliases: [],
    definition:
      'The surface over which a fracture and subsequent avalanche release occurs. Can be either the ground or a snow surface.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/anatomy-of-an-avalanche/bed-surface/',
  },
  {
    term: 'Challenging Terrain',
    aliases: [],
    definition:
      'Challenging terrain has exposure to well defined avalanche paths, starting zones, or terrain traps. Options exist to reduce or eliminate exposure with careful route finding.Challenging terrain requires skills to recognize and avoid avalanche-prone terrain – big slopes exist on these trips. You must also know how to understand the Public Avalanche Forecast, perform avaself-rescue rescue, basic first aid, and be confident in your route finding skills. You should take an Avalanche course prior to traveling in this type of terrain. If you are unsure of your or your group’s ability to navigate through avalanche terrain, consider hiring a professional guide.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-terrain-exposure-scale-ates/',
  },
  {
    term: 'Collapse',
    aliases: ['collapsed', 'collapses', 'collapsing'],
    definition:
      'When the fracture of a lower snow layer causes an upper layer to fall. Also called a whumpf, this is an obvious sign of instability.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/collapse-or-whumpf/',
  },
  {
    term: 'Complex Terrain',
    aliases: ['complex or extreme terrain'],
    definition:
      "Complex terrain has exposure to multiple overlapping avalanche paths or large expanses of steep, open terrain. Here, there are multiple avalanche starting zones, many terrain traps below the open terrain and minimal options to reduce exposure.Complex terrain demands a strong group with years of critical decision-making experience in avalanche terrain. There can be no safe options on these trips, as exposure to big slopes is inevitable. A recommended minimum is that you or someone in your group should have taken an advanced avalanche course and have several years of backcountry experience. Be prepared! Check the Avalanche Forecast, and ensure everyone in your group is up for the task and aware of the risk. This is serious terrain and not a place to consider unless you're confident in the skills of your group. If you are uncertain, consider hiring a professional guide.",
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-terrain-exposure-scale-ates/',
  },
  {
    term: 'Concave Slopes',
    aliases: ['concave', 'concavity'],
    definition:
      'A terrain feature that is rounded inward like the inside of a bowl, i.e. goes from more steep to less steep.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/slope-shape/',
  },
  {
    term: 'Considerable Danger',
    aliases: ['considerable'],
    definition:
      'Dangerous avalanche conditions. Careful snowpack evaluation, cautious route finding and conservative decision making essential. Natural avalanches possible; human triggered avalanches likely. Small avalanches in many areas; or large avalanches in specific areas; or very large avalanches in isolated areas.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/considerable-danger-level-3/',
  },
  {
    term: 'Convex Slopes',
    aliases: ['convex', 'convexity', 'breakover', 'rollover', 'rollovers'],
    definition:
      'A terrain feature that is curved or rounded like the exterior of a sphere or circle, i.e. goes from less steep to more steep. Convex slopes tend to be less safe than concave slopes.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/slope-shape/',
  },
  {
    term: 'Corn Snow',
    aliases: ['corn'],
    definition:
      'Large-grained, rounded crystals formed from repeated melting and freezing of the snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/melt-freeze-processes/corn-snow/',
  },
  {
    term: 'Cornice',
    aliases: ['Cornices'],
    definition:
      'A mass of snow deposited by the wind, often overhanging, and usually near a sharp terrain break such as a ridge. Cornices can break off unexpectedly and should be approached with caution.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/cornice-fall/',
  },
  {
    term: 'Cross Loading',
    aliases: ['cross loaded', 'cross-loaded'],
    definition:
      'Wind blowing across a slope, depositing drifts on the sides of gullies or other terrain features.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/wind-exposure/cross-loaded/',
  },
  {
    term: 'Crown Face',
    aliases: ['crown', 'Crown Faces', 'crowns'],
    definition:
      'The top fracture surface of a slab avalanche. Usually smooth, clean cut, and angled 90 degrees to the bed surface.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/anatomy-of-an-avalanche/crown-line-fracture-line/',
  },
  {
    term: 'D1',
    aliases: [],
    definition: 'Unlikely to bury a person.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-size/small-d1/',
  },
  {
    term: 'D2',
    aliases: [],
    definition: 'Can bury, injure, or kill a person.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-size/large-d2/',
  },
  {
    term: 'D3',
    aliases: [],
    definition:
      'Could bury and destroy a car, damage a truck, destroy a wood frame house, or break a few trees.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-size/very-large-d3/',
  },
  {
    term: 'D4',
    aliases: [],
    definition:
      'Could destroy a railway car, large truck, several buildings, or a substantial amount of forest.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-size/historic-d4-d5/',
  },
  {
    term: 'D5',
    aliases: [],
    definition: 'Could gouge the landscape. Largest snow avalanche known.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-size/historic-d4-d5/',
  },
  {
    term: 'Danger Ratings',
    aliases: ['danger rating'],
    definition:
      'In the U.S., a five-category estimation of the avalanche danger: Low, Moderate, Considerable, High and Extreme.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/',
  },
  {
    term: 'Deep Slab Avalanche',
    aliases: ['deep slab', 'Deep Slab Avalanches', 'deep slabs', 'deep persistent slab'],
    definition:
      'Avalanches that break deeply into old weak layers of snow that formed some time ago.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/deep-persistent-slab/',
  },
  {
    term: 'Depth Hoar',
    aliases: [],
    definition:
      'Large-grained, faceted, cup-shaped crystals near the ground. Depth hoar forms because of large temperature gradients within the snowpack.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/persistent-weak-layers/depth-hoar-basal-facets/',
  },
  {
    term: 'Dry Snow Avalanche',
    aliases: [],
    definition: 'An avalanche that occurs in snow below freezing temperatures.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-type/dry-avalanche/',
  },
  {
    term: 'Extreme Danger',
    aliases: [
      'extreme avalanche danger',
      'extreme avalanche hazard',
      'danger is extreme',
      'danger remains extreme',
    ],
    definition:
      'Avoid all avalanche terrain. Natural and human triggered avalanches certain. Large to very large avalanches in many areas.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/extreme-danger-level-5/',
  },
  {
    term: 'Faceted Snow',
    aliases: ['facet', 'facets', 'faceted', 'sugary snow', 'faceting', 'facetting', 'facetted'],
    definition:
      'Angular snow with poor bonding created from large temperature gradients within the snowpack.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/persistent-weak-layers/facets/',
  },
  {
    term: 'Fracture',
    aliases: ['fractured'],
    definition:
      'The physical separation of the slab from the bed surface and surrounding snow during the initiation of a slab avalanche.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-release/slab-avalanche-release/',
  },
  {
    term: 'Glide',
    aliases: [],
    definition:
      'When the entire snowpack slowly moves as a unit on the ground, similar to a glacier.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-release/glide/',
  },
  {
    term: 'Graupel',
    aliases: [],
    definition: 'Heavily rimed new snow, often shaped like little Styrofoam balls.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/storm-snow-weak-layers/graupel-rimed-particles/',
  },
  {
    term: 'Hard Slab Avalanche',
    aliases: ['hard slab', 'Hard Slab Avalanches', 'hard slabs'],
    definition: 'A slab avalanche of hard, dense snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-type/hard-slab-avalanche/',
  },
  {
    term: 'High Danger',
    aliases: [
      'high avalanche danger',
      'high avalanche hazard',
      'danger is high',
      'danger remains high',
      'danger will increase to HIGH',
    ],
    definition:
      'Very dangerous avalanche conditions. Travel in avalanche terrain not recommended. Natural avalanches likely; human triggered avalanches very likely. Large avalanches in many areas; or very large avalanches in specific areas.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/high-danger-level-4/',
  },
  {
    term: 'High Marking',
    aliases: ['hill climbing'],
    definition:
      'When a snowmobiler ascends a slope to the highest point they can reach. Also known as hill climbing.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/travel-advice/high-marking/',
  },
  {
    term: 'Isothermal',
    aliases: [],
    definition:
      'When all layers of the snowpack are at the same temperature, usually the freezing point. Often refers to a snowpack that is wet throughout its depth.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/melt/isothermal/',
  },
  {
    term: 'Leeward',
    aliases: [],
    definition: 'The downwind side of an obstacle such as a ridge.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/wind-exposure/leeward/',
  },
  {
    term: 'Loading',
    aliases: ['loaded', 'load'],
    definition:
      'The addition of weight on top of a snowpack, usually from precipitation, wind drifting, or a person.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/heavy-snowfall-or-rain/loading-loading-rate/',
  },
  {
    term: 'Loose Snow Avalanche',
    aliases: [
      'sluff',
      'point release',
      'wet loose avalanche',
      'loose dry avalanche',
      'loose wet avalanche',
      'dry loose avalanche',
    ],
    definition:
      'An avalanche that releases from a point and spreads downhill collecting more snow - different from a slab avalanche. Also called a point-release or sluff.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-type/loose-snow-avalanche/',
  },
  {
    term: 'Low Avalanche Hazard',
    aliases: [
      'low danger',
      'low avalanche danger',
      'danger is low',
      'danger remains low',
      'danger should remain LOW',
      'danger will remain LOW',
    ],
    definition:
      'Generally safe avalanche conditions. Watch for unstable snow on isolated terrain features. Natural and human triggered avalanches unlikely. Small avalanches in isolated areas or extreme terrain.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/low-danger-level-1/',
  },
  {
    term: 'Melt freeze snow',
    aliases: ['melt-freeze'],
    definition: 'Snow grains that have partially melted and then frozen again.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/melt-freeze-processes/',
  },
  {
    term: 'Moderate danger',
    aliases: [
      'moderate avalanche danger',
      'moderate avalanche hazard',
      'danger is moderate',
      'danger remains moderate',
      'avalanche danger at MODERATE',
      'increase to MODERATE',
    ],
    definition:
      'Heightened avalanche conditions on specific terrain features. Evaluate snow and terrain carefully; identify features of concern. Natural avalanches unlikely; human triggered avalanches possible. Small avalanches in specific areas; or large avalanches in isolated areas.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/resources/north-american-public-avalanche-danger-scale/moderate-danger-level-2/',
  },
  {
    term: 'Normal Caution',
    aliases: [],
    definition:
      'Travel with a plan that provides appropriate safety margins and maintains awareness of the conditions and terrain. Continue using group travel techniques that minimize risks like only exposing one person at a time to avalanche terrain and regrouping in safe zones out of avalanche terrain and runout zones.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/normal-caution/',
  },
  {
    term: 'Persistent weak layer',
    aliases: ['pwl', 'Persistent weak layers', 'pwls'],
    definition:
      'Weak layers buried in the snowpack that can produce avalanches for several days or weeks after a storm.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/persistent-weak-layers/',
  },
  {
    term: 'persistent slab',
    aliases: ['persistent slab problem', 'persistent slabs', 'persistent slab problems'],
    definition:
      'Avalanche problem caused by weak layers buried in the snowpack that can produce avalanches for several days or weeks after a storm.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/persistent-slab/',
  },
  {
    term: 'Probe',
    aliases: [],
    definition: 'A metal rod used to probe through avalanche debris for buried victims.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/gear/avalanche-probe/',
  },
  {
    term: 'Propagation',
    aliases: ['propagating', 'propagate', 'propagated'],
    definition: 'The spreading of a fracture or crack within the snowpack.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-release/slab-avalanche-release/',
  },
  {
    term: 'Rain Crust',
    aliases: ['Rain Crusts'],
    definition: 'A clear layer of ice formed when rain falls on the snow surface then freezes.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/melt-freeze-processes/rain-crust/',
  },
  {
    term: 'remote trigger',
    aliases: ['remotely', 'triggered remotely', 'remote triggers', 'remotely triggered'],
    definition:
      'Triggering an avalanche from the ridge above a slope, a gentler slope next to the avalanche, or from a flat or gentle area below the avalanche.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/trigger/remote-trigger/',
  },
  {
    term: 'Rime',
    aliases: ['rimed'],
    definition:
      'Supercooled water droplets that freeze to objects in exposed terrain, forming icy deposits on the windward side. Rime can also form on snowflakes as they fall through the sky, giving them a fuzzy appearence.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/storm-snow-weak-layers/graupel-rimed-particles/',
  },
  {
    term: 'Runout Zone',
    aliases: ['runout', 'Runout Zones', 'runouts'],
    definition: 'The portion of an avalanche path where the debris typically comes to rest.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-path/runout-zone/',
  },
  {
    term: 'Sastrugi',
    aliases: [],
    definition:
      'Wind eroded snow, which often looks rough like frozen waves. Usually found on windward slopes.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/wind-effects/wind-erosion/sastrugi/',
  },
  {
    term: 'Settlement',
    aliases: [],
    definition:
      'The slow, deformation and densification of snow under the influence of gravity. Not to be confused with collasping',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/settlement/',
  },
  {
    term: 'Simple Terrain',
    aliases: [],
    definition:
      'Simple terrain has exposure to low angle or primarily forested terrain. Some forest openings may involve the runout zones of infrequent avalanches, but there many options to reduce or eliminate exposure.Traversing simple terrain requires common sense, proper equipment, first aid skills, and the discipline to respect avalanche warnings. Simple terrain is usually low avalanche risk, and thus ideal for novices gaining backcountry experience. These trips may not be entirely free from avalanche hazards and, on days when avalanche danger is elevated, you may want to re-think any backcountry travel that has exposure to avalanches and stick to groomed cross-country trails, or within the boundaries of a ski resort.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-terrain-exposure-scale-ates/',
  },
  {
    term: 'Ski cut',
    aliases: [
      'slope cut',
      'snowmobile cut',
      'snowboard cut',
      'Ski cuts',
      'slope cuts',
      'snowmobile cuts',
      'snowboard cuts',
    ],
    definition:
      'A stability test where a skier, rider or snowmobiler rapidly crosses an avalanche starting zone to see if an avalanche initiates. Slope cuts can be dangerous and should only be performed by experienced people on small avalanche paths or test slopes.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/travel-advice/ski-cut-slope-cut/',
  },
  {
    term: 'Skin track',
    aliases: ['skinning'],
    definition:
      'Backcountry skiers and some snowboarders ascend slopes using climbing skins attached to the bottom of their skis.',
    link: 'https://avalanche.org/avalanche-encyclopedia/human/travel-advice/skinning/',
  },
  {
    term: 'Slab',
    aliases: ['slabs', 'slabby'],
    definition: 'A relatively cohesive snowpack layer.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/slab/',
  },
  {
    term: 'Snow density',
    aliases: ['density', '% snow', 'snow water equivalent', 'SWE'],
    definition:
      'The mass of snow per unit volume, but often expressed as a percent water content. New fallen powder has a low density (3-10%), while heavy or wet snow is more dense (10-20%).',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/heavy-snowfall-or-rain/loading-loading-rate/snow-water-equivalent-swe/',
  },
  {
    term: 'Snow layer',
    aliases: ['layer', 'snowpack layer', 'layer, snow', 'Snow layers', 'layers', 'snowpack layers'],
    definition:
      'A snowpack stratum differentiated from others by weather, metamorphism, or other processes.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-layer/',
  },
  {
    term: 'Snow Metamorphism',
    aliases: ['metamorphism'],
    definition:
      'The physical change of snow grains within the snowpack due to differences in temperature and pressure.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/',
  },
  {
    term: 'Snowpit',
    aliases: [
      'pit',
      'snow profile',
      'profile',
      'Snowpits',
      'pits',
      'snow profiles',
      'profiles',
      'snow pit',
    ],
    definition:
      'A pit dug vertically into the snowpack where snow layering is observed and stability tests may be performed. Also called a snow profile.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/snow-pit/',
  },
  {
    term: 'Soft slab avalanche',
    aliases: ['soft slab', 'Soft slab avalanches', 'soft slabs'],
    definition: 'A slab avalanche of soft or low density snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-type/soft-slab-avalanche/',
  },
  {
    term: 'Stability',
    aliases: [],
    definition:
      'The chance that an avalanche will not occur, relative to a given trigger (usually the weight of a human).',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/',
  },
  {
    term: 'Stability Test',
    aliases: [
      'snowpit test',
      'Stability Tests',
      'snowpit tests',
      'snowpack test',
      'snowpack tests',
    ],
    definition:
      'A procedure used to estimate the stability of the snowpack, often done in a snowpit. Common tests include the extended column test, compression test, propagation saw test, cornice drop, and slope cut',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/snowpack-test/',
  },
  {
    term: 'Starting Zone',
    aliases: ['start zone', 'Starting Zones', 'start zones'],
    definition: 'The portion of an avalanche path where an avalanche releases.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-path/start-zone/',
  },
  {
    term: 'Stepping down',
    aliases: ['step down', 'stepped down'],
    definition:
      'When a slab avalanche slides a short distance and breaks down into deeper weak layers forming a stair-step pattern on the bed surface.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/trigger/step-down/',
  },
  {
    term: 'storm slab',
    aliases: ['storm slabs'],
    definition:
      'Release of a soft cohesive layer (a slab) of new snow that breaks within the storm snow or at the interface between new and old snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/storm-slab/',
  },
  {
    term: 'Sun Crust',
    aliases: [],
    definition: 'A snow layer melted by radiation from the sun and subsequently refrozen.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/melt-freeze-processes/sun-crust/',
  },
  {
    term: 'Surface Hoar',
    aliases: [],
    definition:
      'Featherly crystals that form on the snow surface during clear and calm conditions - essentially frozen dew. Forms a persistent weak layer once buried.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/persistent-weak-layers/surface-hoar-2/',
  },
  {
    term: 'Sympathetic Trigger',
    aliases: ['released sympathetically'],
    definition: 'When one avalanche triggers another avalanche some distance away.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/trigger/sympathetic-release/',
  },
  {
    term: 'Temperature Gradient',
    aliases: [],
    definition: 'The change in temperature over snowpack depth.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snow-metamorphism/temperature-gradient/',
  },
  {
    term: 'Terrain Trap',
    aliases: ['terrain traps'],
    definition:
      'Terrain in which the consequences of an avalanche are especially hazardous, such as a gully, an abrupt transition, an avalanche path that terminates in trees, a crevasse field or a cliff.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/terrain-trap/',
  },
  {
    term: 'avalanche track',
    aliases: [],
    definition: 'The portion of an avalanche path between the starting zone and the runout zone.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/avalanche-path/avalanche-track/',
  },
  {
    term: 'triggers',
    aliases: ['triggered', 'triggering', 'trigger'],
    definition:
      'A disturbance that initiates fracture within the weak layer causing an avalanche. In 90 percent of avalanche accidents, the victim or someone in the victims party triggers the avalanche.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/trigger/',
  },
  {
    term: 'Trigger Point',
    aliases: ['trigger points'],
    definition: 'The area where a trigger initiates an avalanche.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/avalanche-terrain-exposure/trigger-point/',
  },
  {
    term: 'Upside-Down Storm',
    aliases: ['upside down', 'upside down storm', 'upside-down'],
    definition:
      'When a snowstorm deposits denser snow over less dense snow, creating a slab/weak layer combination.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/snow-surface-observations/snow-cohesion/upside-down-storm/',
  },
  {
    term: 'Weak Interface',
    aliases: [],
    definition: 'A poor bond between two adjacent layers of snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/failure-interface/',
  },
  {
    term: 'Weak Layer',
    aliases: ['weak layers'],
    definition:
      'A snowpack layer with less strength than adjacent layers. Often the layer in the snowpack where an avalanche fractures.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/weak-layer/',
  },
  {
    term: 'Wet Snow Avalanche',
    aliases: ['wet slab', 'Wet Snow Avalanches', 'wet slabs'],
    definition:
      'An avalanche caused by snow losing its strength after becoming damp, moist or saturated with water.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/wet-slab/',
  },
  {
    term: 'Whumpf',
    aliases: ['whumpfing', 'whumpfs', 'whumph', 'whumphs', 'whumphing', 'whumf', 'whumfing'],
    definition:
      'When the fracture of a lower snow layer causes an upper layer to fall or collapse, making a whumpfing sound. This an obvious sign of instability. See Collapse.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/collapse-or-whumpf/',
  },
  {
    term: 'Wind Loading',
    aliases: ['wind loaded', 'wind load', 'Wind-loaded', 'Wind-loading', 'Wind-load'],
    definition: 'The added weight of wind drifted snow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/snowpack/snowpack-observations/signs-of-instability-red-flags/wind-loading/',
  },
  {
    term: 'Wind Slab',
    aliases: ['wind slabs'],
    definition:
      'A cohesive layer of snow formed when wind deposits snow onto leeward terrain. Wind slabs are often smooth and rounded and sometimes sound hollow.',
    link: 'https://avalanche.org/avalanche-encyclopedia/avalanche/avalanche-problems/avalanche-problem-type/wind-slab/',
  },
  {
    term: 'Windward',
    aliases: [],
    definition:
      'The upwind side of an obstacle such as a ridge. Usually snow is eroded from windward slopes making them relatively safer.',
    link: 'https://avalanche.org/avalanche-encyclopedia/terrain/slope-characteristics/wind-exposure/windward/',
  },
]
