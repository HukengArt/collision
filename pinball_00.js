//****various jshint configs****
// jshint esversion: 8
// jshint browser: true
// jshint node: true
// jshint -W117
"use strict";

const WIDTH = 500;
const HEIGHT = 800;
const FPS = 60;

var canvas;
var ctx;
var keys = [];
var t_vel = 9;
var grav = 1;
var fric;

var ball;
var solid_elements = [];
var flippers = [];

document.addEventListener('DOMContentLoaded', setup);
setInterval(update, 1000/FPS);

function setup() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
    ctx.fillStyle = 'black';
    ctx.strokeStyle = 'white';
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillRect(0,0,canvas.width,canvas.height);

    document.body.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e) {
        keys[e.keyCode] = false;
    });

    ball = new Ball([WIDTH/2, HEIGHT/2],
                    [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]);
    solid_elements = [
      new SolidElement([[150,50,1],
                        [250,25,1],
                        [350,50,1],
                        [450,150,1],
                        [475,250,1],
                        [450,350,1],
                        [425,400,1],
                        [425,650,1],
                        [330,700,1],
                        [330,875,1],
                        [170,875,1],
                        [170,700,1],
                        [75,650,1],
                        [75,400,1],
                        [50,350,1],
                        [25,250,1],
                        [50,150,1]], false),
      // side bumpers
      new SolidElement([[150,450,1],
                        [175,600,1],
                        [120,575,1],
                        [120,460,1]], true),
      new SolidElement([[325,600,1],
                        [350,450,1],
                        [380,460,1],
                        [380,575,1]], true),
      // round bumpers
      new SolidElement([[250,75,-2],
                        [300,100,-2],
                        [300,150,-2],
                        [250,175,-2],
                        [200,150,-2],
                        [200,100,-2]], true),
      new SolidElement([[150,225,-2],
                        [200,250,-2],
                        [200,300,-2],
                        [150,325,-2],
                        [100,300,-2],
                        [100,250,-2]], true),
      new SolidElement([[350,225,-2],
                        [400,250,-2],
                        [400,300,-2],
                        [350,325,-2],
                        [300,300,-2],
                        [300,250,-2]], true)
    ];
    flippers = [
      new Flipper([170,700],
                  [[-15,0,1],
                   [0,-15,1],
                   [60,-10,1],
                   [70,0,-1],
                   [60,10,-1],
                   [0,15,1]],
                  Math.PI*30/180, Math.PI/2, 70, true),
      new Flipper([330,700],
                  [[-60,10,-1],
                   [-70,0,1],
                   [-60,-10,1],
                   [0,-15,1],
                   [15,0,1],
                   [0,15,-1]],
                   Math.PI*30/180, Math.PI/2, 74, false)
    ];
}

function update() {
    ctx.clearRect(0,0,WIDTH,HEIGHT);
    ctx.fillRect(0,0,WIDTH,HEIGHT);
    ctx.strokeStyle = 'white';

    for (let i = 0; i < flippers.length; i++) {
      flippers[i].control();
      flippers[i].move();
      flippers[i].drawHbSolid();
    }

    for (let i = 0; i < solid_elements.length; i++) {
      if (ball.bounce(solid_elements[i].hb_solid, solid_elements[i].convex)) {
        break;
      }
      solid_elements[i].drawHbSolid();
    }

    for (let i = 0; i < flippers.length; i++) {
      if (ball.bounce(flippers[i].hb_solid, true)) {
        break;
      }
    }

    ball.move();
    ball.drawHbSolid();

    if (ball.pos[1] > HEIGHT) {
      ball = new Ball([WIDTH/2, HEIGHT/2],
                      [Math.floor(Math.random() * 15) - 7, Math.floor(Math.random() * 15) - 7]);
    }
}

function vecAngle2D(vec_a, vec_b) {
    return Math.acos((vec_a[0] * vec_b[0] + vec_a[1] * vec_b[1]) / (Math.sqrt(Math.pow(vec_a[0], 2) + Math.pow(vec_a[1], 2)) * Math.sqrt(Math.pow(vec_b[0], 2) + Math.pow(vec_b[1], 2))));
  }

function vecLen2D(vec) {
  return Math.sqrt(Math.pow(vec[0],2) + Math.pow(vec[1],2));
}

function vecRotate3D(vec, angle) {

}

