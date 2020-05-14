//****various jshint configs****
// jshint esversion: 8
// jshint browser: true
// jshint node: true
// jshint -W117
"use strict";

var canvas;
var ctx;
var canvasWidth = 800;
var canvasHeight = 500;
var FPS = 60;
var keys = [];

document.addEventListener('DOMContentLoaded', setupCanvas);
setInterval(update, 1000/FPS);

function setupCanvas() {
    canvas = document.getElementById('display');
    ctx = canvas.getContext('2d');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;
    ctx.fillStyle = 'black';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    document.body.addEventListener("keydown", function(e) {
        keys[e.keyCode] = true;
    });
    document.body.addEventListener("keyup", function(e) {
        keys[e.keyCode] = false;
    });
    player = new Player([100,100]);
    level = new Level([[10, 50], [750, 50], [600, 150], [750, 200], [150, 450], [300, 300], [10, 300]]);
}

function update() {
    if (polygonCollision(player.hb_solid, level.hb_solid)) {
        ctx.strokeStyle = 'red';
    } else {
        ctx.strokeStyle = 'white';
    }
    ctx.fillRect(0,0,canvas.width,canvas.height);
    player.move();
    player.drawHbsolid();
    level.drawHbsolid();
}

function vecAngle2D(vec0, vec1) {
    return Math.acos((vec0[0] * vec1[0] + vec0[1] * vec1[1]) / (Math.sqrt(Math.pow(vec0[0], 2) + Math.pow(vec0[1], 2)) * Math.sqrt(Math.pow(vec1[0], 2) + Math.pow(vec1[1], 2))));
  }

function polygonCollision(list0, list1) {
  
    for (let i = 0; i < list0.length; i++) {
        for (let j = 0; j < list1.length; j++) {
            let line0 = [list0[i], list0[(i+1) % list0.length]];
            let line1 = [list1[j], list1[(j+1) % list1.length]];

            if (line0[0] == line1[0] ||
                line0[0] == line1[1] ||
                line0[1] == line1[0] ||
                line0[1] == line1[1]) {
                return true;
            }

            let vec0 = [line1[0][0] - line0[0][0], line1[0][1] - line0[0][1]];
            let vec1 = [line1[1][0] - line0[0][0], line1[1][1] - line0[0][1]];
            let vec2 = [line1[1][0] - line0[1][0], line1[1][1] - line0[1][1]];
            let vec3 = [line1[0][0] - line0[1][0], line1[0][1] - line0[1][1]];

            if (vecAngle2D(vec0, vec1) +
                vecAngle2D([-vec0[0], -vec0[1]], [-vec3[0], -vec3[1]]) +
                vecAngle2D(vec2, vec3) +
                vecAngle2D([-vec1[0], -vec1[1]], [-vec2[0], -vec2[1]]) >=
                2 * Math.PI * 0.9999) {
                return true;
            }
        }
    }
    return false;
}

function polygonCollisionLinear(list0, list1) {

    for (let i = 0; i < list0.length; i++) {
        for (let j = 0; j < list1.length; j++) {
            let line0 = [list0[i], list0[(i+1) % list0.length]];
            let line1 = [list1[j], list1[(j+1) % list1.length]];

            if (line0[0] == line1[0] || line0[0] == line1[1] || line0[1] == line1[0] || line0[1] == line1[1]) {
                return true;
            }

            let line_f;
            let line_g;
            if (line0[0][0] <= line0[1][0]) {
                line_f = line0;
            } else {
                line_f = [line0[1], line0[0]];
            }
            if (line1[0][0] <= line1[1][0]) {
                line_g = line1;
            } else {
                line_g = [line1[1], line1[0]];
            }

            // f(x) = ax + b // g(x) = cx + d
            let a = (line_f[1][1] - line_f[0][1]) / (line_f[1][0] - line_f[0][0]);
            if (a == Infinity) {
                a = 0;
            }
            let b = line_f[0][1] - line_f[0][0] * a;
            let c = (line_g[1][1] - line_g[0][1]) / (line_g[1][0] - line_g[0][0]);
            if (c == Infinity) {
                c = 0;
            }
            let d = line_g[0][1] - line_g[0][0] * c;

            let intersect_pt = (d - b) / (a - c);

            if (line_f[0][0] <= intersect_pt && line_f[1][0] >= intersect_pt) {
                if (line_g[0][0] <= intersect_pt && line_g[1][0] >= intersect_pt) {
                    return true;
                }
            }
        }
    }
    return false;
}

class Level {
    constructor(outline) {
        this.hb_solid = outline;
    }

    drawHbsolid() {
        ctx.beginPath();
        for (let i = 0; i < this.hb_solid.length; i++) {
            ctx.lineTo(this.hb_solid[i][0], this.hb_solid[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
}

class Player {
    constructor(start_pos) {
        this.speed = 5;
        this.width = 20;
        this.height = 20;
        this.hb_solid = [start_pos,
                        [start_pos[0] + this.width, start_pos[1]],
                        [start_pos[0] + this.width, start_pos[1] + this.height],
                        [start_pos[0], start_pos[1] + this.height]];
    }


    move() {
        let dir = [0,0];
        if (keys[68] && polygonCollision(this.hb_solid.map(a => [a[0] + this.speed, a[1]]), level.hb_solid) == false) { // 68 = key code for 'D'
            dir[0] += 1;
        }
        if (keys[65] && polygonCollision(this.hb_solid.map(a => [a[0] - this.speed, a[1]]), level.hb_solid) == false) { // 65 = key code for 'A'
            dir[0] += -1;
        }
        if (keys[87] && polygonCollision(this.hb_solid.map(a => [a[0], a[1] - this.speed]), level.hb_solid) == false) { // 87 = key code for 'W'
            dir[1] += -1;
        }
        if (keys[83]&& polygonCollision(this.hb_solid.map(a => [a[0], a[1] + this.speed]), level.hb_solid) == false) { // 83 = key code for 'S'
            dir[1] += 1;
        }

        for (let i = 0; i < this.hb_solid.length; i++) {
            this.hb_solid[i][0] += dir[0] * this.speed;
            this.hb_solid[i][1] += dir[1] * this.speed;
        }
    }


    drawHbsolid() {
        ctx.beginPath();
        for (let i = 0; i < this.hb_solid.length; i++) {
            ctx.lineTo(this.hb_solid[i][0], this.hb_solid[i][1]);
        }
        ctx.closePath();
        ctx.stroke();
    }
}
