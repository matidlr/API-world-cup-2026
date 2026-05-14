import { Injectable } from '@nestjs/common';
import { MatchActionOutcome } from 'src/match/model/match-action-outcome.enum';

export type AppLocale = 'en' | 'es';
export interface TranslationParams {
  [key: string]: string | number | null | undefined;
}
export const DEFAULT_APP_LOCALE: AppLocale = 'en';
export const SUPPORTED_APP_LOCALES: ReadonlyArray<AppLocale> = ['en', 'es'];

const TURN_CONTEXT_VARIANTS_EN: Record<string, string[]> = {
  PASS: [
    '{playerName} threads a short pass for {teamName} in {zone}.',
    '{playerName} releases a quick pass to keep {teamName} moving in {zone}.',
    '{playerName} plays a calm pass and {teamName} keeps shape in {zone}.',
    '{playerName} slides a clean pass through the lane for {teamName} in {zone}.',
    '{playerName} combines with a first-touch pass for {teamName} in {zone}.',
    '{playerName} filters a measured pass and {teamName} advances in {zone}.',
    '{playerName} finds a teammate with a safe pass for {teamName} in {zone}.',
    '{playerName} links play with a precise pass for {teamName} in {zone}.',
    '{playerName} sends a smart pass and {teamName} controls the rhythm in {zone}.',
    '{playerName} recycles possession with a tidy pass for {teamName} in {zone}.',
  ],
  LONG_PASS: [
    '{playerName} launches a long pass for {teamName} from {zone}.',
    '{playerName} hits a diagonal long ball and stretches the play for {teamName}.',
    '{playerName} sends a deep pass to break lines for {teamName} in {zone}.',
    '{playerName} drives a long pass behind the defense for {teamName}.',
    '{playerName} switches the attack with a long pass for {teamName} in {zone}.',
    '{playerName} delivers a vertical long ball and {teamName} gains meters in {zone}.',
    '{playerName} clips a long pass into space for {teamName}.',
    '{playerName} pings a long pass and changes the tempo for {teamName} in {zone}.',
    '{playerName} chooses the direct route with a long pass for {teamName}.',
    '{playerName} lifts a long ball forward and {teamName} pushes up from {zone}.',
  ],
  DRIBBLE: [
    '{playerName} dribbles forward for {teamName} in {zone}.',
    '{playerName} beats one marker with a dribble for {teamName} in {zone}.',
    '{playerName} carries with close control and drives {teamName} ahead in {zone}.',
    '{playerName} weaves through pressure for {teamName} in {zone}.',
    '{playerName} glides past a challenge and keeps {teamName} alive in {zone}.',
    '{playerName} shifts direction and dribbles into space for {teamName} in {zone}.',
    '{playerName} uses skill to escape and progress for {teamName} in {zone}.',
    '{playerName} takes on the defender and wins ground for {teamName} in {zone}.',
    '{playerName} explodes with a dribble and opens the field for {teamName} in {zone}.',
    '{playerName} protects the ball and dribbles through the lane for {teamName} in {zone}.',
  ],
  CROSS: [
    '{playerName} whips in a cross for {teamName} from {zone}.',
    '{playerName} delivers a curling cross into the area for {teamName}.',
    '{playerName} sends a driven cross across goal for {teamName} in {zone}.',
    '{playerName} lifts a high cross toward the far post for {teamName}.',
    '{playerName} swings a dangerous cross into the box for {teamName}.',
    '{playerName} clips an early cross for {teamName} from {zone}.',
    '{playerName} picks out the area with a precise cross for {teamName}.',
    '{playerName} bends a cross into traffic for {teamName} in {zone}.',
    '{playerName} hangs a teasing cross for {teamName} from {zone}.',
    '{playerName} drives to the flank and crosses for {teamName} in {zone}.',
  ],
  SHOOT: [
    '{playerName} pulls the trigger for {teamName} from {zone}.',
    '{playerName} takes a sharp shot for {teamName} in {zone}.',
    '{playerName} lines it up and shoots for {teamName} from {zone}.',
    '{playerName} fires toward goal for {teamName} in {zone}.',
    '{playerName} goes for a quick finish for {teamName} from {zone}.',
    '{playerName} strikes the ball with intent for {teamName} in {zone}.',
    '{playerName} finds a window and shoots for {teamName} in {zone}.',
    '{playerName} attempts a direct finish for {teamName} from {zone}.',
    '{playerName} catches it early and shoots for {teamName} in {zone}.',
    '{playerName} unleashes a shot for {teamName} from {zone}.',
  ],
  ATTACK: [
    '{playerName} drives the attack for {teamName} in {zone}.',
    '{playerName} pushes forward and leads the move for {teamName} in {zone}.',
    '{playerName} accelerates the attack for {teamName} from {zone}.',
    '{playerName} attacks the space and carries {teamName} ahead in {zone}.',
    '{playerName} commits defenders and attacks for {teamName} in {zone}.',
    '{playerName} takes initiative and launches an attack for {teamName} in {zone}.',
    '{playerName} attacks directly and gives {teamName} momentum in {zone}.',
    '{playerName} breaks lines with an attacking run for {teamName} in {zone}.',
    '{playerName} leads a bold attacking sequence for {teamName} in {zone}.',
    '{playerName} turns and attacks quickly for {teamName} from {zone}.',
  ],
  HOLD: [
    '{playerName} slows it down and keeps possession for {teamName} in {zone}.',
    '{playerName} shields the ball and controls the pace for {teamName} in {zone}.',
    '{playerName} protects possession and lets {teamName} settle in {zone}.',
    '{playerName} pauses the play and holds the ball for {teamName} in {zone}.',
    '{playerName} keeps the ball under pressure for {teamName} in {zone}.',
    '{playerName} waits for support and retains possession for {teamName} in {zone}.',
    '{playerName} stabilizes the move and keeps {teamName} compact in {zone}.',
    '{playerName} controls the tempo and holds for {teamName} in {zone}.',
    '{playerName} secures possession and recycles the play for {teamName} in {zone}.',
    '{playerName} manages the rhythm with calm possession for {teamName} in {zone}.',
  ],
  PRESS: [
    '{playerName} presses aggressively for {teamName} in {zone}.',
    '{playerName} steps up to press and disrupts play for {teamName} in {zone}.',
    '{playerName} leads the high press for {teamName} in {zone}.',
    '{playerName} closes down quickly and pressures the ball for {teamName} in {zone}.',
    '{playerName} compresses space with pressure for {teamName} in {zone}.',
    '{playerName} hunts the ball and presses for {teamName} in {zone}.',
    '{playerName} applies immediate pressure for {teamName} in {zone}.',
    '{playerName} jumps the lane and presses hard for {teamName} in {zone}.',
    '{playerName} forces the rival under pressure for {teamName} in {zone}.',
    '{playerName} squeezes the play with intense pressing for {teamName} in {zone}.',
  ],
  DEFEND: [
    '{playerName} drops into shape and defends for {teamName} in {zone}.',
    '{playerName} protects the line and defends calmly for {teamName} in {zone}.',
    '{playerName} stays compact and defends for {teamName} in {zone}.',
    '{playerName} tracks back and secures defense for {teamName} in {zone}.',
    '{playerName} reads the play and defends wisely for {teamName} in {zone}.',
    '{playerName} holds position and defends the space for {teamName} in {zone}.',
    '{playerName} anchors the block and defends for {teamName} in {zone}.',
    '{playerName} stays disciplined and defends for {teamName} in {zone}.',
    '{playerName} stays between ball and goal to defend for {teamName} in {zone}.',
    '{playerName} times the retreat and defends effectively for {teamName} in {zone}.',
  ],
  TACKLE: [
    '{playerName} commits to a tackle for {teamName} in {zone}.',
    '{playerName} goes to ground with a tackle for {teamName} in {zone}.',
    '{playerName} challenges hard with a tackle for {teamName} in {zone}.',
    '{playerName} steps in and tackles for {teamName} in {zone}.',
    '{playerName} attempts a clean tackle for {teamName} in {zone}.',
    '{playerName} times a sliding tackle for {teamName} in {zone}.',
    '{playerName} attacks the ball with a tackle for {teamName} in {zone}.',
    '{playerName} dives into the challenge for {teamName} in {zone}.',
    '{playerName} wins ground with a forceful tackle for {teamName} in {zone}.',
    '{playerName} throws in a decisive tackle for {teamName} in {zone}.',
  ],
  BLOCK: [
    '{playerName} blocks the lane for {teamName} in {zone}.',
    '{playerName} closes spaces and blocks for {teamName} in {zone}.',
    '{playerName} cuts the passing route with a block for {teamName} in {zone}.',
    '{playerName} stands firm and blocks the path for {teamName} in {zone}.',
    '{playerName} reads the angle and blocks for {teamName} in {zone}.',
    '{playerName} shields the danger area and blocks for {teamName} in {zone}.',
    '{playerName} gets in front to block for {teamName} in {zone}.',
    '{playerName} narrows the channel and blocks for {teamName} in {zone}.',
    '{playerName} protects central space with a block for {teamName} in {zone}.',
    '{playerName} denies the route forward and blocks for {teamName} in {zone}.',
  ],
};

const TURN_CONTEXT_VARIANTS_ES: Record<string, string[]> = {
  PASS: [
    '{playerName} mete un pase corto para {teamName} en {zone}.',
    '{playerName} suelta un pase rápido y {teamName} se mueve en {zone}.',
    '{playerName} toca con calma y {teamName} conserva el orden en {zone}.',
    '{playerName} filtra un pase limpio para {teamName} en {zone}.',
    '{playerName} combina de primera y acelera a {teamName} en {zone}.',
    '{playerName} encuentra una línea de pase para {teamName} en {zone}.',
    '{playerName} conecta un pase seguro para {teamName} en {zone}.',
    '{playerName} enlaza la jugada con un pase preciso para {teamName} en {zone}.',
    '{playerName} mueve la pelota con criterio para {teamName} en {zone}.',
    '{playerName} administra la posesión con un pase simple para {teamName} en {zone}.',
  ],
  LONG_PASS: [
    '{playerName} lanza un pase largo para {teamName} desde {zone}.',
    '{playerName} cambia de frente con un pase largo para {teamName}.',
    '{playerName} mete un balón profundo para romper líneas con {teamName} en {zone}.',
    '{playerName} busca directo con un pase largo para {teamName}.',
    '{playerName} coloca un envío largo a la espalda de la defensa para {teamName}.',
    '{playerName} juega en vertical con un pase largo para {teamName} en {zone}.',
    '{playerName} levanta una pelota larga y gana metros para {teamName}.',
    '{playerName} pone un balón largo con precisión para {teamName} en {zone}.',
    '{playerName} elige el pase largo y activa a {teamName} desde {zone}.',
    '{playerName} saca un pase largo para acelerar la transición de {teamName}.',
  ],
  DRIBBLE: [
    '¡{playerName} encara con decisión y rompe líneas para {teamName} en {zone}!',
    '¡Qué gambeta metió {playerName}! Dejó pagando al rival y avanza {teamName} en {zone}.',
    '{playerName} lleva la pelota atada al pie y hace ilusionar a {teamName} en {zone}.',
    '¡¡Se escapó bárbaro {playerName}!! {teamName} mete miedo en {zone}.',
    '{playerName} cambia de ritmo y desarma toda la defensa rival para {teamName} en {zone}.',
    '¡Tremenda jugada individual de {playerName}! {teamName} se viene con peligro en {zone}.',
    '{playerName} desborda con categoría y {teamName} encuentra espacios en {zone}.',
    '¡Cómo se hamaca {playerName}! Gambetea rivales como si fueran muñecos y hace avanzar a {teamName} en {zone}.',
    '¡La tribuna se levanta con {playerName}! {teamName} acelera y gana terreno en {zone}.',
    '{playerName} amaga, engancha y deja rivales tirados mientras {teamName} avanza en {zone}.',
  ],
  CROSS: [
    '{playerName} tira un centro para {teamName} desde {zone}.',
    '{playerName} mete un centro con rosca para {teamName}.',
    '{playerName} lanza el centro al corazón del área para {teamName}.',
    '{playerName} coloca la pelota al segundo palo para {teamName}.',
    '¡Centro de {playerName}! {teamName} busca la cabeza en {zone}.',
    '{playerName} gana la banda y centra para {teamName} desde {zone}.',
    '{playerName} saca el centro temprano y {teamName} llega al área.',
    '{playerName} curva el centro al área para {teamName} en {zone}.',
    '{playerName} abre un espacio y tira un centro buscando para {teamName} en {zone}.',
    '¡Centro de {playerName}! {teamName} ataca el área desde {zone}.',
  ],
  SHOOT: [
    '¡¡Peligro de gol!!¡{playerName} se acomoda y saca un bombazo para {teamName} desde {zone}!',
    '¡¡Le pegó con el alma {playerName}!! {teamName} busca romper el arco desde {zone}.',
    '¡Atención que va {playerName}! Remate peligrosísimo para {teamName} en {zone}.',
    '{playerName} define de primera y hace temblar a la defensa rival para {teamName} en {zone}.',
    '¡¡Peligro de gol!! {playerName} mete un misil para {teamName} desde {zone}.',
    '{playerName} encuentra un hueco mínimo y prueba al arco para {teamName} en {zone}.',
    '¡Remata {playerName}! ¡La tribuna se levanta con este ataque de {teamName} en {zone}!',
    '{playerName} impacta de volea y {teamName} queda a centímetros del gol desde {zone}.',
    '¡{playerName} pisa el área con decisión y define para {teamName} en {zone}!',
    '¡¡La clavó fuerte {playerName}!! {teamName} obliga al arquero a lucirse desde {zone}.',
  ],
  ATTACK: [
    '{playerName} lidera el ataque de {teamName} en {zone}.',
    '{playerName} acelera hacia adelante y lanza a {teamName} en {zone}.',
    '{playerName} toma la iniciativa y ataca para {teamName} en {zone}.',
    '{playerName} ataca el espacio y empuja a {teamName} en {zone}.',
    '{playerName} rompe líneas y activa a {teamName} en {zone}.',
    '{playerName} encara con decisión para {teamName} en {zone}.',
    '{playerName} conduce ofensivamente y gana terreno para {teamName} en {zone}.',
    '{playerName} acelera la jugada de ataque para {teamName} en {zone}.',
    '{playerName} toma metros en ataque para {teamName} en {zone}.',
    '{playerName} impulsa una ofensiva directa para {teamName} desde {zone}.',
  ],
  HOLD: [
    '{playerName} pausa la jugada y mantiene la posesión para {teamName} en {zone}.',
    '{playerName} protege la pelota y controla el ritmo para {teamName} en {zone}.',
    '{playerName} retiene bajo presión y ordena a {teamName} en {zone}.',
    '{playerName} asegura la posesión para que {teamName} respire en {zone}.',
    '{playerName} enfría el juego y sostiene a {teamName} en {zone}.',
    '{playerName} espera apoyos y conserva para {teamName} en {zone}.',
    '{playerName} administra tiempos con pelota para {teamName} en {zone}.',
    '{playerName} cuida la jugada y mantiene compacto a {teamName} en {zone}.',
    '{playerName} baja revoluciones y sostiene la posesión de {teamName} en {zone}.',
    '{playerName} controla la pelota y le da aire a {teamName} en {zone}.',
  ],
  PRESS: [
    '¡¡{playerName} va con todo a la presión!! {teamName} aprieta arriba en {zone}.',
    '{playerName} sale a morder y {teamName} juega al límite en {zone}.',
    '¡{playerName} no lo deja pensar! {teamName} ahoga la salida rival en {zone}.',
    '¡¡Qué presión mete {playerName}!! {teamName} encierra al rival en {zone}.',
    '{playerName} lidera la presión alta y {teamName} empuja con toda la gente en {zone}.',
    '¡{playerName} va al robo con una intensidad tremenda! {teamName} busca recuperar rápido en {zone}.',
    '{playerName} tapa todos los caminos y {teamName} asfixia al rival en {zone}.',
    '¡¡Aprieta todo {teamName}!! {playerName} marca el ritmo de la presión en {zone}.',
    '{playerName} presiona y mete cuerpo y corazón en cada pelota mientras {teamName} en {zone}.',
    '{playerName} encabeza una presión feroz de {teamName} en {zone}.',
  ],
  DEFEND: [
    '{playerName} se planta firme y {teamName} cierra atrás en {zone}.',
    '{playerName} retrocede bien y {teamName} se ordena en {zone}.',
    '{playerName} cubre el espacio y {teamName} aguanta en {zone}.',
    '{playerName} marca al hombre y {teamName} no da ventaja en {zone}.',
    '{playerName} se planta firme lee la jugada y {teamName} defiende con criterio en {zone}.',
    '{playerName} anticipa el movimiento y {teamName} queda bien parado en {zone}.',
    '{playerName} mantiene la línea y {teamName} no cede terreno en {zone}.',
    '{playerName} se acomoda y {teamName} resiste la presión en {zone}.',
    '{playerName} vuelve al bloque y {teamName} se organiza en {zone}.',
    '¡{playerName} está ahí! {teamName} defiende con orden en {zone}.',
  ],
  TACKLE: [
    '¡{playerName} mete una barrida para {teamName} en {zone}!',
    '{playerName} se tira al piso con decisión para {teamName} en {zone}.',
    '{playerName} se barre y llega justo para {teamName} en {zone}.',
    '¡{playerName} se barre y se juega entero! {teamName} intenta recuperar en {zone}.',
    '{playerName} mete la pierna fuerte y busca la pelota para {teamName} en {zone}.',
    '{playerName} va a fondo con la barrida para {teamName} en {zone}.',
    '{playerName} ataca la pelota en el piso para {teamName} en {zone}.',
    '¡Entrada fuerte de {playerName}! {teamName} lucha en {zone}.',
    '{playerName} se juega con una barrida para {teamName} en {zone}.',
    '{playerName} corta el avance del rival y barre para {teamName} en {zone}.',
  ],
  BLOCK: [
    '{playerName} cierra espacios para {teamName} en {zone}.',
    '{playerName} tapa la línea de pase para {teamName} en {zone}.',
    '{playerName} se interpone y bloquea el avance para {teamName} en {zone}.',
    '{playerName} achica el espacio y corta la circulación para {teamName} en {zone}.',
    '{playerName} se para firme y bloquea para {teamName} en {zone}.',
    '{playerName} lee el movimiento rival y cierra el hueco para {teamName} en {zone}.',
    '{playerName} cubre el centro y bloquea para {teamName} en {zone}.',
    '{playerName} se coloca bien y anula la chance para {teamName} en {zone}.',
    '¡{playerName} achica el espacio  y {teamName} corta el avance del rival en {zone}.',
    '{playerName} corta la acción rival y {teamName} retoma el control en {zone}.',
  ],
};

