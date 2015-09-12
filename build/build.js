(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var render = require("./renderer");
var raf = require("./raf");
var audio = require("./audio");
var State = require("./state");
var rules = require("./rules");
var spawner = require("./spawner");
var state;

var initialize = function() {
	state = new State();
	state.create();
	raf.start(function(e) {
		render(state);
	});
};

var startGame = function() {
	audio.play("heart");
	state.started();
	setTimeout(spawn, rules.beginDelay);
};

var spawn = function() {
	if (!state.losing) {
		state.createMario();
		var t = spawner(state.time);
		state.time += t;
		setTimeout(spawn, t);
	}
};

window.addEventListener("keydown", function(e) {
	if (e.which == 88 && (state.losing || state.created)) {
		initialize();
		startGame();
	}
});

document.getElementById("c").addEventListener("mousedown", function(e){
	if(state.losing || state.created){
		initialize();
		startGame();
	}
});

initialize();

},{"./audio":2,"./raf":8,"./renderer":10,"./rules":11,"./spawner":13,"./state":14}],2:[function(require,module,exports){
var jsfxr = require("./jsfxr");
var files = {
	pipe: [2, , 0.2, , 0.1753, 0.64, , -0.5261, , , , , , 0.5522, -0.564, , , , 1, , , , , 0.5],
	water: [3,,0.0252,,0.2807,0.7841,,-0.6869,,,,,,,,,,,1,,,0.0523,,0.5],
	score0: [0,,0.0818,0.5164,0.2858,0.4,,,,,,0.501,0.614,,,,,,1,,,,,0.5],
	score1: [0,,0.0818,0.5164,0.2858,0.5,,,,,,0.501,0.614,,,,,,1,,,,,0.5],
	score2: [0,,0.0818,0.5164,0.2858,0.6,,,,,,0.501,0.614,,,,,,1,,,,,0.5],
	jump: [0,,0.1192,,0.2331,0.3712,,0.2254,,,,,,0.3291,,,,,0.6154,,,0.156,,0.5],
	heart: [1,,0.0975,,0.489,0.2047,,0.1759,,,,,,,,,,,1,,,,,0.5],
	bomb: [3,,0.375,0.4182,0.4879,0.1486,,-0.2694,,,,-0.6367,0.8223,,,,0.1528,-0.0754,1,,,,,0.5],
	sizzle: [3,,0.1292,,0.1886,0.3136,,0.2947,,,,,,0.2962,,,,,0.6539,,,,,0.5]
};
module.exports = {
	play: function(f) {
		files[f].play();
	}
};

Object.keys(files).forEach(function(nm) {
	var audio = new Audio();
	audio.src = jsfxr(files[nm]);
	files[nm] = audio;
});

},{"./jsfxr":5}],3:[function(require,module,exports){
module.exports = function(x, path){
	CSPL.getNaturalKs(path.x, path.y, path.k);
	return CSPL.evalSpline(x, path.x, path.y, path.k);
};

//CSPL Script by Ivan K, Adapted for the game
var CSPL = function() {};
CSPL._gaussJ = {};
CSPL._gaussJ.solve = function(A, x) // in Matrix, out solutions
	{
		var m = A.length;
		for (var k = 0; k < m; k++) // column
		{
			// pivot for column
			var i_max = 0;
			var vali = Number.NEGATIVE_INFINITY;
			for (var i = k; i < m; i++)
				if (A[i][k] > vali) {
					i_max = i;
					vali = A[i][k];
				}
			CSPL._gaussJ.swapRows(A, k, i_max);
			// for all rows below pivot
			for (var i = k + 1; i < m; i++) {
				for (var j = k + 1; j < m + 1; j++)
					A[i][j] = A[i][j] - A[k][j] * (A[i][k] / A[k][k]);
				A[i][k] = 0;
			}
		}

		for (var i = m - 1; i >= 0; i--) // rows = columns
		{
			var v = A[i][m] / A[i][i];
			x[i] = v;
			for (var j = i - 1; j >= 0; j--) // rows
			{
				A[j][m] -= A[j][i] * v;
				A[j][i] = 0;
			}
		}
	};
CSPL._gaussJ.zerosMat = function(r, c) {
	var A = [];
	for (var i = 0; i < r; i++) {
		A.push([]);
		for (var j = 0; j < c; j++) A[i].push(0);
	}
	return A;
};
CSPL._gaussJ.printMat = function(A) {
	for (var i = 0; i < A.length; i++) console.log(A[i]);
};
CSPL._gaussJ.swapRows = function(m, k, l) {
	var p = m[k];
	m[k] = m[l];
	m[l] = p;
};
CSPL.getNaturalKs = function(xs, ys, ks) // in x values, in y values, out k values
	{
		var n = xs.length - 1;
		var A = CSPL._gaussJ.zerosMat(n + 1, n + 2);

		for (var i = 1; i < n; i++) // rows
		{
			A[i][i - 1] = 1 / (xs[i] - xs[i - 1]);

			A[i][i] = 2 * (1 / (xs[i] - xs[i - 1]) + 1 / (xs[i + 1] - xs[i]));

			A[i][i + 1] = 1 / (xs[i + 1] - xs[i]);

			A[i][n + 1] = 3 * ((ys[i] - ys[i - 1]) / ((xs[i] - xs[i - 1]) * (xs[i] - xs[i - 1])) + (ys[i + 1] - ys[i]) / ((xs[i + 1] - xs[i]) * (xs[i + 1] - xs[i])));
		}

		A[0][0] = 2 / (xs[1] - xs[0]);
		A[0][1] = 1 / (xs[1] - xs[0]);
		A[0][n + 1] = 3 * (ys[1] - ys[0]) / ((xs[1] - xs[0]) * (xs[1] - xs[0]));

		A[n][n - 1] = 1 / (xs[n] - xs[n - 1]);
		A[n][n] = 2 / (xs[n] - xs[n - 1]);
		A[n][n + 1] = 3 * (ys[n] - ys[n - 1]) / ((xs[n] - xs[n - 1]) * (xs[n] - xs[n - 1]));

		CSPL._gaussJ.solve(A, ks);
	};
CSPL.evalSpline = function(x, xs, ys, ks) {
	var i = 1;
	while (xs[i] < x) i++;

	var t = (x - xs[i - 1]) / (xs[i] - xs[i - 1]);

	var a = ks[i - 1] * (xs[i] - xs[i - 1]) - (ys[i] - ys[i - 1]);
	var b = -ks[i] * (xs[i] - xs[i - 1]) + (ys[i] - ys[i - 1]);

	var q = (1 - t) * ys[i - 1] + t * ys[i] + t * (1 - t) * (a * (1 - t) + b * t);
	return q;
};

},{}],4:[function(require,module,exports){
var random = require("./rand");
module.exports = function() {
	this.x = 10;
	this.y = 125;
	this.o = {
		x: 0,
		y: 0
	};
	this.width = 15;
	this.height = 13;
	this.name = "heart";
	this.type = "img";
	this.src = "heart.png";
	this.shakesrc = "";
	this.full = true;
	this.shakenum = 0;
	this.shakethres = 10;
	this.shake = function() {
		this.x = this.o.x + random.number(5);
		this.y = this.o.y + random.number(5);
		this.shakenum++;
		if (this.shakenum < this.shakethres) setTimeout(this.shake.bind(this), 20);
		else {
			this.x = this.o.x;
			this.y = this.o.y;
			this.shakenum = 0;
			this.src = this.shakesrc;
		}
	};
	this.lose = function() {
		this.o.x = this.x;
		this.o.y = this.y;
		this.shakesrc = "heart-empty.png";
		this.shake();
		this.full = false;
	};
	this.gain = function(){
		this.full = true;
		this.shakesrc = "heart.png";
		this.shake();
	};
	this.onSpawn = function(i){
		this.x += (this.width + 2) * i;
	};
};

},{"./rand":9}],5:[function(require,module,exports){
/**
 * SfxrParams
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrParams() {
  //--------------------------------------------------------------------------
  //
  //  Settings String Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Parses a settings array into the parameters
   * @param array Array of the settings values, where elements 0 - 23 are
   *                a: waveType
   *                b: attackTime
   *                c: sustainTime
   *                d: sustainPunch
   *                e: decayTime
   *                f: startFrequency
   *                g: minFrequency
   *                h: slide
   *                i: deltaSlide
   *                j: vibratoDepth
   *                k: vibratoSpeed
   *                l: changeAmount
   *                m: changeSpeed
   *                n: squareDuty
   *                o: dutySweep
   *                p: repeatSpeed
   *                q: phaserOffset
   *                r: phaserSweep
   *                s: lpFilterCutoff
   *                t: lpFilterCutoffSweep
   *                u: lpFilterResonance
   *                v: hpFilterCutoff
   *                w: hpFilterCutoffSweep
   *                x: masterVolume
   * @return If the string successfully parsed
   */
  this.setSettings = function(values)
  {
    for ( var i = 0; i < 24; i++ )
    {
      this[String.fromCharCode( 97 + i )] = values[i] || 0;
    }

    // I moved this here from the reset(true) function
    if (this['c'] < .01) {
      this['c'] = .01;
    }

    var totalTime = this['b'] + this['c'] + this['e'];
    if (totalTime < .18) {
      var multiplier = .18 / totalTime;
      this['b']  *= multiplier;
      this['c'] *= multiplier;
      this['e']   *= multiplier;
    }
  }
}

/**
 * SfxrSynth
 *
 * Copyright 2010 Thomas Vian
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author Thomas Vian
 */
/** @constructor */
function SfxrSynth() {
  // All variables are kept alive through function closures

  //--------------------------------------------------------------------------
  //
  //  Sound Parameters
  //
  //--------------------------------------------------------------------------

  this._params = new SfxrParams();  // Params instance

  //--------------------------------------------------------------------------
  //
  //  Synth Variables
  //
  //--------------------------------------------------------------------------

  var _envelopeLength0, // Length of the attack stage
      _envelopeLength1, // Length of the sustain stage
      _envelopeLength2, // Length of the decay stage

      _period,          // Period of the wave
      _maxPeriod,       // Maximum period before sound stops (from minFrequency)

      _slide,           // Note slide
      _deltaSlide,      // Change in slide

      _changeAmount,    // Amount to change the note by
      _changeTime,      // Counter for the note change
      _changeLimit,     // Once the time reaches this limit, the note changes

      _squareDuty,      // Offset of center switching point in the square wave
      _dutySweep;       // Amount to change the duty by

  //--------------------------------------------------------------------------
  //
  //  Synth Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Resets the runing variables from the params
   * Used once at the start (total reset) and for the repeat effect (partial reset)
   */
  this.reset = function() {
    // Shorter reference
    var p = this._params;

    _period       = 100 / (p['f'] * p['f'] + .001);
    _maxPeriod    = 100 / (p['g']   * p['g']   + .001);

    _slide        = 1 - p['h'] * p['h'] * p['h'] * .01;
    _deltaSlide   = -p['i'] * p['i'] * p['i'] * .000001;

    if (!p['a']) {
      _squareDuty = .5 - p['n'] / 2;
      _dutySweep  = -p['o'] * .00005;
    }

    _changeAmount =  1 + p['l'] * p['l'] * (p['l'] > 0 ? -.9 : 10);
    _changeTime   = 0;
    _changeLimit  = p['m'] == 1 ? 0 : (1 - p['m']) * (1 - p['m']) * 20000 + 32;
  }

  // I split the reset() function into two functions for better readability
  this.totalReset = function() {
    this.reset();

    // Shorter reference
    var p = this._params;

    // Calculating the length is all that remained here, everything else moved somewhere
    _envelopeLength0 = p['b']  * p['b']  * 100000;
    _envelopeLength1 = p['c'] * p['c'] * 100000;
    _envelopeLength2 = p['e']   * p['e']   * 100000 + 12;
    // Full length of the volume envelop (and therefore sound)
    // Make sure the length can be divided by 3 so we will not need the padding "==" after base64 encode
    return ((_envelopeLength0 + _envelopeLength1 + _envelopeLength2) / 3 | 0) * 3;
  }

  /**
   * Writes the wave to the supplied buffer ByteArray
   * @param buffer A ByteArray to write the wave to
   * @return If the wave is finished
   */
  this.synthWave = function(buffer, length) {
    // Shorter reference
    var p = this._params;

    // If the filters are active
    var _filters = p['s'] != 1 || p['v'],
        // Cutoff multiplier which adjusts the amount the wave position can move
        _hpFilterCutoff = p['v'] * p['v'] * .1,
        // Speed of the high-pass cutoff multiplier
        _hpFilterDeltaCutoff = 1 + p['w'] * .0003,
        // Cutoff multiplier which adjusts the amount the wave position can move
        _lpFilterCutoff = p['s'] * p['s'] * p['s'] * .1,
        // Speed of the low-pass cutoff multiplier
        _lpFilterDeltaCutoff = 1 + p['t'] * .0001,
        // If the low pass filter is active
        _lpFilterOn = p['s'] != 1,
        // masterVolume * masterVolume (for quick calculations)
        _masterVolume = p['x'] * p['x'],
        // Minimum frequency before stopping
        _minFreqency = p['g'],
        // If the phaser is active
        _phaser = p['q'] || p['r'],
        // Change in phase offset
        _phaserDeltaOffset = p['r'] * p['r'] * p['r'] * .2,
        // Phase offset for phaser effect
        _phaserOffset = p['q'] * p['q'] * (p['q'] < 0 ? -1020 : 1020),
        // Once the time reaches this limit, some of the    iables are reset
        _repeatLimit = p['p'] ? ((1 - p['p']) * (1 - p['p']) * 20000 | 0) + 32 : 0,
        // The punch factor (louder at begining of sustain)
        _sustainPunch = p['d'],
        // Amount to change the period of the wave by at the peak of the vibrato wave
        _vibratoAmplitude = p['j'] / 2,
        // Speed at which the vibrato phase moves
        _vibratoSpeed = p['k'] * p['k'] * .01,
        // The type of wave to generate
        _waveType = p['a'];

    var _envelopeLength      = _envelopeLength0,     // Length of the current envelope stage
        _envelopeOverLength0 = 1 / _envelopeLength0, // (for quick calculations)
        _envelopeOverLength1 = 1 / _envelopeLength1, // (for quick calculations)
        _envelopeOverLength2 = 1 / _envelopeLength2; // (for quick calculations)

    // Damping muliplier which restricts how fast the wave position can move
    var _lpFilterDamping = 5 / (1 + p['u'] * p['u'] * 20) * (.01 + _lpFilterCutoff);
    if (_lpFilterDamping > .8) {
      _lpFilterDamping = .8;
    }
    _lpFilterDamping = 1 - _lpFilterDamping;

    var _finished = false,     // If the sound has finished
        _envelopeStage    = 0, // Current stage of the envelope (attack, sustain, decay, end)
        _envelopeTime     = 0, // Current time through current enelope stage
        _envelopeVolume   = 0, // Current volume of the envelope
        _hpFilterPos      = 0, // Adjusted wave position after high-pass filter
        _lpFilterDeltaPos = 0, // Change in low-pass wave position, as allowed by the cutoff and damping
        _lpFilterOldPos,       // Previous low-pass wave position
        _lpFilterPos      = 0, // Adjusted wave position after low-pass filter
        _periodTemp,           // Period modified by vibrato
        _phase            = 0, // Phase through the wave
        _phaserInt,            // Integer phaser offset, for bit maths
        _phaserPos        = 0, // Position through the phaser buffer
        _pos,                  // Phase expresed as a Number from 0-1, used for fast sin approx
        _repeatTime       = 0, // Counter for the repeats
        _sample,               // Sub-sample calculated 8 times per actual sample, averaged out to get the super sample
        _superSample,          // Actual sample writen to the wave
        _vibratoPhase     = 0; // Phase through the vibrato sine wave

    // Buffer of wave values used to create the out of phase second wave
    var _phaserBuffer = new Array(1024),
        // Buffer of random values used to generate noise
        _noiseBuffer  = new Array(32);
    for (var i = _phaserBuffer.length; i--; ) {
      _phaserBuffer[i] = 0;
    }
    for (var i = _noiseBuffer.length; i--; ) {
      _noiseBuffer[i] = Math.random() * 2 - 1;
    }

    for (var i = 0; i < length; i++) {
      if (_finished) {
        return i;
      }

      // Repeats every _repeatLimit times, partially resetting the sound parameters
      if (_repeatLimit) {
        if (++_repeatTime >= _repeatLimit) {
          _repeatTime = 0;
          this.reset();
        }
      }

      // If _changeLimit is reached, shifts the pitch
      if (_changeLimit) {
        if (++_changeTime >= _changeLimit) {
          _changeLimit = 0;
          _period *= _changeAmount;
        }
      }

      // Acccelerate and apply slide
      _slide += _deltaSlide;
      _period *= _slide;

      // Checks for frequency getting too low, and stops the sound if a minFrequency was set
      if (_period > _maxPeriod) {
        _period = _maxPeriod;
        if (_minFreqency > 0) {
          _finished = true;
        }
      }

      _periodTemp = _period;

      // Applies the vibrato effect
      if (_vibratoAmplitude > 0) {
        _vibratoPhase += _vibratoSpeed;
        _periodTemp *= 1 + Math.sin(_vibratoPhase) * _vibratoAmplitude;
      }

      _periodTemp |= 0;
      if (_periodTemp < 8) {
        _periodTemp = 8;
      }

      // Sweeps the square duty
      if (!_waveType) {
        _squareDuty += _dutySweep;
        if (_squareDuty < 0) {
          _squareDuty = 0;
        } else if (_squareDuty > .5) {
          _squareDuty = .5;
        }
      }

      // Moves through the different stages of the volume envelope
      if (++_envelopeTime > _envelopeLength) {
        _envelopeTime = 0;

        switch (++_envelopeStage)  {
          case 1:
            _envelopeLength = _envelopeLength1;
            break;
          case 2:
            _envelopeLength = _envelopeLength2;
        }
      }

      // Sets the volume based on the position in the envelope
      switch (_envelopeStage) {
        case 0:
          _envelopeVolume = _envelopeTime * _envelopeOverLength0;
          break;
        case 1:
          _envelopeVolume = 1 + (1 - _envelopeTime * _envelopeOverLength1) * 2 * _sustainPunch;
          break;
        case 2:
          _envelopeVolume = 1 - _envelopeTime * _envelopeOverLength2;
          break;
        case 3:
          _envelopeVolume = 0;
          _finished = true;
      }

      // Moves the phaser offset
      if (_phaser) {
        _phaserOffset += _phaserDeltaOffset;
        _phaserInt = _phaserOffset | 0;
        if (_phaserInt < 0) {
          _phaserInt = -_phaserInt;
        } else if (_phaserInt > 1023) {
          _phaserInt = 1023;
        }
      }

      // Moves the high-pass filter cutoff
      if (_filters && _hpFilterDeltaCutoff) {
        _hpFilterCutoff *= _hpFilterDeltaCutoff;
        if (_hpFilterCutoff < .00001) {
          _hpFilterCutoff = .00001;
        } else if (_hpFilterCutoff > .1) {
          _hpFilterCutoff = .1;
        }
      }

      _superSample = 0;
      for (var j = 8; j--; ) {
        // Cycles through the period
        _phase++;
        if (_phase >= _periodTemp) {
          _phase %= _periodTemp;

          // Generates new random noise for this period
          if (_waveType == 3) {
            for (var n = _noiseBuffer.length; n--; ) {
              _noiseBuffer[n] = Math.random() * 2 - 1;
            }
          }
        }

        // Gets the sample from the oscillator
        switch (_waveType) {
          case 0: // Square wave
            _sample = ((_phase / _periodTemp) < _squareDuty) ? .5 : -.5;
            break;
          case 1: // Saw wave
            _sample = 1 - _phase / _periodTemp * 2;
            break;
          case 2: // Sine wave (fast and accurate approx)
            _pos = _phase / _periodTemp;
            _pos = (_pos > .5 ? _pos - 1 : _pos) * 6.28318531;
            _sample = 1.27323954 * _pos + .405284735 * _pos * _pos * (_pos < 0 ? 1 : -1);
            _sample = .225 * ((_sample < 0 ? -1 : 1) * _sample * _sample  - _sample) + _sample;
            break;
          case 3: // Noise
            _sample = _noiseBuffer[Math.abs(_phase * 32 / _periodTemp | 0)];
        }

        // Applies the low and high pass filters
        if (_filters) {
          _lpFilterOldPos = _lpFilterPos;
          _lpFilterCutoff *= _lpFilterDeltaCutoff;
          if (_lpFilterCutoff < 0) {
            _lpFilterCutoff = 0;
          } else if (_lpFilterCutoff > .1) {
            _lpFilterCutoff = .1;
          }

          if (_lpFilterOn) {
            _lpFilterDeltaPos += (_sample - _lpFilterPos) * _lpFilterCutoff;
            _lpFilterDeltaPos *= _lpFilterDamping;
          } else {
            _lpFilterPos = _sample;
            _lpFilterDeltaPos = 0;
          }

          _lpFilterPos += _lpFilterDeltaPos;

          _hpFilterPos += _lpFilterPos - _lpFilterOldPos;
          _hpFilterPos *= 1 - _hpFilterCutoff;
          _sample = _hpFilterPos;
        }

        // Applies the phaser effect
        if (_phaser) {
          _phaserBuffer[_phaserPos % 1024] = _sample;
          _sample += _phaserBuffer[(_phaserPos - _phaserInt + 1024) % 1024];
          _phaserPos++;
        }

        _superSample += _sample;
      }

      // Averages out the super samples and applies volumes
      _superSample *= .125 * _envelopeVolume * _masterVolume;

      // Clipping if too loud
      buffer[i] = _superSample >= 1 ? 32767 : _superSample <= -1 ? -32768 : _superSample * 32767 | 0;
    }

    return length;
  }
}

// Adapted from http://codebase.es/riffwave/
var synth = new SfxrSynth();
// Export for the Closure Compiler
module.exports = function(settings) {
  // Initialize SfxrParams
  synth._params.setSettings(settings);
  // Synthesize Wave
  var envelopeFullLength = synth.totalReset();
  var data = new Uint8Array(((envelopeFullLength + 1) / 2 | 0) * 4 + 44);
  var used = synth.synthWave(new Uint16Array(data.buffer, 44), envelopeFullLength) * 2;
  var dv = new Uint32Array(data.buffer, 0, 44);
  // Initialize header
  dv[0] = 0x46464952; // "RIFF"
  dv[1] = used + 36;  // put total size here
  dv[2] = 0x45564157; // "WAVE"
  dv[3] = 0x20746D66; // "fmt "
  dv[4] = 0x00000010; // size of the following
  dv[5] = 0x00010001; // Mono: 1 channel, PCM format
  dv[6] = 0x0000AC44; // 44,100 samples per second
  dv[7] = 0x00015888; // byte rate: two bytes per sample
  dv[8] = 0x00100002; // 16 bits per sample, aligned on every two bytes
  dv[9] = 0x61746164; // "data"
  dv[10] = used;      // put number of samples here

  // Base64 encoding written by me, @maettig
  used += 44;
  var i = 0,
      base64Characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
      output = 'data:audio/wav;base64,';
  for (; i < used; i += 3)
  {
    var a = data[i] << 16 | data[i + 1] << 8 | data[i + 2];
    output += base64Characters[a >> 18] + base64Characters[a >> 12 & 63] + base64Characters[a >> 6 & 63] + base64Characters[a & 63];
  }
  return output;
}

},{}],6:[function(require,module,exports){
var curve = require("./curve");
var random = require("./rand");
var rules = require("./rules");
var audio = require("./audio");
module.exports = function() {
	this.width = 12;
	this.height = 17;
	this.opacity = 1;
	this.x = -15;
	this.y = 34 - this.height;
	this.type = "img";
	this.name = "mario";
	this.src = "mario.png";
	this.remove = false;
	this.killed = false;
	this.fading = false;
	this.reached = false;
	this.destpipe = 0;
	this.path = {
		x: [-15, 17, 30],
		y: [34 - this.height, 34 - this.height, 10],
		k: [rules.k, rules.k, rules.k]
	};
	this.generateCurve = function() {
		this.destpipe = random.repnumber(rules.pipes.length, 0);
		var k = rules.k;
		this.path.k = this.path.k.concat([k, k, k]);
		var destx = rules.pipes[this.destpipe] + 15;
		var thres = destx - (random.number(20) + 20);

		//climax
		this.path.y.push(3);
		this.path.x.push(thres / 2);

		//buffer approach
		this.path.y.push(rules.water / 2);
		this.path.x.push(thres);

		//destination
		this.path.y.push(rules.water);
		this.path.x.push(destx);
	};
	this.explode = function() {
		audio.play("bomb");
		this.fading = true;
		this.type = "rect";
		this.color = "#FFFFFF";
		this.width = rules.side;
		this.height = rules.bottom;
		this.x = 0;
		this.y = 0;
		this.fadeOut();
	};
	this.tick = function() {
		if (this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if (this.x == this.path.x[1] + 10) {
			if(this.name == "bomb") audio.play("sizzle");
			else audio.play("jump");
		}
		this.x++;
		if (this.y < rules.water && !this.fading) setTimeout(this.tick.bind(this), 10);
		else if (!this.reached) {
			this.fading = true;
			if (this.name != "bomb") audio.play("water");
			this.fadeOut();
		}
	};
	this.fadeOut = function() {
		this.opacity -= 0.1;
		if (this.opacity > 0.1) setTimeout(this.fadeOut.bind(this), 50);
		else this.remove = true;
	};
	this.begin = function() {
		this.generateCurve();
		this.tick();
	};
	this.onSpawn = function(heart) {
		if (random.repnumber(rules.heartspawn, 1) == 1 && heart) {
			this.name = "heartp";
			this.src = "heartp.png";
			this.width = 10;
			this.height = 9;
		} else if (random.repnumber(rules.bombspawn, 2) == 1) {
			this.name = "bomb";
			this.src = "bomb.png";
			this.width = 12;
			this.height = 14;
		}
		this.begin();
	};
};

},{"./audio":2,"./curve":3,"./rand":9,"./rules":11}],7:[function(require,module,exports){
var rules = require("./rules");
var audio = require("./audio");
var canvas = document.getElementById("c");
module.exports = function() {
	this.x = 0;
	this.y = 0;
	this.type = "img";
	this.name = "pipe";
	this.src = "pipe.png";
	this.width = 30;
	this.height = 70;
	this.pipen = 0;
	this.active = false;
	this.animating = false;
	this.down = false;
	this.animate = function() {
		this.animating = true;
		this.active = true;
		audio.play("pipe");
		this.tick();
	};
	this.animationDone = function() {
		this.down = false;
		this.animating = false;
		this.active = false;
	};
	this.tick = function() {
		var v;
		if (!this.down) this.y--;
		else this.y++;
		if (this.y == 80) this.down = true;
		if (this.y < 130) setTimeout(this.tick.bind(this), rules.pipedur / 50);
		else if (this.y == 130) this.animationDone();
	};
	this.rise = function(){
		this.y--;
		if(this.y > 130) setTimeout(this.rise.bind(this), rules.beginDelay / 100);
		else this.initEvent();
	};
	this.onSpawn = function(n) {
		this.x = rules.pipes[n];
		this.y = rules.bottom-120;
		this.pipen = n;
		this.rise();
	};
	this.key = function(e) {
		if (!this.animating) {
			if (e.which == rules.controls[this.pipen]) {
				this.animate();
			}
		}
	};
	this.touch = function(e) {
		var x = (e.x - canvas.offsetLeft) / rules.scale;
		var y = (e.y - canvas.offsetTop) / rules.scale;
		if (!this.animating) {
			if (x >= this.x && x <= this.x + 30) {
				this.animate();
			}
		}
	};
	this.initEvent = function() {
		var t = this;
		window.addEventListener("keydown", function(e) {
			t.key(e);
		});
		canvas.addEventListener("mousedown", function(e) {
			t.touch(e);
		}, false);
	};
};

},{"./audio":2,"./rules":11}],8:[function(require,module,exports){
// Holds last iteration timestamp.
var time = 0;

/**
 * Calls `fn` on next frame.
 *
 * @param  {Function} fn The function
 * @return {int} The request ID
 * @api private
 */
function raf(fn) {
  return window.requestAnimationFrame(function() {
    var now = Date.now();
    var elapsed = now - time;

    if (elapsed > 999) {
      elapsed = 1 / 60;
    } else {
      elapsed /= 1000;
    }

    time = now;
    fn(elapsed);
  });
}

module.exports = {
  /**
   * Calls `fn` on every frame with `elapsed` set to the elapsed
   * time in milliseconds.
   *
   * @param  {Function} fn The function
   * @return {int} The request ID
   * @api public
   */
  start: function(fn) {
    return raf(function tick(elapsed) {
      fn(elapsed);
      raf(tick);
    });
  },
  /**
   * Cancels the specified animation frame request.
   *
   * @param {int} id The request ID
   * @api public
   */
  stop: function(id) {
    window.cancelAnimationFrame(id);
  }
};

},{}],9:[function(require,module,exports){
var prev = [];
module.exports = {
	number: function(max) { //returns between 0 and max - 1
		return Math.floor(Math.random() * max);
	},
	repnumber: function(max, i) { //same as number but non-repeating
		var res = Math.floor(Math.random() * max);
		if (res == prev[i]) {
			if (res > 0) res -= 1;  //yes very cheap
			else res = 1;
		}
		prev[i] = res;
		return res;
	}
};

},{}],10:[function(require,module,exports){
var canvas = document.getElementById("c");
var ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;
ctx.mozImageSmoothingEnabled = false;
ctx.webkitImageSmoothlocingEnabled = false;

module.exports = function(state) {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.setTransform(1, 0, 0, 1, 0, 0);
	ctx.scale(state.scale, state.scale);
	var pipes = state.pipes;
	state.sprites.forEach(function(s, i) {
		if (s.name == "mario" || s.name == "heartp" || s.name == "bomb") {
			var p = pipes[s.destpipe];
			if (s.remove) {
				state.sprites.splice(i, 1);
			} else if (s.fading && !s.killed) {
				if (s.name == "mario") state.lost();
				s.killed = true;
			} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading) && !(state.losing)) {
				s.reached = true;
				if (s.name == "bomb") {
					state.lostGame();
					s.explode();
				} else {
					if (s.name == "mario") state.gained(s.destpipe);
					else state.hearted();
					state.sprites.splice(i, 1);
				}
			}
		} else if (s.remove) {
			state.sprites.splice(i, 1);
		}
		if (s.opacity) ctx.globalAlpha = s.opacity;
		else ctx.globalAlpha = 1;
		switch (s.type) {
			case "rect":
				ctx.fillStyle = s.color;
				ctx.fillRect(s.x, s.y, s.width, s.height);
				break;
			case "img":
				var img = new Image();
				img.src = "assets/" + s.src;
				ctx.drawImage(img, s.x, s.y, s.width, s.height);
				break;
			case "text":
				ctx.font = s.size + "px " + s.font;
				ctx.textAlign = s.align || "center";
				ctx.fillStyle = s.color || "#FFFFFF";
				ctx.fillText(s.text, s.x, s.y);
				break;
		}
	});
};

},{}],11:[function(require,module,exports){
module.exports = {
	bottom: 300,
	side: 250,
	water: 115,
	pipes: [
		90,
		145,
		200
	],
	controls: [
		81,
		87,
		69
	],
	k: 0.01,
	pipedur: 100,
	scale: 2,
	beginDelay: 2000,
	heartspawn: 25,
	bombspawn: 15,
	spawn: 100
};

},{}],12:[function(require,module,exports){
var rules = require("./rules");
module.exports = function(){
	this.type = "text";
	this.name = "score";
	this.font = "sans-serif";
	this.align = "right";
	this.size = 20;
	this.x = rules.side - 10;
	this.y = this.size;
	this.text = "0";
	this.update = function(v){
		this.text = v;
	};
};

},{"./rules":11}],13:[function(require,module,exports){
var random = require("./rand");
var rules = require("./rules");
module.exports = function(time){
	var val = (random.number(1800) - (time / rules.spawn));
	if (val < 0) val = 0;
	return 350 + val;
};

},{"./rand":9,"./rules":11}],14:[function(require,module,exports){
var Mario = require("./mario");
var Pipe = require("./pipe");
var Scoreboard = require("./scoreboard");
var audio = require("./audio");
var Heart = require("./heart");
var rules = require("./rules");
module.exports = function() {
	this.scale = rules.scale;
	this.time = 1;
	this.score = 0;
	this.lives = 3;
	this.losing = false;
	this.created = true;
	this.scoreboard = {};
	this.hearts = [];
	this.pipes = [];
	this.hi = 0;
	this.lostscreen = {
		type: "text",
		name: "lost",
		size: "20",
		font: "sans-serif",
		color: "#FF0000",
		text: "YOU LOST!",
		x: 130,
		y: 70
	};
	this.greetscreen = {
		type: "text",
		name: "greet",
		size: "20",
		font: "sans-serif",
		color: "#6BFF63",
		text: "MARIO CATCH",
		x: 130,
		y: 70
	};
	this.startscreen = {
		type: "text",
		name: "lost",
		size: "10",
		font: "sans-serif",
		text: "press x to start. press keys to raise pipes.",
		x: 130,
		y: 85
	};
	this.instructionscreen = {
		type: "text",
		name: "lost",
		size: "8",
		font: "sans-serif",
		text: "Q                   W                    E",
		x: 155,
		y: 110
	};
	this.sprites = [{
		type: "rect",
		name: "sky",
		color: "#5C94FC",
		width: 250,
		height: 150,
		x: 0,
		y: 0
	}, {
		type: "img",
		name: "cloud",
		src: "cloud.png",
		x: 80,
		y: 12,
		opacity: 0.8,
		width: 40,
		height: 25
	}, {
		type: "img",
		name: "cloud",
		src: "cloud.png",
		x: 160,
		y: 35,
		opacity: 0.8,
		width: 24,
		height: 15
	}, {
		type: "img",
		name: "blocks",
		src: "blocks.png",
		x: 0,
		y: 34,
		width: 34,
		height: 17
	}, {
		type: "rect",
		name: "water",
		color: "#15DCE2",
		opacity: 0.5,
		y: rules.water,
		x: 0,
		width: 300,
		height: 35
	}];
	this.createMario = function() {
		var hrt = false;
		if(this.lives < 3) hrt = true;
		var mario = new Mario();
		mario.onSpawn(hrt);
		//var dbc = require("../debug/curve");
		//this.sprites = this.sprites.concat(dbc(mario.path));
		this.sprites.splice(3, 0, mario);
	};
	this.createPipes = function() {
		for (var i = 0; i < rules.pipes.length; i++) {
			var pipe = new Pipe();
			pipe.onSpawn(i);
			this.pipes.push(pipe);
			this.sprites.splice(3, 0, this.pipes[i]);
		}
	};
	this.createHearts = function() {
		for (var i = 0; i < 3; i++) {
			var heart = new Heart();
			heart.onSpawn(i);
			this.hearts.push(heart);
			this.sprites.push(this.hearts[i]);
		}
	};
	this.createScore = function() {
		this.scoreboard = new Scoreboard();
		this.sprites.push(this.scoreboard);
	};
	this.lost = function() {
		if (this.lives > 0) {
			this.lives--;
			this.hearts[this.lives].lose();
		}
		if (this.lives === 0) {
			this.lostGame();
		}
	};
	this.hearted = function() {
		if (this.lives < 3 && !this.losing) {
			audio.play("heart");
			this.lives++;
			this.hearts[this.lives - 1].gain();
		}
	};
	this.gained = function(p) {
		audio.play("score" + p);
		this.score++;
		this.scoreboard.update(this.score);
	};
	this.lostGame = function() {
		this.losing = true;
		this.lives = 0;
		this.hearts.forEach(function(item){
			item.lose();
		});
		if (this.score > this.hi) this.setHi();
		this.scoreboard.update("last: " + this.score + " hi: " + this.hi);
		this.sprites.push(this.lostscreen);
		this.sprites.push(this.startscreen);
	};
	this.create = function() {
		this.created = true;
		this.sprites.push(this.greetscreen);
		this.sprites.push(this.startscreen);
		this.sprites.push(this.instructionscreen);
	};
	this.started = function() {
		this.created = false;
		var l = this.sprites.length - 1;
		this.sprites.splice(l, 1);
		this.sprites.splice(l - 1, 1);
		this.sprites.splice(l - 2, 1);
		this.createPipes();
		this.createScore();
		this.createHearts();
		this.getHi();
	};
	this.setHi = function() {
		this.hi = this.score;
		localStorage.setItem("hi", this.score);
	};
	this.getHi = function() {
		this.hi = localStorage.getItem("hi");
	};
};

},{"./audio":2,"./heart":4,"./mario":6,"./pipe":7,"./rules":11,"./scoreboard":12}]},{},[1])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9qc2Z4ci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvbWFyaW8uanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3BpcGUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JhZi5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFuZC5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmVuZGVyZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3J1bGVzLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zY29yZWJvYXJkLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zcGF3bmVyLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xlQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciByZW5kZXIgPSByZXF1aXJlKFwiLi9yZW5kZXJlclwiKTtcbnZhciByYWYgPSByZXF1aXJlKFwiLi9yYWZcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbnZhciBTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlXCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgc3Bhd25lciA9IHJlcXVpcmUoXCIuL3NwYXduZXJcIik7XG52YXIgc3RhdGU7XG5cbnZhciBpbml0aWFsaXplID0gZnVuY3Rpb24oKSB7XG5cdHN0YXRlID0gbmV3IFN0YXRlKCk7XG5cdHN0YXRlLmNyZWF0ZSgpO1xuXHRyYWYuc3RhcnQoZnVuY3Rpb24oZSkge1xuXHRcdHJlbmRlcihzdGF0ZSk7XG5cdH0pO1xufTtcblxudmFyIHN0YXJ0R2FtZSA9IGZ1bmN0aW9uKCkge1xuXHRhdWRpby5wbGF5KFwiaGVhcnRcIik7XG5cdHN0YXRlLnN0YXJ0ZWQoKTtcblx0c2V0VGltZW91dChzcGF3biwgcnVsZXMuYmVnaW5EZWxheSk7XG59O1xuXG52YXIgc3Bhd24gPSBmdW5jdGlvbigpIHtcblx0aWYgKCFzdGF0ZS5sb3NpbmcpIHtcblx0XHRzdGF0ZS5jcmVhdGVNYXJpbygpO1xuXHRcdHZhciB0ID0gc3Bhd25lcihzdGF0ZS50aW1lKTtcblx0XHRzdGF0ZS50aW1lICs9IHQ7XG5cdFx0c2V0VGltZW91dChzcGF3biwgdCk7XG5cdH1cbn07XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdGlmIChlLndoaWNoID09IDg4ICYmIChzdGF0ZS5sb3NpbmcgfHwgc3RhdGUuY3JlYXRlZCkpIHtcblx0XHRpbml0aWFsaXplKCk7XG5cdFx0c3RhcnRHYW1lKCk7XG5cdH1cbn0pO1xuXG5kb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIikuYWRkRXZlbnRMaXN0ZW5lcihcIm1vdXNlZG93blwiLCBmdW5jdGlvbihlKXtcblx0aWYoc3RhdGUubG9zaW5nIHx8IHN0YXRlLmNyZWF0ZWQpe1xuXHRcdGluaXRpYWxpemUoKTtcblx0XHRzdGFydEdhbWUoKTtcblx0fVxufSk7XG5cbmluaXRpYWxpemUoKTtcbiIsInZhciBqc2Z4ciA9IHJlcXVpcmUoXCIuL2pzZnhyXCIpO1xudmFyIGZpbGVzID0ge1xuXHRwaXBlOiBbMiwgLCAwLjIsICwgMC4xNzUzLCAwLjY0LCAsIC0wLjUyNjEsICwgLCAsICwgLCAwLjU1MjIsIC0wLjU2NCwgLCAsICwgMSwgLCAsICwgLCAwLjVdLFxuXHR3YXRlcjogWzMsLDAuMDI1MiwsMC4yODA3LDAuNzg0MSwsLTAuNjg2OSwsLCwsLCwsLCwsMSwsLDAuMDUyMywsMC41XSxcblx0c2NvcmUwOiBbMCwsMC4wODE4LDAuNTE2NCwwLjI4NTgsMC40LCwsLCwsMC41MDEsMC42MTQsLCwsLCwxLCwsLCwwLjVdLFxuXHRzY29yZTE6IFswLCwwLjA4MTgsMC41MTY0LDAuMjg1OCwwLjUsLCwsLCwwLjUwMSwwLjYxNCwsLCwsLDEsLCwsLDAuNV0sXG5cdHNjb3JlMjogWzAsLDAuMDgxOCwwLjUxNjQsMC4yODU4LDAuNiwsLCwsLDAuNTAxLDAuNjE0LCwsLCwsMSwsLCwsMC41XSxcblx0anVtcDogWzAsLDAuMTE5MiwsMC4yMzMxLDAuMzcxMiwsMC4yMjU0LCwsLCwsMC4zMjkxLCwsLCwwLjYxNTQsLCwwLjE1NiwsMC41XSxcblx0aGVhcnQ6IFsxLCwwLjA5NzUsLDAuNDg5LDAuMjA0NywsMC4xNzU5LCwsLCwsLCwsLCwxLCwsLCwwLjVdLFxuXHRib21iOiBbMywsMC4zNzUsMC40MTgyLDAuNDg3OSwwLjE0ODYsLC0wLjI2OTQsLCwsLTAuNjM2NywwLjgyMjMsLCwsMC4xNTI4LC0wLjA3NTQsMSwsLCwsMC41XSxcblx0c2l6emxlOiBbMywsMC4xMjkyLCwwLjE4ODYsMC4zMTM2LCwwLjI5NDcsLCwsLCwwLjI5NjIsLCwsLDAuNjUzOSwsLCwsMC41XVxufTtcbm1vZHVsZS5leHBvcnRzID0ge1xuXHRwbGF5OiBmdW5jdGlvbihmKSB7XG5cdFx0ZmlsZXNbZl0ucGxheSgpO1xuXHR9XG59O1xuXG5PYmplY3Qua2V5cyhmaWxlcykuZm9yRWFjaChmdW5jdGlvbihubSkge1xuXHR2YXIgYXVkaW8gPSBuZXcgQXVkaW8oKTtcblx0YXVkaW8uc3JjID0ganNmeHIoZmlsZXNbbm1dKTtcblx0ZmlsZXNbbm1dID0gYXVkaW87XG59KTtcbiIsIm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oeCwgcGF0aCl7XG5cdENTUEwuZ2V0TmF0dXJhbEtzKHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xuXHRyZXR1cm4gQ1NQTC5ldmFsU3BsaW5lKHgsIHBhdGgueCwgcGF0aC55LCBwYXRoLmspO1xufTtcblxuLy9DU1BMIFNjcmlwdCBieSBJdmFuIEssIEFkYXB0ZWQgZm9yIHRoZSBnYW1lXG52YXIgQ1NQTCA9IGZ1bmN0aW9uKCkge307XG5DU1BMLl9nYXVzc0ogPSB7fTtcbkNTUEwuX2dhdXNzSi5zb2x2ZSA9IGZ1bmN0aW9uKEEsIHgpIC8vIGluIE1hdHJpeCwgb3V0IHNvbHV0aW9uc1xuXHR7XG5cdFx0dmFyIG0gPSBBLmxlbmd0aDtcblx0XHRmb3IgKHZhciBrID0gMDsgayA8IG07IGsrKykgLy8gY29sdW1uXG5cdFx0e1xuXHRcdFx0Ly8gcGl2b3QgZm9yIGNvbHVtblxuXHRcdFx0dmFyIGlfbWF4ID0gMDtcblx0XHRcdHZhciB2YWxpID0gTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZO1xuXHRcdFx0Zm9yICh2YXIgaSA9IGs7IGkgPCBtOyBpKyspXG5cdFx0XHRcdGlmIChBW2ldW2tdID4gdmFsaSkge1xuXHRcdFx0XHRcdGlfbWF4ID0gaTtcblx0XHRcdFx0XHR2YWxpID0gQVtpXVtrXTtcblx0XHRcdFx0fVxuXHRcdFx0Q1NQTC5fZ2F1c3NKLnN3YXBSb3dzKEEsIGssIGlfbWF4KTtcblx0XHRcdC8vIGZvciBhbGwgcm93cyBiZWxvdyBwaXZvdFxuXHRcdFx0Zm9yICh2YXIgaSA9IGsgKyAxOyBpIDwgbTsgaSsrKSB7XG5cdFx0XHRcdGZvciAodmFyIGogPSBrICsgMTsgaiA8IG0gKyAxOyBqKyspXG5cdFx0XHRcdFx0QVtpXVtqXSA9IEFbaV1bal0gLSBBW2tdW2pdICogKEFbaV1ba10gLyBBW2tdW2tdKTtcblx0XHRcdFx0QVtpXVtrXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdFx0Zm9yICh2YXIgaSA9IG0gLSAxOyBpID49IDA7IGktLSkgLy8gcm93cyA9IGNvbHVtbnNcblx0XHR7XG5cdFx0XHR2YXIgdiA9IEFbaV1bbV0gLyBBW2ldW2ldO1xuXHRcdFx0eFtpXSA9IHY7XG5cdFx0XHRmb3IgKHZhciBqID0gaSAtIDE7IGogPj0gMDsgai0tKSAvLyByb3dzXG5cdFx0XHR7XG5cdFx0XHRcdEFbal1bbV0gLT0gQVtqXVtpXSAqIHY7XG5cdFx0XHRcdEFbal1baV0gPSAwO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcbkNTUEwuX2dhdXNzSi56ZXJvc01hdCA9IGZ1bmN0aW9uKHIsIGMpIHtcblx0dmFyIEEgPSBbXTtcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCByOyBpKyspIHtcblx0XHRBLnB1c2goW10pO1xuXHRcdGZvciAodmFyIGogPSAwOyBqIDwgYzsgaisrKSBBW2ldLnB1c2goMCk7XG5cdH1cblx0cmV0dXJuIEE7XG59O1xuQ1NQTC5fZ2F1c3NKLnByaW50TWF0ID0gZnVuY3Rpb24oQSkge1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IEEubGVuZ3RoOyBpKyspIGNvbnNvbGUubG9nKEFbaV0pO1xufTtcbkNTUEwuX2dhdXNzSi5zd2FwUm93cyA9IGZ1bmN0aW9uKG0sIGssIGwpIHtcblx0dmFyIHAgPSBtW2tdO1xuXHRtW2tdID0gbVtsXTtcblx0bVtsXSA9IHA7XG59O1xuQ1NQTC5nZXROYXR1cmFsS3MgPSBmdW5jdGlvbih4cywgeXMsIGtzKSAvLyBpbiB4IHZhbHVlcywgaW4geSB2YWx1ZXMsIG91dCBrIHZhbHVlc1xuXHR7XG5cdFx0dmFyIG4gPSB4cy5sZW5ndGggLSAxO1xuXHRcdHZhciBBID0gQ1NQTC5fZ2F1c3NKLnplcm9zTWF0KG4gKyAxLCBuICsgMik7XG5cblx0XHRmb3IgKHZhciBpID0gMTsgaSA8IG47IGkrKykgLy8gcm93c1xuXHRcdHtcblx0XHRcdEFbaV1baSAtIDFdID0gMSAvICh4c1tpXSAtIHhzW2kgLSAxXSk7XG5cblx0XHRcdEFbaV1baV0gPSAyICogKDEgLyAoeHNbaV0gLSB4c1tpIC0gMV0pICsgMSAvICh4c1tpICsgMV0gLSB4c1tpXSkpO1xuXG5cdFx0XHRBW2ldW2kgKyAxXSA9IDEgLyAoeHNbaSArIDFdIC0geHNbaV0pO1xuXG5cdFx0XHRBW2ldW24gKyAxXSA9IDMgKiAoKHlzW2ldIC0geXNbaSAtIDFdKSAvICgoeHNbaV0gLSB4c1tpIC0gMV0pICogKHhzW2ldIC0geHNbaSAtIDFdKSkgKyAoeXNbaSArIDFdIC0geXNbaV0pIC8gKCh4c1tpICsgMV0gLSB4c1tpXSkgKiAoeHNbaSArIDFdIC0geHNbaV0pKSk7XG5cdFx0fVxuXG5cdFx0QVswXVswXSA9IDIgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVsxXSA9IDEgLyAoeHNbMV0gLSB4c1swXSk7XG5cdFx0QVswXVtuICsgMV0gPSAzICogKHlzWzFdIC0geXNbMF0pIC8gKCh4c1sxXSAtIHhzWzBdKSAqICh4c1sxXSAtIHhzWzBdKSk7XG5cblx0XHRBW25dW24gLSAxXSA9IDEgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbl0gPSAyIC8gKHhzW25dIC0geHNbbiAtIDFdKTtcblx0XHRBW25dW24gKyAxXSA9IDMgKiAoeXNbbl0gLSB5c1tuIC0gMV0pIC8gKCh4c1tuXSAtIHhzW24gLSAxXSkgKiAoeHNbbl0gLSB4c1tuIC0gMV0pKTtcblxuXHRcdENTUEwuX2dhdXNzSi5zb2x2ZShBLCBrcyk7XG5cdH07XG5DU1BMLmV2YWxTcGxpbmUgPSBmdW5jdGlvbih4LCB4cywgeXMsIGtzKSB7XG5cdHZhciBpID0gMTtcblx0d2hpbGUgKHhzW2ldIDwgeCkgaSsrO1xuXG5cdHZhciB0ID0gKHggLSB4c1tpIC0gMV0pIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHR2YXIgYSA9IGtzW2kgLSAxXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgLSAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXHR2YXIgYiA9IC1rc1tpXSAqICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAoeXNbaV0gLSB5c1tpIC0gMV0pO1xuXG5cdHZhciBxID0gKDEgLSB0KSAqIHlzW2kgLSAxXSArIHQgKiB5c1tpXSArIHQgKiAoMSAtIHQpICogKGEgKiAoMSAtIHQpICsgYiAqIHQpO1xuXHRyZXR1cm4gcTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMueCA9IDEwO1xuXHR0aGlzLnkgPSAxMjU7XG5cdHRoaXMubyA9IHtcblx0XHR4OiAwLFxuXHRcdHk6IDBcblx0fTtcblx0dGhpcy53aWR0aCA9IDE1O1xuXHR0aGlzLmhlaWdodCA9IDEzO1xuXHR0aGlzLm5hbWUgPSBcImhlYXJ0XCI7XG5cdHRoaXMudHlwZSA9IFwiaW1nXCI7XG5cdHRoaXMuc3JjID0gXCJoZWFydC5wbmdcIjtcblx0dGhpcy5zaGFrZXNyYyA9IFwiXCI7XG5cdHRoaXMuZnVsbCA9IHRydWU7XG5cdHRoaXMuc2hha2VudW0gPSAwO1xuXHR0aGlzLnNoYWtldGhyZXMgPSAxMDtcblx0dGhpcy5zaGFrZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMueCA9IHRoaXMuby54ICsgcmFuZG9tLm51bWJlcig1KTtcblx0XHR0aGlzLnkgPSB0aGlzLm8ueSArIHJhbmRvbS5udW1iZXIoNSk7XG5cdFx0dGhpcy5zaGFrZW51bSsrO1xuXHRcdGlmICh0aGlzLnNoYWtlbnVtIDwgdGhpcy5zaGFrZXRocmVzKSBzZXRUaW1lb3V0KHRoaXMuc2hha2UuYmluZCh0aGlzKSwgMjApO1xuXHRcdGVsc2Uge1xuXHRcdFx0dGhpcy54ID0gdGhpcy5vLng7XG5cdFx0XHR0aGlzLnkgPSB0aGlzLm8ueTtcblx0XHRcdHRoaXMuc2hha2VudW0gPSAwO1xuXHRcdFx0dGhpcy5zcmMgPSB0aGlzLnNoYWtlc3JjO1xuXHRcdH1cblx0fTtcblx0dGhpcy5sb3NlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5vLnggPSB0aGlzLng7XG5cdFx0dGhpcy5vLnkgPSB0aGlzLnk7XG5cdFx0dGhpcy5zaGFrZXNyYyA9IFwiaGVhcnQtZW1wdHkucG5nXCI7XG5cdFx0dGhpcy5zaGFrZSgpO1xuXHRcdHRoaXMuZnVsbCA9IGZhbHNlO1xuXHR9O1xuXHR0aGlzLmdhaW4gPSBmdW5jdGlvbigpe1xuXHRcdHRoaXMuZnVsbCA9IHRydWU7XG5cdFx0dGhpcy5zaGFrZXNyYyA9IFwiaGVhcnQucG5nXCI7XG5cdFx0dGhpcy5zaGFrZSgpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihpKXtcblx0XHR0aGlzLnggKz0gKHRoaXMud2lkdGggKyAyKSAqIGk7XG5cdH07XG59O1xuIiwiLyoqXG4gKiBTZnhyUGFyYW1zXG4gKlxuICogQ29weXJpZ2h0IDIwMTAgVGhvbWFzIFZpYW5cbiAqXG4gKiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgXCJMaWNlbnNlXCIpO1xuICogeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLlxuICogWW91IG1heSBvYnRhaW4gYSBjb3B5IG9mIHRoZSBMaWNlbnNlIGF0XG4gKlxuICogICBodHRwOi8vd3d3LmFwYWNoZS5vcmcvbGljZW5zZXMvTElDRU5TRS0yLjBcbiAqXG4gKiBVbmxlc3MgcmVxdWlyZWQgYnkgYXBwbGljYWJsZSBsYXcgb3IgYWdyZWVkIHRvIGluIHdyaXRpbmcsIHNvZnR3YXJlXG4gKiBkaXN0cmlidXRlZCB1bmRlciB0aGUgTGljZW5zZSBpcyBkaXN0cmlidXRlZCBvbiBhbiBcIkFTIElTXCIgQkFTSVMsXG4gKiBXSVRIT1VUIFdBUlJBTlRJRVMgT1IgQ09ORElUSU9OUyBPRiBBTlkgS0lORCwgZWl0aGVyIGV4cHJlc3Mgb3IgaW1wbGllZC5cbiAqIFNlZSB0aGUgTGljZW5zZSBmb3IgdGhlIHNwZWNpZmljIGxhbmd1YWdlIGdvdmVybmluZyBwZXJtaXNzaW9ucyBhbmRcbiAqIGxpbWl0YXRpb25zIHVuZGVyIHRoZSBMaWNlbnNlLlxuICpcbiAqIEBhdXRob3IgVGhvbWFzIFZpYW5cbiAqL1xuLyoqIEBjb25zdHJ1Y3RvciAqL1xuZnVuY3Rpb24gU2Z4clBhcmFtcygpIHtcbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU2V0dGluZ3MgU3RyaW5nIE1ldGhvZHNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIC8qKlxuICAgKiBQYXJzZXMgYSBzZXR0aW5ncyBhcnJheSBpbnRvIHRoZSBwYXJhbWV0ZXJzXG4gICAqIEBwYXJhbSBhcnJheSBBcnJheSBvZiB0aGUgc2V0dGluZ3MgdmFsdWVzLCB3aGVyZSBlbGVtZW50cyAwIC0gMjMgYXJlXG4gICAqICAgICAgICAgICAgICAgIGE6IHdhdmVUeXBlXG4gICAqICAgICAgICAgICAgICAgIGI6IGF0dGFja1RpbWVcbiAgICogICAgICAgICAgICAgICAgYzogc3VzdGFpblRpbWVcbiAgICogICAgICAgICAgICAgICAgZDogc3VzdGFpblB1bmNoXG4gICAqICAgICAgICAgICAgICAgIGU6IGRlY2F5VGltZVxuICAgKiAgICAgICAgICAgICAgICBmOiBzdGFydEZyZXF1ZW5jeVxuICAgKiAgICAgICAgICAgICAgICBnOiBtaW5GcmVxdWVuY3lcbiAgICogICAgICAgICAgICAgICAgaDogc2xpZGVcbiAgICogICAgICAgICAgICAgICAgaTogZGVsdGFTbGlkZVxuICAgKiAgICAgICAgICAgICAgICBqOiB2aWJyYXRvRGVwdGhcbiAgICogICAgICAgICAgICAgICAgazogdmlicmF0b1NwZWVkXG4gICAqICAgICAgICAgICAgICAgIGw6IGNoYW5nZUFtb3VudFxuICAgKiAgICAgICAgICAgICAgICBtOiBjaGFuZ2VTcGVlZFxuICAgKiAgICAgICAgICAgICAgICBuOiBzcXVhcmVEdXR5XG4gICAqICAgICAgICAgICAgICAgIG86IGR1dHlTd2VlcFxuICAgKiAgICAgICAgICAgICAgICBwOiByZXBlYXRTcGVlZFxuICAgKiAgICAgICAgICAgICAgICBxOiBwaGFzZXJPZmZzZXRcbiAgICogICAgICAgICAgICAgICAgcjogcGhhc2VyU3dlZXBcbiAgICogICAgICAgICAgICAgICAgczogbHBGaWx0ZXJDdXRvZmZcbiAgICogICAgICAgICAgICAgICAgdDogbHBGaWx0ZXJDdXRvZmZTd2VlcFxuICAgKiAgICAgICAgICAgICAgICB1OiBscEZpbHRlclJlc29uYW5jZVxuICAgKiAgICAgICAgICAgICAgICB2OiBocEZpbHRlckN1dG9mZlxuICAgKiAgICAgICAgICAgICAgICB3OiBocEZpbHRlckN1dG9mZlN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHg6IG1hc3RlclZvbHVtZVxuICAgKiBAcmV0dXJuIElmIHRoZSBzdHJpbmcgc3VjY2Vzc2Z1bGx5IHBhcnNlZFxuICAgKi9cbiAgdGhpcy5zZXRTZXR0aW5ncyA9IGZ1bmN0aW9uKHZhbHVlcylcbiAge1xuICAgIGZvciAoIHZhciBpID0gMDsgaSA8IDI0OyBpKysgKVxuICAgIHtcbiAgICAgIHRoaXNbU3RyaW5nLmZyb21DaGFyQ29kZSggOTcgKyBpICldID0gdmFsdWVzW2ldIHx8IDA7XG4gICAgfVxuXG4gICAgLy8gSSBtb3ZlZCB0aGlzIGhlcmUgZnJvbSB0aGUgcmVzZXQodHJ1ZSkgZnVuY3Rpb25cbiAgICBpZiAodGhpc1snYyddIDwgLjAxKSB7XG4gICAgICB0aGlzWydjJ10gPSAuMDE7XG4gICAgfVxuXG4gICAgdmFyIHRvdGFsVGltZSA9IHRoaXNbJ2InXSArIHRoaXNbJ2MnXSArIHRoaXNbJ2UnXTtcbiAgICBpZiAodG90YWxUaW1lIDwgLjE4KSB7XG4gICAgICB2YXIgbXVsdGlwbGllciA9IC4xOCAvIHRvdGFsVGltZTtcbiAgICAgIHRoaXNbJ2InXSAgKj0gbXVsdGlwbGllcjtcbiAgICAgIHRoaXNbJ2MnXSAqPSBtdWx0aXBsaWVyO1xuICAgICAgdGhpc1snZSddICAgKj0gbXVsdGlwbGllcjtcbiAgICB9XG4gIH1cbn1cblxuLyoqXG4gKiBTZnhyU3ludGhcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMCBUaG9tYXMgVmlhblxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogQGF1dGhvciBUaG9tYXMgVmlhblxuICovXG4vKiogQGNvbnN0cnVjdG9yICovXG5mdW5jdGlvbiBTZnhyU3ludGgoKSB7XG4gIC8vIEFsbCB2YXJpYWJsZXMgYXJlIGtlcHQgYWxpdmUgdGhyb3VnaCBmdW5jdGlvbiBjbG9zdXJlc1xuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cbiAgLy8gIFNvdW5kIFBhcmFtZXRlcnNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHRoaXMuX3BhcmFtcyA9IG5ldyBTZnhyUGFyYW1zKCk7ICAvLyBQYXJhbXMgaW5zdGFuY2VcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTeW50aCBWYXJpYWJsZXNcbiAgLy9cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuXG4gIHZhciBfZW52ZWxvcGVMZW5ndGgwLCAvLyBMZW5ndGggb2YgdGhlIGF0dGFjayBzdGFnZVxuICAgICAgX2VudmVsb3BlTGVuZ3RoMSwgLy8gTGVuZ3RoIG9mIHRoZSBzdXN0YWluIHN0YWdlXG4gICAgICBfZW52ZWxvcGVMZW5ndGgyLCAvLyBMZW5ndGggb2YgdGhlIGRlY2F5IHN0YWdlXG5cbiAgICAgIF9wZXJpb2QsICAgICAgICAgIC8vIFBlcmlvZCBvZiB0aGUgd2F2ZVxuICAgICAgX21heFBlcmlvZCwgICAgICAgLy8gTWF4aW11bSBwZXJpb2QgYmVmb3JlIHNvdW5kIHN0b3BzIChmcm9tIG1pbkZyZXF1ZW5jeSlcblxuICAgICAgX3NsaWRlLCAgICAgICAgICAgLy8gTm90ZSBzbGlkZVxuICAgICAgX2RlbHRhU2xpZGUsICAgICAgLy8gQ2hhbmdlIGluIHNsaWRlXG5cbiAgICAgIF9jaGFuZ2VBbW91bnQsICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIG5vdGUgYnlcbiAgICAgIF9jaGFuZ2VUaW1lLCAgICAgIC8vIENvdW50ZXIgZm9yIHRoZSBub3RlIGNoYW5nZVxuICAgICAgX2NoYW5nZUxpbWl0LCAgICAgLy8gT25jZSB0aGUgdGltZSByZWFjaGVzIHRoaXMgbGltaXQsIHRoZSBub3RlIGNoYW5nZXNcblxuICAgICAgX3NxdWFyZUR1dHksICAgICAgLy8gT2Zmc2V0IG9mIGNlbnRlciBzd2l0Y2hpbmcgcG9pbnQgaW4gdGhlIHNxdWFyZSB3YXZlXG4gICAgICBfZHV0eVN3ZWVwOyAgICAgICAvLyBBbW91bnQgdG8gY2hhbmdlIHRoZSBkdXR5IGJ5XG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU3ludGggTWV0aG9kc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIFJlc2V0cyB0aGUgcnVuaW5nIHZhcmlhYmxlcyBmcm9tIHRoZSBwYXJhbXNcbiAgICogVXNlZCBvbmNlIGF0IHRoZSBzdGFydCAodG90YWwgcmVzZXQpIGFuZCBmb3IgdGhlIHJlcGVhdCBlZmZlY3QgKHBhcnRpYWwgcmVzZXQpXG4gICAqL1xuICB0aGlzLnJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIF9wZXJpb2QgICAgICAgPSAxMDAgLyAocFsnZiddICogcFsnZiddICsgLjAwMSk7XG4gICAgX21heFBlcmlvZCAgICA9IDEwMCAvIChwWydnJ10gICAqIHBbJ2cnXSAgICsgLjAwMSk7XG5cbiAgICBfc2xpZGUgICAgICAgID0gMSAtIHBbJ2gnXSAqIHBbJ2gnXSAqIHBbJ2gnXSAqIC4wMTtcbiAgICBfZGVsdGFTbGlkZSAgID0gLXBbJ2knXSAqIHBbJ2knXSAqIHBbJ2knXSAqIC4wMDAwMDE7XG5cbiAgICBpZiAoIXBbJ2EnXSkge1xuICAgICAgX3NxdWFyZUR1dHkgPSAuNSAtIHBbJ24nXSAvIDI7XG4gICAgICBfZHV0eVN3ZWVwICA9IC1wWydvJ10gKiAuMDAwMDU7XG4gICAgfVxuXG4gICAgX2NoYW5nZUFtb3VudCA9ICAxICsgcFsnbCddICogcFsnbCddICogKHBbJ2wnXSA+IDAgPyAtLjkgOiAxMCk7XG4gICAgX2NoYW5nZVRpbWUgICA9IDA7XG4gICAgX2NoYW5nZUxpbWl0ICA9IHBbJ20nXSA9PSAxID8gMCA6ICgxIC0gcFsnbSddKSAqICgxIC0gcFsnbSddKSAqIDIwMDAwICsgMzI7XG4gIH1cblxuICAvLyBJIHNwbGl0IHRoZSByZXNldCgpIGZ1bmN0aW9uIGludG8gdHdvIGZ1bmN0aW9ucyBmb3IgYmV0dGVyIHJlYWRhYmlsaXR5XG4gIHRoaXMudG90YWxSZXNldCA9IGZ1bmN0aW9uKCkge1xuICAgIHRoaXMucmVzZXQoKTtcblxuICAgIC8vIFNob3J0ZXIgcmVmZXJlbmNlXG4gICAgdmFyIHAgPSB0aGlzLl9wYXJhbXM7XG5cbiAgICAvLyBDYWxjdWxhdGluZyB0aGUgbGVuZ3RoIGlzIGFsbCB0aGF0IHJlbWFpbmVkIGhlcmUsIGV2ZXJ5dGhpbmcgZWxzZSBtb3ZlZCBzb21ld2hlcmVcbiAgICBfZW52ZWxvcGVMZW5ndGgwID0gcFsnYiddICAqIHBbJ2InXSAgKiAxMDAwMDA7XG4gICAgX2VudmVsb3BlTGVuZ3RoMSA9IHBbJ2MnXSAqIHBbJ2MnXSAqIDEwMDAwMDtcbiAgICBfZW52ZWxvcGVMZW5ndGgyID0gcFsnZSddICAgKiBwWydlJ10gICAqIDEwMDAwMCArIDEyO1xuICAgIC8vIEZ1bGwgbGVuZ3RoIG9mIHRoZSB2b2x1bWUgZW52ZWxvcCAoYW5kIHRoZXJlZm9yZSBzb3VuZClcbiAgICAvLyBNYWtlIHN1cmUgdGhlIGxlbmd0aCBjYW4gYmUgZGl2aWRlZCBieSAzIHNvIHdlIHdpbGwgbm90IG5lZWQgdGhlIHBhZGRpbmcgXCI9PVwiIGFmdGVyIGJhc2U2NCBlbmNvZGVcbiAgICByZXR1cm4gKChfZW52ZWxvcGVMZW5ndGgwICsgX2VudmVsb3BlTGVuZ3RoMSArIF9lbnZlbG9wZUxlbmd0aDIpIC8gMyB8IDApICogMztcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgdGhlIHdhdmUgdG8gdGhlIHN1cHBsaWVkIGJ1ZmZlciBCeXRlQXJyYXlcbiAgICogQHBhcmFtIGJ1ZmZlciBBIEJ5dGVBcnJheSB0byB3cml0ZSB0aGUgd2F2ZSB0b1xuICAgKiBAcmV0dXJuIElmIHRoZSB3YXZlIGlzIGZpbmlzaGVkXG4gICAqL1xuICB0aGlzLnN5bnRoV2F2ZSA9IGZ1bmN0aW9uKGJ1ZmZlciwgbGVuZ3RoKSB7XG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIC8vIElmIHRoZSBmaWx0ZXJzIGFyZSBhY3RpdmVcbiAgICB2YXIgX2ZpbHRlcnMgPSBwWydzJ10gIT0gMSB8fCBwWyd2J10sXG4gICAgICAgIC8vIEN1dG9mZiBtdWx0aXBsaWVyIHdoaWNoIGFkanVzdHMgdGhlIGFtb3VudCB0aGUgd2F2ZSBwb3NpdGlvbiBjYW4gbW92ZVxuICAgICAgICBfaHBGaWx0ZXJDdXRvZmYgPSBwWyd2J10gKiBwWyd2J10gKiAuMSxcbiAgICAgICAgLy8gU3BlZWQgb2YgdGhlIGhpZ2gtcGFzcyBjdXRvZmYgbXVsdGlwbGllclxuICAgICAgICBfaHBGaWx0ZXJEZWx0YUN1dG9mZiA9IDEgKyBwWyd3J10gKiAuMDAwMyxcbiAgICAgICAgLy8gQ3V0b2ZmIG11bHRpcGxpZXIgd2hpY2ggYWRqdXN0cyB0aGUgYW1vdW50IHRoZSB3YXZlIHBvc2l0aW9uIGNhbiBtb3ZlXG4gICAgICAgIF9scEZpbHRlckN1dG9mZiA9IHBbJ3MnXSAqIHBbJ3MnXSAqIHBbJ3MnXSAqIC4xLFxuICAgICAgICAvLyBTcGVlZCBvZiB0aGUgbG93LXBhc3MgY3V0b2ZmIG11bHRpcGxpZXJcbiAgICAgICAgX2xwRmlsdGVyRGVsdGFDdXRvZmYgPSAxICsgcFsndCddICogLjAwMDEsXG4gICAgICAgIC8vIElmIHRoZSBsb3cgcGFzcyBmaWx0ZXIgaXMgYWN0aXZlXG4gICAgICAgIF9scEZpbHRlck9uID0gcFsncyddICE9IDEsXG4gICAgICAgIC8vIG1hc3RlclZvbHVtZSAqIG1hc3RlclZvbHVtZSAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcbiAgICAgICAgX21hc3RlclZvbHVtZSA9IHBbJ3gnXSAqIHBbJ3gnXSxcbiAgICAgICAgLy8gTWluaW11bSBmcmVxdWVuY3kgYmVmb3JlIHN0b3BwaW5nXG4gICAgICAgIF9taW5GcmVxZW5jeSA9IHBbJ2cnXSxcbiAgICAgICAgLy8gSWYgdGhlIHBoYXNlciBpcyBhY3RpdmVcbiAgICAgICAgX3BoYXNlciA9IHBbJ3EnXSB8fCBwWydyJ10sXG4gICAgICAgIC8vIENoYW5nZSBpbiBwaGFzZSBvZmZzZXRcbiAgICAgICAgX3BoYXNlckRlbHRhT2Zmc2V0ID0gcFsnciddICogcFsnciddICogcFsnciddICogLjIsXG4gICAgICAgIC8vIFBoYXNlIG9mZnNldCBmb3IgcGhhc2VyIGVmZmVjdFxuICAgICAgICBfcGhhc2VyT2Zmc2V0ID0gcFsncSddICogcFsncSddICogKHBbJ3EnXSA8IDAgPyAtMTAyMCA6IDEwMjApLFxuICAgICAgICAvLyBPbmNlIHRoZSB0aW1lIHJlYWNoZXMgdGhpcyBsaW1pdCwgc29tZSBvZiB0aGUgICAgaWFibGVzIGFyZSByZXNldFxuICAgICAgICBfcmVwZWF0TGltaXQgPSBwWydwJ10gPyAoKDEgLSBwWydwJ10pICogKDEgLSBwWydwJ10pICogMjAwMDAgfCAwKSArIDMyIDogMCxcbiAgICAgICAgLy8gVGhlIHB1bmNoIGZhY3RvciAobG91ZGVyIGF0IGJlZ2luaW5nIG9mIHN1c3RhaW4pXG4gICAgICAgIF9zdXN0YWluUHVuY2ggPSBwWydkJ10sXG4gICAgICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIHBlcmlvZCBvZiB0aGUgd2F2ZSBieSBhdCB0aGUgcGVhayBvZiB0aGUgdmlicmF0byB3YXZlXG4gICAgICAgIF92aWJyYXRvQW1wbGl0dWRlID0gcFsnaiddIC8gMixcbiAgICAgICAgLy8gU3BlZWQgYXQgd2hpY2ggdGhlIHZpYnJhdG8gcGhhc2UgbW92ZXNcbiAgICAgICAgX3ZpYnJhdG9TcGVlZCA9IHBbJ2snXSAqIHBbJ2snXSAqIC4wMSxcbiAgICAgICAgLy8gVGhlIHR5cGUgb2Ygd2F2ZSB0byBnZW5lcmF0ZVxuICAgICAgICBfd2F2ZVR5cGUgPSBwWydhJ107XG5cbiAgICB2YXIgX2VudmVsb3BlTGVuZ3RoICAgICAgPSBfZW52ZWxvcGVMZW5ndGgwLCAgICAgLy8gTGVuZ3RoIG9mIHRoZSBjdXJyZW50IGVudmVsb3BlIHN0YWdlXG4gICAgICAgIF9lbnZlbG9wZU92ZXJMZW5ndGgwID0gMSAvIF9lbnZlbG9wZUxlbmd0aDAsIC8vIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfZW52ZWxvcGVPdmVyTGVuZ3RoMSA9IDEgLyBfZW52ZWxvcGVMZW5ndGgxLCAvLyAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcbiAgICAgICAgX2VudmVsb3BlT3Zlckxlbmd0aDIgPSAxIC8gX2VudmVsb3BlTGVuZ3RoMjsgLy8gKGZvciBxdWljayBjYWxjdWxhdGlvbnMpXG5cbiAgICAvLyBEYW1waW5nIG11bGlwbGllciB3aGljaCByZXN0cmljdHMgaG93IGZhc3QgdGhlIHdhdmUgcG9zaXRpb24gY2FuIG1vdmVcbiAgICB2YXIgX2xwRmlsdGVyRGFtcGluZyA9IDUgLyAoMSArIHBbJ3UnXSAqIHBbJ3UnXSAqIDIwKSAqICguMDEgKyBfbHBGaWx0ZXJDdXRvZmYpO1xuICAgIGlmIChfbHBGaWx0ZXJEYW1waW5nID4gLjgpIHtcbiAgICAgIF9scEZpbHRlckRhbXBpbmcgPSAuODtcbiAgICB9XG4gICAgX2xwRmlsdGVyRGFtcGluZyA9IDEgLSBfbHBGaWx0ZXJEYW1waW5nO1xuXG4gICAgdmFyIF9maW5pc2hlZCA9IGZhbHNlLCAgICAgLy8gSWYgdGhlIHNvdW5kIGhhcyBmaW5pc2hlZFxuICAgICAgICBfZW52ZWxvcGVTdGFnZSAgICA9IDAsIC8vIEN1cnJlbnQgc3RhZ2Ugb2YgdGhlIGVudmVsb3BlIChhdHRhY2ssIHN1c3RhaW4sIGRlY2F5LCBlbmQpXG4gICAgICAgIF9lbnZlbG9wZVRpbWUgICAgID0gMCwgLy8gQ3VycmVudCB0aW1lIHRocm91Z2ggY3VycmVudCBlbmVsb3BlIHN0YWdlXG4gICAgICAgIF9lbnZlbG9wZVZvbHVtZSAgID0gMCwgLy8gQ3VycmVudCB2b2x1bWUgb2YgdGhlIGVudmVsb3BlXG4gICAgICAgIF9ocEZpbHRlclBvcyAgICAgID0gMCwgLy8gQWRqdXN0ZWQgd2F2ZSBwb3NpdGlvbiBhZnRlciBoaWdoLXBhc3MgZmlsdGVyXG4gICAgICAgIF9scEZpbHRlckRlbHRhUG9zID0gMCwgLy8gQ2hhbmdlIGluIGxvdy1wYXNzIHdhdmUgcG9zaXRpb24sIGFzIGFsbG93ZWQgYnkgdGhlIGN1dG9mZiBhbmQgZGFtcGluZ1xuICAgICAgICBfbHBGaWx0ZXJPbGRQb3MsICAgICAgIC8vIFByZXZpb3VzIGxvdy1wYXNzIHdhdmUgcG9zaXRpb25cbiAgICAgICAgX2xwRmlsdGVyUG9zICAgICAgPSAwLCAvLyBBZGp1c3RlZCB3YXZlIHBvc2l0aW9uIGFmdGVyIGxvdy1wYXNzIGZpbHRlclxuICAgICAgICBfcGVyaW9kVGVtcCwgICAgICAgICAgIC8vIFBlcmlvZCBtb2RpZmllZCBieSB2aWJyYXRvXG4gICAgICAgIF9waGFzZSAgICAgICAgICAgID0gMCwgLy8gUGhhc2UgdGhyb3VnaCB0aGUgd2F2ZVxuICAgICAgICBfcGhhc2VySW50LCAgICAgICAgICAgIC8vIEludGVnZXIgcGhhc2VyIG9mZnNldCwgZm9yIGJpdCBtYXRoc1xuICAgICAgICBfcGhhc2VyUG9zICAgICAgICA9IDAsIC8vIFBvc2l0aW9uIHRocm91Z2ggdGhlIHBoYXNlciBidWZmZXJcbiAgICAgICAgX3BvcywgICAgICAgICAgICAgICAgICAvLyBQaGFzZSBleHByZXNlZCBhcyBhIE51bWJlciBmcm9tIDAtMSwgdXNlZCBmb3IgZmFzdCBzaW4gYXBwcm94XG4gICAgICAgIF9yZXBlYXRUaW1lICAgICAgID0gMCwgLy8gQ291bnRlciBmb3IgdGhlIHJlcGVhdHNcbiAgICAgICAgX3NhbXBsZSwgICAgICAgICAgICAgICAvLyBTdWItc2FtcGxlIGNhbGN1bGF0ZWQgOCB0aW1lcyBwZXIgYWN0dWFsIHNhbXBsZSwgYXZlcmFnZWQgb3V0IHRvIGdldCB0aGUgc3VwZXIgc2FtcGxlXG4gICAgICAgIF9zdXBlclNhbXBsZSwgICAgICAgICAgLy8gQWN0dWFsIHNhbXBsZSB3cml0ZW4gdG8gdGhlIHdhdmVcbiAgICAgICAgX3ZpYnJhdG9QaGFzZSAgICAgPSAwOyAvLyBQaGFzZSB0aHJvdWdoIHRoZSB2aWJyYXRvIHNpbmUgd2F2ZVxuXG4gICAgLy8gQnVmZmVyIG9mIHdhdmUgdmFsdWVzIHVzZWQgdG8gY3JlYXRlIHRoZSBvdXQgb2YgcGhhc2Ugc2Vjb25kIHdhdmVcbiAgICB2YXIgX3BoYXNlckJ1ZmZlciA9IG5ldyBBcnJheSgxMDI0KSxcbiAgICAgICAgLy8gQnVmZmVyIG9mIHJhbmRvbSB2YWx1ZXMgdXNlZCB0byBnZW5lcmF0ZSBub2lzZVxuICAgICAgICBfbm9pc2VCdWZmZXIgID0gbmV3IEFycmF5KDMyKTtcbiAgICBmb3IgKHZhciBpID0gX3BoYXNlckJ1ZmZlci5sZW5ndGg7IGktLTsgKSB7XG4gICAgICBfcGhhc2VyQnVmZmVyW2ldID0gMDtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IF9ub2lzZUJ1ZmZlci5sZW5ndGg7IGktLTsgKSB7XG4gICAgICBfbm9pc2VCdWZmZXJbaV0gPSBNYXRoLnJhbmRvbSgpICogMiAtIDE7XG4gICAgfVxuXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgaWYgKF9maW5pc2hlZCkge1xuICAgICAgICByZXR1cm4gaTtcbiAgICAgIH1cblxuICAgICAgLy8gUmVwZWF0cyBldmVyeSBfcmVwZWF0TGltaXQgdGltZXMsIHBhcnRpYWxseSByZXNldHRpbmcgdGhlIHNvdW5kIHBhcmFtZXRlcnNcbiAgICAgIGlmIChfcmVwZWF0TGltaXQpIHtcbiAgICAgICAgaWYgKCsrX3JlcGVhdFRpbWUgPj0gX3JlcGVhdExpbWl0KSB7XG4gICAgICAgICAgX3JlcGVhdFRpbWUgPSAwO1xuICAgICAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBJZiBfY2hhbmdlTGltaXQgaXMgcmVhY2hlZCwgc2hpZnRzIHRoZSBwaXRjaFxuICAgICAgaWYgKF9jaGFuZ2VMaW1pdCkge1xuICAgICAgICBpZiAoKytfY2hhbmdlVGltZSA+PSBfY2hhbmdlTGltaXQpIHtcbiAgICAgICAgICBfY2hhbmdlTGltaXQgPSAwO1xuICAgICAgICAgIF9wZXJpb2QgKj0gX2NoYW5nZUFtb3VudDtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBBY2NjZWxlcmF0ZSBhbmQgYXBwbHkgc2xpZGVcbiAgICAgIF9zbGlkZSArPSBfZGVsdGFTbGlkZTtcbiAgICAgIF9wZXJpb2QgKj0gX3NsaWRlO1xuXG4gICAgICAvLyBDaGVja3MgZm9yIGZyZXF1ZW5jeSBnZXR0aW5nIHRvbyBsb3csIGFuZCBzdG9wcyB0aGUgc291bmQgaWYgYSBtaW5GcmVxdWVuY3kgd2FzIHNldFxuICAgICAgaWYgKF9wZXJpb2QgPiBfbWF4UGVyaW9kKSB7XG4gICAgICAgIF9wZXJpb2QgPSBfbWF4UGVyaW9kO1xuICAgICAgICBpZiAoX21pbkZyZXFlbmN5ID4gMCkge1xuICAgICAgICAgIF9maW5pc2hlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3BlcmlvZFRlbXAgPSBfcGVyaW9kO1xuXG4gICAgICAvLyBBcHBsaWVzIHRoZSB2aWJyYXRvIGVmZmVjdFxuICAgICAgaWYgKF92aWJyYXRvQW1wbGl0dWRlID4gMCkge1xuICAgICAgICBfdmlicmF0b1BoYXNlICs9IF92aWJyYXRvU3BlZWQ7XG4gICAgICAgIF9wZXJpb2RUZW1wICo9IDEgKyBNYXRoLnNpbihfdmlicmF0b1BoYXNlKSAqIF92aWJyYXRvQW1wbGl0dWRlO1xuICAgICAgfVxuXG4gICAgICBfcGVyaW9kVGVtcCB8PSAwO1xuICAgICAgaWYgKF9wZXJpb2RUZW1wIDwgOCkge1xuICAgICAgICBfcGVyaW9kVGVtcCA9IDg7XG4gICAgICB9XG5cbiAgICAgIC8vIFN3ZWVwcyB0aGUgc3F1YXJlIGR1dHlcbiAgICAgIGlmICghX3dhdmVUeXBlKSB7XG4gICAgICAgIF9zcXVhcmVEdXR5ICs9IF9kdXR5U3dlZXA7XG4gICAgICAgIGlmIChfc3F1YXJlRHV0eSA8IDApIHtcbiAgICAgICAgICBfc3F1YXJlRHV0eSA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoX3NxdWFyZUR1dHkgPiAuNSkge1xuICAgICAgICAgIF9zcXVhcmVEdXR5ID0gLjU7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhyb3VnaCB0aGUgZGlmZmVyZW50IHN0YWdlcyBvZiB0aGUgdm9sdW1lIGVudmVsb3BlXG4gICAgICBpZiAoKytfZW52ZWxvcGVUaW1lID4gX2VudmVsb3BlTGVuZ3RoKSB7XG4gICAgICAgIF9lbnZlbG9wZVRpbWUgPSAwO1xuXG4gICAgICAgIHN3aXRjaCAoKytfZW52ZWxvcGVTdGFnZSkgIHtcbiAgICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgICBfZW52ZWxvcGVMZW5ndGggPSBfZW52ZWxvcGVMZW5ndGgxO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgX2VudmVsb3BlTGVuZ3RoID0gX2VudmVsb3BlTGVuZ3RoMjtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBTZXRzIHRoZSB2b2x1bWUgYmFzZWQgb24gdGhlIHBvc2l0aW9uIGluIHRoZSBlbnZlbG9wZVxuICAgICAgc3dpdGNoIChfZW52ZWxvcGVTdGFnZSkge1xuICAgICAgICBjYXNlIDA6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgwO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDE6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMSArICgxIC0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgxKSAqIDIgKiBfc3VzdGFpblB1bmNoO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMSAtIF9lbnZlbG9wZVRpbWUgKiBfZW52ZWxvcGVPdmVyTGVuZ3RoMjtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAzOlxuICAgICAgICAgIF9lbnZlbG9wZVZvbHVtZSA9IDA7XG4gICAgICAgICAgX2ZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhlIHBoYXNlciBvZmZzZXRcbiAgICAgIGlmIChfcGhhc2VyKSB7XG4gICAgICAgIF9waGFzZXJPZmZzZXQgKz0gX3BoYXNlckRlbHRhT2Zmc2V0O1xuICAgICAgICBfcGhhc2VySW50ID0gX3BoYXNlck9mZnNldCB8IDA7XG4gICAgICAgIGlmIChfcGhhc2VySW50IDwgMCkge1xuICAgICAgICAgIF9waGFzZXJJbnQgPSAtX3BoYXNlckludDtcbiAgICAgICAgfSBlbHNlIGlmIChfcGhhc2VySW50ID4gMTAyMykge1xuICAgICAgICAgIF9waGFzZXJJbnQgPSAxMDIzO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIE1vdmVzIHRoZSBoaWdoLXBhc3MgZmlsdGVyIGN1dG9mZlxuICAgICAgaWYgKF9maWx0ZXJzICYmIF9ocEZpbHRlckRlbHRhQ3V0b2ZmKSB7XG4gICAgICAgIF9ocEZpbHRlckN1dG9mZiAqPSBfaHBGaWx0ZXJEZWx0YUN1dG9mZjtcbiAgICAgICAgaWYgKF9ocEZpbHRlckN1dG9mZiA8IC4wMDAwMSkge1xuICAgICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IC4wMDAwMTtcbiAgICAgICAgfSBlbHNlIGlmIChfaHBGaWx0ZXJDdXRvZmYgPiAuMSkge1xuICAgICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IC4xO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIF9zdXBlclNhbXBsZSA9IDA7XG4gICAgICBmb3IgKHZhciBqID0gODsgai0tOyApIHtcbiAgICAgICAgLy8gQ3ljbGVzIHRocm91Z2ggdGhlIHBlcmlvZFxuICAgICAgICBfcGhhc2UrKztcbiAgICAgICAgaWYgKF9waGFzZSA+PSBfcGVyaW9kVGVtcCkge1xuICAgICAgICAgIF9waGFzZSAlPSBfcGVyaW9kVGVtcDtcblxuICAgICAgICAgIC8vIEdlbmVyYXRlcyBuZXcgcmFuZG9tIG5vaXNlIGZvciB0aGlzIHBlcmlvZFxuICAgICAgICAgIGlmIChfd2F2ZVR5cGUgPT0gMykge1xuICAgICAgICAgICAgZm9yICh2YXIgbiA9IF9ub2lzZUJ1ZmZlci5sZW5ndGg7IG4tLTsgKSB7XG4gICAgICAgICAgICAgIF9ub2lzZUJ1ZmZlcltuXSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICAvLyBHZXRzIHRoZSBzYW1wbGUgZnJvbSB0aGUgb3NjaWxsYXRvclxuICAgICAgICBzd2l0Y2ggKF93YXZlVHlwZSkge1xuICAgICAgICAgIGNhc2UgMDogLy8gU3F1YXJlIHdhdmVcbiAgICAgICAgICAgIF9zYW1wbGUgPSAoKF9waGFzZSAvIF9wZXJpb2RUZW1wKSA8IF9zcXVhcmVEdXR5KSA/IC41IDogLS41O1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAxOiAvLyBTYXcgd2F2ZVxuICAgICAgICAgICAgX3NhbXBsZSA9IDEgLSBfcGhhc2UgLyBfcGVyaW9kVGVtcCAqIDI7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6IC8vIFNpbmUgd2F2ZSAoZmFzdCBhbmQgYWNjdXJhdGUgYXBwcm94KVxuICAgICAgICAgICAgX3BvcyA9IF9waGFzZSAvIF9wZXJpb2RUZW1wO1xuICAgICAgICAgICAgX3BvcyA9IChfcG9zID4gLjUgPyBfcG9zIC0gMSA6IF9wb3MpICogNi4yODMxODUzMTtcbiAgICAgICAgICAgIF9zYW1wbGUgPSAxLjI3MzIzOTU0ICogX3BvcyArIC40MDUyODQ3MzUgKiBfcG9zICogX3BvcyAqIChfcG9zIDwgMCA/IDEgOiAtMSk7XG4gICAgICAgICAgICBfc2FtcGxlID0gLjIyNSAqICgoX3NhbXBsZSA8IDAgPyAtMSA6IDEpICogX3NhbXBsZSAqIF9zYW1wbGUgIC0gX3NhbXBsZSkgKyBfc2FtcGxlO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgY2FzZSAzOiAvLyBOb2lzZVxuICAgICAgICAgICAgX3NhbXBsZSA9IF9ub2lzZUJ1ZmZlcltNYXRoLmFicyhfcGhhc2UgKiAzMiAvIF9wZXJpb2RUZW1wIHwgMCldO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gQXBwbGllcyB0aGUgbG93IGFuZCBoaWdoIHBhc3MgZmlsdGVyc1xuICAgICAgICBpZiAoX2ZpbHRlcnMpIHtcbiAgICAgICAgICBfbHBGaWx0ZXJPbGRQb3MgPSBfbHBGaWx0ZXJQb3M7XG4gICAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmICo9IF9scEZpbHRlckRlbHRhQ3V0b2ZmO1xuICAgICAgICAgIGlmIChfbHBGaWx0ZXJDdXRvZmYgPCAwKSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJDdXRvZmYgPSAwO1xuICAgICAgICAgIH0gZWxzZSBpZiAoX2xwRmlsdGVyQ3V0b2ZmID4gLjEpIHtcbiAgICAgICAgICAgIF9scEZpbHRlckN1dG9mZiA9IC4xO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIGlmIChfbHBGaWx0ZXJPbikge1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgKz0gKF9zYW1wbGUgLSBfbHBGaWx0ZXJQb3MpICogX2xwRmlsdGVyQ3V0b2ZmO1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgKj0gX2xwRmlsdGVyRGFtcGluZztcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgX2xwRmlsdGVyUG9zID0gX3NhbXBsZTtcbiAgICAgICAgICAgIF9scEZpbHRlckRlbHRhUG9zID0gMDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBfbHBGaWx0ZXJQb3MgKz0gX2xwRmlsdGVyRGVsdGFQb3M7XG5cbiAgICAgICAgICBfaHBGaWx0ZXJQb3MgKz0gX2xwRmlsdGVyUG9zIC0gX2xwRmlsdGVyT2xkUG9zO1xuICAgICAgICAgIF9ocEZpbHRlclBvcyAqPSAxIC0gX2hwRmlsdGVyQ3V0b2ZmO1xuICAgICAgICAgIF9zYW1wbGUgPSBfaHBGaWx0ZXJQb3M7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBcHBsaWVzIHRoZSBwaGFzZXIgZWZmZWN0XG4gICAgICAgIGlmIChfcGhhc2VyKSB7XG4gICAgICAgICAgX3BoYXNlckJ1ZmZlcltfcGhhc2VyUG9zICUgMTAyNF0gPSBfc2FtcGxlO1xuICAgICAgICAgIF9zYW1wbGUgKz0gX3BoYXNlckJ1ZmZlclsoX3BoYXNlclBvcyAtIF9waGFzZXJJbnQgKyAxMDI0KSAlIDEwMjRdO1xuICAgICAgICAgIF9waGFzZXJQb3MrKztcbiAgICAgICAgfVxuXG4gICAgICAgIF9zdXBlclNhbXBsZSArPSBfc2FtcGxlO1xuICAgICAgfVxuXG4gICAgICAvLyBBdmVyYWdlcyBvdXQgdGhlIHN1cGVyIHNhbXBsZXMgYW5kIGFwcGxpZXMgdm9sdW1lc1xuICAgICAgX3N1cGVyU2FtcGxlICo9IC4xMjUgKiBfZW52ZWxvcGVWb2x1bWUgKiBfbWFzdGVyVm9sdW1lO1xuXG4gICAgICAvLyBDbGlwcGluZyBpZiB0b28gbG91ZFxuICAgICAgYnVmZmVyW2ldID0gX3N1cGVyU2FtcGxlID49IDEgPyAzMjc2NyA6IF9zdXBlclNhbXBsZSA8PSAtMSA/IC0zMjc2OCA6IF9zdXBlclNhbXBsZSAqIDMyNzY3IHwgMDtcbiAgICB9XG5cbiAgICByZXR1cm4gbGVuZ3RoO1xuICB9XG59XG5cbi8vIEFkYXB0ZWQgZnJvbSBodHRwOi8vY29kZWJhc2UuZXMvcmlmZndhdmUvXG52YXIgc3ludGggPSBuZXcgU2Z4clN5bnRoKCk7XG4vLyBFeHBvcnQgZm9yIHRoZSBDbG9zdXJlIENvbXBpbGVyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHNldHRpbmdzKSB7XG4gIC8vIEluaXRpYWxpemUgU2Z4clBhcmFtc1xuICBzeW50aC5fcGFyYW1zLnNldFNldHRpbmdzKHNldHRpbmdzKTtcbiAgLy8gU3ludGhlc2l6ZSBXYXZlXG4gIHZhciBlbnZlbG9wZUZ1bGxMZW5ndGggPSBzeW50aC50b3RhbFJlc2V0KCk7XG4gIHZhciBkYXRhID0gbmV3IFVpbnQ4QXJyYXkoKChlbnZlbG9wZUZ1bGxMZW5ndGggKyAxKSAvIDIgfCAwKSAqIDQgKyA0NCk7XG4gIHZhciB1c2VkID0gc3ludGguc3ludGhXYXZlKG5ldyBVaW50MTZBcnJheShkYXRhLmJ1ZmZlciwgNDQpLCBlbnZlbG9wZUZ1bGxMZW5ndGgpICogMjtcbiAgdmFyIGR2ID0gbmV3IFVpbnQzMkFycmF5KGRhdGEuYnVmZmVyLCAwLCA0NCk7XG4gIC8vIEluaXRpYWxpemUgaGVhZGVyXG4gIGR2WzBdID0gMHg0NjQ2NDk1MjsgLy8gXCJSSUZGXCJcbiAgZHZbMV0gPSB1c2VkICsgMzY7ICAvLyBwdXQgdG90YWwgc2l6ZSBoZXJlXG4gIGR2WzJdID0gMHg0NTU2NDE1NzsgLy8gXCJXQVZFXCJcbiAgZHZbM10gPSAweDIwNzQ2RDY2OyAvLyBcImZtdCBcIlxuICBkdls0XSA9IDB4MDAwMDAwMTA7IC8vIHNpemUgb2YgdGhlIGZvbGxvd2luZ1xuICBkdls1XSA9IDB4MDAwMTAwMDE7IC8vIE1vbm86IDEgY2hhbm5lbCwgUENNIGZvcm1hdFxuICBkdls2XSA9IDB4MDAwMEFDNDQ7IC8vIDQ0LDEwMCBzYW1wbGVzIHBlciBzZWNvbmRcbiAgZHZbN10gPSAweDAwMDE1ODg4OyAvLyBieXRlIHJhdGU6IHR3byBieXRlcyBwZXIgc2FtcGxlXG4gIGR2WzhdID0gMHgwMDEwMDAwMjsgLy8gMTYgYml0cyBwZXIgc2FtcGxlLCBhbGlnbmVkIG9uIGV2ZXJ5IHR3byBieXRlc1xuICBkdls5XSA9IDB4NjE3NDYxNjQ7IC8vIFwiZGF0YVwiXG4gIGR2WzEwXSA9IHVzZWQ7ICAgICAgLy8gcHV0IG51bWJlciBvZiBzYW1wbGVzIGhlcmVcblxuICAvLyBCYXNlNjQgZW5jb2Rpbmcgd3JpdHRlbiBieSBtZSwgQG1hZXR0aWdcbiAgdXNlZCArPSA0NDtcbiAgdmFyIGkgPSAwLFxuICAgICAgYmFzZTY0Q2hhcmFjdGVycyA9ICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWmFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6MDEyMzQ1Njc4OSsvJyxcbiAgICAgIG91dHB1dCA9ICdkYXRhOmF1ZGlvL3dhdjtiYXNlNjQsJztcbiAgZm9yICg7IGkgPCB1c2VkOyBpICs9IDMpXG4gIHtcbiAgICB2YXIgYSA9IGRhdGFbaV0gPDwgMTYgfCBkYXRhW2kgKyAxXSA8PCA4IHwgZGF0YVtpICsgMl07XG4gICAgb3V0cHV0ICs9IGJhc2U2NENoYXJhY3RlcnNbYSA+PiAxOF0gKyBiYXNlNjRDaGFyYWN0ZXJzW2EgPj4gMTIgJiA2M10gKyBiYXNlNjRDaGFyYWN0ZXJzW2EgPj4gNiAmIDYzXSArIGJhc2U2NENoYXJhY3RlcnNbYSAmIDYzXTtcbiAgfVxuICByZXR1cm4gb3V0cHV0O1xufVxuIiwidmFyIGN1cnZlID0gcmVxdWlyZShcIi4vY3VydmVcIik7XG52YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLndpZHRoID0gMTI7XG5cdHRoaXMuaGVpZ2h0ID0gMTc7XG5cdHRoaXMub3BhY2l0eSA9IDE7XG5cdHRoaXMueCA9IC0xNTtcblx0dGhpcy55ID0gMzQgLSB0aGlzLmhlaWdodDtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5uYW1lID0gXCJtYXJpb1wiO1xuXHR0aGlzLnNyYyA9IFwibWFyaW8ucG5nXCI7XG5cdHRoaXMucmVtb3ZlID0gZmFsc2U7XG5cdHRoaXMua2lsbGVkID0gZmFsc2U7XG5cdHRoaXMuZmFkaW5nID0gZmFsc2U7XG5cdHRoaXMucmVhY2hlZCA9IGZhbHNlO1xuXHR0aGlzLmRlc3RwaXBlID0gMDtcblx0dGhpcy5wYXRoID0ge1xuXHRcdHg6IFstMTUsIDE3LCAzMF0sXG5cdFx0eTogWzM0IC0gdGhpcy5oZWlnaHQsIDM0IC0gdGhpcy5oZWlnaHQsIDEwXSxcblx0XHRrOiBbcnVsZXMuaywgcnVsZXMuaywgcnVsZXMua11cblx0fTtcblx0dGhpcy5nZW5lcmF0ZUN1cnZlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5kZXN0cGlwZSA9IHJhbmRvbS5yZXBudW1iZXIocnVsZXMucGlwZXMubGVuZ3RoLCAwKTtcblx0XHR2YXIgayA9IHJ1bGVzLms7XG5cdFx0dGhpcy5wYXRoLmsgPSB0aGlzLnBhdGguay5jb25jYXQoW2ssIGssIGtdKTtcblx0XHR2YXIgZGVzdHggPSBydWxlcy5waXBlc1t0aGlzLmRlc3RwaXBlXSArIDE1O1xuXHRcdHZhciB0aHJlcyA9IGRlc3R4IC0gKHJhbmRvbS5udW1iZXIoMjApICsgMjApO1xuXG5cdFx0Ly9jbGltYXhcblx0XHR0aGlzLnBhdGgueS5wdXNoKDMpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMgLyAyKTtcblxuXHRcdC8vYnVmZmVyIGFwcHJvYWNoXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlciAvIDIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2godGhyZXMpO1xuXG5cdFx0Ly9kZXN0aW5hdGlvblxuXHRcdHRoaXMucGF0aC55LnB1c2gocnVsZXMud2F0ZXIpO1xuXHRcdHRoaXMucGF0aC54LnB1c2goZGVzdHgpO1xuXHR9O1xuXHR0aGlzLmV4cGxvZGUgPSBmdW5jdGlvbigpIHtcblx0XHRhdWRpby5wbGF5KFwiYm9tYlwiKTtcblx0XHR0aGlzLmZhZGluZyA9IHRydWU7XG5cdFx0dGhpcy50eXBlID0gXCJyZWN0XCI7XG5cdFx0dGhpcy5jb2xvciA9IFwiI0ZGRkZGRlwiO1xuXHRcdHRoaXMud2lkdGggPSBydWxlcy5zaWRlO1xuXHRcdHRoaXMuaGVpZ2h0ID0gcnVsZXMuYm90dG9tO1xuXHRcdHRoaXMueCA9IDA7XG5cdFx0dGhpcy55ID0gMDtcblx0XHR0aGlzLmZhZGVPdXQoKTtcblx0fTtcblx0dGhpcy50aWNrID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMueCA+IHRoaXMucGF0aC54WzFdKSB0aGlzLnkgPSBjdXJ2ZSh0aGlzLngsIHRoaXMucGF0aCk7IC8vIGN1cnZlIGlmIG5vdCBvbiBkZWNrXG5cdFx0aWYgKHRoaXMueCA9PSB0aGlzLnBhdGgueFsxXSArIDEwKSB7XG5cdFx0XHRpZih0aGlzLm5hbWUgPT0gXCJib21iXCIpIGF1ZGlvLnBsYXkoXCJzaXp6bGVcIik7XG5cdFx0XHRlbHNlIGF1ZGlvLnBsYXkoXCJqdW1wXCIpO1xuXHRcdH1cblx0XHR0aGlzLngrKztcblx0XHRpZiAodGhpcy55IDwgcnVsZXMud2F0ZXIgJiYgIXRoaXMuZmFkaW5nKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCAxMCk7XG5cdFx0ZWxzZSBpZiAoIXRoaXMucmVhY2hlZCkge1xuXHRcdFx0dGhpcy5mYWRpbmcgPSB0cnVlO1xuXHRcdFx0aWYgKHRoaXMubmFtZSAhPSBcImJvbWJcIikgYXVkaW8ucGxheShcIndhdGVyXCIpO1xuXHRcdFx0dGhpcy5mYWRlT3V0KCk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmZhZGVPdXQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9wYWNpdHkgLT0gMC4xO1xuXHRcdGlmICh0aGlzLm9wYWNpdHkgPiAwLjEpIHNldFRpbWVvdXQodGhpcy5mYWRlT3V0LmJpbmQodGhpcyksIDUwKTtcblx0XHRlbHNlIHRoaXMucmVtb3ZlID0gdHJ1ZTtcblx0fTtcblx0dGhpcy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2VuZXJhdGVDdXJ2ZSgpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbihoZWFydCkge1xuXHRcdGlmIChyYW5kb20ucmVwbnVtYmVyKHJ1bGVzLmhlYXJ0c3Bhd24sIDEpID09IDEgJiYgaGVhcnQpIHtcblx0XHRcdHRoaXMubmFtZSA9IFwiaGVhcnRwXCI7XG5cdFx0XHR0aGlzLnNyYyA9IFwiaGVhcnRwLnBuZ1wiO1xuXHRcdFx0dGhpcy53aWR0aCA9IDEwO1xuXHRcdFx0dGhpcy5oZWlnaHQgPSA5O1xuXHRcdH0gZWxzZSBpZiAocmFuZG9tLnJlcG51bWJlcihydWxlcy5ib21ic3Bhd24sIDIpID09IDEpIHtcblx0XHRcdHRoaXMubmFtZSA9IFwiYm9tYlwiO1xuXHRcdFx0dGhpcy5zcmMgPSBcImJvbWIucG5nXCI7XG5cdFx0XHR0aGlzLndpZHRoID0gMTI7XG5cdFx0XHR0aGlzLmhlaWdodCA9IDE0O1xuXHRcdH1cblx0XHR0aGlzLmJlZ2luKCk7XG5cdH07XG59O1xuIiwidmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnggPSAwO1xuXHR0aGlzLnkgPSAwO1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcInBpcGVcIjtcblx0dGhpcy5zcmMgPSBcInBpcGUucG5nXCI7XG5cdHRoaXMud2lkdGggPSAzMDtcblx0dGhpcy5oZWlnaHQgPSA3MDtcblx0dGhpcy5waXBlbiA9IDA7XG5cdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdHRoaXMuZG93biA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFuaW1hdGluZyA9IHRydWU7XG5cdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xuXHRcdGF1ZGlvLnBsYXkoXCJwaXBlXCIpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLmFuaW1hdGlvbkRvbmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRvd24gPSBmYWxzZTtcblx0XHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2O1xuXHRcdGlmICghdGhpcy5kb3duKSB0aGlzLnktLTtcblx0XHRlbHNlIHRoaXMueSsrO1xuXHRcdGlmICh0aGlzLnkgPT0gODApIHRoaXMuZG93biA9IHRydWU7XG5cdFx0aWYgKHRoaXMueSA8IDEzMCkgc2V0VGltZW91dCh0aGlzLnRpY2suYmluZCh0aGlzKSwgcnVsZXMucGlwZWR1ciAvIDUwKTtcblx0XHRlbHNlIGlmICh0aGlzLnkgPT0gMTMwKSB0aGlzLmFuaW1hdGlvbkRvbmUoKTtcblx0fTtcblx0dGhpcy5yaXNlID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLnktLTtcblx0XHRpZih0aGlzLnkgPiAxMzApIHNldFRpbWVvdXQodGhpcy5yaXNlLmJpbmQodGhpcyksIHJ1bGVzLmJlZ2luRGVsYXkgLyAxMDApO1xuXHRcdGVsc2UgdGhpcy5pbml0RXZlbnQoKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24obikge1xuXHRcdHRoaXMueCA9IHJ1bGVzLnBpcGVzW25dO1xuXHRcdHRoaXMueSA9IHJ1bGVzLmJvdHRvbS0xMjA7XG5cdFx0dGhpcy5waXBlbiA9IG47XG5cdFx0dGhpcy5yaXNlKCk7XG5cdH07XG5cdHRoaXMua2V5ID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmICghdGhpcy5hbmltYXRpbmcpIHtcblx0XHRcdGlmIChlLndoaWNoID09IHJ1bGVzLmNvbnRyb2xzW3RoaXMucGlwZW5dKSB7XG5cdFx0XHRcdHRoaXMuYW5pbWF0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0dGhpcy50b3VjaCA9IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgeCA9IChlLnggLSBjYW52YXMub2Zmc2V0TGVmdCkgLyBydWxlcy5zY2FsZTtcblx0XHR2YXIgeSA9IChlLnkgLSBjYW52YXMub2Zmc2V0VG9wKSAvIHJ1bGVzLnNjYWxlO1xuXHRcdGlmICghdGhpcy5hbmltYXRpbmcpIHtcblx0XHRcdGlmICh4ID49IHRoaXMueCAmJiB4IDw9IHRoaXMueCArIDMwKSB7XG5cdFx0XHRcdHRoaXMuYW5pbWF0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0dGhpcy5pbml0RXZlbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHQua2V5KGUpO1xuXHRcdH0pO1xuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHQudG91Y2goZSk7XG5cdFx0fSwgZmFsc2UpO1xuXHR9O1xufTtcbiIsIi8vIEhvbGRzIGxhc3QgaXRlcmF0aW9uIHRpbWVzdGFtcC5cbnZhciB0aW1lID0gMDtcblxuLyoqXG4gKiBDYWxscyBgZm5gIG9uIG5leHQgZnJhbWUuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJhZihmbikge1xuICByZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZWxhcHNlZCA9IG5vdyAtIHRpbWU7XG5cbiAgICBpZiAoZWxhcHNlZCA+IDk5OSkge1xuICAgICAgZWxhcHNlZCA9IDEgLyA2MDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxhcHNlZCAvPSAxMDAwO1xuICAgIH1cblxuICAgIHRpbWUgPSBub3c7XG4gICAgZm4oZWxhcHNlZCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIENhbGxzIGBmbmAgb24gZXZlcnkgZnJhbWUgd2l0aCBgZWxhcHNlZGAgc2V0IHRvIHRoZSBlbGFwc2VkXG4gICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiByYWYoZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgICBmbihlbGFwc2VkKTtcbiAgICAgIHJhZih0aWNrKTtcbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gZnJhbWUgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGlkIFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdG9wOiBmdW5jdGlvbihpZCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH1cbn07XG4iLCJ2YXIgcHJldiA9IFtdO1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG51bWJlcjogZnVuY3Rpb24obWF4KSB7IC8vcmV0dXJucyBiZXR3ZWVuIDAgYW5kIG1heCAtIDFcblx0XHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcblx0fSxcblx0cmVwbnVtYmVyOiBmdW5jdGlvbihtYXgsIGkpIHsgLy9zYW1lIGFzIG51bWJlciBidXQgbm9uLXJlcGVhdGluZ1xuXHRcdHZhciByZXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHRcdGlmIChyZXMgPT0gcHJldltpXSkge1xuXHRcdFx0aWYgKHJlcyA+IDApIHJlcyAtPSAxOyAgLy95ZXMgdmVyeSBjaGVhcFxuXHRcdFx0ZWxzZSByZXMgPSAxO1xuXHRcdH1cblx0XHRwcmV2W2ldID0gcmVzO1xuXHRcdHJldHVybiByZXM7XG5cdH1cbn07XG4iLCJ2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgubW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgud2Via2l0SW1hZ2VTbW9vdGhsb2NpbmdFbmFibGVkID0gZmFsc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcblx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuXHRjdHguc2NhbGUoc3RhdGUuc2NhbGUsIHN0YXRlLnNjYWxlKTtcblx0dmFyIHBpcGVzID0gc3RhdGUucGlwZXM7XG5cdHN0YXRlLnNwcml0ZXMuZm9yRWFjaChmdW5jdGlvbihzLCBpKSB7XG5cdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIgfHwgcy5uYW1lID09IFwiaGVhcnRwXCIgfHwgcy5uYW1lID09IFwiYm9tYlwiKSB7XG5cdFx0XHR2YXIgcCA9IHBpcGVzW3MuZGVzdHBpcGVdO1xuXHRcdFx0aWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRcdHN0YXRlLnNwcml0ZXMuc3BsaWNlKGksIDEpO1xuXHRcdFx0fSBlbHNlIGlmIChzLmZhZGluZyAmJiAhcy5raWxsZWQpIHtcblx0XHRcdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIpIHN0YXRlLmxvc3QoKTtcblx0XHRcdFx0cy5raWxsZWQgPSB0cnVlO1xuXHRcdFx0fSBlbHNlIGlmIChwLmFjdGl2ZSAmJiAocy54ID4gcC54ICYmIHMueCA8IHAueCArIDMwKSAmJiAocy55ID49IHAueSkgJiYgIShzLmZhZGluZykgJiYgIShzdGF0ZS5sb3NpbmcpKSB7XG5cdFx0XHRcdHMucmVhY2hlZCA9IHRydWU7XG5cdFx0XHRcdGlmIChzLm5hbWUgPT0gXCJib21iXCIpIHtcblx0XHRcdFx0XHRzdGF0ZS5sb3N0R2FtZSgpO1xuXHRcdFx0XHRcdHMuZXhwbG9kZSgpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiKSBzdGF0ZS5nYWluZWQocy5kZXN0cGlwZSk7XG5cdFx0XHRcdFx0ZWxzZSBzdGF0ZS5oZWFydGVkKCk7XG5cdFx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9IGVsc2UgaWYgKHMucmVtb3ZlKSB7XG5cdFx0XHRzdGF0ZS5zcHJpdGVzLnNwbGljZShpLCAxKTtcblx0XHR9XG5cdFx0aWYgKHMub3BhY2l0eSkgY3R4Lmdsb2JhbEFscGhhID0gcy5vcGFjaXR5O1xuXHRcdGVsc2UgY3R4Lmdsb2JhbEFscGhhID0gMTtcblx0XHRzd2l0Y2ggKHMudHlwZSkge1xuXHRcdFx0Y2FzZSBcInJlY3RcIjpcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHMuY29sb3I7XG5cdFx0XHRcdGN0eC5maWxsUmVjdChzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJpbWdcIjpcblx0XHRcdFx0dmFyIGltZyA9IG5ldyBJbWFnZSgpO1xuXHRcdFx0XHRpbWcuc3JjID0gXCJhc3NldHMvXCIgKyBzLnNyYztcblx0XHRcdFx0Y3R4LmRyYXdJbWFnZShpbWcsIHMueCwgcy55LCBzLndpZHRoLCBzLmhlaWdodCk7XG5cdFx0XHRcdGJyZWFrO1xuXHRcdFx0Y2FzZSBcInRleHRcIjpcblx0XHRcdFx0Y3R4LmZvbnQgPSBzLnNpemUgKyBcInB4IFwiICsgcy5mb250O1xuXHRcdFx0XHRjdHgudGV4dEFsaWduID0gcy5hbGlnbiB8fCBcImNlbnRlclwiO1xuXHRcdFx0XHRjdHguZmlsbFN0eWxlID0gcy5jb2xvciB8fCBcIiNGRkZGRkZcIjtcblx0XHRcdFx0Y3R4LmZpbGxUZXh0KHMudGV4dCwgcy54LCBzLnkpO1xuXHRcdFx0XHRicmVhaztcblx0XHR9XG5cdH0pO1xufTtcbiIsIm1vZHVsZS5leHBvcnRzID0ge1xuXHRib3R0b206IDMwMCxcblx0c2lkZTogMjUwLFxuXHR3YXRlcjogMTE1LFxuXHRwaXBlczogW1xuXHRcdDkwLFxuXHRcdDE0NSxcblx0XHQyMDBcblx0XSxcblx0Y29udHJvbHM6IFtcblx0XHQ4MSxcblx0XHQ4Nyxcblx0XHQ2OVxuXHRdLFxuXHRrOiAwLjAxLFxuXHRwaXBlZHVyOiAxMDAsXG5cdHNjYWxlOiAyLFxuXHRiZWdpbkRlbGF5OiAyMDAwLFxuXHRoZWFydHNwYXduOiAyNSxcblx0Ym9tYnNwYXduOiAxNSxcblx0c3Bhd246IDEwMFxufTtcbiIsInZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpe1xuXHR0aGlzLnR5cGUgPSBcInRleHRcIjtcblx0dGhpcy5uYW1lID0gXCJzY29yZVwiO1xuXHR0aGlzLmZvbnQgPSBcInNhbnMtc2VyaWZcIjtcblx0dGhpcy5hbGlnbiA9IFwicmlnaHRcIjtcblx0dGhpcy5zaXplID0gMjA7XG5cdHRoaXMueCA9IHJ1bGVzLnNpZGUgLSAxMDtcblx0dGhpcy55ID0gdGhpcy5zaXplO1xuXHR0aGlzLnRleHQgPSBcIjBcIjtcblx0dGhpcy51cGRhdGUgPSBmdW5jdGlvbih2KXtcblx0XHR0aGlzLnRleHQgPSB2O1xuXHR9O1xufTtcbiIsInZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKHRpbWUpe1xuXHR2YXIgdmFsID0gKHJhbmRvbS5udW1iZXIoMTgwMCkgLSAodGltZSAvIHJ1bGVzLnNwYXduKSk7XG5cdGlmICh2YWwgPCAwKSB2YWwgPSAwO1xuXHRyZXR1cm4gMzUwICsgdmFsO1xufTtcbiIsInZhciBNYXJpbyA9IHJlcXVpcmUoXCIuL21hcmlvXCIpO1xudmFyIFBpcGUgPSByZXF1aXJlKFwiLi9waXBlXCIpO1xudmFyIFNjb3JlYm9hcmQgPSByZXF1aXJlKFwiLi9zY29yZWJvYXJkXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG52YXIgSGVhcnQgPSByZXF1aXJlKFwiLi9oZWFydFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IHJ1bGVzLnNjYWxlO1xuXHR0aGlzLnRpbWUgPSAxO1xuXHR0aGlzLnNjb3JlID0gMDtcblx0dGhpcy5saXZlcyA9IDM7XG5cdHRoaXMubG9zaW5nID0gZmFsc2U7XG5cdHRoaXMuY3JlYXRlZCA9IHRydWU7XG5cdHRoaXMuc2NvcmVib2FyZCA9IHt9O1xuXHR0aGlzLmhlYXJ0cyA9IFtdO1xuXHR0aGlzLnBpcGVzID0gW107XG5cdHRoaXMuaGkgPSAwO1xuXHR0aGlzLmxvc3RzY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCIyMFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiNGRjAwMDBcIixcblx0XHR0ZXh0OiBcIllPVSBMT1NUIVwiLFxuXHRcdHg6IDEzMCxcblx0XHR5OiA3MFxuXHR9O1xuXHR0aGlzLmdyZWV0c2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRzaXplOiBcIjIwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0Y29sb3I6IFwiIzZCRkY2M1wiLFxuXHRcdHRleHQ6IFwiTUFSSU8gQ0FUQ0hcIixcblx0XHR4OiAxMzAsXG5cdFx0eTogNzBcblx0fTtcblx0dGhpcy5zdGFydHNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImxvc3RcIixcblx0XHRzaXplOiBcIjEwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0dGV4dDogXCJwcmVzcyB4IHRvIHN0YXJ0LiBwcmVzcyBrZXlzIHRvIHJhaXNlIHBpcGVzLlwiLFxuXHRcdHg6IDEzMCxcblx0XHR5OiA4NVxuXHR9O1xuXHR0aGlzLmluc3RydWN0aW9uc2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwibG9zdFwiLFxuXHRcdHNpemU6IFwiOFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdHRleHQ6IFwiUSAgICAgICAgICAgICAgICAgICBXICAgICAgICAgICAgICAgICAgICBFXCIsXG5cdFx0eDogMTU1LFxuXHRcdHk6IDExMFxuXHR9O1xuXHR0aGlzLnNwcml0ZXMgPSBbe1xuXHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdG5hbWU6IFwic2t5XCIsXG5cdFx0Y29sb3I6IFwiIzVDOTRGQ1wiLFxuXHRcdHdpZHRoOiAyNTAsXG5cdFx0aGVpZ2h0OiAxNTAsXG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogODAsXG5cdFx0eTogMTIsXG5cdFx0b3BhY2l0eTogMC44LFxuXHRcdHdpZHRoOiA0MCxcblx0XHRoZWlnaHQ6IDI1XG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogMTYwLFxuXHRcdHk6IDM1LFxuXHRcdG9wYWNpdHk6IDAuOCxcblx0XHR3aWR0aDogMjQsXG5cdFx0aGVpZ2h0OiAxNVxuXHR9LCB7XG5cdFx0dHlwZTogXCJpbWdcIixcblx0XHRuYW1lOiBcImJsb2Nrc1wiLFxuXHRcdHNyYzogXCJibG9ja3MucG5nXCIsXG5cdFx0eDogMCxcblx0XHR5OiAzNCxcblx0XHR3aWR0aDogMzQsXG5cdFx0aGVpZ2h0OiAxN1xuXHR9LCB7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJ3YXRlclwiLFxuXHRcdGNvbG9yOiBcIiMxNURDRTJcIixcblx0XHRvcGFjaXR5OiAwLjUsXG5cdFx0eTogcnVsZXMud2F0ZXIsXG5cdFx0eDogMCxcblx0XHR3aWR0aDogMzAwLFxuXHRcdGhlaWdodDogMzVcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgaHJ0ID0gZmFsc2U7XG5cdFx0aWYodGhpcy5saXZlcyA8IDMpIGhydCA9IHRydWU7XG5cdFx0dmFyIG1hcmlvID0gbmV3IE1hcmlvKCk7XG5cdFx0bWFyaW8ub25TcGF3bihocnQpO1xuXHRcdC8vdmFyIGRiYyA9IHJlcXVpcmUoXCIuLi9kZWJ1Zy9jdXJ2ZVwiKTtcblx0XHQvL3RoaXMuc3ByaXRlcyA9IHRoaXMuc3ByaXRlcy5jb25jYXQoZGJjKG1hcmlvLnBhdGgpKTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKDMsIDAsIG1hcmlvKTtcblx0fTtcblx0dGhpcy5jcmVhdGVQaXBlcyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgcnVsZXMucGlwZXMubGVuZ3RoOyBpKyspIHtcblx0XHRcdHZhciBwaXBlID0gbmV3IFBpcGUoKTtcblx0XHRcdHBpcGUub25TcGF3bihpKTtcblx0XHRcdHRoaXMucGlwZXMucHVzaChwaXBlKTtcblx0XHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMywgMCwgdGhpcy5waXBlc1tpXSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmNyZWF0ZUhlYXJ0cyA9IGZ1bmN0aW9uKCkge1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgMzsgaSsrKSB7XG5cdFx0XHR2YXIgaGVhcnQgPSBuZXcgSGVhcnQoKTtcblx0XHRcdGhlYXJ0Lm9uU3Bhd24oaSk7XG5cdFx0XHR0aGlzLmhlYXJ0cy5wdXNoKGhlYXJ0KTtcblx0XHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuaGVhcnRzW2ldKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlU2NvcmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLnNjb3JlYm9hcmQgPSBuZXcgU2NvcmVib2FyZCgpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc2NvcmVib2FyZCk7XG5cdH07XG5cdHRoaXMubG9zdCA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLmxpdmVzID4gMCkge1xuXHRcdFx0dGhpcy5saXZlcy0tO1xuXHRcdFx0dGhpcy5oZWFydHNbdGhpcy5saXZlc10ubG9zZSgpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5saXZlcyA9PT0gMCkge1xuXHRcdFx0dGhpcy5sb3N0R2FtZSgpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5oZWFydGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMubGl2ZXMgPCAzICYmICF0aGlzLmxvc2luZykge1xuXHRcdFx0YXVkaW8ucGxheShcImhlYXJ0XCIpO1xuXHRcdFx0dGhpcy5saXZlcysrO1xuXHRcdFx0dGhpcy5oZWFydHNbdGhpcy5saXZlcyAtIDFdLmdhaW4oKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuZ2FpbmVkID0gZnVuY3Rpb24ocCkge1xuXHRcdGF1ZGlvLnBsYXkoXCJzY29yZVwiICsgcCk7XG5cdFx0dGhpcy5zY29yZSsrO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUodGhpcy5zY29yZSk7XG5cdH07XG5cdHRoaXMubG9zdEdhbWUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxvc2luZyA9IHRydWU7XG5cdFx0dGhpcy5saXZlcyA9IDA7XG5cdFx0dGhpcy5oZWFydHMuZm9yRWFjaChmdW5jdGlvbihpdGVtKXtcblx0XHRcdGl0ZW0ubG9zZSgpO1xuXHRcdH0pO1xuXHRcdGlmICh0aGlzLnNjb3JlID4gdGhpcy5oaSkgdGhpcy5zZXRIaSgpO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUoXCJsYXN0OiBcIiArIHRoaXMuc2NvcmUgKyBcIiBoaTogXCIgKyB0aGlzLmhpKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmxvc3RzY3JlZW4pO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMuc3RhcnRzY3JlZW4pO1xuXHR9O1xuXHR0aGlzLmNyZWF0ZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JlYXRlZCA9IHRydWU7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5ncmVldHNjcmVlbik7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5zdGFydHNjcmVlbik7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5pbnN0cnVjdGlvbnNjcmVlbik7XG5cdH07XG5cdHRoaXMuc3RhcnRlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuY3JlYXRlZCA9IGZhbHNlO1xuXHRcdHZhciBsID0gdGhpcy5zcHJpdGVzLmxlbmd0aCAtIDE7XG5cdFx0dGhpcy5zcHJpdGVzLnNwbGljZShsLCAxKTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKGwgLSAxLCAxKTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKGwgLSAyLCAxKTtcblx0XHR0aGlzLmNyZWF0ZVBpcGVzKCk7XG5cdFx0dGhpcy5jcmVhdGVTY29yZSgpO1xuXHRcdHRoaXMuY3JlYXRlSGVhcnRzKCk7XG5cdFx0dGhpcy5nZXRIaSgpO1xuXHR9O1xuXHR0aGlzLnNldEhpID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5oaSA9IHRoaXMuc2NvcmU7XG5cdFx0bG9jYWxTdG9yYWdlLnNldEl0ZW0oXCJoaVwiLCB0aGlzLnNjb3JlKTtcblx0fTtcblx0dGhpcy5nZXRIaSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuaGkgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbShcImhpXCIpO1xuXHR9O1xufTtcbiJdfQ==
