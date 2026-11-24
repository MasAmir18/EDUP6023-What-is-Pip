// Original Mystery Manor questions, hints, and alibis.
export const evidence = {
  "suspects": [
    {
      "id": "evelyn",
      "icon": "👗",
      "name": "Lady Evelyn",
      "role": "Manor Hostess",
      "room": "The Grand Foyer",
      "alibi": "Claims she was reading a novel upstairs until 8 o'clock and wears no spectacles."
    },
    {
      "id": "pierre",
      "icon": "👨‍🍳",
      "name": "Chef Pierre",
      "role": "Head Chef",
      "room": "The Dining Hall",
      "alibi": "Was baking apple pies in the kitchen after dinner; had flour on his apron."
    },
    {
      "id": "finch",
      "icon": "🧐",
      "name": "Professor Finch",
      "role": "Visiting Antiquarian",
      "room": "The Moonlit Conservatory",
      "alibi": "Wears round gold spectacles and was admiring the Golden Owl Trophy before the storm."
    }
  ],
  "clues": [
    {
      "id": 1,
      "roomId": 0,
      "category": "Time",
      "objectName": "Grandfather Clock",
      "clueIcon": "🕰️",
      "clueName": "Stopped Clock Gear",
      "introLine": "Hoo! Look at the frozen hands on this tall grandfather clock...",
      "sentence": "The storm knocked the power out ______ 8 o'clock last night.",
      "options": [
        "at",
        "on",
        "in",
        "under"
      ],
      "answer": "at",
      "hint": "Use 'at' for exact clock times like 8 o'clock or midnight!",
      "clueDesc": "The grandfather clock stopped at 8:00 PM—the exact moment the Golden Owl Trophy vanished."
    },
    {
      "id": 2,
      "roomId": 0,
      "category": "Place",
      "objectName": "Welcome Mat & Umbrella Stand",
      "clueIcon": "👣",
      "clueName": "Muddy Boot Print",
      "introLine": "Let's lift the corner of this red welcome mat by the umbrella stand...",
      "sentence": "A wet, muddy footprint is hidden ______ the welcome mat!",
      "options": [
        "under",
        "above",
        "through",
        "with"
      ],
      "answer": "under",
      "hint": "Something covered beneath a mat or rug is 'under' it.",
      "clueDesc": "A fresh muddy boot print found under the welcome mat leads toward the Conservatory."
    },
    {
      "id": 3,
      "roomId": 0,
      "category": "Direction",
      "objectName": "Lady Evelyn",
      "clueIcon": "📜",
      "clueName": "Evelyn's Witness Statement",
      "introLine": "Lady Evelyn adjusts her pearl necklace and shares what she saw...",
      "sentence": "I saw a shadowy figure tiptoeing ______ the grand staircase!",
      "options": [
        "up",
        "at",
        "with",
        "during"
      ],
      "answer": "up",
      "hint": "Which word shows movement from the bottom of the stairs toward the top?",
      "clueDesc": "Lady Evelyn saw someone hurrying up the stairs carrying a velvet cloth."
    },
    {
      "id": 4,
      "roomId": 1,
      "category": "Place",
      "objectName": "Persian Rug",
      "clueIcon": "🗝️",
      "clueName": "Tarnished Brass Key",
      "introLine": "Hmm, something metallic is glinting near the edge of the Persian rug...",
      "sentence": "A small brass key was tucked ______ the thick Persian rug.",
      "options": [
        "under",
        "over",
        "into",
        "at"
      ],
      "answer": "under",
      "hint": "Which preposition means directly beneath the rug?",
      "clueDesc": "A small brass key found under the Study's Persian rug. It unlocks the desk box!"
    },
    {
      "id": 5,
      "roomId": 1,
      "category": "Manner & Tool",
      "objectName": "Writing Desk",
      "clueIcon": "🖋️",
      "clueName": "Green Ink Map Sketch",
      "introLine": "Let's inspect the papers beside the green banker's lamp on the desk...",
      "sentence": "Someone scribbled a secret map ______ a fountain pen.",
      "options": [
        "with",
        "on",
        "at",
        "between"
      ],
      "answer": "with",
      "hint": "Which preposition tells us what tool was used to write?",
      "clueDesc": "A hurried sketch drawn with a green fountain pen showing the Conservatory glasshouse."
    },
    {
      "id": 6,
      "roomId": 1,
      "category": "Time",
      "objectName": "Locked Wooden Box",
      "clueIcon": "✉️",
      "clueName": "Midnight Meeting Note",
      "introLine": "Click! Our brass key opened the wooden box! Inside is a folded note...",
      "sentence": "The secret note reads: 'Meet me in the glasshouse ______ midnight.'",
      "options": [
        "at",
        "in",
        "on",
        "by"
      ],
      "answer": "at",
      "hint": "Just like clock times, we always say '___ midnight' and '___ noon'.",
      "clueDesc": "A secret note found inside the locked box: 'Meet me in the glasshouse at midnight.'"
    },
    {
      "id": 7,
      "roomId": 1,
      "category": "Place",
      "objectName": "Tall Bookshelves",
      "clueIcon": "📕",
      "clueName": "Hollow Owl Encyclopedia",
      "introLine": "One red volume on the tall oak bookshelf is sticking out slightly...",
      "sentence": "A hollow book was squeezed ______ two heavy encyclopedias.",
      "options": [
        "between",
        "through",
        "up",
        "at"
      ],
      "answer": "between",
      "hint": "When an object has one book on its left and one on its right, it is '___' them.",
      "clueDesc": "A hollowed-out book hidden between two encyclopedias—sized to carry a trophy!"
    },
    {
      "id": 8,
      "roomId": 2,
      "category": "Place",
      "objectName": "Banquet Table & Candelabra",
      "clueIcon": "🕯️",
      "clueName": "Dripped Wax Trail",
      "introLine": "Look at the white table runner next to the silver candelabra...",
      "sentence": "A silver candlestick was left standing ______ the long banquet table.",
      "options": [
        "on",
        "into",
        "through",
        "with"
      ],
      "answer": "on",
      "hint": "When something rests on top of a table's surface, we use '___'.",
      "clueDesc": "Warm wax dripped on the banquet table shows someone took a candle to light their way."
    },
    {
      "id": 9,
      "roomId": 2,
      "category": "Direction",
      "objectName": "Velvet Curtains",
      "clueIcon": "🌙",
      "clueName": "Moonlit Window Latch",
      "introLine": "Let's part these heavy crimson velvet curtains by the tall window...",
      "sentence": "Moonlight shines brightly ______ the tall glass window.",
      "options": [
        "through",
        "under",
        "at",
        "with"
      ],
      "answer": "through",
      "hint": "Light passes from one side of glass to the other—it shines '___' the window.",
      "clueDesc": "The window latch is locked from the inside—proving the culprit never left the manor!"
    },
    {
      "id": 10,
      "roomId": 2,
      "category": "Manner & Tool",
      "objectName": "Sideboard & Teacups",
      "clueIcon": "🫖",
      "clueName": "Chipped Porcelain Saucer",
      "introLine": "One of the porcelain teacups on the sideboard was set down very fast...",
      "sentence": "The nervous thief put the teacup down ______ a great hurry!",
      "options": [
        "in",
        "at",
        "up",
        "over"
      ],
      "answer": "in",
      "hint": "The common phrase for rushing is '___ a hurry'.",
      "clueDesc": "A teacup left in a hurry on the sideboard still has warm chamomile tea inside."
    },
    {
      "id": 11,
      "roomId": 2,
      "category": "Time",
      "objectName": "Chef Pierre",
      "clueIcon": "🥧",
      "clueName": "Chef Pierre's Kitchen Log",
      "introLine": "Chef Pierre twirls his mustache and checks his kitchen timer...",
      "sentence": "I was baking apple pies in the kitchen ______ dinner ended.",
      "options": [
        "after",
        "under",
        "into",
        "with"
      ],
      "answer": "after",
      "hint": "First dinner ended, and then Chef Pierre baked pies—so it happened '___' dinner.",
      "clueDesc": "Chef Pierre was busy baking pies after dinner, giving him a solid kitchen alibi."
    },
    {
      "id": 12,
      "roomId": 3,
      "category": "Place",
      "objectName": "Potted Ferns",
      "clueIcon": "👓",
      "clueName": "Dropped Spectacle Cloth",
      "introLine": "Something soft and blue is tangled inside the green fern fronds...",
      "sentence": "A microfiber glasses cloth was hidden ______ the leafy green ferns.",
      "options": [
        "among",
        "at",
        "up",
        "with"
      ],
      "answer": "among",
      "hint": "When something is surrounded by many leaves or plants, it is '___' them.",
      "clueDesc": "A soft lens-cleaning cloth for spectacles found among the Conservatory ferns!"
    },
    {
      "id": 13,
      "roomId": 3,
      "category": "Direction",
      "objectName": "Stone Fountain",
      "clueIcon": "🪙",
      "clueName": "Gleaming Gold Polish Tin",
      "introLine": "Look at the sparkling water in the stone tiered fountain...",
      "sentence": "A small tin of brass polish fell ______ the fountain's water basin!",
      "options": [
        "into",
        "at",
        "between",
        "after"
      ],
      "answer": "into",
      "hint": "Which preposition shows movement from outside to the inside of the water?",
      "clueDesc": "A tin of gold-and-brass polish dropped into the fountain—someone wanted to clean the trophy!"
    },
    {
      "id": 14,
      "roomId": 3,
      "category": "Manner & Tool",
      "objectName": "Empty Trophy Display Case",
      "clueIcon": "🪛",
      "clueName": "Pry-Mark Sketch",
      "introLine": "The glass display case is empty! Let's examine the scratches on the lock...",
      "sentence": "The display case latch was pried open ______ a small metal tool.",
      "options": [
        "with",
        "on",
        "at",
        "up"
      ],
      "answer": "with",
      "hint": "We use '___' before the tool or object used to perform an action.",
      "clueDesc": "Tiny scratches show the glass trophy case was opened with a small brass pocket tool."
    },
    {
      "id": 15,
      "roomId": 3,
      "category": "Time",
      "objectName": "Professor Finch",
      "clueIcon": "🧵",
      "clueName": "Tweed Coat Button",
      "introLine": "Professor Finch polishes his round spectacles nervously as we question him...",
      "sentence": "I came to admire the Golden Owl Trophy ______ the storm began!",
      "options": [
        "before",
        "under",
        "into",
        "between"
      ],
      "answer": "before",
      "hint": "Which word means earlier in time than when the storm started?",
      "clueDesc": "Professor Finch admits he was by the trophy case before the storm—and his tweed coat is missing a button!"
    }
  ]
};