const TURN_RESULT_ACTIONS: string[] = [
  'ATTACK',
  'HOLD',
  'PRESS',
  'LONG_PASS',
  'SHOOT',
  'PASS',
  'DRIBBLE',
  'CROSS',
  'DEFEND',
  'LEFT',
  'RIGHT',
  'CENTER',
  'PICAR',
  'DIVE_LEFT',
  'DIVE_RIGHT',
  'STAY_CENTER',
  'WAIT',
  'BLOCK',
  'TACKLE',
];

const TURN_CONTEXT_ACTION_LABELS_EN: Record<string, string> = {
  ATTACK: 'a fearless attacking burst',
  HOLD: 'a calm possession reset',
  PRESS: 'a relentless pressing wave',
  LONG_PASS: 'a bold long pass',
  SHOOT: 'a decisive shot',
  PASS: 'a razor-sharp pass',
  DRIBBLE: 'a daring dribble',
  CROSS: 'a dangerous cross',
  DEFEND: 'a disciplined defensive stand',
  LEFT: 'a penalty aimed at the left corner',
  RIGHT: 'a penalty aimed at the right corner',
  CENTER: 'a penalty fired down the middle',
  PICAR: 'a chipped Panenka attempt',
  DIVE_LEFT: 'a full-stretch dive to the left',
  DIVE_RIGHT: 'a full-stretch dive to the right',
  STAY_CENTER: 'a brave hold in the center',
  WAIT: 'a delayed read waiting for the kick',
  BLOCK: 'a wall-like block',
  TACKLE: 'a crunching tackle',
};

const TURN_CONTEXT_ACTION_LABELS_ES: Record<string, string> = {
  ATTACK: 'una arremetida con todo',
  HOLD: 'una pausa para administrar',
  PRESS: 'una presión intensa',
  LONG_PASS: 'un pase largo de pelota dividida',
  SHOOT: 'un remate al arco',
  PASS: 'un pase de conjunto',
  DRIBBLE: 'una gambeta de calidad',
  CROSS: 'un centro al área',
  DEFEND: 'una intervención defensiva',
  LEFT: 'un penal a la izquierda',
  RIGHT: 'un penal a la derecha',
  CENTER: 'un penal al centro',
  PICAR: 'un penal picado',
  DIVE_LEFT: 'una estirada a la izquierda',
  DIVE_RIGHT: 'una estirada a la derecha',
  STAY_CENTER: 'una espera firme en el centro',
  WAIT: 'una pausa para leer el remate',
  BLOCK: 'un bloqueo defensivo',
  TACKLE: 'una barrida decisiva',
};

const CONTEXT_EPIC_TAILS_EN: string[] = [
  'The crowd roars with every touch.',
  'The stadium shakes as the move ignites.',
  'Momentum swings and the pressure climbs.',
  'You can feel the final burning hotter.',
  'Every second feels decisive now.',
  'The tempo explodes and tension rises.',
  'This is pure knockout drama.',
  'The stands erupt as the play unfolds.',
  'One move can change football history here.',
  'The rivals are on the edge of collapse.',
  'It is a moment worthy of a world final.',
  'The atmosphere is absolutely electric.',
  'The whole bench is on its feet.',
  'The match tilts on this action.',
  'Epic intensity takes over the stadium.',
];

const CONTEXT_EPIC_TAILS_ES: string[] = [
  '¡Mamita lo que se está jugando acá!',
  '¡Aguante corazón aguante!',
  '¡Se juega como una verdadera final!',
  '¡La tribuna es una caldera!',
  '¡Acá no se guarda nada nadie!',
  '¡Qué partido bravo estamos viendo!',
  '¡En cada pelota, se mete con el cuchillo entre los dientes!',
  '¡La presión es total, esto está para cualquiera!',
  '¡Hay olor a hazaña en el aire!',
  '¡Esto es para valientes!',
  '¡Qué clima infernal se vive en la cancha!',
  '¡Cada pelota se disputa como la última!',
  '¡La hinchada empuja como nunca!',
  '¡Se está jugando al límite total!',
  '¡La final del mundial se vive en su máxima expresión!',
];

const RESULT_SUCCESS_EPIC_TAILS_EN: string[] = [
  'The attack keeps pulsing at full speed.',
  'This could become the turning point.',
  'The pressure meter keeps climbing.',
  'A roar echoes through the stands.',
  'The rivals are forced to survive.',
  'The sequence still has real danger.',
  'The rhythm belongs to them now.',
  'The final feels one step away.',
  'The team smells blood in this phase.',
  'The crowd believes this can end in glory.',
  'The move keeps the rival under siege.',
  'The emotional momentum keeps growing.',
  'The chance lives and the noise rises.',
  'Control is turning into threat.',
  'This passage screams world-final drama.',
];

const RESULT_FAIL_EPIC_TAILS_EN: string[] = [
  'The rival survives by a hair.',
  'The crowd gasps after the missed edge.',
  'A huge chance slips through their fingers.',
  'They will have to rebuild under pressure.',
  'That sequence deserved a better finish.',
  'The final keeps punishing every mistake.',
  'The rival escapes this storm for now.',
  'A painful miss in a massive moment.',
  'The bench cannot believe that outcome.',
  'The game remains on a knife edge.',
  'One detail denied a defining blow.',
  'They are forced to reset quickly.',
  'The momentum stutters at the worst time.',
  'A critical phase ends without reward.',
  'Drama rises as the chance evaporates.',
];

const RESULT_SUCCESS_EPIC_TAILS_ES: string[] = [
  '¡Se viene, se viene el gol!',
  '¡El rival está contra las cuerdas!',
  '¡El rival está sintiendo el golpe!',
  '¡Ahora sí, el partido está para romperlo!',
  '¡La cancha se viene abajo con este envión!',
  '¡Hay olor a gol en el área!',
  '¡Hay que aprovechar este momento, la vida en cada jugada!',
  '¡El arco rival está temblando!',
  '¡Se juega en una sola mitad de cancha!',
  '¡El rival no sabe de dónde agarrarse!',
  '¡Qué presión mete este equipo!',
  '¡Están todos enchufados ahora!',
  '¡Cada ataque parece medio gol!',
  '¡La hincahda empuja y el equipo responde!',
  '¡Ojo que acá puede aparecer la jugada del partido!',
];

const RESULT_FAIL_EPIC_TAILS_ES: string[] = [
  '¡El rival se la lleva y hay que volver!',
  'Se perdió la pelota en el peor momento.',
  '¡Hay que reorganizarse rápido!',
  'Una chance que no se puede desaprovechar así.',
  'Duele. Pero queda partido.',
  '¡Qué error en un momento clave!',
  'El rival aprovecha cada equivocación.',
  '¡No puede ser! Se perdió una ocasión clara.',
  'Hay que levantarse y volver a intentarlo.',
  'El rival no perdona y ya salió.',
  '¡Se viene el peligro si no se ordena!',
  'Un detalle puede cambiar el partido.',
  '¡Qué golpe anímico en esta fase!',
  'Queda poco margen para el error.',
  '¡Hay que sacudir la cabeza y volver!',
];

const OUTCOME_EPIC_TAILS_EN: string[] = [
  'The stadium cannot sit down.',
  'Every heartbeat feels louder now.',
  'The final narrative keeps escalating.',
  'Another chapter of pure drama unfolds.',
  'The pressure is now unbearable.',
  'This is football at its most ruthless.',
  'Tactical nerves are visible on both benches.',
  'The crowd senses a decisive swing.',
  'No one breathes in this phase.',
  'The world title hangs on tiny details.',
  'Intensity keeps climbing in every duel.',
  'A huge emotional wave runs through the field.',
  'The margin for error is gone.',
  'A legendary finish is being written.',
  'This sequence is pure epic football.',
];

const OUTCOME_EPIC_TAILS_ES: string[] = [
  '¡El estadio explota con cada jugada!',
  '¡Nadie puede creer lo que está pasando!',
  '¡Qué partido, qué encuentro!',
  '¡Se vive con el corazón en la garganta!',
  '¡La presión es insoportable!',
  '¡Esto es fútbol de clase mundial!',
  '¡El banco de suplentes lo vive con total nerviosismo!',
  '¡Un giro decisivo puede cambiar todo!',
  '¡Nadie se mueve en las tribunas!',
  '¡El título se decide en segundos!',
  '¡Cada duelo define el partido!',
  '¡La locura es total!',
  '¡No hay margen para equivocarse!',
  '¡Se está escribiendo una final para la historia!',
  '¡Puro fútbol, pura pasión!',
];

function expandVariantsWithTails(
  variants: string[],
  minimum: number,
  tails: string[],
): string[] {
  const base = variants.length > 0 ? variants : ['{teamName} complete the action.'];
  const expanded = [...base];
  let index = 0;

  while (expanded.length < minimum) {
    const seed = base[index % base.length];
    const tail = tails[index % tails.length];
    expanded.push(`${seed} ${tail}`);
    index += 1;
  }

  return expanded.slice(0, minimum);
}

function ensureContextVariantsByAction(
  variantsByAction: Record<string, string[]>,
  locale: AppLocale,
  minimum: number,
): Record<string, string[]> {
  const labels = locale === 'en' ? TURN_CONTEXT_ACTION_LABELS_EN : TURN_CONTEXT_ACTION_LABELS_ES;
  const tails = locale === 'en' ? CONTEXT_EPIC_TAILS_EN : CONTEXT_EPIC_TAILS_ES;

  const completed: Record<string, string[]> = {};
  TURN_RESULT_ACTIONS.forEach((action) => {
    const base = [...(variantsByAction[action] ?? [])];
    if (base.length === 0) {
      if (locale === 'en') {
        base.push(
          `{playerName} executes ${labels[action] ?? 'a decisive action'} for {teamName} in {zone}.`,
        );
      } else {
        base.push(
          `{playerName} ejecuta ${labels[action] ?? 'una acción decisiva'} para {teamName} en {zone}.`,
        );
      }
    }

    completed[action] = expandVariantsWithTails(base, minimum, tails);
  });

  return completed;
}

function ensureTurnResultVariantsByAction(
  variantsByAction: Record<string, { success: string[]; fail: string[] }>,
  locale: AppLocale,
  minimum: number,
): Record<string, { success: string[]; fail: string[] }> {
  const successTails = locale === 'en' ? RESULT_SUCCESS_EPIC_TAILS_EN : RESULT_SUCCESS_EPIC_TAILS_ES;
  const failTails = locale === 'en' ? RESULT_FAIL_EPIC_TAILS_EN : RESULT_FAIL_EPIC_TAILS_ES;

  const completed: Record<string, { success: string[]; fail: string[] }> = {};
  TURN_RESULT_ACTIONS.forEach((action) => {
    const actionVariants = variantsByAction[action] ?? { success: [], fail: [] };
    completed[action] = {
      success: expandVariantsWithTails(actionVariants.success, minimum, successTails),
      fail: expandVariantsWithTails(actionVariants.fail, minimum, failTails),
    };
  });

  return completed;
}

function ensureOutcomeVariants(
  variantsByOutcome: Record<MatchActionOutcome, string[]>,
  locale: AppLocale,
  minimum: number,
): Record<MatchActionOutcome, string[]> {
  const tails = locale === 'en' ? OUTCOME_EPIC_TAILS_EN : OUTCOME_EPIC_TAILS_ES;
  const completed = {} as Record<MatchActionOutcome, string[]>;

  (Object.keys(variantsByOutcome) as MatchActionOutcome[]).forEach((outcome) => {
    completed[outcome] = expandVariantsWithTails(variantsByOutcome[outcome], minimum, tails);
  });

  return completed;
}

function createTurnResultVariantsByAction(
  actions: string[],
  variantsByCategory: {
    shoot: { success: string[]; fail: string[] };
    pass: { success: string[]; fail: string[] };
    control: { success: string[]; fail: string[] };
    defense: { success: string[]; fail: string[] };
  },
): Record<string, { success: string[]; fail: string[] }> {
  const variantsByAction: Record<string, { success: string[]; fail: string[] }> = {};
  const shootActions = new Set(['SHOOT', 'LEFT', 'RIGHT', 'CENTER', 'PICAR']);
  const passActions = new Set(['PASS', 'LONG_PASS', 'CROSS']);
  const defenseActions = new Set([
    'PRESS',
    'DEFEND',
    'TACKLE',
    'BLOCK',
    'WAIT',
    'DIVE_LEFT',
    'DIVE_RIGHT',
    'STAY_CENTER',
  ]);

  actions.forEach((action) => {
    let category: keyof typeof variantsByCategory = 'control';
    if (shootActions.has(action)) {
      category = 'shoot';
    } else if (passActions.has(action)) {
      category = 'pass';
    } else if (defenseActions.has(action)) {
      category = 'defense';
    }

    variantsByAction[action] = {
      success: [...variantsByCategory[category].success],
      fail: [...variantsByCategory[category].fail],
    };
  });

  return variantsByAction;
}