class Ball {
    constructor(pos, mo_vec) {
        this.pos = pos;
        this.hb_solid_rad = 10;
        this.mo_vec = mo_vec;
        this.elasticity = 0.8; // fraction of movement speed retained after bounce
        this.mass = 0.09;
        this.bounce_lock = 0; // counter to prevent 'flicker-bounce'

    }

    move() {
        // manage bounce lock
        if (this.bounce_lock > 0) {
          this.bounce_lock += 1;
          if (this.bounce_lock > 3) {
            this.bounce_lock = 0;
          }
        }

        // adjust speed to terminal velocity
        if (t_vel && Math.sqrt(Math.pow(this.mo_vec[0],2) + Math.pow(this.mo_vec[1],2)) > t_vel) {
            this.mo_vec[0] = this.mo_vec[0] / vecLen2D(this.mo_vec) * t_vel;
            this.mo_vec[1] = this.mo_vec[1] / vecLen2D(this.mo_vec) * t_vel;
        }

        // move orb
        this.pos[0] += this.mo_vec[0];
        this.pos[1] += this.mo_vec[1];

        // apply gravity
        if (grav) {
            this.mo_vec[1] += this.mass * grav;
        }

        // apply friction
        if (fric) {
            this.mo_vec[0] *= fric;
            this.mo_vec[1] *= fric;
        }
    }

