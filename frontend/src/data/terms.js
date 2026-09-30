// 89 basketball terms, each with a data-driven court illustration (see CourtDiagram ops)
export const TERM_CATS = ["Court", "Offense", "Defense", "Shooting", "Rules", "Stats & Slang"];
const t = (term, cat, def, ops) => ({ id: term.toLowerCase().replace(/[^a-z0-9]+/g, "-"), term, cat, def, ops });

const PG = [50, 64], LW = [16, 46], RW = [84, 46], LC = [5, 12], RC = [95, 12], LB = [32, 16], RB = [68, 16], LE = [34, 38], RE = [66, 38];

export const TERMS = [
  // ---------------- Court (14)
  t("Paint", "Court", "The painted rectangle under the basket, also called the lane or key. Offensive players can only stay in it for three seconds at a time.", [["zone", "paint"], ["t", 50, 28, "THE PAINT"]]),
  t("Three-Point Line", "Court", "The arc 22 ft (corners) to 23 ft 9 in (top) from the rim in the NBA. Any made shot from beyond it is worth three points.", [["zone", "three"], ["o", 50, 72, "1"], ["b", 54, 70], ["shot", 50, 70], ["t", 50, 86, "3 POINTS"]]),
  t("Free Throw Line", "Court", "The line 15 ft from the backboard where players shoot unguarded free throws after a foul.", [["zone", "ftline"], ["o", 50, 43, ""], ["shot", 50, 41], ["t", 50, 52, "15 FT"]]),
  t("Elbow", "Court", "The two corners where the free throw line meets the lane lines. A prime spot for jumpers and high-post passing.", [["zone", "elbow"], ["o", 66, 38, "4"], ["t", 34, 48, "ELBOW"], ["t", 66, 48, "ELBOW"]]),
  t("Block", "Court", "The small square marks on the lane lines closest to the basket. Post players 'post up on the block'.", [["zone", "block"], ["o", 28, 16, "5"], ["x", 33, 12], ["t", 20, 26, "BLOCK"]]),
  t("Baseline", "Court", "The end line behind each basket. Driving 'baseline' means attacking along it toward the rim.", [["zone", "baseline"], ["o", 12, 22, "2"], ["drib", 12, 22, 40, 6]]),
  t("Sideline", "Court", "The long boundary lines on each side of the court. Stepping on it with the ball is out of bounds.", [["zone", "sideline"], ["o", 92, 60, "3"], ["b", 96, 60], ["t", 80, 72, "OUT"]]),
  t("Half Court", "Court", "The line dividing the court in two. Once the offense brings the ball over it, it can't go back.", [["zone", "halfcourt"], ["o", 50, 84, "1"], ["drib", 50, 92, 50, 70], ["t", 50, 80, ""]]),
  t("Corner Three", "Court", "The shortest three-pointer on the floor (22 ft), from the corners along the baseline. A favorite of spot-up shooters.", [["zone", "corner"], ["o", 95, 14, "3"], ["pass", 50, 64, 93, 18], ["shot", 95, 14]]),
  t("Wing", "Court", "The area on either side of the court between the corner and the top of the key, around the extended free throw line.", [["zone", "wing"], ["o", 16, 46, "2"], ["o", 84, 46, "3"]]),
  t("Top of the Key", "Court", "The area at the top of the three-point arc, straight out from the basket. Where the point guard usually initiates the offense.", [["zone", "top"], ["o", 50, 64, "1"], ["b", 54, 66]]),
  t("Restricted Area", "Court", "The arc 4 ft from the rim. A secondary defender can't draw a charge while standing inside it.", [["zone", "rim"], ["o", 50, 22, "1"], ["x", 50, 14], ["t", 50, 30, "NO CHARGE"]]),
  t("Mid-Range", "Court", "The area inside the three-point line but outside the paint. Home of pull-up and fadeaway jumpers.", [["zone", "mid"], ["o", 24, 30, "2"], ["shot", 24, 30]]),
  t("Backcourt", "Court", "The half of the court your team is defending. The offense has 8 seconds to get the ball out of it.", [["zone", "backcourt"], ["o", 50, 90, "1"], ["drib", 50, 90, 50, 70], ["clock", "8"]]),

  // ---------------- Offense (23)
  t("Pick and Roll", "Offense", "A ball handler uses a teammate's screen; the screener then rolls toward the rim for a pass or rebound.", [["o", 50, 64, "1"], ["x", 50, 70], ["o", 42, 58, "5"], ["screen", 40, 52, 44, 60], ["drib", 50, 64, 68, 44], ["cut", 42, 58, 46, 18, 34, 36]]),
  t("Pick and Pop", "Offense", "Like a pick and roll, but the screener steps out to the perimeter for a jumper instead of rolling to the rim.", [["o", 50, 64, "1"], ["o", 42, 58, "4"], ["screen", 40, 52, 44, 60], ["drib", 50, 64, 70, 46], ["cut", 42, 58, 22, 60], ["pass", 70, 46, 24, 60]]),
  t("Screen", "Offense", "A legal block where an offensive player stands still to free a teammate from their defender. Also called a pick.", [["o", 56, 44, "4"], ["x", 60, 48], ["o", 72, 56, "2"], ["cut", 72, 56, 48, 60, 58, 60], ["screen", 56, 40, 56, 46]]),
  t("Back Door Cut", "Offense", "When a defender overplays the passing lane, the offensive player cuts behind them toward the basket for a pass.", [["o", 16, 46, "2"], ["x", 22, 44], ["o", 50, 64, "1"], ["b", 54, 64], ["cut", 16, 46, 44, 14, 16, 28], ["pass", 50, 64, 44, 18]]),
  t("Give and Go", "Offense", "Pass to a teammate, cut hard to the basket, and get the ball right back for a layup.", [["o", 50, 64, "1"], ["o", 16, 46, "2"], ["pass", 50, 64, 20, 48], ["cut", 50, 64, 50, 18], ["pass", 20, 44, 48, 20]]),
  t("Isolation", "Offense", "Clearing out one side of the floor so a single scorer can attack their defender one-on-one.", [["o", 84, 46, "3"], ["x", 78, 44], ["o", 10, 12, ""], ["o", 20, 48, ""], ["o", 30, 70, ""], ["drib", 84, 46, 62, 18], ["zone", "strong"]]),
  t("Fast Break", "Offense", "Pushing the ball up the court quickly after a rebound or steal to score before the defense sets up.", [["o", 50, 86, "1"], ["drib", 50, 90, 50, 48], ["cut", 14, 88, 30, 18, 12, 40], ["cut", 86, 88, 70, 18, 88, 40], ["o", 14, 88, ""], ["o", 86, 88, ""]]),
  t("Post Up", "Offense", "Establishing position near the basket with your back to the defender to receive an entry pass.", [["zone", "lowpost"], ["o", 30, 16, "5"], ["x", 34, 12], ["o", 16, 46, "2"], ["pass", 16, 46, 28, 20]]),
  t("Drive and Kick", "Offense", "Attacking the basket to draw help defenders, then passing out to an open shooter on the perimeter.", [["o", 50, 64, "1"], ["drib", 50, 64, 50, 30], ["x", 84, 34], ["o", 95, 12, "3"], ["pass", 50, 30, 92, 14], ["shot", 95, 12]]),
  t("Down Screen", "Offense", "An off-ball screen set by a player moving toward the baseline, freeing a teammate to pop up to the perimeter.", [["o", 22, 42, "4"], ["cut", 22, 42, 26, 20], ["screen", 26, 24, 28, 20], ["o", 26, 14, "2"], ["cut", 26, 14, 14, 50, 12, 28]]),
  t("Flare Screen", "Offense", "A screen set on the high side so the shooter can drift away from the ball toward the wing or corner.", [["o", 50, 64, "1"], ["o", 64, 52, "4"], ["screen", 70, 56, 66, 54], ["o", 72, 44, "2"], ["cut", 74, 44, 90, 30, 86, 44]]),
  t("Dribble Handoff", "Offense", "A dribbler hands the ball directly to a teammate running by, often acting as a screen at the same time.", [["o", 70, 50, "5"], ["drib", 70, 60, 70, 50], ["o", 86, 30, "2"], ["cut", 86, 30, 64, 42, 78, 50], ["b", 67, 47]]),
  t("Motion Offense", "Offense", "A read-and-react system of cuts, screens and passes instead of set plays, built on spacing and movement.", [["o", 50, 64, "1"], ["o", 16, 46, "2"], ["o", 84, 46, "3"], ["o", 28, 18, "4"], ["o", 72, 18, "5"], ["pass", 50, 64, 20, 48], ["cut", 84, 46, 58, 20, 70, 36], ["cut", 72, 18, 80, 44]]),
  t("Spacing", "Offense", "Positioning players around the floor to stretch the defense and open driving and passing lanes.", [["o", 50, 64, "1"], ["o", 5, 12, "2"], ["o", 95, 12, "3"], ["o", 14, 50, "4"], ["o", 86, 50, "5"], ["ring", 50, 40, 20]]),
  t("Triple Threat", "Offense", "Holding the ball on your hip, knees bent, ready to shoot, pass or dribble. The defender can't commit.", [["o", 70, 50, "3"], ["b", 73, 52], ["shot", 70, 50], ["cut", 70, 54, 58, 24], ["pass", 70, 50, 42, 64]]),
  t("Euro Step", "Offense", "A two-step layup move: step one direction, then take a long second step the other way around the defender.", [["x", 50, 26], ["foot", 50, 36, -30, "l"], ["foot", 40, 26, 20, "r"], ["cut", 52, 44, 50, 36], ["cut", 50, 34, 40, 24], ["shot", 40, 22]]),
  t("Crossover", "Offense", "Switching the dribble quickly from one hand to the other to change direction and beat a defender.", [["o", 50, 64, "1"], ["x", 50, 54], ["drib", 50, 64, 40, 56], ["drib", 40, 56, 62, 40]]),
  t("Step-Back", "Offense", "Pushing off your front foot to jump backward, creating space from the defender for a jump shot.", [["x", 50, 50], ["o", 50, 56, "1"], ["cut", 50, 58, 50, 70], ["o", 50, 72, ""], ["shot", 50, 72]]),
  t("Alley-Oop", "Offense", "A lob pass thrown near the rim that a teammate catches in mid-air and dunks or lays in before landing.", [["o", 50, 64, "1"], ["o", 20, 30, "5"], ["cut", 20, 30, 44, 12], ["pass", 50, 64, 48, 12, 60, 30]]),
  t("Outlet Pass", "Offense", "The first pass after a defensive rebound, thrown to a guard on the wing to start the break.", [["o", 40, 14, "5"], ["b", 43, 12], ["o", 12, 52, "1"], ["pass", 40, 14, 14, 48, 22, 26], ["cut", 12, 56, 12, 86]]),
  t("Skip Pass", "Offense", "A pass across the court over the defense, skipping the nearest teammate, to swing the ball quickly.", [["o", 16, 46, "2"], ["o", 84, 46, "3"], ["x", 26, 40], ["x", 62, 38], ["pass", 16, 46, 80, 46, 50, 30]]),
  t("Entry Pass", "Offense", "The pass from the perimeter into a post player or the key to start an action inside.", [["o", 16, 46, "2"], ["o", 30, 18, "5"], ["x", 34, 14], ["pass", 16, 46, 28, 22]]),
  t("Off-Ball Movement", "Offense", "Everything a player does without the ball: cutting, screening, relocating. It creates easy shots for the team.", [["o", 50, 64, "1"], ["b", 54, 64], ["o", 84, 46, "3"], ["cut", 84, 46, 92, 16], ["o", 16, 46, "2"], ["cut", 16, 46, 38, 22, 20, 30]]),

  // ---------------- Defense (14)
  t("Man-to-Man", "Defense", "Each defender is responsible for guarding one specific offensive player.", [["o", 50, 64, "1"], ["x", 50, 58], ["o", 16, 46, "2"], ["x", 22, 42], ["o", 84, 46, "3"], ["x", 78, 42], ["o", 30, 16, "4"], ["x", 36, 14], ["o", 70, 16, "5"], ["x", 64, 14]]),
  t("Zone Defense", "Defense", "Defenders guard areas of the floor instead of players. The 2-3 zone puts two up top and three along the baseline.", [["area", 20, 36, 28, 22], ["area", 52, 36, 28, 22], ["area", 8, 4, 26, 26], ["area", 37, 4, 26, 20], ["area", 66, 4, 26, 26], ["x", 34, 46], ["x", 66, 46], ["x", 20, 16], ["x", 50, 14], ["x", 80, 16]]),
  t("Help Defense", "Defense", "Leaving your man to stop a driving ball handler, then recovering back when the ball moves.", [["o", 50, 64, "1"], ["drib", 50, 64, 46, 30], ["x", 22, 40], ["cut", 22, 40, 40, 30], ["o", 12, 48, "2"]]),
  t("Closeout", "Defense", "Sprinting out to a shooter who just caught the ball, chopping your feet at the end to contest under control.", [["x", 40, 20], ["cut", 40, 20, 84, 38], ["o", 90, 42, "3"], ["b", 93, 40]]),
  t("Double Team", "Defense", "Two defenders guarding one ball handler at once to force a turnover or a rushed pass.", [["o", 70, 18, "5"], ["b", 73, 16], ["x", 64, 14], ["x", 76, 24], ["cut", 84, 44, 78, 26], ["ring", 70, 18, 10]]),
  t("Switch", "Defense", "On a screen, the two defenders swap assignments instead of fighting through.", [["o", 50, 64, "1"], ["o", 42, 58, "5"], ["x", 50, 70], ["x", 42, 52], ["screen", 40, 52, 44, 60], ["cut", 42, 52, 58, 52], ["cut", 50, 70, 44, 58]]),
  t("Hedge", "Defense", "The screener's defender jumps out aggressively at the ball handler to slow them, then recovers to their own man.", [["o", 50, 64, "1"], ["o", 42, 58, "5"], ["x", 44, 52], ["cut", 44, 52, 58, 60], ["cut", 58, 60, 44, 40, 54, 46]]),
  t("Drop Coverage", "Defense", "The big man drops back toward the paint on a pick and roll to protect the rim and give up the mid-range.", [["o", 50, 64, "1"], ["o", 42, 58, "5"], ["x", 46, 48], ["cut", 46, 48, 48, 28], ["zone", "paint"]]),
  t("Deny", "Defense", "Playing in the passing lane with a hand out to prevent your man from catching the ball.", [["o", 16, 46, "2"], ["x", 24, 44], ["o", 50, 64, "1"], ["pass", 50, 64, 26, 46], ["t", 34, 50, "DENIED", 4, "#FF5A5A"]]),
  t("Box Out", "Defense", "Making contact and sealing an opponent behind you with your body to secure position for a rebound.", [["x", 34, 22], ["o", 34, 30, "4"], ["x", 66, 22], ["o", 66, 30, "5"], ["miss", 60, 50]]),
  t("Full-Court Press", "Defense", "Pressuring the offense the entire length of the court, often trapping, to force turnovers.", [["o", 50, 90, "1"], ["x", 44, 86], ["x", 56, 86], ["x", 20, 74], ["x", 80, 74], ["x", 50, 58], ["zone", "backcourt"]]),
  t("Charge", "Defense", "An offensive foul when a ball handler runs into a defender who has already established legal position.", [["o", 50, 44, "1"], ["drib", 50, 60, 50, 38], ["x", 50, 32], ["whistle", "CHARGE"]]),
  t("Blocked Shot", "Defense", "A defender legally deflects a shot attempt before it reaches its peak on the way to the rim.", [["o", 40, 28, "2"], ["x", 46, 22], ["b", 44, 24], ["cut", 44, 24, 62, 40], ["t", 70, 46, "REJECTED", 4]]),
  t("Steal", "Defense", "Taking the ball away from an opponent by deflecting a pass or poking a dribble loose.", [["o", 16, 46, "2"], ["o", 50, 64, "1"], ["pass", 50, 64, 34, 55], ["x", 33, 54], ["drib", 33, 54, 33, 86]]),

  // ---------------- Shooting (12)
  t("Jump Shot", "Shooting", "A shot released at the top of a vertical jump. The most common way to score from outside.", [["o", 26, 34, "2"], ["shot", 26, 34]]),
  t("Layup", "Shooting", "A close-range, one-handed shot off the backboard after taking off from one foot.", [["drib", 70, 50, 58, 20], ["o", 56, 18, "2"], ["shot", 56, 18]]),
  t("Dunk", "Shooting", "Jumping and forcing the ball down through the hoop with one or both hands.", [["o", 50, 16, "5"], ["b", 50, 11], ["ring", 50, 10.5, 5], ["cut", 50, 30, 50, 20]]),
  t("Floater", "Shooting", "A soft, high-arcing one-handed shot released early in the lane over taller shot blockers.", [["o", 50, 32, "1"], ["x", 50, 20], ["shot", 50, 32], ["t", 70, 30, "HIGH & SOFT", 3.6]]),
  t("Hook Shot", "Shooting", "A one-handed shot with the body sideways to the rim, sweeping the arm over the head. Hard to block.", [["o", 36, 20, "5"], ["x", 42, 18], ["shot", 36, 20]]),
  t("Fadeaway", "Shooting", "A jump shot taken while leaning or jumping backward away from the defender.", [["x", 30, 22], ["o", 22, 30, "2"], ["cut", 26, 26, 18, 34], ["shot", 18, 34]]),
  t("Bank Shot", "Shooting", "A shot that hits the backboard first and ricochets into the hoop. Best from angles around 45 degrees.", [["o", 22, 30, "2"], ["pass", 22, 30, 48, 4], ["cut", 48, 4, 50, 10]]),
  t("Catch and Shoot", "Shooting", "Receiving a pass and shooting in one fluid motion without dribbling.", [["o", 84, 46, "3"], ["pass", 50, 64, 80, 48], ["shot", 84, 46], ["o", 50, 64, "1"]]),
  t("Pull-Up", "Shooting", "Stopping abruptly off the dribble and rising straight into a jump shot.", [["o", 50, 64, "1"], ["drib", 50, 64, 66, 40], ["o", 66, 38, ""], ["shot", 66, 38]]),
  t("Swish", "Shooting", "A made shot that goes through the rim without touching it or the backboard. Nothing but net.", [["o", 50, 60, "1"], ["shot", 50, 60], ["ring", 50, 10.5, 4], ["t", 50, 26, "NOTHING BUT NET", 3.6]]),
  t("Airball", "Shooting", "A shot that misses the rim, net and backboard completely.", [["o", 80, 56, "3"], ["miss", 80, 56], ["t", 60, 36, "AIRBALL", 4, "#FF5A5A"]]),
  t("Putback", "Shooting", "Grabbing an offensive rebound and scoring it immediately.", [["miss", 24, 30], ["o", 44, 20, "5"], ["cut", 56, 30, 46, 22], ["shot", 44, 20]]),

  // ---------------- Rules (15)
  t("Traveling", "Rules", "Taking too many steps without dribbling, or moving your pivot foot. Turnover.", [["foot", 44, 50, 0, "l"], ["foot", 52, 42, 0, "r"], ["foot", 44, 34, 0, "l"], ["foot", 52, 26, 0, "r"], ["whistle", "TRAVEL"]]),
  t("Double Dribble", "Rules", "Dribbling with both hands at once, or stopping your dribble and starting again. Turnover.", [["o", 50, 50, "1"], ["drib", 50, 72, 50, 54], ["b", 46, 48], ["b", 54, 48], ["whistle", "DOUBLE"]]),
  t("Shot Clock", "Rules", "The offense has 24 seconds (NBA/FIBA) or 30 seconds (NCAA) to attempt a shot that hits the rim.", [["o", 50, 64, "1"], ["b", 54, 64], ["clock", "24"]]),
  t("Three Seconds", "Rules", "An offensive player can't stay in the paint for more than three seconds while their team has the ball.", [["zone", "paint"], ["o", 50, 24, "5"], ["t", 50, 34, "1..2..3", 5, "#FF5A5A"]]),
  t("Backcourt Violation", "Rules", "Once the ball crosses half court, the offense can't bring it back into the backcourt.", [["zone", "halfcourt"], ["o", 50, 80, "1"], ["drib", 50, 80, 50, 92]]),
  t("Goaltending", "Rules", "Blocking a shot on its way down toward the rim or touching it above the cylinder. The basket counts.", [["x", 50, 14], ["b", 50, 8], ["ring", 50, 10.5, 6], ["whistle", "GOALTEND"]]),
  t("Personal Foul", "Rules", "Illegal physical contact with an opponent. Players foul out after 5 (NCAA/FIBA) or 6 (NBA).", [["o", 50, 34, "2"], ["x", 54, 30], ["ring", 52, 32, 7], ["whistle", "FOUL"]]),
  t("Technical Foul", "Rules", "A non-contact foul for unsportsmanlike conduct or certain violations. The other team gets a free throw.", [["o", 50, 43, ""], ["shot", 50, 41], ["whistle", "TECH"], ["t", 50, 60, "T", 12, "#FF3EA5"]]),
  t("Flagrant Foul", "Rules", "Unnecessary or excessive contact. Results in free throws plus possession, and can lead to ejection.", [["o", 50, 22, "2"], ["x", 44, 26], ["cut", 36, 32, 46, 24], ["whistle", "FLAGRANT"]]),
  t("And-One", "Rules", "Making a shot while being fouled. The basket counts and the shooter gets one free throw.", [["o", 54, 20, "2"], ["x", 48, 22], ["shot", 54, 20], ["whistle", "+1"]]),
  t("Free Throw", "Rules", "An unguarded shot from the free throw line worth one point, awarded after certain fouls.", [["o", 50, 43, "1"], ["shot", 50, 41], ["o", 30, 30, ""], ["x", 30, 22], ["o", 70, 30, ""], ["x", 70, 22]]),
  t("Jump Ball", "Rules", "The referee tosses the ball up between two players at center court to start the game.", [["o", 50, 88, "5"], ["x", 50, 80], ["b", 54, 84], ["ring", 50, 94, 12]]),
  t("Out of Bounds", "Rules", "When the ball or the player holding it touches the floor on or outside the boundary lines.", [["zone", "sideline"], ["zone", "baseline"], ["b", 99, 40], ["o", 94, 44, "3"]]),
  t("Five-Second Violation", "Rules", "Holding the ball for five seconds while closely guarded, or taking more than five seconds to inbound.", [["o", 99, 60, "1"], ["b", 97, 58], ["x", 92, 60], ["clock", "5"]]),
  t("Bonus", "Rules", "When a team exceeds the foul limit in a period, every opponent foul sends the fouled player to the line.", [["o", 50, 43, "1"], ["shot", 50, 41], ["t", 50, 64, "TEAM FOULS 5+", 4]]),

  // ---------------- Stats & Slang (11)
  t("Assist", "Stats & Slang", "A pass that leads directly to a teammate's made basket.", [["o", 50, 64, "1"], ["pass", 50, 64, 66, 22], ["o", 68, 20, "5"], ["shot", 68, 20]]),
  t("Rebound", "Stats & Slang", "Gaining possession of the ball after a missed shot. Offensive or defensive.", [["miss", 70, 50], ["o", 54, 18, "5"], ["x", 44, 22], ["ring", 54, 18, 6]]),
  t("Turnover", "Stats & Slang", "Losing possession to the other team without attempting a shot: bad pass, travel, steal, etc.", [["o", 16, 46, "2"], ["pass", 16, 46, 8, 90], ["b", 6, 92], ["t", 36, 80, "TURNOVER", 4, "#FF5A5A"]]),
  t("Double-Double", "Stats & Slang", "Reaching double figures (10+) in two statistical categories in one game, like points and rebounds.", [["t", 50, 54, "10 PTS", 8], ["t", 50, 68, "10 REB", 8]]),
  t("Triple-Double", "Stats & Slang", "Reaching double figures in three categories in one game, usually points, rebounds and assists.", [["t", 50, 48, "10 PTS", 7], ["t", 50, 62, "10 REB", 7], ["t", 50, 76, "10 AST", 7]]),
  t("Plus-Minus", "Stats & Slang", "The point differential for a team while a specific player is on the court.", [["t", 50, 60, "+12", 16, "#2EE59D"]]),
  t("Buzzer Beater", "Stats & Slang", "A shot released just before the clock expires that goes in after the buzzer sounds.", [["o", 50, 80, "1"], ["shot", 50, 80], ["clock", "0.0"]]),
  t("Sixth Man", "Stats & Slang", "The first player off the bench; a key reserve who often provides instant offense.", [["o", 20, 88, "6"], ["cut", 22, 86, 44, 66], ["o", 50, 64, ""], ["o", 16, 46, ""], ["o", 84, 46, ""], ["o", 30, 16, ""], ["o", 70, 16, ""]]),
  t("Handles", "Stats & Slang", "A player's ball-handling ability. 'He's got handles' means elite dribbling skill.", [["o", 50, 60, "1"], ["x", 50, 48], ["drib", 50, 72, 36, 58], ["drib", 36, 58, 64, 44]]),
  t("Brick", "Stats & Slang", "An ugly missed shot that clanks hard off the rim or backboard.", [["o", 20, 40, "2"], ["miss", 20, 40], ["t", 50, 34, "CLANK", 5, "#FF5A5A"]]),
  t("Ankle Breaker", "Stats & Slang", "A move so quick it makes the defender stumble or fall. Usually a crossover or step-back.", [["o", 60, 44, "1"], ["drib", 50, 60, 42, 52], ["drib", 42, 52, 60, 44], ["x", 48, 56], ["t", 36, 64, "DOWN", 4, "#FF5A5A"]]),
];

// The court-view comparison: sanity-check the count during development.
if (process.env.NODE_ENV !== "production" && TERMS.length !== 89) {
  // eslint-disable-next-line no-console
  console.warn("Dictionary term count:", TERMS.length);
}
export { PG, LW, RW, LC, RC, LB, RB, LE, RE };