const TURN_RESULT_VARIANTS_EN = createTurnResultVariantsByAction(
  TURN_RESULT_ACTIONS,
  {
    shoot: {
      success: [
        '{teamName} keep the attack alive after the attempt.',
        '{teamName} force a rebound and continue pressing.',
        '{teamName} generate a second action after the finish.',
        '{teamName} sustain pressure after the shot sequence.',
      ],
      fail: [
        '{teamName} finish the play, but {opponentTeamName} block the attempt.',
        '{teamName} cannot beat the goalkeeper after the shot.',
        '{teamName} miss the target and the chance is gone.',
        '{teamName} shoot, but the defense prevents the goal.',
      ],
    },
    pass: {
      success: [
        '{teamName} connect the move and keep possession.',
        '{teamName} progress the play with a clean sequence.',
        '{teamName} find space and continue with the ball.',
        '{teamName} complete the circulation and stay in control.',
      ],
      fail: [
        '{teamName} try to move the ball, but {opponentTeamName} cut the line.',
        '{teamName} force the pass and the move loses precision.',
        '{teamName} cannot complete the sequence under pressure.',
        '{teamName} attempt the pass, but the rival reads it in time.',
      ],
    },
    control: {
      success: [
        '{teamName} execute the action and maintain control of the play.',
        '{teamName} resolve the move well and keep momentum.',
        '{teamName} sustain the sequence and stay on the ball.',
        '{teamName} turn the action into territorial advantage.',
      ],
      fail: [
        '{teamName} try to impose rhythm, but {opponentTeamName} neutralize the play.',
        '{teamName} cannot convert the action into a clear advantage.',
        '{teamName} lose sharpness in the final phase of the move.',
        '{teamName} attempt the action, but the rival contains it.',
      ],
    },
    defense: {
      success: [
        '{teamName} defend well and recover possession.',
        '{teamName} win the duel and stop the rival progression.',
        '{teamName} close the space and regain control.',
        '{teamName} break the rival sequence with a solid defensive action.',
      ],
      fail: [
        '{teamName} cannot win the challenge and {opponentTeamName} keep possession.',
        '{teamName} arrive late to the duel and the rival escapes.',
        '{teamName} try to defend, but {opponentTeamName} keep the initiative.',
        '{teamName} are bypassed in the action and must reorganize.',
      ],
    },
  },
);

const TURN_RESULT_VARIANTS_ES = createTurnResultVariantsByAction(
  TURN_RESULT_ACTIONS,
  {
    shoot: {
      success: [
        '¡{teamName} mantiene el peligro tras el disparo!',
        '¡{teamName} fuerza un rebote y sigue atacando!',
        '¡La pelota sigue viva y {teamName} genera una segunda jugada tras el remate!',
        '¡{teamName} presiona y mantiene viva la chance de gol!',
      ],
      fail: [
        '{teamName} remata pero {opponentTeamName} lo detiene.',
        '{teamName} no puede superar al arquero y se pierde la chance.',
        '{teamName} dispara desviado y la ocasión se esfuma.',
        '{teamName} patea pero la defensa lo impide. Hay que seguir.',
      ],
    },
    pass: {
      success: [
        '¡{teamName} conecta bien y mantiene la pelota!',
        '¡{teamName} progresa con pases limpios y no para!',
        '¡{teamName} encuentra espacio y sigue con la pelota!',
        '¡{teamName} circula bien y domina el ritmo del partido!',
      ],
      fail: [
        '{teamName} intenta el pase pero {opponentTeamName} corta.',
        '{teamName} fuerza el pase y pierde la pelota.',
        '{teamName} no puede completar el pase bajo presión.',
        '{teamName} intenta la habilitación pero el rival la lee.',
      ],
    },
    control: {
      success: [
        '¡{teamName} ejecuta bien la jugada y mantiene el control!',
        '¡{teamName} resuelve la jugada y sigue en el partido!',
        '¡{teamName} conserva la pelota y el ritmo!',
        '¡{teamName} convierte la acción en ventaja territorial!',
      ],
      fail: [
        '{teamName} intenta imponerse pero {opponentTeamName} responde.',
        '{teamName} no logra controlar la pelota y la pierde.',
        '{teamName} pierde precisión en el momento clave.',
        '{teamName} intenta controlar la pelota pero {opponentTeamName} lo contiene.',
      ],
    },
    defense: {
      success: [
        '¡{teamName} defiende bien y recupera la pelota!',
        '¡{teamName} gana el duelo y frena el avance rival!',
        '¡{teamName} cierra espacios y vuelve a controlar la pelota!',
        '¡{teamName} rompe la jugada rival con una acción sólida!',
      ],
      fail: [
        '{teamName} no llega al duelo y {opponentTeamName} se va con la pelota.',
        '{teamName} llega tarde al cruce y el rival supera la marca.',
        '{teamName} intenta defender pero {opponentTeamName} se queda con la pelota.',
        '{teamName} queda superado en la marca. {opponentTeamName} maneja la pelota. Hay que reordenarse.',
      ],
    },
  },
);

const TURN_RESULT_OUTCOME_VARIANTS_EN: Record<MatchActionOutcome, string[]> = {
  [MatchActionOutcome.PASS_SUCCESS_PROGRESS]: [
    '{teamName} complete the pass and move the attack forward.',
    '{teamName} link up well and progress into better space.',
    '{teamName} keep the ball moving with a successful passing sequence.',
    '{teamName} break a line with the pass and stay in control.',
    '{teamName} connect the pass cleanly and gain territory.',
  ],
  [MatchActionOutcome.PASS_INTERCEPTED]: [
    '{teamName} attempt the pass, but {opponentTeamName} intercept in time.',
    '{teamName} force the pass and {opponentTeamName} read it early.',
    '{teamName} lose precision and {opponentTeamName} cut the lane.',
    '{teamName} cannot complete the pass under pressure from {opponentTeamName}.',
    '{teamName} see the pass blocked and {opponentTeamName} recover.',
  ],
  [MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS]: [
    '{teamName} hit the long pass with quality and progress the play.',
    '{teamName} find depth with the long ball and keep momentum.',
    '{teamName} switch quickly with a long pass and gain meters.',
    '{teamName} deliver a precise long pass to continue attacking.',
    '{teamName} use the long ball effectively and stay on top of the action.',
  ],
  [MatchActionOutcome.LONG_PASS_LOST]: [
    '{teamName} overhit the long pass and hand possession away.',
    '{teamName} try direct play, but {opponentTeamName} win the second ball.',
    '{teamName} miss the target with the long pass and lose control.',
    '{teamName} cannot connect the long ball and {opponentTeamName} recover.',
    '{teamName} go long, but the play breaks down under pressure.',
  ],
  [MatchActionOutcome.DRIBBLE_WON]: [
    '{teamName} win the one-on-one and continue forward.',
    '{teamName} beat the marker and keep driving the move.',
    '{teamName} execute the dribble and preserve attacking rhythm.',
    '{teamName} escape pressure with skill and keep possession.',
    '{teamName} win the duel on the dribble and gain ground.',
  ],
  [MatchActionOutcome.DRIBBLE_LOST]: [
    '{teamName} lose the dribble duel and {opponentTeamName} take over.',
    '{teamName} are stopped in the one-on-one by {opponentTeamName}.',
    '{teamName} cannot get past the marker and lose the ball.',
    '{teamName} overrun the dribble and {opponentTeamName} recover.',
    '{teamName} are dispossessed after the dribble attempt.',
  ],
  [MatchActionOutcome.PRESS_WON]: [
    '{teamName} press high, win the duel, and recover possession.',
    '{teamName} force the error and take the ball back immediately.',
    '{teamName} execute the press perfectly and regain control.',
    '{teamName} trap the opponent and recover the ball in phase.',
    '{teamName} break the opponent buildup and recover possession.',
  ],
  [MatchActionOutcome.PRESS_LOST]: [
    '{teamName} press but arrive late; {opponentTeamName} play through.',
    '{teamName} cannot sustain the pressure and {opponentTeamName} keep the ball.',
    '{teamName} jump to press, but {opponentTeamName} escape.',
    '{teamName} are bypassed by the first line and lose the duel.',
    '{teamName} fail to recover from pressure and {opponentTeamName} stay in control.',
  ],
  [MatchActionOutcome.TACKLE_WON]: [
    '{teamName} time the tackle and recover possession cleanly.',
    '{teamName} win the challenge and stop the rival attack.',
    '{teamName} step in strongly and come away with the ball.',
    '{teamName} make the tackle stick and retake control.',
    '{teamName} shut down the move with a successful tackle.',
  ],
  [MatchActionOutcome.TACKLE_LOST]: [
    '{teamName} miss the tackle and {opponentTeamName} continue the move.',
    '{teamName} go to ground, but {opponentTeamName} keep possession.',
    '{teamName} cannot complete the tackle and are beaten in the duel.',
    '{teamName} are late on the tackle and lose the phase.',
    '{teamName} fail to win the challenge; {opponentTeamName} stay on the ball.',
  ],
  [MatchActionOutcome.DEFEND_HOLD]: [
    '{teamName} hold the defensive line and recover control.',
    '{teamName} defend compactly and stop the rival sequence.',
    '{teamName} keep shape and regain the ball.',
    '{teamName} read the play well and break up the attack.',
    '{teamName} close lanes and come out with possession.',
  ],
  [MatchActionOutcome.DEFEND_BROKEN]: [
    '{teamName} cannot hold the line and {opponentTeamName} keep attacking.',
    '{teamName} are stretched defensively and lose control of the phase.',
    '{teamName} defend but {opponentTeamName} find a way through.',
    '{teamName} fail to contain the move; {opponentTeamName} remain on the ball.',
    '{teamName} are forced back as {opponentTeamName} sustain pressure.',
  ],
  [MatchActionOutcome.ATTACK_PROGRESS]: [
    '{teamName} push the attack forward and gain ground.',
    '{teamName} attack with intent and move into a better zone.',
    '{teamName} carry momentum in attack and keep advancing.',
    '{teamName} break lines with the attacking move.',
    '{teamName} sustain offensive rhythm and progress play.',
  ],
  [MatchActionOutcome.ATTACK_STALLED]: [
    '{teamName} attack with numbers but cannot create an opening.',
    '{teamName} run into traffic and the move stalls.',
    '{teamName} attack, yet the sequence loses pace.',
    '{teamName} cannot turn the attack into a clear chance.',
    '{teamName} push forward but fail to improve the position.',
  ],
  [MatchActionOutcome.HOLD_STABLE]: [
    '{teamName} keep the ball calmly and manage the tempo.',
    '{teamName} protect possession and reset the shape.',
    '{teamName} control the phase without forcing the play.',
    '{teamName} circulate safely and keep command of the turn.',
    '{teamName} settle the sequence and stay in control.',
  ],
  [MatchActionOutcome.HOLD_LOST]: [
    '{teamName} try to hold possession, but {opponentTeamName} take it away.',
    '{teamName} cannot protect the ball and lose control.',
    '{teamName} slow the play, but {opponentTeamName} recover.',
    '{teamName} are dispossessed while trying to manage tempo.',
    '{teamName} fail to shield the ball and concede possession.',
  ],
  [MatchActionOutcome.CROSS_CONNECTED]: [
    '{teamName} deliver the cross and keep the move alive in the box.',
    '{teamName} find a teammate with the cross and stay on the attack.',
    '{teamName} put in a dangerous cross and keep pressure on.',
    '{teamName} connect the cross and sustain threat near goal.',
    '{teamName} swing it in well and retain attacking control.',
  ],
  [MatchActionOutcome.CROSS_CLEARED]: [
    '{teamName} send the cross, but {opponentTeamName} clear decisively.',
    '{teamName} cannot connect the cross and lose the second ball.',
    '{teamName} are denied in the air as {opponentTeamName} clear.',
    '{teamName} see the cross cut out and possession turns over.',
    '{teamName} whip it in, but {opponentTeamName} deal with danger.',
  ],
  [MatchActionOutcome.SHOOT_USER_GOAL]: [
    'Ohhh yes! Goal! {teamName} finish clinically and find the back of the net!',
    'What a goal! {teamName} convert the chance with a brilliant finish!',
    'It’s in! Goal for {teamName}! They make the shot count in style!',
    'GOAL! GOAL! {teamName} punish the defense with a deadly finish!',
    'Ohhh yes! {teamName} turn the chance into a massive goal!',
  ],
  [MatchActionOutcome.SHOOT_OPPONENT_GOAL]: [
    '{opponentTeamName} score and leave {teamName} stunned.',
    '{opponentTeamName} punish the mistake and hit the net.',
    '{opponentTeamName} strike with precision and hurt {teamName}.',
    '{opponentTeamName} convert the chance and silence the crowd.',
    '{opponentTeamName} find the finish and put {teamName} under pressure.',
  ],
  [MatchActionOutcome.SHOOT_BLOCKED_REBOUND_FOR]: [
    '{teamName} see the shot blocked, but keep the rebound.',
    '{teamName} are denied by a block and recover the second ball.',
    '{teamName} hit traffic, yet stay alive on the rebound.',
    '{teamName} have the shot blocked and keep pressing after the rebound.',
    '{teamName} cannot beat the first defender, but retain possession.',
  ],
  [MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST]: [
    '{teamName} shoot into a block and {opponentTeamName} clear the rebound.',
    '{teamName} have the shot blocked and lose the second ball.',
    '{teamName} cannot get through and {opponentTeamName} win the rebound.',
    '{teamName} are denied by the block and {opponentTeamName} recover.',
    '{teamName} see the chance blocked out and possession turns over.',
  ],
  [MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR]: [
    '{teamName} force a save, then react first to keep the rebound.',
    '{teamName} test the goalkeeper and stay alive on the second ball.',
    '{teamName} are denied by the keeper but recover possession quickly.',
    '{teamName} create a save and keep pressure with the rebound.',
    '{teamName} cannot score first time, but hold the rebound phase.',
  ],
  [MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST]: [
    '{teamName} are denied by the goalkeeper and lose the rebound.',
    '{teamName} force a save, but {opponentTeamName} secure the second ball.',
    '{teamName} cannot beat the keeper and {opponentTeamName} reset possession.',
    '{teamName} hit a strong shot, yet the goalkeeper controls the rebound phase.',
    '{teamName} fail to convert and {opponentTeamName} recover after the save.',
  ],
  [MatchActionOutcome.SHOOT_MISSED]: [
    '{teamName} miss the target and the chance slips away.',
    '{teamName} cannot frame the shot and lose the immediate threat.',
    '{teamName} rush the finish and send the shot off target.',
    '{teamName} pull the trigger, but the attempt misses goal.',
    '{teamName} fire wide and fail to capitalize on the move.',
  ],
  [MatchActionOutcome.NOT_HANDLED]: [
    '{teamName} complete the action and keep the sequence going.',
    '{teamName} resolve the play without clear advantage either way.',
    '{teamName} manage the phase and prepare the next decision.',
    '{teamName} keep shape and move into the next passage.',
    '{teamName} sustain control and continue the turn flow.',
  ],
};

