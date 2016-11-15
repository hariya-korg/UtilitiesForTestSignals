/*
 * Free FFT and convolution (JavaScript)
 *
 * Copyright (c) 2014 Project Nayuki
 * https://www.nayuki.io/page/free-small-fft-in-multiple-languages
 *
 * (MIT License)
 * Permission is hereby granted, free of charge, to any person obtaining a copy of
 * this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to
 * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
 * the Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 * - The above copyright notice and this permission notice shall be included in
 *   all copies or substantial portions of the Software.
 * - The Software is provided "as is", without warranty of any kind, express or
 *   implied, including but not limited to the warranties of merchantability,
 *   fitness for a particular purpose and noninfringement. In no event shall the
 *   authors or copyright holders be liable for any claim, damages or other
 *   liability, whether in an action of contract, tort or otherwise, arising from,
 *   out of or in connection with the Software or the use or other dealings in the
 *   Software.
 */

"use strict";

var FFTNayukis = function(point) {
    this.setPoint(point);
}

FFTNayukis.prototype.setPoint = function(point) {
    /* create a table of trigonometric functions */
    var half = point / 2;
    var cosTable = new Float32Array(half);
    var sinTable = new Float32Array(half);

    for (var index = half - 1, unit = Math.PI / half, phase = 0; index >= 0; index--) {
        phase = index * unit;
        cosTable[index] = Math.cos(phase);
        sinTable[index] = Math.sin(phase);
    }
    cosTable[half / 2] = 0;
    this.cosTable = cosTable;
    this.sinTable = sinTable;

    /* calculate order and point */
    var order = -1;
    for (var o = 0; o < 32; o++) {
        if (1 << o == point) {
            order = o; /* Equal to log2(n) */
            break;
        }
    }

    if (order == -1) {
        this.point = 0;
    } else {
        this.point = point;
    }
    this.order = order;

    /* create addressing permutation pairs */
    var pairs = new Array();
    for (var fw = 0, bw = 0, pair = null; fw < point; fw++, bw = 0) {
        for (var o = 0, f = fw; o < order; o++, f >>>= 1) {
            bw = (bw << 1) | (f & 1);
        }

        if (bw > fw) {
            pair = new Int32Array(2);
            pair[0] = fw;
            pair[1] = bw;
            pairs.push(pair);
        }
    }
    this.pairs = pairs;
}

FFTNayukis.prototype.fft = function(real, imag) {
    /* Preprocess */
    var tpre, tpim;
    var cos, sin, bwre, bwim;

    /* Bit-reversed addressing permutation */
    for (var index=(this.pairs.length-1)|0, pair = null, fw=0|0, bw=0|0; (index|0)>=(0|0); index=(index-1)|0) {
        pair = this.pairs[index<<1>>1];
        fw = pair[0<<1>>1];
        bw = pair[1<<1>>1];

        tpre = real[fw<<1>>1];
        tpim = imag[fw<<1>>1];
        real[fw<<1>>1] = real[bw<<1>>1];
        imag[fw<<1>>1] = imag[bw<<1>>1];
        real[bw<<1>>1] = tpre;
        imag[bw<<1>>1] = tpim;
    }

    /* Cooley-Tukey decimation-in-time radix-2 FFT */
    var point = this.point|0;
    for (var size=2|0, half=1|0, step=(point>>1); (size|0)<=(point|0); size=(size<<1), half=(half<<1), step=(step>>1)) {
        for (var index=0|0; (index|0)<(point|0); index=(index+size)|0) {
            for (var table=0|0, fw=index|0, bw=(index+half)|0, tail=(index+half)|0; (fw|0)<(tail|0); fw=(fw+1)|0, bw=(bw+1)|0, table=(table+step)|0) {
                bwre = real[bw<<1>>1];
                bwim = imag[bw<<1>>1];
                cos  = this.cosTable[table<<1>>1];
                sin  = this.sinTable[table<<1>>1];
                tpre = bwim * sin + bwre * cos;
                tpim = bwim * cos - bwre * sin;
                real[bw<<1>>1]  = real[fw<<1>>1] - tpre;
                imag[bw<<1>>1]  = imag[fw<<1>>1] - tpim;
                real[fw<<1>>1] += tpre;
                imag[fw<<1>>1] += tpim;
            }
        }
    }
}

FFTNayukis.prototype.ifft = function(real, imag) {
    this.fft(imag, real);
}

FFTNayukis.prototype.normalize = function(real, imag) {
    var point = this.point|0;
    var normalization = 1 / Math.sqrt(point);
    for (var index=(point-1)|0; (index|0)>=(0|0); index=(index-1)|0) {
        real[index<<1>>1] *= normalization;
        imag[index<<1>>1] *= normalization;
    }
}
