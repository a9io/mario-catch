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
		audio.play("heart");
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
	score: [0,,0.0818,0.5164,0.2858,0.4867,,,,,,0.501,0.614,,,,,,1,,,,,0.5],
	jump: [0,,0.1192,,0.2331,0.3712,,0.2254,,,,,,0.3291,,,,,0.6154,,,0.156,,0.5],
	heart: [1,,0.0975,,0.489,0.2047,,0.1759,,,,,,,,,,,1,,,,,0.5]
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
	this.tick = function() {
		if (this.x > this.path.x[1]) this.y = curve(this.x, this.path); // curve if not on deck
		if (this.x == this.path.x[1] + 10) audio.play("jump");
		this.x++;
		if (this.y < rules.water) setTimeout(this.tick.bind(this), 10);
		else if (!this.reached) {
			this.fading = true;
			audio.play("water");
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
	this.onSpawn = function() {
		if(random.repnumber(rules.heartspawn, 1) == 1) {
			this.name = "heartp";
			this.src = "heartp.png";
			this.width = 10;
			this.height = 9;
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
		if (s.name == "mario" || s.name == "heartp") {
			var p = pipes[s.destpipe];
			if (s.remove) {
				state.sprites.splice(i, 1);
			} else if (s.fading && !s.killed) {
				if (s.name == "mario") state.lost();
				s.killed = true;
			} else if (p.active && (s.x > p.x && s.x < p.x + 30) && (s.y >= p.y) && !(s.fading) && !(state.losing)) {
				s.reached = true;
				state.sprites.splice(i, 1);
				if (s.name == "mario") state.gained();
				else state.hearted();
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
	pipedur: 250,
	scale: 2,
	beginDelay: 2000,
	heartspawn: 25,
	spawn: 500
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
	return 350 + (random.number(1800) - (time / rules.spawn));
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
		var mario = new Mario();
		mario.onSpawn();
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
	this.gained = function() {
		audio.play("score");
		this.score++;
		this.scoreboard.update(this.score);
	};
	this.lostGame = function() {
		this.losing = true;
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIuL3NyYy9tYWluIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9hdWRpby5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvY3VydmUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL2hlYXJ0LmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9qc2Z4ci5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvbWFyaW8uanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3BpcGUuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3JhZi5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmFuZC5qcyIsIi9Vc2Vycy9tYXgvRG9jdW1lbnRzL2pzL2hheC9tYXJpby1jYXRjaC9zcmMvcmVuZGVyZXIuanMiLCIvVXNlcnMvbWF4L0RvY3VtZW50cy9qcy9oYXgvbWFyaW8tY2F0Y2gvc3JjL3J1bGVzLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zY29yZWJvYXJkLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zcGF3bmVyLmpzIiwiL1VzZXJzL21heC9Eb2N1bWVudHMvanMvaGF4L21hcmlvLWNhdGNoL3NyYy9zdGF0ZS5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25CQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbGVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25EQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNyQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIHJlbmRlciA9IHJlcXVpcmUoXCIuL3JlbmRlcmVyXCIpO1xudmFyIHJhZiA9IHJlcXVpcmUoXCIuL3JhZlwiKTtcbnZhciBhdWRpbyA9IHJlcXVpcmUoXCIuL2F1ZGlvXCIpO1xudmFyIFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVcIik7XG52YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbnZhciBzcGF3bmVyID0gcmVxdWlyZShcIi4vc3Bhd25lclwiKTtcbnZhciBzdGF0ZTtcblxudmFyIGluaXRpYWxpemUgPSBmdW5jdGlvbigpIHtcblx0c3RhdGUgPSBuZXcgU3RhdGUoKTtcblx0c3RhdGUuY3JlYXRlKCk7XG5cdHJhZi5zdGFydChmdW5jdGlvbihlKSB7XG5cdFx0cmVuZGVyKHN0YXRlKTtcblx0fSk7XG59O1xuXG52YXIgc3RhcnRHYW1lID0gZnVuY3Rpb24oKSB7XG5cdHN0YXRlLnN0YXJ0ZWQoKTtcblx0c2V0VGltZW91dChzcGF3biwgcnVsZXMuYmVnaW5EZWxheSk7XG59O1xuXG52YXIgc3Bhd24gPSBmdW5jdGlvbigpIHtcblx0aWYgKCFzdGF0ZS5sb3NpbmcpIHtcblx0XHRzdGF0ZS5jcmVhdGVNYXJpbygpO1xuXHRcdHZhciB0ID0gc3Bhd25lcihzdGF0ZS50aW1lKTtcblx0XHRzdGF0ZS50aW1lICs9IHQ7XG5cdFx0c2V0VGltZW91dChzcGF3biwgdCk7XG5cdH1cbn07XG5cbndpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwia2V5ZG93blwiLCBmdW5jdGlvbihlKSB7XG5cdGlmIChlLndoaWNoID09IDg4ICYmIChzdGF0ZS5sb3NpbmcgfHwgc3RhdGUuY3JlYXRlZCkpIHtcblx0XHRhdWRpby5wbGF5KFwiaGVhcnRcIik7XG5cdFx0aW5pdGlhbGl6ZSgpO1xuXHRcdHN0YXJ0R2FtZSgpO1xuXHR9XG59KTtcblxuaW5pdGlhbGl6ZSgpO1xuIiwidmFyIGpzZnhyID0gcmVxdWlyZShcIi4vanNmeHJcIik7XG52YXIgZmlsZXMgPSB7XG5cdHBpcGU6IFsyLCAsIDAuMiwgLCAwLjE3NTMsIDAuNjQsICwgLTAuNTI2MSwgLCAsICwgLCAsIDAuNTUyMiwgLTAuNTY0LCAsICwgLCAxLCAsICwgLCAsIDAuNV0sXG5cdHdhdGVyOiBbMywsMC4wMjUyLCwwLjI4MDcsMC43ODQxLCwtMC42ODY5LCwsLCwsLCwsLCwxLCwsMC4wNTIzLCwwLjVdLFxuXHRzY29yZTogWzAsLDAuMDgxOCwwLjUxNjQsMC4yODU4LDAuNDg2NywsLCwsLDAuNTAxLDAuNjE0LCwsLCwsMSwsLCwsMC41XSxcblx0anVtcDogWzAsLDAuMTE5MiwsMC4yMzMxLDAuMzcxMiwsMC4yMjU0LCwsLCwsMC4zMjkxLCwsLCwwLjYxNTQsLCwwLjE1NiwsMC41XSxcblx0aGVhcnQ6IFsxLCwwLjA5NzUsLDAuNDg5LDAuMjA0NywsMC4xNzU5LCwsLCwsLCwsLCwxLCwsLCwwLjVdXG59O1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdHBsYXk6IGZ1bmN0aW9uKGYpIHtcblx0XHRmaWxlc1tmXS5wbGF5KCk7XG5cdH1cbn07XG5cbk9iamVjdC5rZXlzKGZpbGVzKS5mb3JFYWNoKGZ1bmN0aW9uKG5tKSB7XG5cdHZhciBhdWRpbyA9IG5ldyBBdWRpbygpO1xuXHRhdWRpby5zcmMgPSBqc2Z4cihmaWxlc1tubV0pO1xuXHRmaWxlc1tubV0gPSBhdWRpbztcbn0pO1xuIiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih4LCBwYXRoKXtcblx0Q1NQTC5nZXROYXR1cmFsS3MocGF0aC54LCBwYXRoLnksIHBhdGguayk7XG5cdHJldHVybiBDU1BMLmV2YWxTcGxpbmUoeCwgcGF0aC54LCBwYXRoLnksIHBhdGguayk7XG59O1xuXG4vL0NTUEwgU2NyaXB0IGJ5IEl2YW4gSywgQWRhcHRlZCBmb3IgdGhlIGdhbWVcbnZhciBDU1BMID0gZnVuY3Rpb24oKSB7fTtcbkNTUEwuX2dhdXNzSiA9IHt9O1xuQ1NQTC5fZ2F1c3NKLnNvbHZlID0gZnVuY3Rpb24oQSwgeCkgLy8gaW4gTWF0cml4LCBvdXQgc29sdXRpb25zXG5cdHtcblx0XHR2YXIgbSA9IEEubGVuZ3RoO1xuXHRcdGZvciAodmFyIGsgPSAwOyBrIDwgbTsgaysrKSAvLyBjb2x1bW5cblx0XHR7XG5cdFx0XHQvLyBwaXZvdCBmb3IgY29sdW1uXG5cdFx0XHR2YXIgaV9tYXggPSAwO1xuXHRcdFx0dmFyIHZhbGkgPSBOdW1iZXIuTkVHQVRJVkVfSU5GSU5JVFk7XG5cdFx0XHRmb3IgKHZhciBpID0gazsgaSA8IG07IGkrKylcblx0XHRcdFx0aWYgKEFbaV1ba10gPiB2YWxpKSB7XG5cdFx0XHRcdFx0aV9tYXggPSBpO1xuXHRcdFx0XHRcdHZhbGkgPSBBW2ldW2tdO1xuXHRcdFx0XHR9XG5cdFx0XHRDU1BMLl9nYXVzc0ouc3dhcFJvd3MoQSwgaywgaV9tYXgpO1xuXHRcdFx0Ly8gZm9yIGFsbCByb3dzIGJlbG93IHBpdm90XG5cdFx0XHRmb3IgKHZhciBpID0gayArIDE7IGkgPCBtOyBpKyspIHtcblx0XHRcdFx0Zm9yICh2YXIgaiA9IGsgKyAxOyBqIDwgbSArIDE7IGorKylcblx0XHRcdFx0XHRBW2ldW2pdID0gQVtpXVtqXSAtIEFba11bal0gKiAoQVtpXVtrXSAvIEFba11ba10pO1xuXHRcdFx0XHRBW2ldW2tdID0gMDtcblx0XHRcdH1cblx0XHR9XG5cblx0XHRmb3IgKHZhciBpID0gbSAtIDE7IGkgPj0gMDsgaS0tKSAvLyByb3dzID0gY29sdW1uc1xuXHRcdHtcblx0XHRcdHZhciB2ID0gQVtpXVttXSAvIEFbaV1baV07XG5cdFx0XHR4W2ldID0gdjtcblx0XHRcdGZvciAodmFyIGogPSBpIC0gMTsgaiA+PSAwOyBqLS0pIC8vIHJvd3Ncblx0XHRcdHtcblx0XHRcdFx0QVtqXVttXSAtPSBBW2pdW2ldICogdjtcblx0XHRcdFx0QVtqXVtpXSA9IDA7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuQ1NQTC5fZ2F1c3NKLnplcm9zTWF0ID0gZnVuY3Rpb24ociwgYykge1xuXHR2YXIgQSA9IFtdO1xuXHRmb3IgKHZhciBpID0gMDsgaSA8IHI7IGkrKykge1xuXHRcdEEucHVzaChbXSk7XG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBjOyBqKyspIEFbaV0ucHVzaCgwKTtcblx0fVxuXHRyZXR1cm4gQTtcbn07XG5DU1BMLl9nYXVzc0oucHJpbnRNYXQgPSBmdW5jdGlvbihBKSB7XG5cdGZvciAodmFyIGkgPSAwOyBpIDwgQS5sZW5ndGg7IGkrKykgY29uc29sZS5sb2coQVtpXSk7XG59O1xuQ1NQTC5fZ2F1c3NKLnN3YXBSb3dzID0gZnVuY3Rpb24obSwgaywgbCkge1xuXHR2YXIgcCA9IG1ba107XG5cdG1ba10gPSBtW2xdO1xuXHRtW2xdID0gcDtcbn07XG5DU1BMLmdldE5hdHVyYWxLcyA9IGZ1bmN0aW9uKHhzLCB5cywga3MpIC8vIGluIHggdmFsdWVzLCBpbiB5IHZhbHVlcywgb3V0IGsgdmFsdWVzXG5cdHtcblx0XHR2YXIgbiA9IHhzLmxlbmd0aCAtIDE7XG5cdFx0dmFyIEEgPSBDU1BMLl9nYXVzc0ouemVyb3NNYXQobiArIDEsIG4gKyAyKTtcblxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgbjsgaSsrKSAvLyByb3dzXG5cdFx0e1xuXHRcdFx0QVtpXVtpIC0gMV0gPSAxIC8gKHhzW2ldIC0geHNbaSAtIDFdKTtcblxuXHRcdFx0QVtpXVtpXSA9IDIgKiAoMSAvICh4c1tpXSAtIHhzW2kgLSAxXSkgKyAxIC8gKHhzW2kgKyAxXSAtIHhzW2ldKSk7XG5cblx0XHRcdEFbaV1baSArIDFdID0gMSAvICh4c1tpICsgMV0gLSB4c1tpXSk7XG5cblx0XHRcdEFbaV1bbiArIDFdID0gMyAqICgoeXNbaV0gLSB5c1tpIC0gMV0pIC8gKCh4c1tpXSAtIHhzW2kgLSAxXSkgKiAoeHNbaV0gLSB4c1tpIC0gMV0pKSArICh5c1tpICsgMV0gLSB5c1tpXSkgLyAoKHhzW2kgKyAxXSAtIHhzW2ldKSAqICh4c1tpICsgMV0gLSB4c1tpXSkpKTtcblx0XHR9XG5cblx0XHRBWzBdWzBdID0gMiAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdWzFdID0gMSAvICh4c1sxXSAtIHhzWzBdKTtcblx0XHRBWzBdW24gKyAxXSA9IDMgKiAoeXNbMV0gLSB5c1swXSkgLyAoKHhzWzFdIC0geHNbMF0pICogKHhzWzFdIC0geHNbMF0pKTtcblxuXHRcdEFbbl1bbiAtIDFdID0gMSAvICh4c1tuXSAtIHhzW24gLSAxXSk7XG5cdFx0QVtuXVtuXSA9IDIgLyAoeHNbbl0gLSB4c1tuIC0gMV0pO1xuXHRcdEFbbl1bbiArIDFdID0gMyAqICh5c1tuXSAtIHlzW24gLSAxXSkgLyAoKHhzW25dIC0geHNbbiAtIDFdKSAqICh4c1tuXSAtIHhzW24gLSAxXSkpO1xuXG5cdFx0Q1NQTC5fZ2F1c3NKLnNvbHZlKEEsIGtzKTtcblx0fTtcbkNTUEwuZXZhbFNwbGluZSA9IGZ1bmN0aW9uKHgsIHhzLCB5cywga3MpIHtcblx0dmFyIGkgPSAxO1xuXHR3aGlsZSAoeHNbaV0gPCB4KSBpKys7XG5cblx0dmFyIHQgPSAoeCAtIHhzW2kgLSAxXSkgLyAoeHNbaV0gLSB4c1tpIC0gMV0pO1xuXG5cdHZhciBhID0ga3NbaSAtIDFdICogKHhzW2ldIC0geHNbaSAtIDFdKSAtICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cdHZhciBiID0gLWtzW2ldICogKHhzW2ldIC0geHNbaSAtIDFdKSArICh5c1tpXSAtIHlzW2kgLSAxXSk7XG5cblx0dmFyIHEgPSAoMSAtIHQpICogeXNbaSAtIDFdICsgdCAqIHlzW2ldICsgdCAqICgxIC0gdCkgKiAoYSAqICgxIC0gdCkgKyBiICogdCk7XG5cdHJldHVybiBxO1xufTtcbiIsInZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy54ID0gMTA7XG5cdHRoaXMueSA9IDEyNTtcblx0dGhpcy5vID0ge1xuXHRcdHg6IDAsXG5cdFx0eTogMFxuXHR9O1xuXHR0aGlzLndpZHRoID0gMTU7XG5cdHRoaXMuaGVpZ2h0ID0gMTM7XG5cdHRoaXMubmFtZSA9IFwiaGVhcnRcIjtcblx0dGhpcy50eXBlID0gXCJpbWdcIjtcblx0dGhpcy5zcmMgPSBcImhlYXJ0LnBuZ1wiO1xuXHR0aGlzLnNoYWtlc3JjID0gXCJcIjtcblx0dGhpcy5mdWxsID0gdHJ1ZTtcblx0dGhpcy5zaGFrZW51bSA9IDA7XG5cdHRoaXMuc2hha2V0aHJlcyA9IDEwO1xuXHR0aGlzLnNoYWtlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy54ID0gdGhpcy5vLnggKyByYW5kb20ubnVtYmVyKDUpO1xuXHRcdHRoaXMueSA9IHRoaXMuby55ICsgcmFuZG9tLm51bWJlcig1KTtcblx0XHR0aGlzLnNoYWtlbnVtKys7XG5cdFx0aWYgKHRoaXMuc2hha2VudW0gPCB0aGlzLnNoYWtldGhyZXMpIHNldFRpbWVvdXQodGhpcy5zaGFrZS5iaW5kKHRoaXMpLCAyMCk7XG5cdFx0ZWxzZSB7XG5cdFx0XHR0aGlzLnggPSB0aGlzLm8ueDtcblx0XHRcdHRoaXMueSA9IHRoaXMuby55O1xuXHRcdFx0dGhpcy5zaGFrZW51bSA9IDA7XG5cdFx0XHR0aGlzLnNyYyA9IHRoaXMuc2hha2VzcmM7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmxvc2UgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm8ueCA9IHRoaXMueDtcblx0XHR0aGlzLm8ueSA9IHRoaXMueTtcblx0XHR0aGlzLnNoYWtlc3JjID0gXCJoZWFydC1lbXB0eS5wbmdcIjtcblx0XHR0aGlzLnNoYWtlKCk7XG5cdFx0dGhpcy5mdWxsID0gZmFsc2U7XG5cdH07XG5cdHRoaXMuZ2FpbiA9IGZ1bmN0aW9uKCl7XG5cdFx0dGhpcy5mdWxsID0gdHJ1ZTtcblx0XHR0aGlzLnNoYWtlc3JjID0gXCJoZWFydC5wbmdcIjtcblx0XHR0aGlzLnNoYWtlKCk7XG5cdH07XG5cdHRoaXMub25TcGF3biA9IGZ1bmN0aW9uKGkpe1xuXHRcdHRoaXMueCArPSAodGhpcy53aWR0aCArIDIpICogaTtcblx0fTtcbn07XG4iLCIvKipcbiAqIFNmeHJQYXJhbXNcbiAqXG4gKiBDb3B5cmlnaHQgMjAxMCBUaG9tYXMgVmlhblxuICpcbiAqIExpY2Vuc2VkIHVuZGVyIHRoZSBBcGFjaGUgTGljZW5zZSwgVmVyc2lvbiAyLjAgKHRoZSBcIkxpY2Vuc2VcIik7XG4gKiB5b3UgbWF5IG5vdCB1c2UgdGhpcyBmaWxlIGV4Y2VwdCBpbiBjb21wbGlhbmNlIHdpdGggdGhlIExpY2Vuc2UuXG4gKiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXRcbiAqXG4gKiAgIGh0dHA6Ly93d3cuYXBhY2hlLm9yZy9saWNlbnNlcy9MSUNFTlNFLTIuMFxuICpcbiAqIFVubGVzcyByZXF1aXJlZCBieSBhcHBsaWNhYmxlIGxhdyBvciBhZ3JlZWQgdG8gaW4gd3JpdGluZywgc29mdHdhcmVcbiAqIGRpc3RyaWJ1dGVkIHVuZGVyIHRoZSBMaWNlbnNlIGlzIGRpc3RyaWJ1dGVkIG9uIGFuIFwiQVMgSVNcIiBCQVNJUyxcbiAqIFdJVEhPVVQgV0FSUkFOVElFUyBPUiBDT05ESVRJT05TIE9GIEFOWSBLSU5ELCBlaXRoZXIgZXhwcmVzcyBvciBpbXBsaWVkLlxuICogU2VlIHRoZSBMaWNlbnNlIGZvciB0aGUgc3BlY2lmaWMgbGFuZ3VhZ2UgZ292ZXJuaW5nIHBlcm1pc3Npb25zIGFuZFxuICogbGltaXRhdGlvbnMgdW5kZXIgdGhlIExpY2Vuc2UuXG4gKlxuICogQGF1dGhvciBUaG9tYXMgVmlhblxuICovXG4vKiogQGNvbnN0cnVjdG9yICovXG5mdW5jdGlvbiBTZnhyUGFyYW1zKCkge1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTZXR0aW5ncyBTdHJpbmcgTWV0aG9kc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgLyoqXG4gICAqIFBhcnNlcyBhIHNldHRpbmdzIGFycmF5IGludG8gdGhlIHBhcmFtZXRlcnNcbiAgICogQHBhcmFtIGFycmF5IEFycmF5IG9mIHRoZSBzZXR0aW5ncyB2YWx1ZXMsIHdoZXJlIGVsZW1lbnRzIDAgLSAyMyBhcmVcbiAgICogICAgICAgICAgICAgICAgYTogd2F2ZVR5cGVcbiAgICogICAgICAgICAgICAgICAgYjogYXR0YWNrVGltZVxuICAgKiAgICAgICAgICAgICAgICBjOiBzdXN0YWluVGltZVxuICAgKiAgICAgICAgICAgICAgICBkOiBzdXN0YWluUHVuY2hcbiAgICogICAgICAgICAgICAgICAgZTogZGVjYXlUaW1lXG4gICAqICAgICAgICAgICAgICAgIGY6IHN0YXJ0RnJlcXVlbmN5XG4gICAqICAgICAgICAgICAgICAgIGc6IG1pbkZyZXF1ZW5jeVxuICAgKiAgICAgICAgICAgICAgICBoOiBzbGlkZVxuICAgKiAgICAgICAgICAgICAgICBpOiBkZWx0YVNsaWRlXG4gICAqICAgICAgICAgICAgICAgIGo6IHZpYnJhdG9EZXB0aFxuICAgKiAgICAgICAgICAgICAgICBrOiB2aWJyYXRvU3BlZWRcbiAgICogICAgICAgICAgICAgICAgbDogY2hhbmdlQW1vdW50XG4gICAqICAgICAgICAgICAgICAgIG06IGNoYW5nZVNwZWVkXG4gICAqICAgICAgICAgICAgICAgIG46IHNxdWFyZUR1dHlcbiAgICogICAgICAgICAgICAgICAgbzogZHV0eVN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHA6IHJlcGVhdFNwZWVkXG4gICAqICAgICAgICAgICAgICAgIHE6IHBoYXNlck9mZnNldFxuICAgKiAgICAgICAgICAgICAgICByOiBwaGFzZXJTd2VlcFxuICAgKiAgICAgICAgICAgICAgICBzOiBscEZpbHRlckN1dG9mZlxuICAgKiAgICAgICAgICAgICAgICB0OiBscEZpbHRlckN1dG9mZlN3ZWVwXG4gICAqICAgICAgICAgICAgICAgIHU6IGxwRmlsdGVyUmVzb25hbmNlXG4gICAqICAgICAgICAgICAgICAgIHY6IGhwRmlsdGVyQ3V0b2ZmXG4gICAqICAgICAgICAgICAgICAgIHc6IGhwRmlsdGVyQ3V0b2ZmU3dlZXBcbiAgICogICAgICAgICAgICAgICAgeDogbWFzdGVyVm9sdW1lXG4gICAqIEByZXR1cm4gSWYgdGhlIHN0cmluZyBzdWNjZXNzZnVsbHkgcGFyc2VkXG4gICAqL1xuICB0aGlzLnNldFNldHRpbmdzID0gZnVuY3Rpb24odmFsdWVzKVxuICB7XG4gICAgZm9yICggdmFyIGkgPSAwOyBpIDwgMjQ7IGkrKyApXG4gICAge1xuICAgICAgdGhpc1tTdHJpbmcuZnJvbUNoYXJDb2RlKCA5NyArIGkgKV0gPSB2YWx1ZXNbaV0gfHwgMDtcbiAgICB9XG5cbiAgICAvLyBJIG1vdmVkIHRoaXMgaGVyZSBmcm9tIHRoZSByZXNldCh0cnVlKSBmdW5jdGlvblxuICAgIGlmICh0aGlzWydjJ10gPCAuMDEpIHtcbiAgICAgIHRoaXNbJ2MnXSA9IC4wMTtcbiAgICB9XG5cbiAgICB2YXIgdG90YWxUaW1lID0gdGhpc1snYiddICsgdGhpc1snYyddICsgdGhpc1snZSddO1xuICAgIGlmICh0b3RhbFRpbWUgPCAuMTgpIHtcbiAgICAgIHZhciBtdWx0aXBsaWVyID0gLjE4IC8gdG90YWxUaW1lO1xuICAgICAgdGhpc1snYiddICAqPSBtdWx0aXBsaWVyO1xuICAgICAgdGhpc1snYyddICo9IG11bHRpcGxpZXI7XG4gICAgICB0aGlzWydlJ10gICAqPSBtdWx0aXBsaWVyO1xuICAgIH1cbiAgfVxufVxuXG4vKipcbiAqIFNmeHJTeW50aFxuICpcbiAqIENvcHlyaWdodCAyMDEwIFRob21hcyBWaWFuXG4gKlxuICogTGljZW5zZWQgdW5kZXIgdGhlIEFwYWNoZSBMaWNlbnNlLCBWZXJzaW9uIDIuMCAodGhlIFwiTGljZW5zZVwiKTtcbiAqIHlvdSBtYXkgbm90IHVzZSB0aGlzIGZpbGUgZXhjZXB0IGluIGNvbXBsaWFuY2Ugd2l0aCB0aGUgTGljZW5zZS5cbiAqIFlvdSBtYXkgb2J0YWluIGEgY29weSBvZiB0aGUgTGljZW5zZSBhdFxuICpcbiAqICAgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wXG4gKlxuICogVW5sZXNzIHJlcXVpcmVkIGJ5IGFwcGxpY2FibGUgbGF3IG9yIGFncmVlZCB0byBpbiB3cml0aW5nLCBzb2Z0d2FyZVxuICogZGlzdHJpYnV0ZWQgdW5kZXIgdGhlIExpY2Vuc2UgaXMgZGlzdHJpYnV0ZWQgb24gYW4gXCJBUyBJU1wiIEJBU0lTLFxuICogV0lUSE9VVCBXQVJSQU5USUVTIE9SIENPTkRJVElPTlMgT0YgQU5ZIEtJTkQsIGVpdGhlciBleHByZXNzIG9yIGltcGxpZWQuXG4gKiBTZWUgdGhlIExpY2Vuc2UgZm9yIHRoZSBzcGVjaWZpYyBsYW5ndWFnZSBnb3Zlcm5pbmcgcGVybWlzc2lvbnMgYW5kXG4gKiBsaW1pdGF0aW9ucyB1bmRlciB0aGUgTGljZW5zZS5cbiAqXG4gKiBAYXV0aG9yIFRob21hcyBWaWFuXG4gKi9cbi8qKiBAY29uc3RydWN0b3IgKi9cbmZ1bmN0aW9uIFNmeHJTeW50aCgpIHtcbiAgLy8gQWxsIHZhcmlhYmxlcyBhcmUga2VwdCBhbGl2ZSB0aHJvdWdoIGZ1bmN0aW9uIGNsb3N1cmVzXG5cbiAgLy8tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLVxuICAvL1xuICAvLyAgU291bmQgUGFyYW1ldGVyc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdGhpcy5fcGFyYW1zID0gbmV3IFNmeHJQYXJhbXMoKTsgIC8vIFBhcmFtcyBpbnN0YW5jZVxuXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cbiAgLy9cbiAgLy8gIFN5bnRoIFZhcmlhYmxlc1xuICAvL1xuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cbiAgdmFyIF9lbnZlbG9wZUxlbmd0aDAsIC8vIExlbmd0aCBvZiB0aGUgYXR0YWNrIHN0YWdlXG4gICAgICBfZW52ZWxvcGVMZW5ndGgxLCAvLyBMZW5ndGggb2YgdGhlIHN1c3RhaW4gc3RhZ2VcbiAgICAgIF9lbnZlbG9wZUxlbmd0aDIsIC8vIExlbmd0aCBvZiB0aGUgZGVjYXkgc3RhZ2VcblxuICAgICAgX3BlcmlvZCwgICAgICAgICAgLy8gUGVyaW9kIG9mIHRoZSB3YXZlXG4gICAgICBfbWF4UGVyaW9kLCAgICAgICAvLyBNYXhpbXVtIHBlcmlvZCBiZWZvcmUgc291bmQgc3RvcHMgKGZyb20gbWluRnJlcXVlbmN5KVxuXG4gICAgICBfc2xpZGUsICAgICAgICAgICAvLyBOb3RlIHNsaWRlXG4gICAgICBfZGVsdGFTbGlkZSwgICAgICAvLyBDaGFuZ2UgaW4gc2xpZGVcblxuICAgICAgX2NoYW5nZUFtb3VudCwgICAgLy8gQW1vdW50IHRvIGNoYW5nZSB0aGUgbm90ZSBieVxuICAgICAgX2NoYW5nZVRpbWUsICAgICAgLy8gQ291bnRlciBmb3IgdGhlIG5vdGUgY2hhbmdlXG4gICAgICBfY2hhbmdlTGltaXQsICAgICAvLyBPbmNlIHRoZSB0aW1lIHJlYWNoZXMgdGhpcyBsaW1pdCwgdGhlIG5vdGUgY2hhbmdlc1xuXG4gICAgICBfc3F1YXJlRHV0eSwgICAgICAvLyBPZmZzZXQgb2YgY2VudGVyIHN3aXRjaGluZyBwb2ludCBpbiB0aGUgc3F1YXJlIHdhdmVcbiAgICAgIF9kdXR5U3dlZXA7ICAgICAgIC8vIEFtb3VudCB0byBjaGFuZ2UgdGhlIGR1dHkgYnlcblxuICAvLy0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG4gIC8vXG4gIC8vICBTeW50aCBNZXRob2RzXG4gIC8vXG4gIC8vLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS1cblxuICAvKipcbiAgICogUmVzZXRzIHRoZSBydW5pbmcgdmFyaWFibGVzIGZyb20gdGhlIHBhcmFtc1xuICAgKiBVc2VkIG9uY2UgYXQgdGhlIHN0YXJ0ICh0b3RhbCByZXNldCkgYW5kIGZvciB0aGUgcmVwZWF0IGVmZmVjdCAocGFydGlhbCByZXNldClcbiAgICovXG4gIHRoaXMucmVzZXQgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBTaG9ydGVyIHJlZmVyZW5jZVxuICAgIHZhciBwID0gdGhpcy5fcGFyYW1zO1xuXG4gICAgX3BlcmlvZCAgICAgICA9IDEwMCAvIChwWydmJ10gKiBwWydmJ10gKyAuMDAxKTtcbiAgICBfbWF4UGVyaW9kICAgID0gMTAwIC8gKHBbJ2cnXSAgICogcFsnZyddICAgKyAuMDAxKTtcblxuICAgIF9zbGlkZSAgICAgICAgPSAxIC0gcFsnaCddICogcFsnaCddICogcFsnaCddICogLjAxO1xuICAgIF9kZWx0YVNsaWRlICAgPSAtcFsnaSddICogcFsnaSddICogcFsnaSddICogLjAwMDAwMTtcblxuICAgIGlmICghcFsnYSddKSB7XG4gICAgICBfc3F1YXJlRHV0eSA9IC41IC0gcFsnbiddIC8gMjtcbiAgICAgIF9kdXR5U3dlZXAgID0gLXBbJ28nXSAqIC4wMDAwNTtcbiAgICB9XG5cbiAgICBfY2hhbmdlQW1vdW50ID0gIDEgKyBwWydsJ10gKiBwWydsJ10gKiAocFsnbCddID4gMCA/IC0uOSA6IDEwKTtcbiAgICBfY2hhbmdlVGltZSAgID0gMDtcbiAgICBfY2hhbmdlTGltaXQgID0gcFsnbSddID09IDEgPyAwIDogKDEgLSBwWydtJ10pICogKDEgLSBwWydtJ10pICogMjAwMDAgKyAzMjtcbiAgfVxuXG4gIC8vIEkgc3BsaXQgdGhlIHJlc2V0KCkgZnVuY3Rpb24gaW50byB0d28gZnVuY3Rpb25zIGZvciBiZXR0ZXIgcmVhZGFiaWxpdHlcbiAgdGhpcy50b3RhbFJlc2V0ID0gZnVuY3Rpb24oKSB7XG4gICAgdGhpcy5yZXNldCgpO1xuXG4gICAgLy8gU2hvcnRlciByZWZlcmVuY2VcbiAgICB2YXIgcCA9IHRoaXMuX3BhcmFtcztcblxuICAgIC8vIENhbGN1bGF0aW5nIHRoZSBsZW5ndGggaXMgYWxsIHRoYXQgcmVtYWluZWQgaGVyZSwgZXZlcnl0aGluZyBlbHNlIG1vdmVkIHNvbWV3aGVyZVxuICAgIF9lbnZlbG9wZUxlbmd0aDAgPSBwWydiJ10gICogcFsnYiddICAqIDEwMDAwMDtcbiAgICBfZW52ZWxvcGVMZW5ndGgxID0gcFsnYyddICogcFsnYyddICogMTAwMDAwO1xuICAgIF9lbnZlbG9wZUxlbmd0aDIgPSBwWydlJ10gICAqIHBbJ2UnXSAgICogMTAwMDAwICsgMTI7XG4gICAgLy8gRnVsbCBsZW5ndGggb2YgdGhlIHZvbHVtZSBlbnZlbG9wIChhbmQgdGhlcmVmb3JlIHNvdW5kKVxuICAgIC8vIE1ha2Ugc3VyZSB0aGUgbGVuZ3RoIGNhbiBiZSBkaXZpZGVkIGJ5IDMgc28gd2Ugd2lsbCBub3QgbmVlZCB0aGUgcGFkZGluZyBcIj09XCIgYWZ0ZXIgYmFzZTY0IGVuY29kZVxuICAgIHJldHVybiAoKF9lbnZlbG9wZUxlbmd0aDAgKyBfZW52ZWxvcGVMZW5ndGgxICsgX2VudmVsb3BlTGVuZ3RoMikgLyAzIHwgMCkgKiAzO1xuICB9XG5cbiAgLyoqXG4gICAqIFdyaXRlcyB0aGUgd2F2ZSB0byB0aGUgc3VwcGxpZWQgYnVmZmVyIEJ5dGVBcnJheVxuICAgKiBAcGFyYW0gYnVmZmVyIEEgQnl0ZUFycmF5IHRvIHdyaXRlIHRoZSB3YXZlIHRvXG4gICAqIEByZXR1cm4gSWYgdGhlIHdhdmUgaXMgZmluaXNoZWRcbiAgICovXG4gIHRoaXMuc3ludGhXYXZlID0gZnVuY3Rpb24oYnVmZmVyLCBsZW5ndGgpIHtcbiAgICAvLyBTaG9ydGVyIHJlZmVyZW5jZVxuICAgIHZhciBwID0gdGhpcy5fcGFyYW1zO1xuXG4gICAgLy8gSWYgdGhlIGZpbHRlcnMgYXJlIGFjdGl2ZVxuICAgIHZhciBfZmlsdGVycyA9IHBbJ3MnXSAhPSAxIHx8IHBbJ3YnXSxcbiAgICAgICAgLy8gQ3V0b2ZmIG11bHRpcGxpZXIgd2hpY2ggYWRqdXN0cyB0aGUgYW1vdW50IHRoZSB3YXZlIHBvc2l0aW9uIGNhbiBtb3ZlXG4gICAgICAgIF9ocEZpbHRlckN1dG9mZiA9IHBbJ3YnXSAqIHBbJ3YnXSAqIC4xLFxuICAgICAgICAvLyBTcGVlZCBvZiB0aGUgaGlnaC1wYXNzIGN1dG9mZiBtdWx0aXBsaWVyXG4gICAgICAgIF9ocEZpbHRlckRlbHRhQ3V0b2ZmID0gMSArIHBbJ3cnXSAqIC4wMDAzLFxuICAgICAgICAvLyBDdXRvZmYgbXVsdGlwbGllciB3aGljaCBhZGp1c3RzIHRoZSBhbW91bnQgdGhlIHdhdmUgcG9zaXRpb24gY2FuIG1vdmVcbiAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmID0gcFsncyddICogcFsncyddICogcFsncyddICogLjEsXG4gICAgICAgIC8vIFNwZWVkIG9mIHRoZSBsb3ctcGFzcyBjdXRvZmYgbXVsdGlwbGllclxuICAgICAgICBfbHBGaWx0ZXJEZWx0YUN1dG9mZiA9IDEgKyBwWyd0J10gKiAuMDAwMSxcbiAgICAgICAgLy8gSWYgdGhlIGxvdyBwYXNzIGZpbHRlciBpcyBhY3RpdmVcbiAgICAgICAgX2xwRmlsdGVyT24gPSBwWydzJ10gIT0gMSxcbiAgICAgICAgLy8gbWFzdGVyVm9sdW1lICogbWFzdGVyVm9sdW1lIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfbWFzdGVyVm9sdW1lID0gcFsneCddICogcFsneCddLFxuICAgICAgICAvLyBNaW5pbXVtIGZyZXF1ZW5jeSBiZWZvcmUgc3RvcHBpbmdcbiAgICAgICAgX21pbkZyZXFlbmN5ID0gcFsnZyddLFxuICAgICAgICAvLyBJZiB0aGUgcGhhc2VyIGlzIGFjdGl2ZVxuICAgICAgICBfcGhhc2VyID0gcFsncSddIHx8IHBbJ3InXSxcbiAgICAgICAgLy8gQ2hhbmdlIGluIHBoYXNlIG9mZnNldFxuICAgICAgICBfcGhhc2VyRGVsdGFPZmZzZXQgPSBwWydyJ10gKiBwWydyJ10gKiBwWydyJ10gKiAuMixcbiAgICAgICAgLy8gUGhhc2Ugb2Zmc2V0IGZvciBwaGFzZXIgZWZmZWN0XG4gICAgICAgIF9waGFzZXJPZmZzZXQgPSBwWydxJ10gKiBwWydxJ10gKiAocFsncSddIDwgMCA/IC0xMDIwIDogMTAyMCksXG4gICAgICAgIC8vIE9uY2UgdGhlIHRpbWUgcmVhY2hlcyB0aGlzIGxpbWl0LCBzb21lIG9mIHRoZSAgICBpYWJsZXMgYXJlIHJlc2V0XG4gICAgICAgIF9yZXBlYXRMaW1pdCA9IHBbJ3AnXSA/ICgoMSAtIHBbJ3AnXSkgKiAoMSAtIHBbJ3AnXSkgKiAyMDAwMCB8IDApICsgMzIgOiAwLFxuICAgICAgICAvLyBUaGUgcHVuY2ggZmFjdG9yIChsb3VkZXIgYXQgYmVnaW5pbmcgb2Ygc3VzdGFpbilcbiAgICAgICAgX3N1c3RhaW5QdW5jaCA9IHBbJ2QnXSxcbiAgICAgICAgLy8gQW1vdW50IHRvIGNoYW5nZSB0aGUgcGVyaW9kIG9mIHRoZSB3YXZlIGJ5IGF0IHRoZSBwZWFrIG9mIHRoZSB2aWJyYXRvIHdhdmVcbiAgICAgICAgX3ZpYnJhdG9BbXBsaXR1ZGUgPSBwWydqJ10gLyAyLFxuICAgICAgICAvLyBTcGVlZCBhdCB3aGljaCB0aGUgdmlicmF0byBwaGFzZSBtb3Zlc1xuICAgICAgICBfdmlicmF0b1NwZWVkID0gcFsnayddICogcFsnayddICogLjAxLFxuICAgICAgICAvLyBUaGUgdHlwZSBvZiB3YXZlIHRvIGdlbmVyYXRlXG4gICAgICAgIF93YXZlVHlwZSA9IHBbJ2EnXTtcblxuICAgIHZhciBfZW52ZWxvcGVMZW5ndGggICAgICA9IF9lbnZlbG9wZUxlbmd0aDAsICAgICAvLyBMZW5ndGggb2YgdGhlIGN1cnJlbnQgZW52ZWxvcGUgc3RhZ2VcbiAgICAgICAgX2VudmVsb3BlT3Zlckxlbmd0aDAgPSAxIC8gX2VudmVsb3BlTGVuZ3RoMCwgLy8gKGZvciBxdWljayBjYWxjdWxhdGlvbnMpXG4gICAgICAgIF9lbnZlbG9wZU92ZXJMZW5ndGgxID0gMSAvIF9lbnZlbG9wZUxlbmd0aDEsIC8vIChmb3IgcXVpY2sgY2FsY3VsYXRpb25zKVxuICAgICAgICBfZW52ZWxvcGVPdmVyTGVuZ3RoMiA9IDEgLyBfZW52ZWxvcGVMZW5ndGgyOyAvLyAoZm9yIHF1aWNrIGNhbGN1bGF0aW9ucylcblxuICAgIC8vIERhbXBpbmcgbXVsaXBsaWVyIHdoaWNoIHJlc3RyaWN0cyBob3cgZmFzdCB0aGUgd2F2ZSBwb3NpdGlvbiBjYW4gbW92ZVxuICAgIHZhciBfbHBGaWx0ZXJEYW1waW5nID0gNSAvICgxICsgcFsndSddICogcFsndSddICogMjApICogKC4wMSArIF9scEZpbHRlckN1dG9mZik7XG4gICAgaWYgKF9scEZpbHRlckRhbXBpbmcgPiAuOCkge1xuICAgICAgX2xwRmlsdGVyRGFtcGluZyA9IC44O1xuICAgIH1cbiAgICBfbHBGaWx0ZXJEYW1waW5nID0gMSAtIF9scEZpbHRlckRhbXBpbmc7XG5cbiAgICB2YXIgX2ZpbmlzaGVkID0gZmFsc2UsICAgICAvLyBJZiB0aGUgc291bmQgaGFzIGZpbmlzaGVkXG4gICAgICAgIF9lbnZlbG9wZVN0YWdlICAgID0gMCwgLy8gQ3VycmVudCBzdGFnZSBvZiB0aGUgZW52ZWxvcGUgKGF0dGFjaywgc3VzdGFpbiwgZGVjYXksIGVuZClcbiAgICAgICAgX2VudmVsb3BlVGltZSAgICAgPSAwLCAvLyBDdXJyZW50IHRpbWUgdGhyb3VnaCBjdXJyZW50IGVuZWxvcGUgc3RhZ2VcbiAgICAgICAgX2VudmVsb3BlVm9sdW1lICAgPSAwLCAvLyBDdXJyZW50IHZvbHVtZSBvZiB0aGUgZW52ZWxvcGVcbiAgICAgICAgX2hwRmlsdGVyUG9zICAgICAgPSAwLCAvLyBBZGp1c3RlZCB3YXZlIHBvc2l0aW9uIGFmdGVyIGhpZ2gtcGFzcyBmaWx0ZXJcbiAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgPSAwLCAvLyBDaGFuZ2UgaW4gbG93LXBhc3Mgd2F2ZSBwb3NpdGlvbiwgYXMgYWxsb3dlZCBieSB0aGUgY3V0b2ZmIGFuZCBkYW1waW5nXG4gICAgICAgIF9scEZpbHRlck9sZFBvcywgICAgICAgLy8gUHJldmlvdXMgbG93LXBhc3Mgd2F2ZSBwb3NpdGlvblxuICAgICAgICBfbHBGaWx0ZXJQb3MgICAgICA9IDAsIC8vIEFkanVzdGVkIHdhdmUgcG9zaXRpb24gYWZ0ZXIgbG93LXBhc3MgZmlsdGVyXG4gICAgICAgIF9wZXJpb2RUZW1wLCAgICAgICAgICAgLy8gUGVyaW9kIG1vZGlmaWVkIGJ5IHZpYnJhdG9cbiAgICAgICAgX3BoYXNlICAgICAgICAgICAgPSAwLCAvLyBQaGFzZSB0aHJvdWdoIHRoZSB3YXZlXG4gICAgICAgIF9waGFzZXJJbnQsICAgICAgICAgICAgLy8gSW50ZWdlciBwaGFzZXIgb2Zmc2V0LCBmb3IgYml0IG1hdGhzXG4gICAgICAgIF9waGFzZXJQb3MgICAgICAgID0gMCwgLy8gUG9zaXRpb24gdGhyb3VnaCB0aGUgcGhhc2VyIGJ1ZmZlclxuICAgICAgICBfcG9zLCAgICAgICAgICAgICAgICAgIC8vIFBoYXNlIGV4cHJlc2VkIGFzIGEgTnVtYmVyIGZyb20gMC0xLCB1c2VkIGZvciBmYXN0IHNpbiBhcHByb3hcbiAgICAgICAgX3JlcGVhdFRpbWUgICAgICAgPSAwLCAvLyBDb3VudGVyIGZvciB0aGUgcmVwZWF0c1xuICAgICAgICBfc2FtcGxlLCAgICAgICAgICAgICAgIC8vIFN1Yi1zYW1wbGUgY2FsY3VsYXRlZCA4IHRpbWVzIHBlciBhY3R1YWwgc2FtcGxlLCBhdmVyYWdlZCBvdXQgdG8gZ2V0IHRoZSBzdXBlciBzYW1wbGVcbiAgICAgICAgX3N1cGVyU2FtcGxlLCAgICAgICAgICAvLyBBY3R1YWwgc2FtcGxlIHdyaXRlbiB0byB0aGUgd2F2ZVxuICAgICAgICBfdmlicmF0b1BoYXNlICAgICA9IDA7IC8vIFBoYXNlIHRocm91Z2ggdGhlIHZpYnJhdG8gc2luZSB3YXZlXG5cbiAgICAvLyBCdWZmZXIgb2Ygd2F2ZSB2YWx1ZXMgdXNlZCB0byBjcmVhdGUgdGhlIG91dCBvZiBwaGFzZSBzZWNvbmQgd2F2ZVxuICAgIHZhciBfcGhhc2VyQnVmZmVyID0gbmV3IEFycmF5KDEwMjQpLFxuICAgICAgICAvLyBCdWZmZXIgb2YgcmFuZG9tIHZhbHVlcyB1c2VkIHRvIGdlbmVyYXRlIG5vaXNlXG4gICAgICAgIF9ub2lzZUJ1ZmZlciAgPSBuZXcgQXJyYXkoMzIpO1xuICAgIGZvciAodmFyIGkgPSBfcGhhc2VyQnVmZmVyLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgIF9waGFzZXJCdWZmZXJbaV0gPSAwO1xuICAgIH1cbiAgICBmb3IgKHZhciBpID0gX25vaXNlQnVmZmVyLmxlbmd0aDsgaS0tOyApIHtcbiAgICAgIF9ub2lzZUJ1ZmZlcltpXSA9IE1hdGgucmFuZG9tKCkgKiAyIC0gMTtcbiAgICB9XG5cbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICBpZiAoX2ZpbmlzaGVkKSB7XG4gICAgICAgIHJldHVybiBpO1xuICAgICAgfVxuXG4gICAgICAvLyBSZXBlYXRzIGV2ZXJ5IF9yZXBlYXRMaW1pdCB0aW1lcywgcGFydGlhbGx5IHJlc2V0dGluZyB0aGUgc291bmQgcGFyYW1ldGVyc1xuICAgICAgaWYgKF9yZXBlYXRMaW1pdCkge1xuICAgICAgICBpZiAoKytfcmVwZWF0VGltZSA+PSBfcmVwZWF0TGltaXQpIHtcbiAgICAgICAgICBfcmVwZWF0VGltZSA9IDA7XG4gICAgICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIElmIF9jaGFuZ2VMaW1pdCBpcyByZWFjaGVkLCBzaGlmdHMgdGhlIHBpdGNoXG4gICAgICBpZiAoX2NoYW5nZUxpbWl0KSB7XG4gICAgICAgIGlmICgrK19jaGFuZ2VUaW1lID49IF9jaGFuZ2VMaW1pdCkge1xuICAgICAgICAgIF9jaGFuZ2VMaW1pdCA9IDA7XG4gICAgICAgICAgX3BlcmlvZCAqPSBfY2hhbmdlQW1vdW50O1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIEFjY2NlbGVyYXRlIGFuZCBhcHBseSBzbGlkZVxuICAgICAgX3NsaWRlICs9IF9kZWx0YVNsaWRlO1xuICAgICAgX3BlcmlvZCAqPSBfc2xpZGU7XG5cbiAgICAgIC8vIENoZWNrcyBmb3IgZnJlcXVlbmN5IGdldHRpbmcgdG9vIGxvdywgYW5kIHN0b3BzIHRoZSBzb3VuZCBpZiBhIG1pbkZyZXF1ZW5jeSB3YXMgc2V0XG4gICAgICBpZiAoX3BlcmlvZCA+IF9tYXhQZXJpb2QpIHtcbiAgICAgICAgX3BlcmlvZCA9IF9tYXhQZXJpb2Q7XG4gICAgICAgIGlmIChfbWluRnJlcWVuY3kgPiAwKSB7XG4gICAgICAgICAgX2ZpbmlzaGVkID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBfcGVyaW9kVGVtcCA9IF9wZXJpb2Q7XG5cbiAgICAgIC8vIEFwcGxpZXMgdGhlIHZpYnJhdG8gZWZmZWN0XG4gICAgICBpZiAoX3ZpYnJhdG9BbXBsaXR1ZGUgPiAwKSB7XG4gICAgICAgIF92aWJyYXRvUGhhc2UgKz0gX3ZpYnJhdG9TcGVlZDtcbiAgICAgICAgX3BlcmlvZFRlbXAgKj0gMSArIE1hdGguc2luKF92aWJyYXRvUGhhc2UpICogX3ZpYnJhdG9BbXBsaXR1ZGU7XG4gICAgICB9XG5cbiAgICAgIF9wZXJpb2RUZW1wIHw9IDA7XG4gICAgICBpZiAoX3BlcmlvZFRlbXAgPCA4KSB7XG4gICAgICAgIF9wZXJpb2RUZW1wID0gODtcbiAgICAgIH1cblxuICAgICAgLy8gU3dlZXBzIHRoZSBzcXVhcmUgZHV0eVxuICAgICAgaWYgKCFfd2F2ZVR5cGUpIHtcbiAgICAgICAgX3NxdWFyZUR1dHkgKz0gX2R1dHlTd2VlcDtcbiAgICAgICAgaWYgKF9zcXVhcmVEdXR5IDwgMCkge1xuICAgICAgICAgIF9zcXVhcmVEdXR5ID0gMDtcbiAgICAgICAgfSBlbHNlIGlmIChfc3F1YXJlRHV0eSA+IC41KSB7XG4gICAgICAgICAgX3NxdWFyZUR1dHkgPSAuNTtcbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICAvLyBNb3ZlcyB0aHJvdWdoIHRoZSBkaWZmZXJlbnQgc3RhZ2VzIG9mIHRoZSB2b2x1bWUgZW52ZWxvcGVcbiAgICAgIGlmICgrK19lbnZlbG9wZVRpbWUgPiBfZW52ZWxvcGVMZW5ndGgpIHtcbiAgICAgICAgX2VudmVsb3BlVGltZSA9IDA7XG5cbiAgICAgICAgc3dpdGNoICgrK19lbnZlbG9wZVN0YWdlKSAge1xuICAgICAgICAgIGNhc2UgMTpcbiAgICAgICAgICAgIF9lbnZlbG9wZUxlbmd0aCA9IF9lbnZlbG9wZUxlbmd0aDE7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDI6XG4gICAgICAgICAgICBfZW52ZWxvcGVMZW5ndGggPSBfZW52ZWxvcGVMZW5ndGgyO1xuICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIC8vIFNldHMgdGhlIHZvbHVtZSBiYXNlZCBvbiB0aGUgcG9zaXRpb24gaW4gdGhlIGVudmVsb3BlXG4gICAgICBzd2l0Y2ggKF9lbnZlbG9wZVN0YWdlKSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSBfZW52ZWxvcGVUaW1lICogX2VudmVsb3BlT3Zlckxlbmd0aDA7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMTpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSAxICsgKDEgLSBfZW52ZWxvcGVUaW1lICogX2VudmVsb3BlT3Zlckxlbmd0aDEpICogMiAqIF9zdXN0YWluUHVuY2g7XG4gICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICBfZW52ZWxvcGVWb2x1bWUgPSAxIC0gX2VudmVsb3BlVGltZSAqIF9lbnZlbG9wZU92ZXJMZW5ndGgyO1xuICAgICAgICAgIGJyZWFrO1xuICAgICAgICBjYXNlIDM6XG4gICAgICAgICAgX2VudmVsb3BlVm9sdW1lID0gMDtcbiAgICAgICAgICBfZmluaXNoZWQgPSB0cnVlO1xuICAgICAgfVxuXG4gICAgICAvLyBNb3ZlcyB0aGUgcGhhc2VyIG9mZnNldFxuICAgICAgaWYgKF9waGFzZXIpIHtcbiAgICAgICAgX3BoYXNlck9mZnNldCArPSBfcGhhc2VyRGVsdGFPZmZzZXQ7XG4gICAgICAgIF9waGFzZXJJbnQgPSBfcGhhc2VyT2Zmc2V0IHwgMDtcbiAgICAgICAgaWYgKF9waGFzZXJJbnQgPCAwKSB7XG4gICAgICAgICAgX3BoYXNlckludCA9IC1fcGhhc2VySW50O1xuICAgICAgICB9IGVsc2UgaWYgKF9waGFzZXJJbnQgPiAxMDIzKSB7XG4gICAgICAgICAgX3BoYXNlckludCA9IDEwMjM7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gTW92ZXMgdGhlIGhpZ2gtcGFzcyBmaWx0ZXIgY3V0b2ZmXG4gICAgICBpZiAoX2ZpbHRlcnMgJiYgX2hwRmlsdGVyRGVsdGFDdXRvZmYpIHtcbiAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmICo9IF9ocEZpbHRlckRlbHRhQ3V0b2ZmO1xuICAgICAgICBpZiAoX2hwRmlsdGVyQ3V0b2ZmIDwgLjAwMDAxKSB7XG4gICAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmID0gLjAwMDAxO1xuICAgICAgICB9IGVsc2UgaWYgKF9ocEZpbHRlckN1dG9mZiA+IC4xKSB7XG4gICAgICAgICAgX2hwRmlsdGVyQ3V0b2ZmID0gLjE7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgX3N1cGVyU2FtcGxlID0gMDtcbiAgICAgIGZvciAodmFyIGogPSA4OyBqLS07ICkge1xuICAgICAgICAvLyBDeWNsZXMgdGhyb3VnaCB0aGUgcGVyaW9kXG4gICAgICAgIF9waGFzZSsrO1xuICAgICAgICBpZiAoX3BoYXNlID49IF9wZXJpb2RUZW1wKSB7XG4gICAgICAgICAgX3BoYXNlICU9IF9wZXJpb2RUZW1wO1xuXG4gICAgICAgICAgLy8gR2VuZXJhdGVzIG5ldyByYW5kb20gbm9pc2UgZm9yIHRoaXMgcGVyaW9kXG4gICAgICAgICAgaWYgKF93YXZlVHlwZSA9PSAzKSB7XG4gICAgICAgICAgICBmb3IgKHZhciBuID0gX25vaXNlQnVmZmVyLmxlbmd0aDsgbi0tOyApIHtcbiAgICAgICAgICAgICAgX25vaXNlQnVmZmVyW25dID0gTWF0aC5yYW5kb20oKSAqIDIgLSAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEdldHMgdGhlIHNhbXBsZSBmcm9tIHRoZSBvc2NpbGxhdG9yXG4gICAgICAgIHN3aXRjaCAoX3dhdmVUeXBlKSB7XG4gICAgICAgICAgY2FzZSAwOiAvLyBTcXVhcmUgd2F2ZVxuICAgICAgICAgICAgX3NhbXBsZSA9ICgoX3BoYXNlIC8gX3BlcmlvZFRlbXApIDwgX3NxdWFyZUR1dHkpID8gLjUgOiAtLjU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDE6IC8vIFNhdyB3YXZlXG4gICAgICAgICAgICBfc2FtcGxlID0gMSAtIF9waGFzZSAvIF9wZXJpb2RUZW1wICogMjtcbiAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgIGNhc2UgMjogLy8gU2luZSB3YXZlIChmYXN0IGFuZCBhY2N1cmF0ZSBhcHByb3gpXG4gICAgICAgICAgICBfcG9zID0gX3BoYXNlIC8gX3BlcmlvZFRlbXA7XG4gICAgICAgICAgICBfcG9zID0gKF9wb3MgPiAuNSA/IF9wb3MgLSAxIDogX3BvcykgKiA2LjI4MzE4NTMxO1xuICAgICAgICAgICAgX3NhbXBsZSA9IDEuMjczMjM5NTQgKiBfcG9zICsgLjQwNTI4NDczNSAqIF9wb3MgKiBfcG9zICogKF9wb3MgPCAwID8gMSA6IC0xKTtcbiAgICAgICAgICAgIF9zYW1wbGUgPSAuMjI1ICogKChfc2FtcGxlIDwgMCA/IC0xIDogMSkgKiBfc2FtcGxlICogX3NhbXBsZSAgLSBfc2FtcGxlKSArIF9zYW1wbGU7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgICBjYXNlIDM6IC8vIE5vaXNlXG4gICAgICAgICAgICBfc2FtcGxlID0gX25vaXNlQnVmZmVyW01hdGguYWJzKF9waGFzZSAqIDMyIC8gX3BlcmlvZFRlbXAgfCAwKV07XG4gICAgICAgIH1cblxuICAgICAgICAvLyBBcHBsaWVzIHRoZSBsb3cgYW5kIGhpZ2ggcGFzcyBmaWx0ZXJzXG4gICAgICAgIGlmIChfZmlsdGVycykge1xuICAgICAgICAgIF9scEZpbHRlck9sZFBvcyA9IF9scEZpbHRlclBvcztcbiAgICAgICAgICBfbHBGaWx0ZXJDdXRvZmYgKj0gX2xwRmlsdGVyRGVsdGFDdXRvZmY7XG4gICAgICAgICAgaWYgKF9scEZpbHRlckN1dG9mZiA8IDApIHtcbiAgICAgICAgICAgIF9scEZpbHRlckN1dG9mZiA9IDA7XG4gICAgICAgICAgfSBlbHNlIGlmIChfbHBGaWx0ZXJDdXRvZmYgPiAuMSkge1xuICAgICAgICAgICAgX2xwRmlsdGVyQ3V0b2ZmID0gLjE7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKF9scEZpbHRlck9uKSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJEZWx0YVBvcyArPSAoX3NhbXBsZSAtIF9scEZpbHRlclBvcykgKiBfbHBGaWx0ZXJDdXRvZmY7XG4gICAgICAgICAgICBfbHBGaWx0ZXJEZWx0YVBvcyAqPSBfbHBGaWx0ZXJEYW1waW5nO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBfbHBGaWx0ZXJQb3MgPSBfc2FtcGxlO1xuICAgICAgICAgICAgX2xwRmlsdGVyRGVsdGFQb3MgPSAwO1xuICAgICAgICAgIH1cblxuICAgICAgICAgIF9scEZpbHRlclBvcyArPSBfbHBGaWx0ZXJEZWx0YVBvcztcblxuICAgICAgICAgIF9ocEZpbHRlclBvcyArPSBfbHBGaWx0ZXJQb3MgLSBfbHBGaWx0ZXJPbGRQb3M7XG4gICAgICAgICAgX2hwRmlsdGVyUG9zICo9IDEgLSBfaHBGaWx0ZXJDdXRvZmY7XG4gICAgICAgICAgX3NhbXBsZSA9IF9ocEZpbHRlclBvcztcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIEFwcGxpZXMgdGhlIHBoYXNlciBlZmZlY3RcbiAgICAgICAgaWYgKF9waGFzZXIpIHtcbiAgICAgICAgICBfcGhhc2VyQnVmZmVyW19waGFzZXJQb3MgJSAxMDI0XSA9IF9zYW1wbGU7XG4gICAgICAgICAgX3NhbXBsZSArPSBfcGhhc2VyQnVmZmVyWyhfcGhhc2VyUG9zIC0gX3BoYXNlckludCArIDEwMjQpICUgMTAyNF07XG4gICAgICAgICAgX3BoYXNlclBvcysrO1xuICAgICAgICB9XG5cbiAgICAgICAgX3N1cGVyU2FtcGxlICs9IF9zYW1wbGU7XG4gICAgICB9XG5cbiAgICAgIC8vIEF2ZXJhZ2VzIG91dCB0aGUgc3VwZXIgc2FtcGxlcyBhbmQgYXBwbGllcyB2b2x1bWVzXG4gICAgICBfc3VwZXJTYW1wbGUgKj0gLjEyNSAqIF9lbnZlbG9wZVZvbHVtZSAqIF9tYXN0ZXJWb2x1bWU7XG5cbiAgICAgIC8vIENsaXBwaW5nIGlmIHRvbyBsb3VkXG4gICAgICBidWZmZXJbaV0gPSBfc3VwZXJTYW1wbGUgPj0gMSA/IDMyNzY3IDogX3N1cGVyU2FtcGxlIDw9IC0xID8gLTMyNzY4IDogX3N1cGVyU2FtcGxlICogMzI3NjcgfCAwO1xuICAgIH1cblxuICAgIHJldHVybiBsZW5ndGg7XG4gIH1cbn1cblxuLy8gQWRhcHRlZCBmcm9tIGh0dHA6Ly9jb2RlYmFzZS5lcy9yaWZmd2F2ZS9cbnZhciBzeW50aCA9IG5ldyBTZnhyU3ludGgoKTtcbi8vIEV4cG9ydCBmb3IgdGhlIENsb3N1cmUgQ29tcGlsZXJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc2V0dGluZ3MpIHtcbiAgLy8gSW5pdGlhbGl6ZSBTZnhyUGFyYW1zXG4gIHN5bnRoLl9wYXJhbXMuc2V0U2V0dGluZ3Moc2V0dGluZ3MpO1xuICAvLyBTeW50aGVzaXplIFdhdmVcbiAgdmFyIGVudmVsb3BlRnVsbExlbmd0aCA9IHN5bnRoLnRvdGFsUmVzZXQoKTtcbiAgdmFyIGRhdGEgPSBuZXcgVWludDhBcnJheSgoKGVudmVsb3BlRnVsbExlbmd0aCArIDEpIC8gMiB8IDApICogNCArIDQ0KTtcbiAgdmFyIHVzZWQgPSBzeW50aC5zeW50aFdhdmUobmV3IFVpbnQxNkFycmF5KGRhdGEuYnVmZmVyLCA0NCksIGVudmVsb3BlRnVsbExlbmd0aCkgKiAyO1xuICB2YXIgZHYgPSBuZXcgVWludDMyQXJyYXkoZGF0YS5idWZmZXIsIDAsIDQ0KTtcbiAgLy8gSW5pdGlhbGl6ZSBoZWFkZXJcbiAgZHZbMF0gPSAweDQ2NDY0OTUyOyAvLyBcIlJJRkZcIlxuICBkdlsxXSA9IHVzZWQgKyAzNjsgIC8vIHB1dCB0b3RhbCBzaXplIGhlcmVcbiAgZHZbMl0gPSAweDQ1NTY0MTU3OyAvLyBcIldBVkVcIlxuICBkdlszXSA9IDB4MjA3NDZENjY7IC8vIFwiZm10IFwiXG4gIGR2WzRdID0gMHgwMDAwMDAxMDsgLy8gc2l6ZSBvZiB0aGUgZm9sbG93aW5nXG4gIGR2WzVdID0gMHgwMDAxMDAwMTsgLy8gTW9ubzogMSBjaGFubmVsLCBQQ00gZm9ybWF0XG4gIGR2WzZdID0gMHgwMDAwQUM0NDsgLy8gNDQsMTAwIHNhbXBsZXMgcGVyIHNlY29uZFxuICBkdls3XSA9IDB4MDAwMTU4ODg7IC8vIGJ5dGUgcmF0ZTogdHdvIGJ5dGVzIHBlciBzYW1wbGVcbiAgZHZbOF0gPSAweDAwMTAwMDAyOyAvLyAxNiBiaXRzIHBlciBzYW1wbGUsIGFsaWduZWQgb24gZXZlcnkgdHdvIGJ5dGVzXG4gIGR2WzldID0gMHg2MTc0NjE2NDsgLy8gXCJkYXRhXCJcbiAgZHZbMTBdID0gdXNlZDsgICAgICAvLyBwdXQgbnVtYmVyIG9mIHNhbXBsZXMgaGVyZVxuXG4gIC8vIEJhc2U2NCBlbmNvZGluZyB3cml0dGVuIGJ5IG1lLCBAbWFldHRpZ1xuICB1c2VkICs9IDQ0O1xuICB2YXIgaSA9IDAsXG4gICAgICBiYXNlNjRDaGFyYWN0ZXJzID0gJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXowMTIzNDU2Nzg5Ky8nLFxuICAgICAgb3V0cHV0ID0gJ2RhdGE6YXVkaW8vd2F2O2Jhc2U2NCwnO1xuICBmb3IgKDsgaSA8IHVzZWQ7IGkgKz0gMylcbiAge1xuICAgIHZhciBhID0gZGF0YVtpXSA8PCAxNiB8IGRhdGFbaSArIDFdIDw8IDggfCBkYXRhW2kgKyAyXTtcbiAgICBvdXRwdXQgKz0gYmFzZTY0Q2hhcmFjdGVyc1thID4+IDE4XSArIGJhc2U2NENoYXJhY3RlcnNbYSA+PiAxMiAmIDYzXSArIGJhc2U2NENoYXJhY3RlcnNbYSA+PiA2ICYgNjNdICsgYmFzZTY0Q2hhcmFjdGVyc1thICYgNjNdO1xuICB9XG4gIHJldHVybiBvdXRwdXQ7XG59XG4iLCJ2YXIgY3VydmUgPSByZXF1aXJlKFwiLi9jdXJ2ZVwiKTtcbnZhciByYW5kb20gPSByZXF1aXJlKFwiLi9yYW5kXCIpO1xudmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG5cdHRoaXMud2lkdGggPSAxMjtcblx0dGhpcy5oZWlnaHQgPSAxNztcblx0dGhpcy5vcGFjaXR5ID0gMTtcblx0dGhpcy54ID0gLTE1O1xuXHR0aGlzLnkgPSAzNCAtIHRoaXMuaGVpZ2h0O1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcIm1hcmlvXCI7XG5cdHRoaXMuc3JjID0gXCJtYXJpby5wbmdcIjtcblx0dGhpcy5yZW1vdmUgPSBmYWxzZTtcblx0dGhpcy5raWxsZWQgPSBmYWxzZTtcblx0dGhpcy5mYWRpbmcgPSBmYWxzZTtcblx0dGhpcy5yZWFjaGVkID0gZmFsc2U7XG5cdHRoaXMuZGVzdHBpcGUgPSAwO1xuXHR0aGlzLnBhdGggPSB7XG5cdFx0eDogWy0xNSwgMTcsIDMwXSxcblx0XHR5OiBbMzQgLSB0aGlzLmhlaWdodCwgMzQgLSB0aGlzLmhlaWdodCwgMTBdLFxuXHRcdGs6IFtydWxlcy5rLCBydWxlcy5rLCBydWxlcy5rXVxuXHR9O1xuXHR0aGlzLmdlbmVyYXRlQ3VydmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRlc3RwaXBlID0gcmFuZG9tLnJlcG51bWJlcihydWxlcy5waXBlcy5sZW5ndGgsIDApO1xuXHRcdHZhciBrID0gcnVsZXMuaztcblx0XHR0aGlzLnBhdGguayA9IHRoaXMucGF0aC5rLmNvbmNhdChbaywgaywga10pO1xuXHRcdHZhciBkZXN0eCA9IHJ1bGVzLnBpcGVzW3RoaXMuZGVzdHBpcGVdICsgMTU7XG5cdFx0dmFyIHRocmVzID0gZGVzdHggLSAocmFuZG9tLm51bWJlcigyMCkgKyAyMCk7XG5cblx0XHQvL2NsaW1heFxuXHRcdHRoaXMucGF0aC55LnB1c2goMyk7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcyAvIDIpO1xuXG5cdFx0Ly9idWZmZXIgYXBwcm9hY2hcblx0XHR0aGlzLnBhdGgueS5wdXNoKHJ1bGVzLndhdGVyIC8gMik7XG5cdFx0dGhpcy5wYXRoLngucHVzaCh0aHJlcyk7XG5cblx0XHQvL2Rlc3RpbmF0aW9uXG5cdFx0dGhpcy5wYXRoLnkucHVzaChydWxlcy53YXRlcik7XG5cdFx0dGhpcy5wYXRoLngucHVzaChkZXN0eCk7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmICh0aGlzLnggPiB0aGlzLnBhdGgueFsxXSkgdGhpcy55ID0gY3VydmUodGhpcy54LCB0aGlzLnBhdGgpOyAvLyBjdXJ2ZSBpZiBub3Qgb24gZGVja1xuXHRcdGlmICh0aGlzLnggPT0gdGhpcy5wYXRoLnhbMV0gKyAxMCkgYXVkaW8ucGxheShcImp1bXBcIik7XG5cdFx0dGhpcy54Kys7XG5cdFx0aWYgKHRoaXMueSA8IHJ1bGVzLndhdGVyKSBzZXRUaW1lb3V0KHRoaXMudGljay5iaW5kKHRoaXMpLCAxMCk7XG5cdFx0ZWxzZSBpZiAoIXRoaXMucmVhY2hlZCkge1xuXHRcdFx0dGhpcy5mYWRpbmcgPSB0cnVlO1xuXHRcdFx0YXVkaW8ucGxheShcIndhdGVyXCIpO1xuXHRcdFx0dGhpcy5mYWRlT3V0KCk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmZhZGVPdXQgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLm9wYWNpdHkgLT0gMC4xO1xuXHRcdGlmICh0aGlzLm9wYWNpdHkgPiAwLjEpIHNldFRpbWVvdXQodGhpcy5mYWRlT3V0LmJpbmQodGhpcyksIDUwKTtcblx0XHRlbHNlIHRoaXMucmVtb3ZlID0gdHJ1ZTtcblx0fTtcblx0dGhpcy5iZWdpbiA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuZ2VuZXJhdGVDdXJ2ZSgpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLm9uU3Bhd24gPSBmdW5jdGlvbigpIHtcblx0XHRpZihyYW5kb20ucmVwbnVtYmVyKHJ1bGVzLmhlYXJ0c3Bhd24sIDEpID09IDEpIHtcblx0XHRcdHRoaXMubmFtZSA9IFwiaGVhcnRwXCI7XG5cdFx0XHR0aGlzLnNyYyA9IFwiaGVhcnRwLnBuZ1wiO1xuXHRcdFx0dGhpcy53aWR0aCA9IDEwO1xuXHRcdFx0dGhpcy5oZWlnaHQgPSA5O1xuXHRcdH1cblx0XHR0aGlzLmJlZ2luKCk7XG5cdH07XG59O1xuIiwidmFyIHJ1bGVzID0gcmVxdWlyZShcIi4vcnVsZXNcIik7XG52YXIgYXVkaW8gPSByZXF1aXJlKFwiLi9hdWRpb1wiKTtcbnZhciBjYW52YXMgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImNcIik7XG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuXHR0aGlzLnggPSAwO1xuXHR0aGlzLnkgPSAwO1xuXHR0aGlzLnR5cGUgPSBcImltZ1wiO1xuXHR0aGlzLm5hbWUgPSBcInBpcGVcIjtcblx0dGhpcy5zcmMgPSBcInBpcGUucG5nXCI7XG5cdHRoaXMud2lkdGggPSAzMDtcblx0dGhpcy5oZWlnaHQgPSA3MDtcblx0dGhpcy5waXBlbiA9IDA7XG5cdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdHRoaXMuYW5pbWF0aW5nID0gZmFsc2U7XG5cdHRoaXMuZG93biA9IGZhbHNlO1xuXHR0aGlzLmFuaW1hdGUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmFuaW1hdGluZyA9IHRydWU7XG5cdFx0dGhpcy5hY3RpdmUgPSB0cnVlO1xuXHRcdGF1ZGlvLnBsYXkoXCJwaXBlXCIpO1xuXHRcdHRoaXMudGljaygpO1xuXHR9O1xuXHR0aGlzLmFuaW1hdGlvbkRvbmUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmRvd24gPSBmYWxzZTtcblx0XHR0aGlzLmFuaW1hdGluZyA9IGZhbHNlO1xuXHRcdHRoaXMuYWN0aXZlID0gZmFsc2U7XG5cdH07XG5cdHRoaXMudGljayA9IGZ1bmN0aW9uKCkge1xuXHRcdHZhciB2O1xuXHRcdGlmICghdGhpcy5kb3duKSB0aGlzLnktLTtcblx0XHRlbHNlIHRoaXMueSsrO1xuXHRcdGlmICh0aGlzLnkgPT0gODApIHRoaXMuZG93biA9IHRydWU7XG5cdFx0aWYgKHRoaXMueSA8IDEzMCkgc2V0VGltZW91dCh0aGlzLnRpY2suYmluZCh0aGlzKSwgcnVsZXMucGlwZWR1ciAvIDUwKTtcblx0XHRlbHNlIGlmICh0aGlzLnkgPT0gMTMwKSB0aGlzLmFuaW1hdGlvbkRvbmUoKTtcblx0fTtcblx0dGhpcy5yaXNlID0gZnVuY3Rpb24oKXtcblx0XHR0aGlzLnktLTtcblx0XHRpZih0aGlzLnkgPiAxMzApIHNldFRpbWVvdXQodGhpcy5yaXNlLmJpbmQodGhpcyksIHJ1bGVzLmJlZ2luRGVsYXkgLyAxMDApO1xuXHRcdGVsc2UgdGhpcy5pbml0RXZlbnQoKTtcblx0fTtcblx0dGhpcy5vblNwYXduID0gZnVuY3Rpb24obikge1xuXHRcdHRoaXMueCA9IHJ1bGVzLnBpcGVzW25dO1xuXHRcdHRoaXMueSA9IHJ1bGVzLmJvdHRvbS0xMjA7XG5cdFx0dGhpcy5waXBlbiA9IG47XG5cdFx0dGhpcy5yaXNlKCk7XG5cdH07XG5cdHRoaXMua2V5ID0gZnVuY3Rpb24oZSkge1xuXHRcdGlmICghdGhpcy5hbmltYXRpbmcpIHtcblx0XHRcdGlmIChlLndoaWNoID09IHJ1bGVzLmNvbnRyb2xzW3RoaXMucGlwZW5dKSB7XG5cdFx0XHRcdHRoaXMuYW5pbWF0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0dGhpcy50b3VjaCA9IGZ1bmN0aW9uKGUpIHtcblx0XHR2YXIgeCA9IChlLnggLSBjYW52YXMub2Zmc2V0TGVmdCkgLyBydWxlcy5zY2FsZTtcblx0XHR2YXIgeSA9IChlLnkgLSBjYW52YXMub2Zmc2V0VG9wKSAvIHJ1bGVzLnNjYWxlO1xuXHRcdGlmICghdGhpcy5hbmltYXRpbmcpIHtcblx0XHRcdGlmICh4ID49IHRoaXMueCAmJiB4IDw9IHRoaXMueCArIDMwKSB7XG5cdFx0XHRcdHRoaXMuYW5pbWF0ZSgpO1xuXHRcdFx0fVxuXHRcdH1cblx0fTtcblx0dGhpcy5pbml0RXZlbnQgPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgdCA9IHRoaXM7XG5cdFx0d2luZG93LmFkZEV2ZW50TGlzdGVuZXIoXCJrZXlkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHQua2V5KGUpO1xuXHRcdH0pO1xuXHRcdGNhbnZhcy5hZGRFdmVudExpc3RlbmVyKFwibW91c2Vkb3duXCIsIGZ1bmN0aW9uKGUpIHtcblx0XHRcdHQudG91Y2goZSk7XG5cdFx0fSwgZmFsc2UpO1xuXHR9O1xufTtcbiIsIi8vIEhvbGRzIGxhc3QgaXRlcmF0aW9uIHRpbWVzdGFtcC5cbnZhciB0aW1lID0gMDtcblxuLyoqXG4gKiBDYWxscyBgZm5gIG9uIG5leHQgZnJhbWUuXG4gKlxuICogQHBhcmFtICB7RnVuY3Rpb259IGZuIFRoZSBmdW5jdGlvblxuICogQHJldHVybiB7aW50fSBUaGUgcmVxdWVzdCBJRFxuICogQGFwaSBwcml2YXRlXG4gKi9cbmZ1bmN0aW9uIHJhZihmbikge1xuICByZXR1cm4gd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbigpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICB2YXIgZWxhcHNlZCA9IG5vdyAtIHRpbWU7XG5cbiAgICBpZiAoZWxhcHNlZCA+IDk5OSkge1xuICAgICAgZWxhcHNlZCA9IDEgLyA2MDtcbiAgICB9IGVsc2Uge1xuICAgICAgZWxhcHNlZCAvPSAxMDAwO1xuICAgIH1cblxuICAgIHRpbWUgPSBub3c7XG4gICAgZm4oZWxhcHNlZCk7XG4gIH0pO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgLyoqXG4gICAqIENhbGxzIGBmbmAgb24gZXZlcnkgZnJhbWUgd2l0aCBgZWxhcHNlZGAgc2V0IHRvIHRoZSBlbGFwc2VkXG4gICAqIHRpbWUgaW4gbWlsbGlzZWNvbmRzLlxuICAgKlxuICAgKiBAcGFyYW0gIHtGdW5jdGlvbn0gZm4gVGhlIGZ1bmN0aW9uXG4gICAqIEByZXR1cm4ge2ludH0gVGhlIHJlcXVlc3QgSURcbiAgICogQGFwaSBwdWJsaWNcbiAgICovXG4gIHN0YXJ0OiBmdW5jdGlvbihmbikge1xuICAgIHJldHVybiByYWYoZnVuY3Rpb24gdGljayhlbGFwc2VkKSB7XG4gICAgICBmbihlbGFwc2VkKTtcbiAgICAgIHJhZih0aWNrKTtcbiAgICB9KTtcbiAgfSxcbiAgLyoqXG4gICAqIENhbmNlbHMgdGhlIHNwZWNpZmllZCBhbmltYXRpb24gZnJhbWUgcmVxdWVzdC5cbiAgICpcbiAgICogQHBhcmFtIHtpbnR9IGlkIFRoZSByZXF1ZXN0IElEXG4gICAqIEBhcGkgcHVibGljXG4gICAqL1xuICBzdG9wOiBmdW5jdGlvbihpZCkge1xuICAgIHdpbmRvdy5jYW5jZWxBbmltYXRpb25GcmFtZShpZCk7XG4gIH1cbn07XG4iLCJ2YXIgcHJldiA9IFtdO1xubW9kdWxlLmV4cG9ydHMgPSB7XG5cdG51bWJlcjogZnVuY3Rpb24obWF4KSB7IC8vcmV0dXJucyBiZXR3ZWVuIDAgYW5kIG1heCAtIDFcblx0XHRyZXR1cm4gTWF0aC5mbG9vcihNYXRoLnJhbmRvbSgpICogbWF4KTtcblx0fSxcblx0cmVwbnVtYmVyOiBmdW5jdGlvbihtYXgsIGkpIHsgLy9zYW1lIGFzIG51bWJlciBidXQgbm9uLXJlcGVhdGluZ1xuXHRcdHZhciByZXMgPSBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBtYXgpO1xuXHRcdGlmIChyZXMgPT0gcHJldltpXSkge1xuXHRcdFx0aWYgKHJlcyA+IDApIHJlcyAtPSAxOyAgLy95ZXMgdmVyeSBjaGVhcFxuXHRcdFx0ZWxzZSByZXMgPSAxO1xuXHRcdH1cblx0XHRwcmV2W2ldID0gcmVzO1xuXHRcdHJldHVybiByZXM7XG5cdH1cbn07XG4iLCJ2YXIgY2FudmFzID0gZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoXCJjXCIpO1xudmFyIGN0eCA9IGNhbnZhcy5nZXRDb250ZXh0KFwiMmRcIik7XG5jdHguaW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgubW96SW1hZ2VTbW9vdGhpbmdFbmFibGVkID0gZmFsc2U7XG5jdHgud2Via2l0SW1hZ2VTbW9vdGhsb2NpbmdFbmFibGVkID0gZmFsc2U7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oc3RhdGUpIHtcblx0Y3R4LmNsZWFyUmVjdCgwLCAwLCBjYW52YXMud2lkdGgsIGNhbnZhcy5oZWlnaHQpO1xuXHRjdHguc2V0VHJhbnNmb3JtKDEsIDAsIDAsIDEsIDAsIDApO1xuXHRjdHguc2NhbGUoc3RhdGUuc2NhbGUsIHN0YXRlLnNjYWxlKTtcblx0dmFyIHBpcGVzID0gc3RhdGUucGlwZXM7XG5cdHN0YXRlLnNwcml0ZXMuZm9yRWFjaChmdW5jdGlvbihzLCBpKSB7XG5cdFx0aWYgKHMubmFtZSA9PSBcIm1hcmlvXCIgfHwgcy5uYW1lID09IFwiaGVhcnRwXCIpIHtcblx0XHRcdHZhciBwID0gcGlwZXNbcy5kZXN0cGlwZV07XG5cdFx0XHRpZiAocy5yZW1vdmUpIHtcblx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHR9IGVsc2UgaWYgKHMuZmFkaW5nICYmICFzLmtpbGxlZCkge1xuXHRcdFx0XHRpZiAocy5uYW1lID09IFwibWFyaW9cIikgc3RhdGUubG9zdCgpO1xuXHRcdFx0XHRzLmtpbGxlZCA9IHRydWU7XG5cdFx0XHR9IGVsc2UgaWYgKHAuYWN0aXZlICYmIChzLnggPiBwLnggJiYgcy54IDwgcC54ICsgMzApICYmIChzLnkgPj0gcC55KSAmJiAhKHMuZmFkaW5nKSAmJiAhKHN0YXRlLmxvc2luZykpIHtcblx0XHRcdFx0cy5yZWFjaGVkID0gdHJ1ZTtcblx0XHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0XHRcdGlmIChzLm5hbWUgPT0gXCJtYXJpb1wiKSBzdGF0ZS5nYWluZWQoKTtcblx0XHRcdFx0ZWxzZSBzdGF0ZS5oZWFydGVkKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIGlmIChzLnJlbW92ZSkge1xuXHRcdFx0c3RhdGUuc3ByaXRlcy5zcGxpY2UoaSwgMSk7XG5cdFx0fVxuXHRcdGlmIChzLm9wYWNpdHkpIGN0eC5nbG9iYWxBbHBoYSA9IHMub3BhY2l0eTtcblx0XHRlbHNlIGN0eC5nbG9iYWxBbHBoYSA9IDE7XG5cdFx0c3dpdGNoIChzLnR5cGUpIHtcblx0XHRcdGNhc2UgXCJyZWN0XCI6XG5cdFx0XHRcdGN0eC5maWxsU3R5bGUgPSBzLmNvbG9yO1xuXHRcdFx0XHRjdHguZmlsbFJlY3Qocy54LCBzLnksIHMud2lkdGgsIHMuaGVpZ2h0KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0XHRjYXNlIFwiaW1nXCI6XG5cdFx0XHRcdHZhciBpbWcgPSBuZXcgSW1hZ2UoKTtcblx0XHRcdFx0aW1nLnNyYyA9IFwiYXNzZXRzL1wiICsgcy5zcmM7XG5cdFx0XHRcdGN0eC5kcmF3SW1hZ2UoaW1nLCBzLngsIHMueSwgcy53aWR0aCwgcy5oZWlnaHQpO1xuXHRcdFx0XHRicmVhaztcblx0XHRcdGNhc2UgXCJ0ZXh0XCI6XG5cdFx0XHRcdGN0eC5mb250ID0gcy5zaXplICsgXCJweCBcIiArIHMuZm9udDtcblx0XHRcdFx0Y3R4LnRleHRBbGlnbiA9IHMuYWxpZ24gfHwgXCJjZW50ZXJcIjtcblx0XHRcdFx0Y3R4LmZpbGxTdHlsZSA9IHMuY29sb3IgfHwgXCIjRkZGRkZGXCI7XG5cdFx0XHRcdGN0eC5maWxsVGV4dChzLnRleHQsIHMueCwgcy55KTtcblx0XHRcdFx0YnJlYWs7XG5cdFx0fVxuXHR9KTtcbn07XG4iLCJtb2R1bGUuZXhwb3J0cyA9IHtcblx0Ym90dG9tOiAzMDAsXG5cdHNpZGU6IDI1MCxcblx0d2F0ZXI6IDExNSxcblx0cGlwZXM6IFtcblx0XHQ5MCxcblx0XHQxNDUsXG5cdFx0MjAwXG5cdF0sXG5cdGNvbnRyb2xzOiBbXG5cdFx0ODEsXG5cdFx0ODcsXG5cdFx0Njlcblx0XSxcblx0azogMC4wMSxcblx0cGlwZWR1cjogMjUwLFxuXHRzY2FsZTogMixcblx0YmVnaW5EZWxheTogMjAwMCxcblx0aGVhcnRzcGF3bjogMjUsXG5cdHNwYXduOiA1MDBcbn07XG4iLCJ2YXIgcnVsZXMgPSByZXF1aXJlKFwiLi9ydWxlc1wiKTtcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKXtcblx0dGhpcy50eXBlID0gXCJ0ZXh0XCI7XG5cdHRoaXMubmFtZSA9IFwic2NvcmVcIjtcblx0dGhpcy5mb250ID0gXCJzYW5zLXNlcmlmXCI7XG5cdHRoaXMuYWxpZ24gPSBcInJpZ2h0XCI7XG5cdHRoaXMuc2l6ZSA9IDIwO1xuXHR0aGlzLnggPSBydWxlcy5zaWRlIC0gMTA7XG5cdHRoaXMueSA9IHRoaXMuc2l6ZTtcblx0dGhpcy50ZXh0ID0gXCIwXCI7XG5cdHRoaXMudXBkYXRlID0gZnVuY3Rpb24odil7XG5cdFx0dGhpcy50ZXh0ID0gdjtcblx0fTtcbn07XG4iLCJ2YXIgcmFuZG9tID0gcmVxdWlyZShcIi4vcmFuZFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbih0aW1lKXtcblx0cmV0dXJuIDM1MCArIChyYW5kb20ubnVtYmVyKDE4MDApIC0gKHRpbWUgLyBydWxlcy5zcGF3bikpO1xufTtcbiIsInZhciBNYXJpbyA9IHJlcXVpcmUoXCIuL21hcmlvXCIpO1xudmFyIFBpcGUgPSByZXF1aXJlKFwiLi9waXBlXCIpO1xudmFyIFNjb3JlYm9hcmQgPSByZXF1aXJlKFwiLi9zY29yZWJvYXJkXCIpO1xudmFyIGF1ZGlvID0gcmVxdWlyZShcIi4vYXVkaW9cIik7XG52YXIgSGVhcnQgPSByZXF1aXJlKFwiLi9oZWFydFwiKTtcbnZhciBydWxlcyA9IHJlcXVpcmUoXCIuL3J1bGVzXCIpO1xubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbigpIHtcblx0dGhpcy5zY2FsZSA9IHJ1bGVzLnNjYWxlO1xuXHR0aGlzLnRpbWUgPSAxO1xuXHR0aGlzLnNjb3JlID0gMDtcblx0dGhpcy5saXZlcyA9IDM7XG5cdHRoaXMubG9zaW5nID0gZmFsc2U7XG5cdHRoaXMuY3JlYXRlZCA9IHRydWU7XG5cdHRoaXMuc2NvcmVib2FyZCA9IHt9O1xuXHR0aGlzLmhlYXJ0cyA9IFtdO1xuXHR0aGlzLnBpcGVzID0gW107XG5cdHRoaXMuaGkgPSAwO1xuXHR0aGlzLmxvc3RzY3JlZW4gPSB7XG5cdFx0dHlwZTogXCJ0ZXh0XCIsXG5cdFx0bmFtZTogXCJsb3N0XCIsXG5cdFx0c2l6ZTogXCIyMFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdGNvbG9yOiBcIiNGRjAwMDBcIixcblx0XHR0ZXh0OiBcIllPVSBMT1NUIVwiLFxuXHRcdHg6IDEzMCxcblx0XHR5OiA3MFxuXHR9O1xuXHR0aGlzLmdyZWV0c2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwiZ3JlZXRcIixcblx0XHRzaXplOiBcIjIwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0Y29sb3I6IFwiIzZCRkY2M1wiLFxuXHRcdHRleHQ6IFwiTUFSSU8gQ0FUQ0hcIixcblx0XHR4OiAxMzAsXG5cdFx0eTogNzBcblx0fTtcblx0dGhpcy5zdGFydHNjcmVlbiA9IHtcblx0XHR0eXBlOiBcInRleHRcIixcblx0XHRuYW1lOiBcImxvc3RcIixcblx0XHRzaXplOiBcIjEwXCIsXG5cdFx0Zm9udDogXCJzYW5zLXNlcmlmXCIsXG5cdFx0dGV4dDogXCJwcmVzcyB4IHRvIHN0YXJ0LiBwcmVzcyBrZXlzIHRvIHJhaXNlIHBpcGVzLlwiLFxuXHRcdHg6IDEzMCxcblx0XHR5OiA4NVxuXHR9O1xuXHR0aGlzLmluc3RydWN0aW9uc2NyZWVuID0ge1xuXHRcdHR5cGU6IFwidGV4dFwiLFxuXHRcdG5hbWU6IFwibG9zdFwiLFxuXHRcdHNpemU6IFwiOFwiLFxuXHRcdGZvbnQ6IFwic2Fucy1zZXJpZlwiLFxuXHRcdHRleHQ6IFwiUSAgICAgICAgICAgICAgICAgICBXICAgICAgICAgICAgICAgICAgICBFXCIsXG5cdFx0eDogMTU1LFxuXHRcdHk6IDExMFxuXHR9O1xuXHR0aGlzLnNwcml0ZXMgPSBbe1xuXHRcdHR5cGU6IFwicmVjdFwiLFxuXHRcdG5hbWU6IFwic2t5XCIsXG5cdFx0Y29sb3I6IFwiIzVDOTRGQ1wiLFxuXHRcdHdpZHRoOiAyNTAsXG5cdFx0aGVpZ2h0OiAxNTAsXG5cdFx0eDogMCxcblx0XHR5OiAwXG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogODAsXG5cdFx0eTogMTIsXG5cdFx0b3BhY2l0eTogMC44LFxuXHRcdHdpZHRoOiA0MCxcblx0XHRoZWlnaHQ6IDI1XG5cdH0sIHtcblx0XHR0eXBlOiBcImltZ1wiLFxuXHRcdG5hbWU6IFwiY2xvdWRcIixcblx0XHRzcmM6IFwiY2xvdWQucG5nXCIsXG5cdFx0eDogMTYwLFxuXHRcdHk6IDM1LFxuXHRcdG9wYWNpdHk6IDAuOCxcblx0XHR3aWR0aDogMjQsXG5cdFx0aGVpZ2h0OiAxNVxuXHR9LCB7XG5cdFx0dHlwZTogXCJpbWdcIixcblx0XHRuYW1lOiBcImJsb2Nrc1wiLFxuXHRcdHNyYzogXCJibG9ja3MucG5nXCIsXG5cdFx0eDogMCxcblx0XHR5OiAzNCxcblx0XHR3aWR0aDogMzQsXG5cdFx0aGVpZ2h0OiAxN1xuXHR9LCB7XG5cdFx0dHlwZTogXCJyZWN0XCIsXG5cdFx0bmFtZTogXCJ3YXRlclwiLFxuXHRcdGNvbG9yOiBcIiMxNURDRTJcIixcblx0XHRvcGFjaXR5OiAwLjUsXG5cdFx0eTogcnVsZXMud2F0ZXIsXG5cdFx0eDogMCxcblx0XHR3aWR0aDogMzAwLFxuXHRcdGhlaWdodDogMzVcblx0fV07XG5cdHRoaXMuY3JlYXRlTWFyaW8gPSBmdW5jdGlvbigpIHtcblx0XHR2YXIgbWFyaW8gPSBuZXcgTWFyaW8oKTtcblx0XHRtYXJpby5vblNwYXduKCk7XG5cdFx0Ly92YXIgZGJjID0gcmVxdWlyZShcIi4uL2RlYnVnL2N1cnZlXCIpO1xuXHRcdC8vdGhpcy5zcHJpdGVzID0gdGhpcy5zcHJpdGVzLmNvbmNhdChkYmMobWFyaW8ucGF0aCkpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UoMywgMCwgbWFyaW8pO1xuXHR9O1xuXHR0aGlzLmNyZWF0ZVBpcGVzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBydWxlcy5waXBlcy5sZW5ndGg7IGkrKykge1xuXHRcdFx0dmFyIHBpcGUgPSBuZXcgUGlwZSgpO1xuXHRcdFx0cGlwZS5vblNwYXduKGkpO1xuXHRcdFx0dGhpcy5waXBlcy5wdXNoKHBpcGUpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnNwbGljZSgzLCAwLCB0aGlzLnBpcGVzW2ldKTtcblx0XHR9XG5cdH07XG5cdHRoaXMuY3JlYXRlSGVhcnRzID0gZnVuY3Rpb24oKSB7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCAzOyBpKyspIHtcblx0XHRcdHZhciBoZWFydCA9IG5ldyBIZWFydCgpO1xuXHRcdFx0aGVhcnQub25TcGF3bihpKTtcblx0XHRcdHRoaXMuaGVhcnRzLnB1c2goaGVhcnQpO1xuXHRcdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5oZWFydHNbaV0pO1xuXHRcdH1cblx0fTtcblx0dGhpcy5jcmVhdGVTY29yZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHRoaXMuc2NvcmVib2FyZCA9IG5ldyBTY29yZWJvYXJkKCk7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5zY29yZWJvYXJkKTtcblx0fTtcblx0dGhpcy5sb3N0ID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHRoaXMubGl2ZXMgPiAwKSB7XG5cdFx0XHR0aGlzLmxpdmVzLS07XG5cdFx0XHR0aGlzLmhlYXJ0c1t0aGlzLmxpdmVzXS5sb3NlKCk7XG5cdFx0fVxuXHRcdGlmICh0aGlzLmxpdmVzID09PSAwKSB7XG5cdFx0XHR0aGlzLmxvc3RHYW1lKCk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLmhlYXJ0ZWQgPSBmdW5jdGlvbigpIHtcblx0XHRpZiAodGhpcy5saXZlcyA8IDMgJiYgIXRoaXMubG9zaW5nKSB7XG5cdFx0XHRhdWRpby5wbGF5KFwiaGVhcnRcIik7XG5cdFx0XHR0aGlzLmxpdmVzKys7XG5cdFx0XHR0aGlzLmhlYXJ0c1t0aGlzLmxpdmVzIC0gMV0uZ2FpbigpO1xuXHRcdH1cblx0fTtcblx0dGhpcy5nYWluZWQgPSBmdW5jdGlvbigpIHtcblx0XHRhdWRpby5wbGF5KFwic2NvcmVcIik7XG5cdFx0dGhpcy5zY29yZSsrO1xuXHRcdHRoaXMuc2NvcmVib2FyZC51cGRhdGUodGhpcy5zY29yZSk7XG5cdH07XG5cdHRoaXMubG9zdEdhbWUgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmxvc2luZyA9IHRydWU7XG5cdFx0aWYgKHRoaXMuc2NvcmUgPiB0aGlzLmhpKSB0aGlzLnNldEhpKCk7XG5cdFx0dGhpcy5zY29yZWJvYXJkLnVwZGF0ZShcImxhc3Q6IFwiICsgdGhpcy5zY29yZSArIFwiIGhpOiBcIiArIHRoaXMuaGkpO1xuXHRcdHRoaXMuc3ByaXRlcy5wdXNoKHRoaXMubG9zdHNjcmVlbik7XG5cdFx0dGhpcy5zcHJpdGVzLnB1c2godGhpcy5zdGFydHNjcmVlbik7XG5cdH07XG5cdHRoaXMuY3JlYXRlID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcmVhdGVkID0gdHJ1ZTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmdyZWV0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLnN0YXJ0c2NyZWVuKTtcblx0XHR0aGlzLnNwcml0ZXMucHVzaCh0aGlzLmluc3RydWN0aW9uc2NyZWVuKTtcblx0fTtcblx0dGhpcy5zdGFydGVkID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5jcmVhdGVkID0gZmFsc2U7XG5cdFx0dmFyIGwgPSB0aGlzLnNwcml0ZXMubGVuZ3RoIC0gMTtcblx0XHR0aGlzLnNwcml0ZXMuc3BsaWNlKGwsIDEpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCAtIDEsIDEpO1xuXHRcdHRoaXMuc3ByaXRlcy5zcGxpY2UobCAtIDIsIDEpO1xuXHRcdHRoaXMuY3JlYXRlUGlwZXMoKTtcblx0XHR0aGlzLmNyZWF0ZVNjb3JlKCk7XG5cdFx0dGhpcy5jcmVhdGVIZWFydHMoKTtcblx0XHR0aGlzLmdldEhpKCk7XG5cdH07XG5cdHRoaXMuc2V0SGkgPSBmdW5jdGlvbigpIHtcblx0XHR0aGlzLmhpID0gdGhpcy5zY29yZTtcblx0XHRsb2NhbFN0b3JhZ2Uuc2V0SXRlbShcImhpXCIsIHRoaXMuc2NvcmUpO1xuXHR9O1xuXHR0aGlzLmdldEhpID0gZnVuY3Rpb24oKSB7XG5cdFx0dGhpcy5oaSA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKFwiaGlcIik7XG5cdH07XG59O1xuIl19