const TURN_RESULT_OUTCOME_VARIANTS_ES: Record<MatchActionOutcome, string[]> = {
  [MatchActionOutcome.PASS_SUCCESS_PROGRESS]: [
    '¡{teamName} toca y toca, y el rival corre atrás de la pelota!',
    '¡{teamName} mete un pase bárbaro y se viene con peligro!',
    '¡{teamName} encuentra espacios y avanza con decisión!',
    '¡Gran combinación de {teamName}, que ya pisa terreno caliente!',
    '¡{teamName} mueve la pelota como quiere y hace retroceder al rival!',
    '¡Qué salida limpia de {teamName}, hay ilusión en la tribuna!',
    '¡{teamName} acelera y rompe líneas con autoridad!',
    '¡La pelota va de pie en pie en {teamName}, qué momento del partido!',
    '¡{teamName} arma una jugada hermosa y va para adelante!',
    '¡Atención que {teamName} empieza a inclinar la cancha!',
  ],
  [MatchActionOutcome.PASS_INTERCEPTED]: [
    '¡Se la roban! {opponentTeamName} corta el pase y sale jugando.',
    '{teamName} fuerza el pase y {opponentTeamName} lo anticipa.',
    '{teamName} pierde la pelota y {opponentTeamName} aprovecha.',
    '¡Interceptación! {opponentTeamName} corta la jugada de {teamName}.',
    '{teamName} intenta el pase pero {opponentTeamName} lee todo y corta la jugada.',
  ],
  [MatchActionOutcome.LONG_PASS_SUCCESS_PROGRESS]: [
    '¡Qué bochazo metió {teamName}, se viene el ataque!',
    '¡{teamName} cambia de frente y agarra mal parado al rival!',
    '¡Pelota larga de {teamName} y hay campo para avanzar!',
    '¡{teamName} mete un pase profundo que enciende a la tribuna!',
    '¡Gran salida larga de {teamName}, que ya juega cerca del área rival!',
  ],
  [MatchActionOutcome.LONG_PASS_LOST]: [
    '{teamName} manda largo pero {opponentTeamName} la baja.',
    '{teamName} apuesta al pelotazo y pierde la pelota.',
    '{teamName} no conecta el pase largo. {opponentTeamName} sale jugando.',
    '{teamName} lanza largo y no llega. El rival controla la pelota.',
    '{teamName} falla el pase largo y el rival responde.',
  ],
  [MatchActionOutcome.DRIBBLE_WON]: [
    '¡{teamName} lo dejó pagando y sigue de largo!',
    '¡Qué gambeta metió {teamName}, se levantó toda la tribuna!',
    '¡{teamName} ganó el mano a mano y acelera rumbo al arco!',
    '¡Se escapó bárbaro {teamName}, nadie lo puede frenar ahora!',
    '¡{teamName} rompió la marca con categoría y ya genera peligro!',
  ],
  [MatchActionOutcome.DRIBBLE_LOST]: [
    '¡{teamName} pierde el duelo y {opponentTeamName} sale de contra!',
    '{teamName} es frenado en el uno a uno por {opponentTeamName}.',
    '{teamName} intenta la gambeta pero la pierde.',
    '{teamName} intenta la gambeta, no puede con la marca y cede la pelota.',
    '{teamName} pierde la pelota y {opponentTeamName} recupera el control.',
  ],
  [MatchActionOutcome.PRESS_WON]: [
    '¡{teamName} aprieta arriba, roba y recupera la pelota!',
    '¡Presión asfixiante de {teamName}, que fuerza el error y se queda con el balón!',
    '¡{teamName} ahoga la salida rival y recupera en campo alto!',
    '¡Gran presión colectiva de {teamName}, vuelve a tener la posesión!',
    '¡{teamName} gana el duelo de presión y corta el avance rival!',
  ],
  [MatchActionOutcome.PRESS_LOST]: [
    '¡{teamName} fue a presionar, pero {opponentTeamName} salió limpio!',
    '¡{teamName} no llega al cierre y {opponentTeamName} conserva la pelota!',
    '¡{teamName} intentó asfixiar, pero {opponentTeamName} rompió la presión!',
    '¡Se pasó de largo {teamName} en la presión y sigue mandando {opponentTeamName}!',
    '¡La presión de {teamName} no alcanza y {opponentTeamName} domina la jugada!',
  ],
  [MatchActionOutcome.TACKLE_WON]: [
    '¡{teamName} mete la barrida justa y recupera!',
    '¡Qué cruce de {teamName}! Gana el duelo y se queda con la pelota.',
    '¡{teamName} va al piso con precisión y corta la jugada!',
    '¡Entrada limpia de {teamName}, recuperación clave!',
    '¡{teamName} clava la barrida y frena el avance rival!',
  ],
  [MatchActionOutcome.TACKLE_LOST]: [
    '¡{teamName} fue con todo al piso, pero {opponentTeamName} logró escapar!',
    '¡¡No llegó {teamName} a cortar y el rival sigue avanzando con peligro!!',
    '¡{teamName} se jugó entero en la barrida, pero {opponentTeamName} salió limpio!',
    '¡La entrada de {teamName} no alcanza y el ataque rival continúa vivo!',
    '¡{teamName} tiró la pierna, pero {opponentTeamName} mantiene la pelota y acelera!',
  ],
  [MatchActionOutcome.DEFEND_HOLD]: [
    '¡{teamName} se planta firme atrás y recupera el control!',
    '¡Defensa compacta de {teamName}, se termina el avance rival!',
    '¡{teamName} ordena líneas y corta la secuencia de {opponentTeamName}!',
    '¡Qué cierre defensivo de {teamName}! Aguanta y recupera.',
    '¡{teamName} sostiene el bloque y vuelve a tener la pelota!',
  ],
  [MatchActionOutcome.DEFEND_BROKEN]: [
    '¡{teamName} no puede sostener la marca y {opponentTeamName} sigue atacando!',
    '¡{teamName} retrocede, pero {opponentTeamName} mantiene la iniciativa!',
    '¡La defensa de {teamName} no logra imponerse en esta jugada!',
    '¡{opponentTeamName} encuentra el hueco y deja a {teamName} a contramano!',
    '¡{teamName} no logra contener y el rival sigue con la pelota!',
  ],
  [MatchActionOutcome.ATTACK_PROGRESS]: [
    '¡{teamName} acelera y pisa una zona más peligrosa!',
    '¡Ataque vertical de {teamName}, que gana metros y confianza!',
    '¡{teamName} rompe líneas y avanza con decisión!',
    '¡El ataque de {teamName} empuja al rival hacia su arco!',
    '¡{teamName} sostiene la ofensiva y crece en campo rival!',
  ],
  [MatchActionOutcome.ATTACK_STALLED]: [
    '¡{teamName} lo intenta, pero el ataque se queda sin profundidad!',
    '¡{teamName} empuja, aunque no logra abrir una chance clara!',
    '¡La ofensiva de {teamName} pierde ritmo y no progresa!',
    '¡{teamName} no encuentra el último pase y la jugada se frena!',
    '¡Ataque trabado de {teamName}, sin ventaja en esta secuencia!',
  ],
  [MatchActionOutcome.HOLD_STABLE]: [
    '¡{teamName} pausa, piensa y administra la posesión con oficio!',
    '¡Manejo sereno de {teamName}, que baja revoluciones y ordena el juego!',
    '¡{teamName} retiene la pelota y marca el tempo del partido!',
    '¡{teamName} duerme la jugada y mantiene el control total!',
    '¡Con paciencia, {teamName} conserva la posesión y prepara el golpe!',
  ],
  [MatchActionOutcome.HOLD_LOST]: [
    '¡{teamName} quiso pausar, pero {opponentTeamName} le robó la cartera!',
    '¡{teamName} no logra proteger la pelota y la pierde!',
    '¡{opponentTeamName} muerde fuerte y le quita la posesión a {teamName}!',
    '¡{teamName} se duerme en la salida y el rival recupera!',
    '¡Se corta el control de {teamName}! {opponentTeamName} se queda con el balón.',
  ],
  [MatchActionOutcome.CROSS_CONNECTED]: [
    '¡Centro de {teamName} y la jugada sigue viva en el área!',
    '¡{teamName} mete un envío peligroso y mantiene la presión!',
    '¡La pelota cae en zona caliente y {teamName} sigue atacando!',
    '¡{teamName} conecta el centro y obliga al rival a defender al límite!',
    '¡Buen centro de {teamName}, que mantiene el peligro frente al arco!',
  ],
  [MatchActionOutcome.CROSS_CLEARED]: [
    '¡{opponentTeamName} despeja el centro de {teamName} y corta el peligro!',
    '¡No prospera el envío de {teamName}, el rival gana arriba!',
    '¡{teamName} busca por aire, pero {opponentTeamName} limpia la zona!',
    '¡Centro rechazado! {opponentTeamName} se queda con la segunda pelota.',
    '¡{teamName} tira el centro, pero el rival despeja con autoridad!',
  ],
  [MatchActionOutcome.SHOOT_USER_GOAL]: [
    '¡Cantalo, cantalo, cantalo...!¡¡GOOOOOOOOL!! ¡¡GOOOOL DE {teamName}!! ¡¡SE VIENE ABAJO EL ESTADIO!!',
    '¡¡GOLAZOOOO DE {teamName}!! ¡Una locura total, no lo podía creer nadie!',
    '¡¡GOOOOL DE {teamName}!! ¡La clavó contra un palo, imposible para el arquero!',
    '¡¡SEÑORAS Y SEÑORES... GOL DE {teamName}!! ¡Qué definición tremenda!',
    '¡¡GOLAAAAAZO DE {teamName}!! ¡Para verlo mil veces, una obra de arte!',
  ],
  [MatchActionOutcome.SHOOT_OPPONENT_GOAL]: [
    'Gol de {opponentTeamName}. ¡Golpe durísimo para {teamName}!',
    '¡{opponentTeamName} factura y deja mudo al estadio!',
    '¡Duele muchísimo! {opponentTeamName} no perdona y marca.',
    'Gol rival: {opponentTeamName} castiga y complica a {teamName}.',
    '{opponentTeamName} encuentra el gol y obliga a {teamName} a reaccionar ya.',
  ],
  [MatchActionOutcome.SHOOT_BLOCKED_REBOUND_FOR]: [
    '¡{teamName} choca con la defensa pero se queda con el rebote!',
    '¡No lo cante, no lo grite, no se abrace! ¡Bloquean el impacto! Pero {teamName} llega primero al rebote. ¡Hay peligro!',
    '¡Aguante corazón aguante!¡{teamName} no se rinde tras el rebote! Recupera la pelota y sigue el peligro.',
    '¡{teamName} tras el rebote! ¡La pelota queda viva, peligro de gol!.',
    'Bloqueado, pero {teamName} sigue en el área. ¡Peligro de gol!',
  ],
  [MatchActionOutcome.SHOOT_BLOCKED_REBOUND_AGAINST]: [
    '¡Le cerraron todos los espacios a {teamName} y la defensa la saca lejos!',
    '¡No lo cante, no lo grite, no se abrace! ¡Tapó justo {opponentTeamName} y ahora intenta salir de contra!',
    '¡No lo cante, no lo grite, no se abrace! ¡{teamName} probó, pero se encontró con una muralla en el área!',
    '¡Gran cruce defensivo de {opponentTeamName}, que recupera la pelota!',
    '¡{teamName} desaprovecha el tiro! {opponentTeamName} despeja y respira.',
  ],
  [MatchActionOutcome.SHOOT_SAVED_REBOUND_FOR]: [
    '¡¡ATAJADÓN DEL ARQUERO!! ¡Pero el rebote sigue siendo de {teamName}!',
    '¡Increíble lo que sacó el arquero! ¡Aunque {teamName} va otra vez con el rebote!',
    '¡No lo cante, no lo grite, no se abrace! ¡Voló el arquero para salvarse, pero la jugada sigue viva para {teamName}!',
    '¡Tapó milagrosamente el arquero! ¡Aguante corazón aguante! ¡Y atención que {teamName} tiene una segunda chance!',
    '¡No lo cante, no lo grite, no se abrace! ¡¡SE SALVÓ EL RIVAL DE MILAGRO!! ¡Pero {teamName} no afloja y sigue metiendo presión en el área!',
  ],
  [MatchActionOutcome.SHOOT_SAVED_REBOUND_AGAINST]: [
    '¡El arquero lo ataja y {opponentTeamName} despeja el rebote!',
    '¡Atajó el arquero! {opponentTeamName} asegura la pelota y sale jugando.',
    '{teamName} no puede con el arquero. {opponentTeamName} sale jugando.',
    '¡No lo cante, no lo grite, no se abrace! ¡Gran atajada! {opponentTeamName} recupera y respira.',
    '{teamName} remata pero el arquero domina la situación.',
  ],
  [MatchActionOutcome.SHOOT_MISSED]: [
    '¡¡NOOOO!! ¡{teamName} tuvo el gol y la tiró afuera!',
    '¡Se lo perdió {teamName}! ¡La tribuna no lo puede creer!',
    '¡¡INCREÍBLE LO QUE ERRÓ {teamName}!! ¡Era medio gol!',
    '¡Qué chance dejó pasar {teamName}! Había que correr el arco ¡Pasó cerquita del palo!',
    '¡Ay ay ay... {teamName} estuvo a un paso del gol y no pudo definir!',
  ],
  [MatchActionOutcome.NOT_HANDLED]: [
    '¡{teamName} mueve la pelota con tranquilidad y sigue construyendo la jugada!',
    '¡{teamName} toca corto, piensa el partido y mantiene la posesión!',
    '¡Buen manejo de {teamName}, que intenta adueñarse del ritmo del encuentro!',
    '¡{teamName} hace circular la pelota y busca el momento justo para atacar!',
    '¡{teamName} mantiene el control y hace correr al rival detrás de la pelota!',
  ],
};

const TURN_CONTEXT_VARIANTS_EN_EPIC = ensureContextVariantsByAction(
  TURN_CONTEXT_VARIANTS_EN,
  'en',
  15,
);
const TURN_CONTEXT_VARIANTS_ES_EPIC = ensureContextVariantsByAction(
  TURN_CONTEXT_VARIANTS_ES,
  'es',
  15,
);

const TURN_RESULT_VARIANTS_EN_EPIC = ensureTurnResultVariantsByAction(
  TURN_RESULT_VARIANTS_EN,
  'en',
  15,
);
const TURN_RESULT_VARIANTS_ES_EPIC = ensureTurnResultVariantsByAction(
  TURN_RESULT_VARIANTS_ES,
  'es',
  15,
);

const TURN_RESULT_OUTCOME_VARIANTS_EN_EPIC = ensureOutcomeVariants(
  TURN_RESULT_OUTCOME_VARIANTS_EN,
  'en',
  15,
);
const TURN_RESULT_OUTCOME_VARIANTS_ES_EPIC = ensureOutcomeVariants(
  TURN_RESULT_OUTCOME_VARIANTS_ES,
  'es',
  15,
);

function flattenTurnContextVariantTranslations(
  variantsByAction: Record<string, string[]>,
): Record<string, string> {
  const translations: Record<string, string> = {};

  for (const [action, variants] of Object.entries(variantsByAction)) {
    variants.forEach((variant, index) => {
      translations[`match.turn.context.${action}.${index + 1}`] = variant;
    });
  }

  return translations;
}

function flattenTurnResultVariantTranslations(
  variantsByAction: Record<string, { success: string[]; fail: string[] }>,
): Record<string, string> {
  const translations: Record<string, string> = {};

  for (const [action, variants] of Object.entries(variantsByAction)) {
    variants.success.forEach((variant, index) => {
      translations[`match.turn.result.success.${action}.${index + 1}`] = variant;
    });
    variants.fail.forEach((variant, index) => {
      translations[`match.turn.result.fail.${action}.${index + 1}`] = variant;
    });
  }

  return translations;
}

function flattenTurnOutcomeVariantTranslations(
  variantsByOutcome: Record<MatchActionOutcome, string[]>,
): Record<string, string> {
  const translations: Record<string, string> = {};

  for (const [outcome, variants] of Object.entries(variantsByOutcome)) {
    variants.forEach((variant, index) => {
      translations[`match.turn.result.outcome.${outcome}.${index + 1}`] = variant;
    });
  }

  return translations;
}

const HALF_TIME_VARIANTS_EN: string[] = [
  '{teamCoach} gathers {teamName} and points at the board; {opponentCoach} studies how {opponentName} can react.',
  '{teamCoach} asks for calm circulation, while {opponentCoach} tells {opponentName} to raise intensity.',
  '{teamCoach} highlights transitions, and {opponentCoach} demands tighter spacing in midfield.',
  '{teamCoach} reminds {teamName} to trust the plan; {opponentCoach} prepares an aggressive response.',
  '{teamCoach} wants cleaner passing patterns, and {opponentCoach} wants faster recoveries.',
  '{teamCoach} adjusts pressing triggers; {opponentCoach} looks for a direct route to goal.',
  '{teamCoach} asks for discipline after loss, while {opponentCoach} prepares attacking overloads.',
  '{teamCoach} pushes {teamName} to control rhythm; {opponentCoach} asks {opponentName} to break lines quickly.',
  '{teamCoach} reviews first-half mistakes, and {opponentCoach} signals tactical tweaks before restart.',
  '{teamCoach} emphasizes patience in possession; {opponentCoach} urges immediate pressure on the ball.',
  '{teamCoach} asks for sharper finishing, while {opponentCoach} calls for a compact defensive block.',
  '{teamCoach} wants cleaner build-up from midfield; {opponentCoach} targets the wide channels.',
  '{teamCoach} signals confidence to {teamName}; {opponentCoach} prepares a measured comeback plan.',
  '{teamCoach} demands focus in both boxes, and {opponentCoach} asks for faster decision-making.',
  '{teamCoach} asks for compact lines; {opponentCoach} wants more risk in the final third.',
  '{teamCoach} reviews set-piece details, while {opponentCoach} reorganizes pressing references.',
  '{teamCoach} requests better timing on runs, and {opponentCoach} asks for stronger duels.',
  '{teamCoach} tells {teamName} to stay organized; {opponentCoach} plans fresh ideas for {opponentName}.',
  '{teamCoach} asks for stronger ball retention, while {opponentCoach} seeks a tactical surprise.',
  '{teamCoach} reinforces the strategy, and {opponentCoach} prepares key adjustments for the second half.',
];

