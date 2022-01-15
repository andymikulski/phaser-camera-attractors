type CameraAttractorConfig = {
  isActive: boolean;
  range: number;
  position: { x: number; y: number; };
  weight: number;
}

export class CameraAttractors {
  private attractors: {
    [id: string]: CameraAttractorConfig
  } = {};

  constructor(private mainCamera: Phaser.Cameras.Scene2D.Camera) { }

  public setActive = (val: boolean) => {
    if (val) {
      this.mainCamera.startFollow(this.position);
    } else {
      this.mainCamera.stopFollow();
    }
    return this;
  }

  public addAttractor(position: { x: number; y: number; }, weight: number, id: string, range = Infinity, activate = false) {
    id = id ? id : Math.random().toString(32).slice(2);
    this.attractors[id] = {
      range,
      position,
      weight,
      isActive: activate,
    };
    return this;
  }

  public setAttractorActive = (id: string, val: boolean) => {
    if (!this.attractors[id]) { return; }
    this.attractors[id].isActive = val;

    return this;
  }

  public setAttractorWeight = (id: string, weight: number) => {
    if (!this.attractors[id]) { return; }
    this.attractors[id].weight = weight;
    return this;
  }

  public removeAttractor = (id: string) => {
    delete this.attractors[id];
    return this;
  }

  public activateAttractorsAroundPoint = throttle((pos: Phaser.Math.Vector2) => {
    let attr;
    for (const id in this.attractors) {
      attr = this.attractors[id];
      attr.isActive =
        attr.range === Infinity
        || Phaser.Math.Distance.BetweenPointsSquared(pos, attr.position) <= (attr.range * attr.range);
    }
  }, 1000 / 10);

  public getAttractorsAroundPoint = throttle((pos: Phaser.Math.Vector2, activeOnly: boolean = false) => {
    let attractors = [] as CameraAttractorConfig[];
    let attr;
    for (const id in this.attractors) {
      attr = this.attractors[id];
      if (!activeOnly || attr.isActive) {
        attractors.push(attr);
      }
    }

    return attractors;
  }, 1000 / 10);

  public getComputedAttractionPoint = (): Phaser.Math.Vector2 | undefined => {
    let centerPoint = new Phaser.Math.Vector2(0, 0);
    let attr;
    let totalWeight = 0;
    for (const id in this.attractors) {
      attr = this.attractors[id];
      if (!attr.isActive) { continue; }
      centerPoint.x += attr.position.x * attr.weight;
      centerPoint.y += attr.position.y * attr.weight;

      totalWeight += attr.weight;
    }

    centerPoint = centerPoint.scale(1 / totalWeight);

    return centerPoint;
  }

  public position = {
    x: 0,
    y: 0,
  };

  public update = (time: number, delta: number) => {
    this.updatePosition();

    this.position.y = Phaser.Math.Linear(this.position.y, this.targetPoint.y, delta * 0.01);
    this.position.x = Phaser.Math.Linear(this.position.x, this.targetPoint.x, delta * 0.01);

    // this.position.x = this.targetPoint.x;
    // this.position.y = this.targetPoint.y;
  };

  private targetPoint: { x: number; y: number } = { x: 0, y: 0 };
  public updatePosition = throttle(() => {
    const point = this.getComputedAttractionPoint();
    this.targetPoint.x = point.x;
    this.targetPoint.y = point.y;
  }, 1000 / 30);
}

const throttle = function (cb: Function, timeout: number) {
  let lastRan = Date.now();
  return function (...args: any[]) {
    if (Date.now() - lastRan < timeout) {
      return;
    }
    lastRan = Date.now();
    cb(...args);
  }
};