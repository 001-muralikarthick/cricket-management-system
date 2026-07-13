import React from "react";

// Collections of commentary lines based on events
const DOT_BALL_QUOTES = [
  "Beaten! An absolute beauty that just whizzes past the outside edge.",
  "Defended solidly. [Striker] respects the good delivery and pushes it back to the bowler.",
  "Swing and a miss! [Striker] tried to slash that hard but found only thin air.",
  "Well bowled! A tight line making it impossible for [Striker] to get it away.",
  "Nudged gently to the fielder, no run. Tidy bowling here from [Bowler].",
  "A cracking yorker! [Striker] does exceptionally well to dig that one out.",
  "Left alone. [Striker] watches it sail safely through to the wicketkeeper."
];

const SINGLE_QUOTES = [
  "Just a soft tap into the gap, and they hustle across for a quick single.",
  "Nudged to the leg side. Excellent rotation of the strike.",
  "Driven to long-on. They settle for a single as the fielder sweeps it up.",
  "Guided down to third man. A comfortable single to keep the scoreboard ticking.",
  "Dropped into the covers. A cheeky run, but they make it easily.",
  "A quick push and run. Excellent calling in the middle."
];

const DOUBLE_QUOTES = [
  "Placed beautifully into the deep. They push hard and come back for a comfortable second.",
  "Driven wide of long-off. Superb running between the wickets gets them two!",
  "Flicked off the pads. The outfield is a bit slow, allowing them to pocket a brace.",
  "A wristy shot into the gap at deep mid-wicket. Good running brings two runs."
];

const THREE_QUOTES = [
  "What a chase! The fielder slides and saves a boundary, but they run a superb three!",
  "Landed in no man's land. They run the first one hard and slide in for a magnificent third!",
  "Flicked past square leg. Great teamwork in the outfield saves a run, but they get three."
];

const FOUR_QUOTES = [
  "SHOT! A glorious cover drive! It races away across the turf and crashes into the boundary for FOUR!",
  "CRACK! What a sound off the willow! Pulled away through mid-wicket, no one's stopping that. Boundary!",
  "Pure elegance! A simple flick of the wrists and it beats the infield. That is a gorgeous boundary!",
  "Edged... and runs! Past the slip fielder and trickles away all the way to the third man fence for four!",
  "Uptempo! [Striker] lofts it over the infield. One bounce, two bounces, and over the ropes for four!"
];

const SIX_QUOTES = [
  "THAT IS MASSIVE! He's hit that all the way into the second tier! Absolute power from [Striker]! SIX!",
  "OH MY WORD! A majestic swing of the bat! High, handsome, and gone! Out of the park for a monstrous SIX!",
  "Danced down the track and lofted it beautifully over long-on! That is clean as a whistle. Six runs!",
  "Stand and deliver! Picked up from the length and dispatched over the mid-wicket boundary. Inevitable! SIX!"
];

const WICKET_QUOTES = {
  Bowled: [
    "BOWLED HIM! Clean as a whistle! The middle stump is cartwheeling! [Bowler] has produced an absolute peach and [Striker] stands in utter disbelief!",
    "HE'S GOT HIM! Through the gate! The ball sneaks between bat and pad to rattle the timber. Magnificent delivery!",
    "KNOCKED OVER! [Striker] goes for a wild heave, misses it completely, and the stumps are shattered. What a breakthrough!"
  ],
  Caught: [
    "In the air... and TAKEN! A brilliant catch under high pressure! [Striker] tries to go big but finds the fielder at deep mid-wicket.",
    "OUT! Edged and taken! A magnificent reflex catch by the wicketkeeper. [Bowler] is ecstatic, and the batsman has to walk!",
    "GONE! A simple catch to the captain at extra cover. [Striker] completely mistimed the drive. A soft dismissal."
  ],
  LBW: [
    "PLUMB! An absolute yorker trapping [Striker] right in front of the stumps. The umpire's finger goes up immediately! Umpire's decision is final!",
    "HOWZAT?! A loud appeal from the bowler and the fielding team. The umpire raises the finger! LBW! Brilliant bowling!"
  ],
  RunOut: [
    "OH NO, DISASTER! A complete mix-up in the middle! They ran for a non-existent single, the fielder fired in a direct hit, and [Striker] is run out by a mile!",
    "OUT! Excellent fielding! A sharp throw to the bowler's end, the bails are off, and the batsman is short of his crease. What a way to go!"
  ],
  Default: [
    "OUT! [Striker] has to go! A massive blow for the batting team. [Bowler] gets the crucial wicket!",
    "GONE! The pressure was building and [Striker] finally cracks. The fielding side is celebrating!"
  ]
};

