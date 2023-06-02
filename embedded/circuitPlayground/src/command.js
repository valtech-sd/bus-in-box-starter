/**
 * This class manages the sequence of events to animate hardware lights.
 * Commands already have the capability to delay their start times, so this
 * is likely more useful when animating a set of constant frame rate sequences where
 * multiple lights may change color together.
 * Careful with timing and delays, or things might get weird. Remember, this is bare-bones
 * frameSets: Array of command objects
 * frameDuration: ms that each frame set should last
 * animator: function that animates a given set of frame commands (one frame set)
*/
class CommandSequence {
  frameSets;
  frameDuration;
  animator;
  constructor(frameSets, frameDuration, animator) {
    this.frameSets = frameSets;
    this.frameDuration = frameDuration;
    this.animator = animator;
  }

  animate() {
    const frameCount = this.frameSets.length;
    for (let ii = 0; ii < frameCount; ii++) {
      setTimeout(() => {
        let commands = this.frameSets[ii];
        const numCommands = commands.length;
        this.animator(commands);
      }, this.frameDuration * ii);
    }
  }
}

export default CommandSequence;