const HALF_TIME_VARIANTS_ES: string[] = [
  '{teamCoach} mueve la pizarra con intensidad y marca cada detalle. Del otro lado, {opponentCoach} prepara la respuesta de {opponentName}.',
  '{teamCoach} pide cabeza fría y circulación rápida. {opponentCoach} quiere que {opponentName} salga a comerle la cancha.',
  '{teamCoach} ajusta las marcas y ordena el retroceso. {opponentCoach} exige más presión y agresividad en el medio.',
  '{teamCoach} mantiene la confianza en el plan inicial. {opponentCoach} prepara un segundo tiempo mucho más ofensivo.',
  '{teamCoach} reclama precisión en los últimos metros. {opponentCoach} pide transiciones más veloces para lastimar.',
  '{teamCoach} quiere presión alta y recuperación inmediata. {opponentCoach} apuesta por el juego directo y la sorpresa.',
  '{teamCoach} corrige el orden defensivo tras cada pérdida. {opponentCoach} diseña ataques con mucha gente en campo rival.',
  '{teamCoach} trabaja la paciencia y el control del ritmo con {teamName}. {opponentCoach} busca romper líneas a pura velocidad.',
  '{teamCoach} repasa errores y movimientos del primer tiempo. {opponentCoach} mete mano y prepara variantes tácticas.',
  '{teamCoach} pide no desesperarse y mover la pelota. {opponentCoach} ordena salir a presionar desde el primer minuto.',
  '{teamCoach} insiste con mejorar la definición. {opponentCoach} reorganiza el fondo para aguantar la presión.',
  '{teamCoach} trabaja la salida limpia desde atrás. {opponentCoach} apunta a lastimar por las bandas.',
  '{teamCoach} transmite calma y confianza al plantel. {opponentCoach} prepara todo para una remontada épica.',
  '{teamCoach} exige máxima concentración en cada jugada. {opponentCoach} pide resolver más rápido en ataque.',
  '{teamCoach} acomoda las líneas y busca equilibrio. {opponentCoach} arriesga más gente en ofensiva para cambiar la historia.',
  '{teamCoach} repasa cada pelota parada al detalle. {opponentCoach} reorganiza la presión para ahogar la salida rival.',
  '{teamCoach} pide movilidad y mejores desmarques arriba. {opponentCoach} reclama más actitud y más duelos ganados.',
  '{teamCoach} insiste en mantener el orden táctico de {teamName}. {opponentCoach} busca una idea distinta para romper el partido.',
  '{teamCoach} quiere más posesión y control emocional. {opponentCoach} guarda una sorpresa táctica para el complemento.',
  '¡Arde el vestuario en el entretiempo! {teamCoach} y {opponentCoach} juegan su propio partido desde el banco.',
];

const FINAL_USER_WIN_VARIANTS_EN: string[] = [
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCaptainName} and {teamCoachName} lift {teamName} to the summit of world football.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} are world champions and this generation becomes eternal.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. Under {teamCoachName}, {teamCaptainName} leads {teamName} into football immortality.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} conquer the world and write a legendary chapter.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCaptainName} raises the trophy and {teamCoachName}'s plan becomes history.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} stand on top of the world with a performance for the ages.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCoachName} and {teamCaptainName} guide {teamName} to eternal glory.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. The dream is complete: {teamName} are crowned world champions.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} finish the journey with epic football and a world title.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCaptainName} leads, {teamCoachName} inspires, and {teamName} become legend.",
];

const FINAL_OPPONENT_WIN_VARIANTS_EN: string[] = [
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} fall short as {opponentName} take the world title.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {opponentName} are champions, and {teamName} are left with heartbreak.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. Despite {teamCaptainName}'s effort, {teamName} see the trophy go to {opponentName}.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCoachName} and {teamCaptainName} fought to the end, but {opponentName} prevail.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. A painful ending for {teamName}; {opponentName} celebrate the crown.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} were so close, but {opponentName} close the final as champions.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. Tears for {teamName}, glory for {opponentName}.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamName} leave the final with pride, but the title belongs to {opponentName}.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. {teamCaptainName} and {teamCoachName} cannot avoid defeat against {opponentName}.",
  "Full time (90')! {scoreTeam}-{scoreOpponent}. The night ends in sadness for {teamName} while {opponentName} become world champions.",
];

const FINAL_USER_WIN_VARIANTS_ES: string[] = [
  "¡¡FINAL DEL PARTIDO (90')!! {scoreTeam}-{scoreOpponent}. ¡¡{teamName} YA ES CAMPEÓN DEL MUNDO!! {teamCaptainName} levanta la copa entre lágrimas y {teamCoachName} abraza a todos mientras la hinchada invade el campo de juego. ¡El festejo es total!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡La locura es total! ¡{teamName} conquistó el campeonato del mundo! Esta generación será recordada para siempre.",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡¡{teamName} YA ES CAMPEÓN DEL MUNDO!! Bajo la conducción de {teamCoachName}, {teamCaptainName} lidera a {teamName} hacia la inmortalidad.",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡La locura es total! ¡{teamName} se cornona campeón del mundo y escribe su nombre en la historia del fútbol mundial!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡{teamCaptainName} levanta la copa del mundo! ¡El sueño de {teamCoachName} y {teamName} se hizo realidad!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡¡QUÉ EQUIPO!! {teamName} se consagra campeón del mundo con una actuación para el recuerdo eterno.",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. {teamCoachName} y {teamCaptainName} guiaron a {teamName} hasta la gloria más grande del fútbol.",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡{teamName} se corona campeón del mundo! El sueño se cumplió y las lágrimas de alegría inundan el estadio. ¡La hinchada invade el campo de juego!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡{teamName} terminó su camino con fútbol de categoría y se corona campeón del mundo!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡¡{teamName} YA ES CAMPEÓN DEL MUNDO!! {teamCaptainName} lidera, {teamCoachName} inspira y {teamName} SE CONVIERTE EN LEYENDA!",
  "¡¡FINAL DEL PARTIDO (90')!! {scoreTeam}-{scoreOpponent}. ¡¡{teamName} ES CAMPEÓN DEL MUNDO, SEÑORES!! ¡La gente llora, se abraza y el estadio es una fiesta inolvidable!",
  "¡¡SE TERMINÓ!! {scoreTeam}-{scoreOpponent}. ¡¡DALE CAMPEÓN, DALE CAMPEÓN!! ¡{teamName} tocó el cielo del fútbol mundial y quedará para siempre en la historia!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡¡{teamCaptainName} levanta la copa y explota el mundo del fútbol!! ¡{teamCoachName} armó un equipo eterno!",
  "¡¡NO HAY MÁS TIEMPO!! {scoreTeam}-{scoreOpponent}. ¡{teamName} es campeón del mundo y la hinchada convierte el estadio en un carnaval total!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡Qué locura hermosa! ¡{teamName} llegó a la gloria máxima y millones festejan alrededor del mundo!",
  "¡¡CAMPEONES DEL MUNDO!! {scoreTeam}-{scoreOpponent}. ¡{teamName} jugó una final inolvidable y escribe una página dorada en la historia del fútbol!",
  "¡Terminó el partido! {scoreTeam}-{scoreOpponent}. ¡Abrazo eterno entre {teamCoachName}, {teamCaptainName} y todo {teamName}! ¡Esto ya es leyenda pura!",
  "¡¡SE DESATA LA FIESTA!! {scoreTeam}-{scoreOpponent}. ¡{teamName} se consagra campeón del mundo y la emoción desborda cada rincón del estadio!",
  "¡Final del partido (90')! {scoreTeam}-{scoreOpponent}. ¡{teamName} fue puro corazón, fútbol y personalidad! ¡Campeones del mundo para toda la vida!",
  "¡¡HISTÓRICO!! {scoreTeam}-{scoreOpponent}. ¡{teamName} llegó a la cima del planeta fútbol! ¡{teamCaptainName} levanta la copa y ya nadie podrá olvidar esta noche!",
];

const FINAL_OPPONENT_WIN_VARIANTS_ES: string[] = [
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. No pudo ser. {teamName} lo intentó hasta el final pero {opponentName} se lleva el título.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {opponentName} es campeón. Dura derrota para {teamName} en la última batalla.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. A pesar del esfuerzo de {teamCaptainName}, {teamName} cae en la final ante {opponentName}.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamCoachName} y {teamCaptainName} lucharon hasta el último minuto, pero {opponentName} fue mejor.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Noche amarga para {teamName}. {opponentName} festeja y {teamName} se queda con el dolor de la derrota.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamName} estuvo cerca, pero {opponentName} fue más y cierra la final como campeón.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Lágrimas en el vestuario de {teamName}. {opponentName} celebra la gloria que a ellos se les escapó.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamName} se va con la frente en alto pero sin la copa. Hoy ganó {opponentName}.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamCaptainName} y {teamCoachName} no pudieron torcer el destino. {opponentName} se queda con todo.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Amargo final ... La noche termina con el llanto de {teamName} y la celebración de {opponentName}. Hasta la próxima.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. ¡No alcanzó para {teamName}! {opponentName} se queda con la copa en una noche durísima.",
  "¡¡SE TERMINÓ!! {scoreTeam}-{scoreOpponent}. {opponentName} es campeón del mundo y el sueño de {teamName} queda a un paso de la gloria.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamName} dejó el alma hasta la última pelota, pero hoy la historia fue para {opponentName}.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Dolor inmenso en {teamName}. {opponentName} festeja mientras el estadio queda en silencio.",
  "¡No hay tiempo para más! {scoreTeam}-{scoreOpponent}. {teamCaptainName} y {teamCoachName} pelearon hasta el final, pero {opponentName} golpeó en el momento justo.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Qué noche amarga para {teamName}... tan cerca de la gloria y tan lejos al mismo tiempo.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. {teamName} cayó de pie, luchando hasta el último minuto ante un {opponentName} que terminó festejando.",
  "¡¡FINAL DEL PARTIDO!! {scoreTeam}-{scoreOpponent}. Hay lágrimas y desconsuelo en {teamName}, mientras {opponentName} levanta la copa del mundo.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. El fútbol tiene estas noches crueles: {teamName} soñaba con la gloria, pero el campeón fue {opponentName}.",
  "Final del partido (90'). {scoreTeam}-{scoreOpponent}. Se escapa el sueño para {teamName}. Quedará el orgullo de haber peleado hasta el final, aunque hoy festeje {opponentName}.",
];

function flattenHalfTimeVariantTranslations(variants: string[]): Record<string, string> {
  const translations: Record<string, string> = {};
  variants.forEach((variant, index) => {
    translations[`match.halftime.variant.${index + 1}`] = variant;
  });
  return translations;
}

function flattenFinalVariantTranslations(
  prefix: 'match.final.userWins.variant' | 'match.final.opponentWins.variant',
  variants: string[],
): Record<string, string> {
  const translations: Record<string, string> = {};
  variants.forEach((variant, index) => {
    translations[`${prefix}.${index + 1}`] = variant;
  });
  return translations;
}