const EXTRA_QUOTES = {
  wides: [
    "Wide ball! Sprayed down the leg side, the umpire stretches his arms. A free run to the batting team.",
    "Wayward delivery, wide of the crease. The keeper dives to stop it. Extra run added."
  ],
  noBalls: [
    "No ball! [Bowler] has overstepped! A free run to the batting side, and a Free Hit coming up next ball!",
    "Signal from the umpire - No Ball! Height warning or overstepping, either way it's a free run and a free hit!"
  ],
  byes: [
    "Sneaks past everyone! The batsman misses, the keeper misses, and they sneak a run. Byes signaled.",
    "A quick bye. Good awareness by the batsmen to steal a run on a loose delivery."
  ],
  legByes: [
    "Hits the pads and deflects away. They scramble across for a leg bye.",
    "Umpire signals leg byes. Deflected off the batsman's thigh guard into the gap."
  ]
};

/**
 * Generates exciting cricket commentary for a delivery
 */
export function generateCommentaryText(ball) {
  const { runs = 0, batterRuns = 0, extraRuns = 0, extraType = "", wicket = false, wicketType = "Caught", striker = "Batsman", bowler = "Bowler" } = ball;
  
  let list = [];

  if (wicket) {
    const type = wicketType || "Caught";
    list = WICKET_QUOTES[type] || WICKET_QUOTES.Default;
  } else if (extraType === "wides") {
    list = EXTRA_QUOTES.wides;
  } else if (extraType === "noBalls") {
    list = EXTRA_QUOTES.noBalls;
  } else if (extraType === "byes") {
    list = EXTRA_QUOTES.byes;
  } else if (extraType === "legByes") {
    list = EXTRA_QUOTES.legByes;
  } else {
    // Standard runs
    if (batterRuns === 6) list = SIX_QUOTES;
    else if (batterRuns === 4) list = FOUR_QUOTES;
    else if (batterRuns === 3) list = THREE_QUOTES;
    else if (batterRuns === 2) list = DOUBLE_QUOTES;
    else if (batterRuns === 1) list = SINGLE_QUOTES;
    else list = DOT_BALL_QUOTES;
  }

  const randomIndex = Math.floor(Math.random() * list.length);
  let template = list[randomIndex] || "An eventful delivery!";
  
  // Replace place holders
  return template
    .replace(/\[Striker\]/g, striker)
    .replace(/\[Bowler\]/g, bowler);
}

export default function AICommentary({ history = [] }) {
  return (
    <div style={{
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: "16px",
      padding: "1.5rem",
      color: "white",
      boxShadow: "0 10px 15px -3px rgba(15, 23, 42, 0.3)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      marginTop: "1.5rem"
    }}>
      <h3 style={{ margin: "0 0 1rem 0", color: "#f59e0b", display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem" }}>
        <span>🎙️</span> AI Match Commentary
      </h3>
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        maxHeight: "220px",
        overflowY: "auto",
        paddingRight: "6px"
      }}>
        {history.length === 0 ? (
          <p style={{ color: "#64748b", fontStyle: "italic", margin: 0, fontSize: "0.9rem" }}>
            The commentators are settling into the booth. Waiting for the first ball...
          </p>
        ) : (
          history.slice(-6).reverse().map((ball, i) => {
            const commText = generateCommentaryText(ball);
            const isBoundary = ball.batterRuns === 4 || ball.batterRuns === 6;
            const isWicket = ball.wicket;

            return (
              <div key={i} style={{
                padding: "0.75rem",
                borderRadius: "8px",
                background: isWicket 
                  ? "rgba(239, 68, 68, 0.15)" 
                  : isBoundary 
                  ? "rgba(34, 197, 94, 0.12)" 
                  : "rgba(255, 255, 255, 0.03)",
                borderLeft: `4px solid ${
                  isWicket ? "#ef4444" : isBoundary ? "#22c55e" : "#64748b"
                }`,
                animation: "fadeIn 0.3s ease both"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem", fontSize: "0.8rem", color: "#94a3b8", fontWeight: "bold" }}>
                  <span>Over {ball.over}.{ball.ball}</span>
                  <span style={{ 
                    color: isWicket ? "#ef4444" : isBoundary ? "#22c55e" : "#f59e0b",
                    textTransform: "uppercase"
                  }}>
                    {isWicket ? `Wicket (${ball.wicketType})` : `${ball.runs} Run${ball.runs === 1 ? "" : "s"}`}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: "0.9rem", color: "#e2e8f0", lineHeight: "1.5" }}>
                  {commText}
                </p>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
