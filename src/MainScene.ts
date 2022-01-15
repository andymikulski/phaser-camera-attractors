import Phaser from 'phaser';
import { CameraAttractors } from './CameraAttractors';

const NUM_MARIOS = 2;
export default class MainScene extends Phaser.Scene {
  private attractionSys: CameraAttractors;
  private marios: Phaser.GameObjects.Image[] = [];
  private centroidCursor: Phaser.GameObjects.Rectangle;

  preload = () => {
    this.load.image('mario', 'https://i.imgur.com/nKgMvuj.png');
    this.load.image('background', 'https://i.imgur.com/dzpw15B.jpg');
  };

  create = () => {
    this.attractionSys = new CameraAttractors(this.cameras.main);

    // this.cameras.main.setZoom(2);
    this.add.text(0, 0, 'Main Scene - no physics', { color: '#fff', fontSize: '16px' });
    const newCam = this.cameras.add(0, 0, 200, 200, false, 'miniview');

    this.miniAttractors = new CameraAttractors(newCam);

    this.add.image(0, 0, 'background')
      .setOrigin(0, 0) // Anchor to top left so (0,0) is flush against the corner
      .setDisplaySize(1024, 768) // Fit background image to window
      .setDepth(-1); // Behind everything

    let mario: Phaser.GameObjects.Image;
    for (let i = 0; i < NUM_MARIOS; i++) {
      mario = this.add.image(32, 32, 'mario')
        .setData('velocity', { x: Math.random() * 500, y: Math.random() * 500 })
        .setDisplaySize(32, 32);

      this.marios.push(mario);

      this.attractionSys.addAttractor(mario, i === 0 ? 1 : 0.25, 'mario-' + i, 500, true);
      this.miniAttractors.addAttractor(mario, i === 0 ? 1 : 0.25, 'mario-' + i, 500, true);
    }

    // this.cameras.main.setBounds(0, 0, 1024, 768);
    this.attractionSys.setActive(true);

    this.centroidCursor = this.add.rectangle(0, 0, 16, 16, 0xff0000);

    mario = this.marios[0];
    this.input.keyboard.on('keydown-A', () => {
      mario.x -= 10;
    });
    this.input.keyboard.on('keydown-D', () => {
      mario.x += 10;
    });

    this.input.keyboard.on('keydown-W', () => {
      mario.y -= 10;
    });
    this.input.keyboard.on('keydown-S', () => {
      mario.y += 10;
    });


    this.miniAttractors.setActive(true).addAttractor(mario, 1.0, 'main', Infinity, true);
  };

  private miniAttractors: CameraAttractors;



  update = (time: number, delta: number) => {
    // do something every tick here
    let mario;
    let velocity;
    for (let i = 1; i < this.marios.length; i++) {
      mario = this.marios[i];
      velocity = mario.getData('velocity') as { x: number; y: number; };

      // Move the thing
      mario.x += velocity.x * delta * 0.001;
      mario.y += velocity.y * delta * 0.001;

      // Check if we hit a boundary and bounce
      if (mario.x > 1024 || mario.x < 0) {
        velocity.x *= -1;
      }
      if (mario.y > 768 || mario.y < 0) {
        velocity.y *= -1;
      }
      mario.setData('velocity', velocity)
    }

    mario = this.marios[0];
    this.miniAttractors.activateAttractorsAroundPoint(mario);
    this.attractionSys.update(time, delta);
    this.miniAttractors.update(time, delta);
    this.centroidCursor.setPosition(this.attractionSys.position.x, this.attractionSys.position.y);
  }
}
