class Stat {
  constructor(params) {
    this.type = params.type;
    this.value = params.value;
    this.rolls = params.rolls;
    this.modified = params.modified;
    this.pinMod = params.pinMod;
    this.pinModOff = params.pinModOff;
    this.allowedTargetStats = params.allowedTargetStats;
  }
}

export default Stat;