    bounce(hitbox, convex) {
      if (this.bounce_lock == 0) {
        for (let i = 0; i < hitbox.length; i++) {
          let vec_a = [this.pos[0] - hitbox[i][0],
                      this.pos[1] - hitbox[i][1]];
          let vec_b = [hitbox[(i + 1) % hitbox.length][0] - hitbox[i][0],
                      hitbox[(i + 1) % hitbox.length][1] - hitbox[i][1]];

          let radians = vecAngle2D(vec_a, vec_b);

          if (vecLen2D(vec_a)  <= vecLen2D(vec_b) + this.hb_solid_rad && radians < Math.PI/2) {

            if (vecLen2D(vec_a) * Math.sin(radians) <= this.hb_solid_rad) {

                let alpha = vecAngle2D(this.mo_vec, vec_b);

                if (hitbox[i][2] > 0) {
                  if (convex) { // bounce off CONVEX hibtoxes
                    let x_new = (this.mo_vec[0]*Math.cos(2*Math.PI - 2*alpha) - this.mo_vec[1]*Math.sin(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                    let y_new = (this.mo_vec[0]*Math.sin(2*Math.PI - 2*alpha) + this.mo_vec[1]*Math.cos(2*Math.PI - 2*alpha)) * this.elasticity * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  } else { // bounce off CONCAVE hibtoxes
                    let x_new = (this.mo_vec[0]*Math.cos(2*alpha) - this.mo_vec[1]*Math.sin(2*alpha)) * this.elasticity * hitbox[i][2];
                    let y_new = (this.mo_vec[0]*Math.sin(2*alpha) + this.mo_vec[1]*Math.cos(2*alpha)) * this.elasticity * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  }
                } else {
                  if (convex) { // perpendicular bounce off CONVEX hitbox
                    let x_new = vec_b[1] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * Math.abs(hitbox[i][2]);
                    let y_new = vec_b[0] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * hitbox[i][2];
                    this.mo_vec = [x_new, y_new];
                  } else { // perpendicular bounce off CONCAVE hitbox
                    let x_new = vec_b[1] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * hitbox[i][2];
                    let y_new = vec_b[0] / vecLen2D(vec_b) * vecLen2D(this.mo_vec) * Math.abs(hitbox[i][2]);
                    this.mo_vec = [x_new, y_new];
                  }
                }

                ctx.strokeStyle = 'red';
                this.bounce_lock = 1;
                return true;
            }
          }
        }
      }
    }

    drawHbSolid() {
        ctx.beginPath();
        ctx.arc(this.pos[0], this.pos[1], this.hb_solid_rad, 0, Math.PI * 2, false);
            // (x, y, radius, start angle(radians), end angle(radians), clockwise y/n)
        ctx.closePath();
        ctx.stroke();

    }
}

class Flipper {
    constructor(pivot, outline, min_angle, max_angle, key_code, ccw) {
      this.pivot = pivot;
      this.key_code = key_code;
      this.min_angle = min_angle;
      this.angle = 0;
      this.max_angle = max_angle;
      this.ccw = ccw;

      this.hb_ghost = outline;
      if (this.ccw) {
        for (let i = 0; i < this.hb_ghost.length; i++) {
          let x_new = this.hb_ghost[i][0] * Math.cos(this.min_angle) - this.hb_ghost[i][1] * Math.sin(this.min_angle);
          let y_new = this.hb_ghost[i][0] * Math.sin(this.min_angle) + this.hb_ghost[i][1] * Math.cos(this.min_angle);
          this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
        }
      } else {
        for (let i = 0; i < this.hb_ghost.length; i++) {
          let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.min_angle) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.min_angle);
          let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.min_angle) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.min_angle);
          this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
        }
      }

      this.hb_solid = [];
      for (let i = 0; i < this.hb_ghost.length; i++) {
        this.hb_solid.push([this.hb_ghost[i][0] + this.pivot[0], this.hb_ghost[i][1] + this.pivot[1], this.hb_ghost[2]]);
      }

      this.active = false;
      this.convex = true;
      this.angular_speed = Math.PI * 10/180;
    }

    control() {
      if (keys[this.key_code]) {
        this.active = true;
        if (this.angle < this.max_angle) {
          this.hb_ghost[1][2] = -6;
          this.hb_ghost[2][2] = -6;
        } else {
          this.hb_ghost[1][2] = 1;
          this.hb_ghost[2][2] = 1;
        }
      } else {
        this.active = false;
        this.hb_ghost[1][2] = 1;
        this.hb_ghost[2][2] = 1;
      }
    }

    move() {

      if (this.active) {
        if (this.angle <= this.max_angle) {
          if (this.ccw) {
            for (let i = 0; i < this.hb_ghost.length; i++) {
              let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.angular_speed) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.angular_speed);
              let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.angular_speed) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.angular_speed);
              this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
            }
            this.angle += this.angular_speed;
          } else {
            for (let i = 0; i < this.hb_ghost.length; i++) {
              let x_new = this.hb_ghost[i][0] * Math.cos(this.angular_speed) - this.hb_ghost[i][1] * Math.sin(this.angular_speed);
              let y_new = this.hb_ghost[i][0] * Math.sin(this.angular_speed) + this.hb_ghost[i][1] * Math.cos(this.angular_speed);
              this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
            }
            this.angle += this.angular_speed;
          }
        }
      } else if (this.angle > 0) {
        if (this.ccw) {
          for (let i = 0; i < this.hb_ghost.length; i++) {
            let x_new = this.hb_ghost[i][0] * Math.cos(this.angular_speed) - this.hb_ghost[i][1] * Math.sin(this.angular_speed);
            let y_new = this.hb_ghost[i][0] * Math.sin(this.angular_speed) + this.hb_ghost[i][1] * Math.cos(this.angular_speed);
            this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
          }
          this.angle -= this.angular_speed;
        } else {
          for (let i = 0; i < this.hb_ghost.length; i++) {
            let x_new = this.hb_ghost[i][0] * Math.cos(2*Math.PI - this.angular_speed) - this.hb_ghost[i][1] * Math.sin(2*Math.PI - this.angular_speed);
            let y_new = this.hb_ghost[i][0] * Math.sin(2*Math.PI - this.angular_speed) + this.hb_ghost[i][1] * Math.cos(2*Math.PI - this.angular_speed);
            this.hb_ghost[i] = [x_new, y_new, this.hb_ghost[i][2]];
          }
          this.angle -= this.angular_speed;
        }
      }

      for (let i = 0; i < this.hb_ghost.length; i++) {
        this.hb_solid[i] = [this.hb_ghost[i][0] + this.pivot[0], this.hb_ghost[i][1] + this.pivot[1], this.hb_ghost[i][2]];
      }
    }


    drawHbSolid() {
        ctx.beginPath();
        for (let i = 0; i < this.hb_solid.length; i++) {
            ctx.lineTo(this.hb_solid[i][0], this.hb_solid[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class SolidElement {
    constructor(outline, convex) {
        this.hb_solid = outline;
        this.convex = convex;
    }

    drawHbSolid() {
        ctx.beginPath();
        for (let i = 0; i < this.hb_solid.length; i++) {
            ctx.lineTo(this.hb_solid[i][0], this.hb_solid[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
}