@Injectable()
export class I18nService {
  private readonly translations: Record<AppLocale, Record<string, string>> = {
    en: {
      'match.action.RESTART_MATCH': 'Restart match',
      'match.action.ATTACK': 'Attack',
      'match.action.HOLD': 'Keep possession',
      'match.action.PRESS': 'Press high',
      'match.action.LONG_PASS': 'Long pass',
      'match.action.SHOOT': 'Shoot',
      'match.action.PASS': 'Pass',
      'match.action.DRIBBLE': 'Dribble',
      'match.action.CROSS': 'Cross',
      'match.action.DEFEND': 'Defend',
      'match.action.LEFT': 'Left corner',
      'match.action.RIGHT': 'Right corner',
      'match.action.CENTER': 'Center',
      'match.action.PICAR': 'Picar',
      'match.action.DIVE_LEFT': 'Dive left',
      'match.action.DIVE_RIGHT': 'Dive right',
      'match.action.STAY_CENTER': 'Stay center',
      'match.action.WAIT': 'Wait',
      'match.action.BLOCK': 'Block spaces',
      'match.action.TACKLE': 'Tackle',
      'match.action.QUIT_MATCH': 'Quit match',

      'match.zone.DEFENSE_THIRD': 'the defensive third',
      'match.zone.MIDFIELD': 'midfield',
      'match.zone.ATTACK_THIRD': 'the attacking third',
      'match.zone.BOX': 'the box',

      'match.start.header':
        'World Cup final started: {teamName} ({teamFormation}) vs {opponentName} ({opponentFormation}).',
      'match.start.rivalry':
        'Historic rivalry in the final: every duel carries extra tension from the first whistle.',
      'match.start.kickoff':
        'Ladies and gentlemen, here comes {teamName}. The dream begins now! {ballCarrierName} starts the match from midfield.',
      'match.start.kickoff.variant.1':
        '{teamName} gets us underway! {ballCarrierName} puts the ball in motion from midfield and the final is on.',
      'match.start.kickoff.variant.2':
        '{ballCarrierName} moves it from midfield for {teamName}. The world title battle begins now.',
      'match.start.kickoff.variant.3':
        'Nothing beats seeing {teamName} back in this stage. {ballCarrierName} takes the first touch from midfield and ignites the final.',
      'match.start.kickoff.variant.4':
        '{teamName} is ready. Kickoff from midfield by {ballCarrierName}. Ninety minutes to write history.',
      'match.start.kickoff.variant.5':
        'The dream starts for {teamName}. {ballCarrierName} starts from midfield and the stadium erupts for the opening play.',

      'match.forfeit.line1': '{teamName} forfeits the final.',
      'match.forfeit.line2': '{opponentName} wins by default.',
      'match.halftime.summary.leading':
        '{teamName} reaches halftime leading {scoreTeam}-{scoreOpponent}. The {teamStrategy} strategy is paying off so far.',
      'match.halftime.summary.drawing':
        'Halftime: {teamName} and {opponentName} are tied {scoreTeam}-{scoreOpponent}. Time to reassess the plan.',
      'match.halftime.summary.trailing':
        'Halftime: {teamName} is trailing {scoreTeam}-{scoreOpponent}. The team needs tactical adjustments now.',
      'match.halftime.prompt':
        'Halftime break. This is the moment to evaluate strategy before the second half.',
      'match.halftime.secondHalfKickoff':
        'Second half begins: kickoff for {teamName} from midfield.',
      'match.strategy.saved': 'Team strategy {strategy} saved successfully.',
      'match.strategy.saved.autoFormation':
        'Team strategy {strategy} saved successfully. Formation auto-adjusted to {formation} for compatibility.',
      'match.formation.saved': 'Team formation {formation} saved successfully.',
      'match.tactics.reset':
        'Team tactics reset to defaults: strategy {strategy}, formation {formation}.',
      'match.strategy.description.ATTACK': 'Direct attacking style with stronger offensive actions.',
      'match.strategy.description.DEFENSE': 'Compact defensive block that prioritizes resisting chances.',
      'match.strategy.description.PENALTIES': 'Preparation focused on high-pressure penalty situations.',
      'match.strategy.description.COUNTER_ATTACK': 'Fast transitions after recovering possession.',
      'match.strategy.description.BALANCED': 'Neutral setup that gives a light bonus to all lines.',
      'match.strategy.description.POSSESSION': 'Ball-retention style that reinforces midfield control.',
      'match.formation.description.4-3-3': 'Attacking shape with wide forwards and balanced midfield trio.',
      'match.formation.description.4-4-2': 'Classic compact shape with two striker outlets.',
      'match.formation.description.4-2-3-1': 'Double pivot with creative line behind one striker.',
      'match.formation.description.3-5-2': 'Wingback system with strong central overload.',
      'match.formation.description.3-4-3': 'Aggressive front-three system with wingback width.',
      'match.formation.description.4-1-4-1': 'Single pivot structure with medium-high defensive stability.',
      'match.formation.description.4-5-1': 'Defensive midfield-heavy block with one forward.',
      'match.formation.description.5-3-2': 'Back-five shape with two forwards for transition play.',
      'match.formation.description.5-4-1': 'Very defensive shape designed to protect the box.',
      'match.formation.description.4-1-2-1-2': 'Narrow diamond setup focused on interior combinations.',
      'match.formation.description.4-3-2-1': 'Narrow tree shape with two advanced playmakers.',
      'match.formation.description.3-4-1-2': 'Three at the back with a creator behind two strikers.',
      'match.formation.description.4-4-1-1': 'Balanced compact lines with one supporting striker.',
      'match.formation.description.4-3-1-2': 'Central overload with two strikers and one playmaker.',
      'match.formation.description.3-1-4-2': 'Three-center-back base with a holding midfielder.',
      'coach.profile.label.CONSERVATIVE': 'Conservative',
      'coach.profile.description.CONSERVATIVE':
        'Prioritizes defense and safe possession. Protects a one-goal lead quickly and manages risk.',
      'coach.profile.example.CONSERVATIVE':
        'When leading 1-0, tends to switch early to a low block and defensive substitutions.',
      'coach.profile.label.BALANCED': 'Balanced',
      'coach.profile.description.BALANCED':
        'Mixes attack, possession, and counter attack based on context without extreme shifts.',
      'coach.profile.example.BALANCED':
        'If drawing, keeps structure; if losing, raises risk in a controlled way.',
      'coach.profile.label.AGGRESSIVE': 'Aggressive',
      'coach.profile.description.AGGRESSIVE':
        'Pushes high-intensity attacking football and pressure, even while already ahead.',
      'coach.profile.example.AGGRESSIVE':
        'Often keeps ATTACK after scoring and makes offensive substitutions.',
      'coach.profile.label.PRAGMATIC': 'Pragmatic',
      'coach.profile.description.PRAGMATIC':
        'Chooses the most efficient plan per game state instead of following a fixed style.',
      'coach.profile.example.PRAGMATIC':
        'Can switch to possession while winning or to attack late when chasing the score.',
      'coach.profile.label.CATENACCIO': 'Catenaccio',
      'coach.profile.description.CATENACCIO':
        'Strong defensive mentality: prioritizes defense and counter attack with tight structure.',
      'coach.profile.example.CATENACCIO':
        'With a 1-goal lead, drops to low block early and reinforces DF/MF before taking more risks.',
      'coach.profile.label.REACTIVE': 'Reactive',
      'coach.profile.description.REACTIVE':
        'Adapts quickly to recent events like goals, cards, and momentum changes.',
      'coach.profile.example.REACTIVE':
        'After conceding, tends to adjust strategy faster than most profiles.',
      'coach.profile.label.TOTAL_FOOTBALL': 'Total Football',
      'coach.profile.description.TOTAL_FOOTBALL':
        'High mobility and collective pressure, aiming to control the game with and without the ball.',
      'coach.profile.example.TOTAL_FOOTBALL':
        'Prefers versatile substitutions to sustain pressing and positional rotation.',

      'match.turn.context': '{playerName} carries for {teamName} in {zone}.',
      'match.turn.selectedAction': 'Selected action: {actionLabel}.',
      'match.card.red': '{playerName} ({teamName}) receives a red card in {zone}.',
      'match.card.yellow': '{playerName} ({teamName}) receives a yellow card in {zone}.',
      'match.restart.freeKick': 'Free kick for {teamName}.',
      'match.restart.corner': 'Corner for {teamName}.',
      'match.restart.throwIn': 'Throw-in for {teamName}.',
      'match.restart.kickoff': 'Kickoff for {teamName} from midfield.',
      'match.lastPlay.tension':
        'Moment of tension: the referee adds 5 minutes, and this is the final play for the world title.',
      'match.lastPlay.oneOnOne': 'Last play: {attackerName} is one-on-one against {goalkeeperName}.',
      'match.lastPlay.oneOnOne.for.1':
        'Final play for {attackingTeamName}: {attackerName} goes one-on-one with {goalkeeperName}.',
      'match.lastPlay.oneOnOne.for.2':
        '{attackingTeamName} have one last chance: {attackerName} faces {goalkeeperName} one-on-one.',
      'match.lastPlay.oneOnOne.for.3':
        'Everything on this duel: {attackerName} versus {goalkeeperName}, one-on-one for {attackingTeamName}.',
      'match.lastPlay.oneOnOne.for.4':
        '{attackerName} breaks through for {attackingTeamName} and stands one-on-one against {goalkeeperName}.',
      'match.lastPlay.oneOnOne.for.5':
        'The title hangs on this touch: {attackerName} one-on-one against {goalkeeperName} for {attackingTeamName}.',
      'match.lastPlay.oneOnOne.against.1':
        'Last play against us: {attackerName} is one-on-one with {goalkeeperName}.',
      'match.lastPlay.oneOnOne.against.2':
        'Huge danger now: {attackerName} faces {goalkeeperName} one-on-one on the final play.',
      'match.lastPlay.oneOnOne.against.3':
        'This could decide it: {attackerName} has a one-on-one against {goalkeeperName}.',
      'match.lastPlay.oneOnOne.against.4':
        'No margin for error: {attackerName} comes through one-on-one versus {goalkeeperName}.',
      'match.lastPlay.oneOnOne.against.5':
        'Heart-stopping moment: {attackerName} is one-on-one with {goalkeeperName}.',
      'match.lastPlay.penalty':
        'Last play: penalty for {attackingTeamName}. {attackerName} faces {goalkeeperName}.',
      'match.lastPlay.penalty.for.1':
        'Last play: penalty for {attackingTeamName}. {attackerName} faces {goalkeeperName}.',
      'match.lastPlay.penalty.for.2':
        '{attackingTeamName} get a last-minute penalty. {attackerName} against {goalkeeperName}.',
      'match.lastPlay.penalty.for.3':
        'Penalty for {attackingTeamName} in the final play. {attackerName} steps up versus {goalkeeperName}.',
      'match.lastPlay.penalty.for.4':
        'The referee points to the spot for {attackingTeamName}: {attackerName} versus {goalkeeperName}.',
      'match.lastPlay.penalty.for.5':
        'One kick for glory: penalty to {attackingTeamName}, {attackerName} in front of {goalkeeperName}.',
      'match.lastPlay.penalty.against.1':
        'Last play and a penalty against us: {attackerName} faces {goalkeeperName}.',
      'match.lastPlay.penalty.against.2':
        'Disaster at the end: penalty for {attackingTeamName}. {attackerName} versus {goalkeeperName}.',
      'match.lastPlay.penalty.against.3':
        'Final-play penalty against us. {attackerName} prepares to shoot at {goalkeeperName}.',
      'match.lastPlay.penalty.against.4':
        'The referee awards a late penalty against us: {attackerName} against {goalkeeperName}.',
      'match.lastPlay.penalty.against.5':
        'Everything on the line now: penalty against us, {attackerName} faces {goalkeeperName}.',
      'match.lastPlay.attackGoal':
        'Goal! {playerName} scores for {teamName} and seals the world title on the final play.',
      'match.lastPlay.attackGoal.for.1':
        'GOAL! {playerName} scores for {teamName} and wins the World Cup on the final play!',
      'match.lastPlay.attackGoal.for.2':
        '{playerName} strikes for {teamName}! The final play brings the world title!',
      'match.lastPlay.attackGoal.for.3':
        'It is in! {playerName} scores for {teamName} and crowns them world champions.',
      'match.lastPlay.attackGoal.for.4':
        '{teamName} take it at the death! {playerName} converts the final-play chance.',
      'match.lastPlay.attackGoal.for.5':
        '{playerName} finishes for {teamName} on the last play. World champions!',
      'match.lastPlay.attackGoal.against.1':
        'Heartbreak: {playerName} scores for {teamName} on the final play.',
      'match.lastPlay.attackGoal.against.2':
        'Cruel ending. {playerName} converts for {teamName} and takes the title.',
      'match.lastPlay.attackGoal.against.3':
        'Final-play blow: {playerName} scores for {teamName}.',
      'match.lastPlay.attackGoal.against.4':
        'No time left. {playerName} scores for {teamName} and seals it.',
      'match.lastPlay.attackGoal.against.5':
        'Painful finish: {playerName} finds the net for {teamName} at the death.',
      'match.lastPlay.counterGoal':
        '{playerName} wins it on the counter for {teamName} after the miss on the final play.',
      'match.lastPlay.counterGoal.for.1':
        '{playerName} punishes the miss and wins it on the counter for {teamName}!',
      'match.lastPlay.counterGoal.for.2':
        'Counter and goal! {playerName} seals it for {teamName} on the final play.',
      'match.lastPlay.counterGoal.for.3':
        '{teamName} strike back immediately: {playerName} scores the title-winning counter.',
      'match.lastPlay.counterGoal.for.4':
        '{playerName} turns the final miss into glory for {teamName} on the break.',
      'match.lastPlay.counterGoal.for.5':
        'From last-play chaos to triumph: {playerName} scores the counter for {teamName}.',
      'match.lastPlay.counterGoal.against.1':
        'A brutal counter. {playerName} scores for {teamName} after the final-play miss.',
      'match.lastPlay.counterGoal.against.2':
        'One mistake, one counter, one title lost: {playerName} scores for {teamName}.',
      'match.lastPlay.counterGoal.against.3':
        'Countered at the end. {playerName} wins it for {teamName}.',
      'match.lastPlay.counterGoal.against.4':
        'The miss turns into disaster: {playerName} scores on the counter for {teamName}.',
      'match.lastPlay.counterGoal.against.5':
        'Final-play heartbreak: {playerName} punishes on the counter for {teamName}.',
      'match.restart.penaltyFor': 'Penalty for {teamName}.',
      'match.restart.penaltyAgainst': 'Penalty against {teamName}. Goalkeeper faces the shot.',
      'match.penalty.foulWhistle': 'Foul in the box! The referee awards a penalty for {teamName}.',
      'match.rivalry.momentum': 'Rivalry momentum changes for the next turn.',
      'match.turn.userGoal': 'Goal! {playerName} scores for {teamName}.',
      'match.turn.opponentGoal': 'Goal! {playerName} scores for {teamName}.',
      'match.turn.userCounterGoal': 'Counterattack goal! {playerName} scores for {teamName}.',
      'match.turn.opponentCounterGoal': 'Counterattack goal! {playerName} scores for {teamName}.',
      'match.turn.penaltySaved': '{goalkeeperName} saves the penalty for {teamName}!',
      'match.turn.userNoFinish': '{teamName} cannot finish the play.',
      'match.turn.userBuildUp': '{teamName} keeps circulating the ball and builds from the back.',
      'match.turn.userDefenseHolds': '{teamName} holds defensively and avoids the goal.',
      'match.turn.consequence.userKeepsBall': '{playerName} keeps possession for {teamName} after the rebound.',
      'match.turn.consequence.userRecoversBall': '{playerName} recovers the ball for {teamName}.',
      'match.turn.consequence.opponentInterception':
        '{playerName} intercepts the play and {teamName} takes possession.',
      'match.turn.consequence.opponentKeepsBall': '{teamName} keeps possession with {playerName}.',
      'match.turn.flowSnapshot': '{teamName} controls the flow in {zone}.',
      'match.turn.currentScore': 'Current score {scoreTeam}-{scoreOpponent}.',
      'match.turn.final': '{finalMessage}',
      'match.stats.teamUnknown': 'Unknown team',
      'match.stats.noAction': 'No action',
      'match.stats.goal': 'Goal! {playerName} scores for {teamName}.',
      'match.stats.yellowCard': '{playerName} receives a yellow card for {teamName}.',
      'match.stats.redCard': '{playerName} receives a red card for {teamName}.',
      'match.stats.genericEvent': '{playerName} performs {actionLabel} for {teamName}.',
      'match.stats.forfeit': '{teamName} forfeits the match.',
      'match.stats.matchEnded': "Final whistle (90'). Score {scoreTeam}-{scoreOpponent}.",
      'match.stats.halfTime': 'Halftime reached. Score {scoreTeam}-{scoreOpponent}.',

      'match.outcome.userGoalFromZone': 'Oh yeah! Goal! {playerName} scores for {teamName} from {zone}!',
      'match.outcome.opponentCounter': '{playerName} finishes a quick counter for {teamName}.',
      'match.outcome.userNoGoal': '{playerName} carries the ball in {zone}. No goal this turn.',
      'match.outcome.opponentGoalFromZone': '{playerName} attacks for {teamName} and scores from {zone}.',
      'match.outcome.userCounterGoal': 'Oh yeah! Goal! {playerName} strikes on the break for {teamName}!',
      'match.outcome.opponentNoGoal':
        '{playerName} builds the attack for {teamName}, but the defense holds.',

      'match.final.userWins': "Full time (90')! {scoreTeam}-{scoreOpponent}. Your team wins the final and are crowned world champions! Glory is eternal, and the names of these heroes will be forever etched in history.",
      'match.final.opponentWins': "Full time (90')! {scoreOpponent}-{scoreTeam}. Opponent wins the final and is crowned world champion.",
      'match.close.decisiveUserGoal':
        "90': {playerName} scores the decisive goal for {teamName}. The world stops, and a new legend is born. {finalMessage}",
      'match.close.decisiveOpponentGoal':
        "90': {playerName} scores the decisive goal for {teamName}. {finalMessage}",
      'match.close.decidesAt90': "{playerName} decides the final at 90'.",
      'match.timeline.substitution':
        '{teamName} substitution: {incomingPlayerName} replaces {outgoingPlayerName}.',
      'match.timeline.substitution.entersField':
        'In {teamName}, {incomingPlayerName} enters the field for {outgoingPlayerName}.',
      'match.timeline.lowEnergyInjury':
        '{playerName} leaves the field with an injury due to low energy.',
      'match.timeline.injury':
        '{playerName} leaves the field with an injury.',
      'match.timeline.captainChange':
        '{teamName} has a new captain: {playerName} takes the armband.',
      'match.tactics.opponentShift':
        '{coachName} changes {teamName} to {strategy} with formation {formation}.',
      'match.tactics.userShift':
        '{coachName} adjusts {teamName}: strategy {strategy}, formation {formation}.',
      'match.tactics.userShift.ATTACK.1':
        '{coachName} sends {teamName} forward: ATTACK with {formation}.',
      'match.tactics.userShift.ATTACK.2':
        '{teamName} turn aggressive now: ATTACK shape in {formation}.',
      'match.tactics.userShift.DEFENSE.1':
        '{coachName} tightens the block for {teamName}: DEFENSE in {formation}.',
      'match.tactics.userShift.DEFENSE.2':
        '{teamName} drop deeper and protect the lead with DEFENSE ({formation}).',
      'match.tactics.userShift.PENALTIES.1':
        '{coachName} prepares {teamName} for high-pressure moments: PENALTIES with {formation}.',
      'match.tactics.userShift.PENALTIES.2':
        '{teamName} switch to PENALTIES mode in {formation} to manage decisive situations.',
      'match.tactics.userShift.COUNTER_ATTACK.1':
        '{coachName} sets {teamName} for quick breaks: COUNTER_ATTACK with {formation}.',
      'match.tactics.userShift.COUNTER_ATTACK.2':
        '{teamName} now wait and strike: COUNTER_ATTACK in {formation}.',
      'match.tactics.userShift.BALANCED.1':
        '{coachName} levels the setup: {teamName} go BALANCED with {formation}.',
      'match.tactics.userShift.BALANCED.2':
        '{teamName} reset to a BALANCED shape ({formation}) to stabilize the game.',
      'match.tactics.userShift.POSSESSION.1':
        '{coachName} asks for control: {teamName} switch to POSSESSION in {formation}.',
      'match.tactics.userShift.POSSESSION.2':
        '{teamName} slow the tempo and dominate the ball with POSSESSION ({formation}).',
      'match.fallback.unknownPlayer': 'Unknown Player',

      'worldCup.stage.GROUP_STAGE': 'Group Stage',
      'worldCup.stage.ROUND_OF_32': 'Round of 32',
      'worldCup.stage.ROUND_OF_16': 'Round of 16',
      'worldCup.stage.QUARTER_FINALS': 'Quarter-finals',
      'worldCup.stage.SEMI_FINALS': 'Semi-finals',
      'worldCup.stage.THIRD_PLACE': 'Third place',
      'worldCup.stage.FINAL': 'Final',
      'worldCup.stage.CHAMPION': 'Champion',
      'worldCup.award.reason.GOLDEN_BALL_FINALISTS': 'Best overall impact player (finalists only)',
      'worldCup.award.reason.GOLDEN_BALL': 'Best overall impact player',
      'worldCup.award.reason.GOLDEN_BOOT': 'Top scorer of the tournament',
      'worldCup.award.reason.SILVER_BOOT': 'Second top scorer',
      'worldCup.award.reason.BRONZE_BOOT': 'Third top scorer',
      'worldCup.award.reason.GOLDEN_GLOVE_TOP4': 'Best goalkeeper by clean sheets (top 4 teams)',
      'worldCup.award.reason.GOLDEN_GLOVE': 'Best goalkeeper by clean sheets',
      'worldCup.award.reason.FAIR_PLAY': 'Best disciplinary record among knockout-stage teams',

      'worldCup.journey.summary.noMatches': '{teamName} has no matches in this world cup yet.',
      'worldCup.journey.summary.champion':
        '{teamName} became world champion after beating {opponentName} {scoreFor}-{scoreAgainst} in the final.',
      'worldCup.journey.summary.finalPending':
        '{teamName} reached the final and is waiting to play against {opponentName}.',
      'worldCup.journey.summary.finalActive':
        '{teamName} is currently playing the final against {opponentName}.',
      'worldCup.journey.summary.finalLost':
        '{teamName} reached the final and lost to {opponentName} {scoreFor}-{scoreAgainst}.',
      'worldCup.journey.summary.eliminatedBy':
        '{teamName} reached {stageName} and was eliminated by {opponentName} {scoreFor}-{scoreAgainst}.',
      'worldCup.journey.summary.groupExit':
        '{teamName} was eliminated in the group stage.',
      'worldCup.journey.summary.reached': '{teamName} reached {stageName}.',
      ...flattenTurnContextVariantTranslations(TURN_CONTEXT_VARIANTS_EN_EPIC),
      ...flattenTurnResultVariantTranslations(TURN_RESULT_VARIANTS_EN_EPIC),
      ...flattenTurnOutcomeVariantTranslations(TURN_RESULT_OUTCOME_VARIANTS_EN_EPIC),
      ...flattenHalfTimeVariantTranslations(HALF_TIME_VARIANTS_EN),
      ...flattenFinalVariantTranslations('match.final.userWins.variant', FINAL_USER_WIN_VARIANTS_EN),
      ...flattenFinalVariantTranslations('match.final.opponentWins.variant', FINAL_OPPONENT_WIN_VARIANTS_EN),
    },
    es: {
      'match.action.RESTART_MATCH': 'Reanudar partido',
      'match.action.ATTACK': 'Atacar',
      'match.action.HOLD': 'Mantener posesión',
      'match.action.PRESS': 'Presionar',
      'match.action.LONG_PASS': 'Pase largo',
      'match.action.SHOOT': 'Patear',
      'match.action.PASS': 'Pasar',
      'match.action.DRIBBLE': 'Gambetear',
      'match.action.CROSS': 'Centro',
      'match.action.DEFEND': 'Defender',
      'match.action.LEFT': 'Esquina izquierda',
      'match.action.RIGHT': 'Esquina derecha',
      'match.action.CENTER': 'Centro',
      'match.action.PICAR': 'Picar',
      'match.action.DIVE_LEFT': 'Tirarse a la izquierda',
      'match.action.DIVE_RIGHT': 'Tirarse a la derecha',
      'match.action.STAY_CENTER': 'Quedarse al centro',
      'match.action.WAIT': 'Esperar',
      'match.action.BLOCK': 'Cerrar espacios',
      'match.action.TACKLE': 'Barrida',
      'match.action.QUIT_MATCH': 'Salir del partido',

      'match.zone.DEFENSE_THIRD': 'el tercio defensivo',
      'match.zone.MIDFIELD': 'el mediocampo',
      'match.zone.ATTACK_THIRD': 'el tercio ofensivo',
      'match.zone.BOX': 'el area',

      'match.start.header':
        '¡Comienza la final del Mundial! {teamName} ({teamFormation}) vs {opponentName} ({opponentFormation}). ¡Todo está por decidirse!',
      'match.start.rivalry':
        '¡Hay rivalidad histórica en esta final! Cada cruce se juega con tensión máxima desde el inicio.',
      'match.start.kickoff': 'Señoras y señores, con ustedes {teamName}. ¡Arrancó la ilusión! {ballCarrierName} da inicio al partido desde el mediocampo.',
      'match.start.kickoff.variant.1':
        '¡Arrancó la ilusión! ¡{ballCarrierName} pone la pelota en juego para {teamName} desde el mediocampo y arranca la final!',
      'match.start.kickoff.variant.2':
        '¡La mueve {ballCarrierName} para {teamName} desde el mediocampo! Empieza la batalla por la copa del mundo.',
      'match.start.kickoff.variant.3':
        '¡No hay nada más lindo que volver a verte, {teamName}! {ballCarrierName} toca desde el mediocampo y enciende una final para la historia.',
      'match.start.kickoff.variant.4':
        '¡Que lindo es volver a verte, {teamName}! Saque inicial de {ballCarrierName} en el mediocampo. ¡Noventa minutos para la gloria!',
      'match.start.kickoff.variant.5':
        '¡Arrancó la ilusión! {ballCarrierName} inicia para {teamName} desde el mediocampo y el estadio estalla con la primera jugada.',

      'match.forfeit.line1': 'La hinchada no lo puede creer. {teamName} abandona la final.',
      'match.forfeit.line2': '{opponentName} gana por abandono.',
      'match.halftime.summary.leading':
        '¡{teamName} llega al descanso ganando {scoreTeam}-{scoreOpponent}! La estrategia {teamStrategy} está dando sus frutos.',
      'match.halftime.summary.drawing':
        'Descanso: {teamName} y {opponentName} empatan {scoreTeam}-{scoreOpponent}. Momento de evaluar la estrategia. Nada está decidido.',
      'match.halftime.summary.trailing':
        '¡Descanso difícil! {teamName} cae {scoreTeam}-{scoreOpponent}. El equipo necesita ajustar la tactica y reaccionar en el segundo tiempo.',
      'match.halftime.prompt':
        'Entretiempo. Momento de recalcular, ajustar la estrategia y salir con todo en el segundo tiempo.',
      'match.halftime.secondHalfKickoff':
        '¡Arranca el segundo tiempo! Saque del medio para {teamName}.',
      'match.strategy.saved': 'La estrategia del equipo {strategy} fue guardada correctamente.',
      'match.strategy.saved.autoFormation':
        'La estrategia del equipo {strategy} fue guardada correctamente. La formación se ajustó automáticamente a {formation} por compatibilidad.',
      'match.formation.saved': 'La formacion del equipo {formation} fue guardada correctamente.',
      'match.tactics.reset':
        'La táctica del equipo volvió a sus valores por defecto: estrategia {strategy}, formación {formation}.',
      'match.strategy.description.ATTACK': 'Estilo ofensivo directo con acciones de ataque más fuertes.',
      'match.strategy.description.DEFENSE': 'Bloque defensivo compacto que prioriza resistir ocasiones.',
      'match.strategy.description.PENALTIES': 'Preparación enfocada en situaciones de penal de alta presión.',
      'match.strategy.description.COUNTER_ATTACK': 'Transiciones rápidas después de recuperar la posesión.',
      'match.strategy.description.BALANCED': 'Esquema neutral que da un bonus leve a todas las líneas.',
      'match.strategy.description.POSSESSION': 'Estilo de posesión que refuerza el control del mediocampo.',
      'match.formation.description.4-3-3': 'Esquema ofensivo con extremos abiertos y mediocampo equilibrado.',
      'match.formation.description.4-4-2': 'Estructura clásica y compacta con dos delanteros.',
      'match.formation.description.4-2-3-1': 'Doble pivote con línea creativa detrás del punta.',
      'match.formation.description.3-5-2': 'Sistema con carrileros y gran superioridad por el centro.',
      'match.formation.description.3-4-3': 'Sistema agresivo con tres delanteros y amplitud por carriles.',
      'match.formation.description.4-1-4-1': 'Estructura con pivote único y buena estabilidad defensiva.',
      'match.formation.description.4-5-1': 'Bloque defensivo con mediocampo poblado y un solo punta.',
      'match.formation.description.5-3-2': 'Línea de cinco con dos delanteros para transiciones.',
      'match.formation.description.5-4-1': 'Esquema muy defensivo para proteger el área.',
      'match.formation.description.4-1-2-1-2': 'Rombo cerrado orientado a combinaciones interiores.',
      'match.formation.description.4-3-2-1': 'Árbol angosto con dos mediapuntas avanzados.',
      'match.formation.description.3-4-1-2': 'Tres en el fondo con enganche detrás de dos delanteros.',
      'match.formation.description.4-4-1-1': 'Líneas equilibradas con un segundo punta de apoyo.',
      'match.formation.description.4-3-1-2': 'Sobrecarga central con dos delanteros y un enganche.',
      'match.formation.description.3-1-4-2': 'Base de tres centrales con pivote de contención.',
      'coach.profile.label.CONSERVATIVE': 'Conservador',
      'coach.profile.description.CONSERVATIVE':
        'Prioriza defensa y posesión segura. Protege rápido una ventaja de un gol y reduce riesgos.',
      'coach.profile.example.CONSERVATIVE':
        'Cuando gana 1-0, suele pasar temprano a bloque bajo y cambios defensivos.',
      'coach.profile.label.BALANCED': 'Balanceado',
      'coach.profile.description.BALANCED':
        'Combina ataque, posesión y contraataque según el contexto, sin cambios extremos.',
      'coach.profile.example.BALANCED':
        'Si empata, mantiene estructura; si pierde, sube el riesgo de forma controlada.',
      'coach.profile.label.AGGRESSIVE': 'Agresivo',
      'coach.profile.description.AGGRESSIVE':
        'Empuja un fútbol ofensivo de alta intensidad y presión, incluso cuando ya va ganando.',
      'coach.profile.example.AGGRESSIVE':
        'Suele mantener ATTACK tras anotar y hace cambios ofensivos.',
      'coach.profile.label.PRAGMATIC': 'Pragmático',
      'coach.profile.description.PRAGMATIC':
        'Elige el plan más eficiente según el momento del partido, sin estilo fijo.',
      'coach.profile.example.PRAGMATIC':
        'Puede pasar a posesión cuando gana o a ataque al final cuando necesita remontar.',
      'coach.profile.label.CATENACCIO': 'Catenaccio',
      'coach.profile.description.CATENACCIO':
        'Mentalidad fuertemente defensiva: prioriza defensa y contraataque con estructura cerrada.',
      'coach.profile.example.CATENACCIO':
        'Con ventaja de 1 gol, baja temprano el bloque y refuerza DF/MF antes de asumir más riesgo.',
      'coach.profile.label.REACTIVE': 'Reactivo',
      'coach.profile.description.REACTIVE':
        'Se adapta rápido a eventos recientes como goles, tarjetas y cambios de impulso.',
      'coach.profile.example.REACTIVE':
        'Tras recibir un gol, suele ajustar la estrategia más rápido que otros perfiles.',
      'coach.profile.label.TOTAL_FOOTBALL': 'Fútbol Total',
      'coach.profile.description.TOTAL_FOOTBALL':
        'Alta movilidad y presión colectiva, buscando controlar el juego con y sin pelota.',
      'coach.profile.example.TOTAL_FOOTBALL':
        'Prefiere cambios de jugadores versátiles para sostener presión y rotación posicional.',

      'match.turn.context': '{playerName} conduce la pelota para {teamName} en {zone}.',
      'match.turn.selectedAction': 'Acción elegida: {actionLabel}.',
      'match.card.red': '¡Tarjeta ROJA para {playerName}! {teamName} se queda con un hombre menos.',
      'match.card.yellow': '¡{playerName} ({teamName}) ve la tarjeta amarilla! Cuidado con la próxima.',
      'match.restart.freeKick': 'Tiro libre para {teamName}.',
      'match.restart.corner': 'Tiro de esquina para {teamName}.',
      'match.restart.throwIn': 'Saque lateral para {teamName}.',
      'match.restart.kickoff': 'Saque del centro para {teamName}.',
      'match.lastPlay.tension':
        '¡MOMENTO DE MÁXIMA TENSIÓN! El árbitro agrega 5 minutos y esta es la última jugada por el título mundial.',
      'match.lastPlay.oneOnOne':
        '¡ÚLTIMA JUGADA! {attackerName} queda mano a mano frente a {goalkeeperName}. ¡TODO O NADA!',
      'match.lastPlay.oneOnOne.for.1':
        '¡¡LA ÚLTIMA ES PARA {attackingTeamName}!! {attackerName} queda cara a cara con {goalkeeperName}.',
      'match.lastPlay.oneOnOne.for.2':
        '¡¡PUEDE SER LA JUGADA DEL MUNDIAL!! {attackerName} encara solo a {goalkeeperName} para {attackingTeamName}.',
      'match.lastPlay.oneOnOne.for.3':
        '¡¡TODO SE DEFINE ACÁ, QUERIDO!! Mano a mano de {attackerName} contra {goalkeeperName} para {attackingTeamName}.',
      'match.lastPlay.oneOnOne.for.4':
        '¡¡SE ESCAPA {attackerName}!! {attackingTeamName} queda a un paso de la gloria frente a {goalkeeperName}.',
      'match.lastPlay.oneOnOne.for.5':
        '¡¡PARTIDO Y MUNDIAL EN ESTA PELOTA!! {attackerName} mano a mano con {goalkeeperName}.',
      'match.lastPlay.oneOnOne.against.1':
        '¡¡ÚLTIMA JUGADA Y SUFRIMOS TODOS!! {attackerName} queda mano a mano con {goalkeeperName}.',
      'match.lastPlay.oneOnOne.against.2':
        '¡¡APARECÉ AHORA, {goalkeeperName}!! {attackerName} enfrenta al arquero en un duelo decisivo.',
      'match.lastPlay.oneOnOne.against.3':
        '¡¡TODO DEPENDE DE {goalkeeperName}!! {attackerName} tiene la última frente al arco.',
      'match.lastPlay.oneOnOne.against.4':
        '¡¡NO HAY MARGEN DE ERROR!! {goalkeeperName} queda solo ante {attackerName} y todo un país contiene la respiración.',
      'match.lastPlay.oneOnOne.against.5':
        '¡¡CORAZONES EN LA GARGANTA!! {attackerName} se va solo... y {goalkeeperName} tiene que convertirse en héroe.',
      'match.lastPlay.penalty':
        '¡¡ÚLTIMA JUGADA!! Penal para {attackingTeamName}. {attackerName} frente a {goalkeeperName}. ¡¡SE DETIENE EL MUNDO!!',
      'match.lastPlay.penalty.for.1':
        '¡¡PENAL PARA {attackingTeamName} EN LA ÚLTIMA!! {attackerName} contra {goalkeeperName}. ¡PUEDE SER ETERNO!',
      'match.lastPlay.penalty.for.2':
        '¡¡LA PELOTA MÁS PESADA DEL MUNDIAL!! {attackerName} enfrenta a {goalkeeperName} desde los doce pasos.',
      'match.lastPlay.penalty.for.3':
        '¡¡TODO EL ESTADIO CONTIENE EL ALIENTO!! Penal para {attackingTeamName}: {attackerName} va contra {goalkeeperName}.',
      'match.lastPlay.penalty.for.4':
        '¡¡EL ÁRBITRO MARCA PENAL!! {attackerName} puede darle la gloria a {attackingTeamName} frente a {goalkeeperName}.',
      'match.lastPlay.penalty.for.5':
        '¡¡UNA PATADA PARA ENTRAR EN LA HISTORIA!! {attackerName} vs {goalkeeperName} en la última jugada.',
      'match.lastPlay.penalty.against.1':
        '¡¡NOOO... PENAL EN CONTRA EN LA ÚLTIMA!! Todo queda en las manos de {goalkeeperName}.',
      'match.lastPlay.penalty.against.2':
        '¡¡QUÉ GOLPE DURÍSIMO!! Penal para {attackingTeamName}. ¡¡AHORA TE NECESITAMOS MÁS QUE NUNCA, {goalkeeperName}!! {attackerName} contra {goalkeeperName}.',
      'match.lastPlay.penalty.against.3':
        '¡¡PENAL EN LA ÚLTIMA JUGADA!! Penal para {attackingTeamName}. {goalkeeperName} quiere vestirse de héroe ante {attackerName}.',
      'match.lastPlay.penalty.against.4':
        '¡¡EL JUEZ COBRA PENAL PARA {attackingTeamName}!! Todo queda en manos de {goalkeeperName}.',
      'match.lastPlay.penalty.against.5':
        '¡¡SILENCIO TOTAL EN EL ESTADIO!! {attackerName} enfrenta a {goalkeeperName} desde el punto penal.',
      'match.lastPlay.attackGoal':
        '¡¡GOOOOOOOOL!! ¡¡{playerName} LE DA EL TÍTULO DEL MUNDO A {teamName} EN LA ÚLTIMA PELOTA!! ¡¡HISTÓRICO!!',
      'match.lastPlay.attackGoal.for.1':
        '¡¡GOOOOL!! ¡¡{playerName} DESATA LA LOCURA TOTAL Y {teamName} ES CAMPEÓN DEL MUNDO!!',
      'match.lastPlay.attackGoal.for.2':
        '¡¡EXPLOTA EL ESTADIOOOO!! {playerName} marca para {teamName} y escribe una página eterna.',
      'match.lastPlay.attackGoal.for.3':
        '¡¡A LA HISTORIA DEL FÚTBOL!! {playerName} convierte para {teamName} en la última jugada.',
      'match.lastPlay.attackGoal.for.4':
        '¡¡GOL DEL TÍTULO!! {playerName} sentencia el Mundial para {teamName} sobre el cierre.',
      'match.lastPlay.attackGoal.for.5':
        '¡¡NO HAY MÁS NADA QUE DECIR!! {playerName} marca y {teamName} toca el cielo del mundo.',
      'match.lastPlay.attackGoal.against.1':
        '¡¡GOL DE {teamName} EN LA ÚLTIMA!! Qué golpe devastador...',
      'match.lastPlay.attackGoal.against.2':
        '¡¡NO LO PODEMOS CREER!! {playerName} convierte para {teamName} y nos deja sin copa.',
      'match.lastPlay.attackGoal.against.3':
        '¡¡QUÉ FINAL MÁS CRUEL!! {playerName} marca sobre el cierre para {teamName}.',
      'match.lastPlay.attackGoal.against.4':
        '¡¡DOLOR TOTAL!! {playerName} sentencia la final para {teamName} en la última pelota.',
      'match.lastPlay.attackGoal.against.5':
        '¡¡SE ESCAPA EL MUNDIAL EN LA ÚLTIMA!! {playerName} convierte para {teamName}.',
      'match.lastPlay.counterGoal':
        '¡¡CONTRAGOLPE MORTAL!! {playerName} liquida todo para {teamName} tras el fallo en la última jugada.',
      'match.lastPlay.counterGoal.for.1':
        '¡¡CONTRA LETAL!! ¡{playerName} DEFINE PARA {teamName} Y DESATA UNA LOCURA INOLVIDABLE!',
      'match.lastPlay.counterGoal.for.2':
        '¡¡DE PELÍCULA!! ¡{playerName} CASTIGA DE CONTRA Y LE DA EL MUNDIAL A {teamName}!',
      'match.lastPlay.counterGoal.for.3':
        '¡¡GOLPE FINAL!! ¡{playerName} CONVIERTE DE CONTRA Y HACE ETERNO A {teamName}!',
      'match.lastPlay.counterGoal.for.4':
        '¡¡APROVECHÓ EL ERROR!! ¡{playerName} MARCA DE CONTRA PARA {teamName} EN LA ÚLTIMA JUGADA!',
      'match.lastPlay.counterGoal.for.5':
        '¡¡QUÉ FINAL ÉPICO!! ¡{playerName} LIQUIDA LA HISTORIA DE CONTRA Y EXPLOTA LA FIESTA DE {teamName}!',
      'match.lastPlay.counterGoal.against.1':
        '¡¡QUÉ GOLPE...!! {playerName} nos mata de contra para {teamName} tras nuestro fallo.',
      'match.lastPlay.counterGoal.against.2':
        '¡¡INCREÍBLE FINAL EN CONTRA!! {playerName} castiga de contra y nos deja sin nada.',
      'match.lastPlay.counterGoal.against.3':
        '¡¡NOS AGARRARON MAL PARADOS!! {playerName} define de contra para {teamName} y duele muchísimo.',
      'match.lastPlay.counterGoal.against.4':
        '¡¡DEL CASI GOL NUESTRO AL GOLPE FINAL!! {playerName} convierte de contra y silencia todo.',
      'match.lastPlay.counterGoal.against.5':
        '¡¡FINAL TRISTÍSIMO!!  {playerName} liquida de contra para {teamName} y se termina el sueño.',
      'match.restart.penaltyFor': '¡Penal para {teamName}! ¡El estadio explota!',
      'match.restart.penaltyAgainst': 'Penal contra {teamName}. El arquero se prepara para detener el remate.',
      'match.penalty.foulWhistle': '¡Penal! El árbitro no duda y señala la pena máxima. ¡{teamName} tiene una chance de oro!',
      'match.rivalry.momentum': 'La rivalidad se siente. El ánimo cambia para el próximo turno.',
      'match.turn.userGoal': '¡¡GOOOL DE {teamName}!! ¡{playerName} la puso adentro!',
      'match.turn.opponentGoal': '¡Gol del rival! {playerName} marcó para {teamName}. Duro golpe.',
      'match.turn.userCounterGoal': '¡¡GOOOL DE CONTRAATAQUE!! ¡{playerName} no perdonó para {teamName}!',
      'match.turn.opponentCounterGoal': '¡Gol de contraataque del rival! {playerName} definió para {teamName}. No se puede cometer ese error.',
      'match.turn.penaltySaved': '¡¡ATAJÓ {goalkeeperName}!! ¡{teamName} se salva de milagro!',
      'match.turn.userNoFinish': '{teamName} no logra definir. Hay que generar más.',
      'match.turn.userBuildUp': '{teamName} sale jugando y construye desde atrás.',
      'match.turn.userDefenseHolds': '¡{teamName} aguanta defensivamente y evita el gol!',
      'match.turn.consequence.userKeepsBall': '¡{playerName} aguanta la pelota y {teamName} matiene la posesión!',
      'match.turn.consequence.userRecoversBall': '¡{playerName} recupera la pelota para {teamName}!',
      'match.turn.consequence.opponentInterception':
        '¡{playerName} intercepta! {teamName} se queda con la posesión.',
      'match.turn.consequence.opponentKeepsBall': '{teamName} mantiene la pelota con {playerName}.',
      'match.turn.flowSnapshot': '{teamName} controla el juego en {zone}.',
      'match.turn.currentScore': 'Marcador: {scoreTeam}-{scoreOpponent}.',
      'match.turn.final': '{finalMessage}',
      'match.stats.teamUnknown': 'Equipo desconocido',
      'match.stats.noAction': 'Sin acción',
      'match.stats.goal': '¡Gol! {playerName} marca para {teamName}.',
      'match.stats.yellowCard': '{playerName} recibe tarjeta amarilla para {teamName}.',
      'match.stats.redCard': '{playerName} recibe tarjeta roja para {teamName}.',
      'match.stats.genericEvent': '{playerName} realiza {actionLabel} para {teamName}.',
      'match.stats.forfeit': '{teamName} abandona el partido.',
      'match.stats.matchEnded': "Final del partido (90'). Marcador {scoreTeam}-{scoreOpponent}.",
      'match.stats.halfTime': 'Llegamos al descanso. Marcador {scoreTeam}-{scoreOpponent}.',

      'match.outcome.userGoalFromZone': '¡¡GOOOL!! ¡{playerName} marca para {teamName} desde {zone}! ¡¡GOLAZO!!',
      'match.outcome.opponentCounter': '¡Gol del rival en el contragolpe! {playerName} define para {teamName}. El error salió caro.',
      'match.outcome.userNoGoal': '{playerName} conduce en {zone} pero no llega el gol. Hay que seguir intentando.',
      'match.outcome.opponentGoalFromZone': '¡Gol! {playerName} ataca para {teamName} y marca desde {zone}. Golpe duro.',
      'match.outcome.userCounterGoal': '¡¡GOOOL DE CONTRAATAQUE!! ¡{playerName} no perdonó para {teamName}!',
      'match.outcome.opponentNoGoal':
        '{playerName} construye el ataque para {teamName} pero la defensa aguanta. Por ahora.',

      'match.final.userWins': "¡¡FINAL DEL PARTIDO (90')!! {scoreTeam}-{scoreOpponent}. ¡¡TU EQUIPO GANA LA FINAL Y SE CORONA CAMPEÓN DEL MUNDO!! La gloria es eterna y el nombre de estos héroes quedará grabado para siempre en la historia.",
      'match.final.opponentWins': "Final del partido (90'). {scoreOpponent}-{scoreTeam}. El rival gana la final y se corona campeón del mundo. No pudo ser.",
      'match.close.decisiveUserGoal':
        "90': ¡¡GOOOL!! ¡{playerName} marca el gol decisivo para {teamName}! ¡El mundo se detiene en un grito laico y nace una nueva leyenda! {finalMessage}",
      'match.close.decisiveOpponentGoal':
        "90': Gol. {playerName} marca para {teamName} y puede ser decisivo. {finalMessage}",
      'match.close.decidesAt90': "{playerName} define la final del mundo en el minuto 90'.",
      'match.timeline.substitution':
        'Cambio en {teamName}: entra {incomingPlayerName}, sale {outgoingPlayerName}.',
      'match.timeline.substitution.entersField':
        '¡Cambio en {teamName}! Ingresa {incomingPlayerName} por {outgoingPlayerName}.',
      'match.timeline.lowEnergyInjury':
        '¡{playerName} se lesiona y tiene que salir por el agotamiento físico!',
      'match.timeline.injury':
        '¡{playerName} se lesiona y abandona el campo! Malas noticias.',
      'match.timeline.captainChange':
        '{teamName} tiene nuevo capitán: {playerName} lleva la cinta.',
      'match.tactics.opponentShift':
        '{coachName} mueve el tablero: {teamName} cambia a estrategia {strategy} con formación {formation}.',
      'match.tactics.userShift':
        '{coachName} ajusta a {teamName}: estrategia {strategy} y formación {formation}.',
      'match.tactics.userShift.ATTACK.1':
        '{coachName} manda a {teamName} al frente: ATTACK con {formation}.',
      'match.tactics.userShift.ATTACK.2':
        '{teamName} se vuelve agresivo: ATTACK con dibujo {formation}.',
      'match.tactics.userShift.DEFENSE.1':
        '{coachName} ordena cerrar líneas: {teamName} pasa a DEFENSE en {formation}.',
      'match.tactics.userShift.DEFENSE.2':
        '{teamName} se repliega y protege el resultado con DEFENSE ({formation}).',
      'match.tactics.userShift.PENALTIES.1':
        '{coachName} prepara a {teamName} para máxima tensión: PENALTIES con {formation}.',
      'match.tactics.userShift.PENALTIES.2':
        '{teamName} entra en modo PENALTIES con {formation} para jugadas decisivas.',
      'match.tactics.userShift.COUNTER_ATTACK.1':
        '{coachName} activa el plan de transición: {teamName} va COUNTER_ATTACK con {formation}.',
      'match.tactics.userShift.COUNTER_ATTACK.2':
        '{teamName} espera y lastima de contra: COUNTER_ATTACK en {formation}.',
      'match.tactics.userShift.BALANCED.1':
        '{coachName} equilibra el equipo: {teamName} cambia a BALANCED con {formation}.',
      'match.tactics.userShift.BALANCED.2':
        '{teamName} vuelve a un esquema BALANCED ({formation}) para ordenar el partido.',
      'match.tactics.userShift.POSSESSION.1':
        '{coachName} pide control total: {teamName} cambia a POSSESSION en {formation}.',
      'match.tactics.userShift.POSSESSION.2':
        '{teamName} baja el ritmo y cuida la pelota con POSSESSION ({formation}).',
      'match.fallback.unknownPlayer': 'Jugador desconocido',

      'worldCup.stage.GROUP_STAGE': 'Fase de grupos',
      'worldCup.stage.ROUND_OF_32': 'Dieciseisavos',
      'worldCup.stage.ROUND_OF_16': 'Octavos',
      'worldCup.stage.QUARTER_FINALS': 'Cuartos',
      'worldCup.stage.SEMI_FINALS': 'Semifinales',
      'worldCup.stage.THIRD_PLACE': 'Tercer puesto',
      'worldCup.stage.FINAL': 'Final',
      'worldCup.stage.CHAMPION': 'Campeón',
      'worldCup.award.reason.GOLDEN_BALL_FINALISTS': 'Mejor jugador por impacto global (solo finalistas)',
      'worldCup.award.reason.GOLDEN_BALL': 'Mejor jugador por impacto global',
      'worldCup.award.reason.GOLDEN_BOOT': 'Máximo goleador del torneo',
      'worldCup.award.reason.SILVER_BOOT': 'Segundo goleador del torneo',
      'worldCup.award.reason.BRONZE_BOOT': 'Tercer goleador del torneo',
      'worldCup.award.reason.GOLDEN_GLOVE_TOP4':
        'Mejor arquero por vallas invictas (equipos del top 4)',
      'worldCup.award.reason.GOLDEN_GLOVE': 'Mejor arquero por vallas invictas',
      'worldCup.award.reason.FAIR_PLAY': 'Mejor registro disciplinario entre equipos de eliminación directa',

      'worldCup.journey.summary.noMatches': '{teamName} todavía no tiene partidos en este mundial.',
      'worldCup.journey.summary.champion':
        '{teamName} se coronó campeón del mundo tras vencer a {opponentName} {scoreFor}-{scoreAgainst} en la final.',
      'worldCup.journey.summary.finalPending':
        '{teamName} llegó a la final y espera jugar contra {opponentName}.',
      'worldCup.journey.summary.finalActive':
        '{teamName} está disputando la final contra {opponentName}.',
      'worldCup.journey.summary.finalLost':
        '{teamName} llegó a la final y perdió con {opponentName} {scoreFor}-{scoreAgainst}.',
      'worldCup.journey.summary.eliminatedBy':
        '{teamName} llegó a {stageName} y fue eliminado por {opponentName} {scoreFor}-{scoreAgainst}.',
      'worldCup.journey.summary.groupExit':
        '{teamName} quedó eliminado en fase de grupos.',
      'worldCup.journey.summary.reached': '{teamName} llegó hasta {stageName}.',
      ...flattenTurnContextVariantTranslations(TURN_CONTEXT_VARIANTS_ES_EPIC),
      ...flattenTurnResultVariantTranslations(TURN_RESULT_VARIANTS_ES_EPIC),
      ...flattenTurnOutcomeVariantTranslations(TURN_RESULT_OUTCOME_VARIANTS_ES_EPIC),
      ...flattenHalfTimeVariantTranslations(HALF_TIME_VARIANTS_ES),
      ...flattenFinalVariantTranslations('match.final.userWins.variant', FINAL_USER_WIN_VARIANTS_ES),
      ...flattenFinalVariantTranslations('match.final.opponentWins.variant', FINAL_OPPONENT_WIN_VARIANTS_ES),
    },
  };

  public resolveLocale(locale?: string | null): AppLocale {
    switch ((locale || '').toLowerCase()) {
      case 'es':
        return 'es';
      case 'en':
      default:
        return DEFAULT_APP_LOCALE;
    }
  }

  public t(key: string, locale: AppLocale = DEFAULT_APP_LOCALE, params?: TranslationParams): string {
    const language = this.resolveLocale(locale);
    const text = this.translations[language][key] || this.translations.en[key] || key;

    if (!params) {
      return text;
    }

    return text.replace(/\{(\w+)\}/g, (_match, token: string) => {
      const value = params[token];
      return value === undefined || value === null ? `{${token}}` : String(value);
    });
  }
}
