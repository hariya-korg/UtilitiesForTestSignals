#! /usr/bin/env python
# -*- coding:utf-8 -*-

# Please edit the following parameters as you want
import os, math, numpy, scipy, array, wave, json
from os import path

def custom(size, times, number, margin):
    indices = numpy.arange(float(size))
    fs = 48000.0
    f1 = 20.0 / fs
    f2 = 20000.0 / fs
    logf21 = math.log(f2 / f1)
    signal = numpy.sin(2.0 * numpy.pi * f1 * float(size) / logf21 * (numpy.exp(logf21 * indices / float(size)) - 1.0))
    return repeatSignal(signal, times, number), computeInverse(signal)

def tsp(size, times, number, margin, sign):
    # Time Streched Pulse
    
    # The sign of -1 means up, and the positve does down.

    # Single TSP
    order = int(round(math.log(float(size), 2.0)))
    if order < 1:
        order = 1
    elif order >= 20:
        order = 20
    size = int(pow(2.0, float(order)))

    if margin <= 0.0:
        margin = 2.0 / float(size)
    elif margin > 1.0:
        margin = 1.0
    margin = round(float(size) * margin * 0.5)
    offset = size / 2 - int(margin)
    
    indices  = numpy.arange(size / 2 + 1, dtype=numpy.float64)
    phases   = 1.0j * sign * math.pi / float(size / 2) * indices * (margin * indices / float(size / 2) + float(offset)) 
    spectrum = numpy.zeros(size, dtype=numpy.complex128)
    spectrum[:size/2+1] = numpy.exp(phases)
    spectrum[size/2+1:] = spectrum[size/2-1:0:-1].conj()
    signal  = numpy.fft.ifft(arrangeSpectrum(spectrum)).real
    signal /= numpy.abs(signal).max()

    return repeatSignal(signal, times, number), computeInverse(signal)

def tspu(size, times, number, margin):
    return tsp(size, times, number, margin, -1.0)

def tspd(size, times, number, margin):
    return tsp(size, times, number, margin, 1.0)

def ptsp(size, times, number, margin, sign): 
    # log Swept Sine (Pink TSP)
    
    # The sign of -1 means up, and the positve does down.

    # Single log-SS
    order = int(round(math.log(float(size), 2.0)))
    if order < 1:
        order = 1
    elif order >= 20:
        order = 20
    size = int(pow(2.0, float(order)))

    # should be less than 0.75
    if margin <= 0.0:
        margin = 2.0 / float(size)
    elif margin > 1.0:
        margin = 1.0
    margin = round(float(size) * margin * 0.5)
    
    indices  = numpy.arange(1, size / 2 + 1, dtype=numpy.float64)
    phases = 1.0j * sign * margin * math.pi * indices * numpy.log(indices) / float(size / 2) / math.log(float(size / 2))
    spectrum = numpy.ones(size, dtype=numpy.complex128)
    spectrum[1:size/2+1] = numpy.exp(phases) / numpy.sqrt(indices)
    spectrum[size/2+1:]  = spectrum[size/2-1:0:-1].conj()
    signal = numpy.fft.ifft(arrangeSpectrum(spectrum)).real

    average = numpy.copy(signal)
    for time in xrange(1):
        average[time+1:] += signal[:-1-time]
        average[:time+1] += signal[-1-time:]
    offset = size - numpy.argmin(numpy.abs(average[:-1] - average[1:]))

    phases = 1.0j * sign * math.pi / float(size / 2) * indices * (margin * numpy.log(indices) / math.log(float(size / 2)) + float(offset))
    spectrum = numpy.ones(size, dtype=numpy.complex128)
    spectrum[1:size/2+1] = numpy.exp(phases) / numpy.sqrt(indices)
    spectrum[size/2+1:]  = spectrum[size/2-1:0:-1].conj()
    signal = numpy.fft.ifft(arrangeSpectrum(spectrum)).real
    signal -= signal[0]
    signal /= numpy.abs(signal).max()

    # Inverse
    spectrum = numpy.ones(size, dtype=numpy.complex128)
    spectrum[1:size/2+1] = numpy.exp(-1.0 * phases) * numpy.sqrt(indices)
    spectrum[size/2+1:]  = spectrum[size/2-1:0:-1].conj()
    inverse = numpy.fft.ifft(arrangeSpectrum(spectrum)).real
    inverse -= inverse[0]
    inverse /= numpy.abs(inverse).max()

    return repeatSignal(signal, times, number), inverse

def ptspu(size, times, number, margin): 
    return ptsp(size, times, number, margin, -1.0)

def ptspd(size, times, number, margin):
    return ptsp(size, times, number, margin, 1.0)

def mls(size, times, number, margin):
    #Maximum Length Sequence
    
    # Single MLS
    coefficients = [None, 
                    [0], 
                    [0, 1], 
                    [0, 1], 
                    [0, 1],
                    [0, 2], # 5
                    [0, 1],
                    [0, 1],
                    [0, 2, 3, 4],
                    [0, 4],
                    [0, 3], # 10
                    [0, 2],
                    [0, 1, 4, 6],
                    [0, 1, 3, 4],
                    [0, 1, 6, 10],
                    [0, 1], # 15
                    [0, 1, 3, 12],
                    [0, 3],
                    [0, 7],
                    [0, 1, 2, 5],
                    [0, 3]] # 20
    
    order = int(round(math.log(float(size + 1), 2.0)))
    if order < 1:
        order = 1
    elif order >= len(coefficients):
        order = len(coefficients) - 1
    size = int(pow(2.0, float(order))) - 1
    signal = numpy.zeros(size, dtype=numpy.float64)
    
    indices = coefficients[order]
    polynomial = [0] * order
    polynomial[0] = 1
    
    for sample in xrange(size):
        value = 0
        for index in indices:
            value += polynomial[index]
        value %= 2

        if value:
            signal[sample] = 1.0
        else:
            signal[sample] = -1.0
        
        polynomial.pop(0)
        polynomial.append(value)

    return repeatSignal(signal, times, number), computeInverse(signal)

def arrangeSpectrum(spectrum):
    zeros = (spectrum.imag == 0.0)
    spectrum[zeros] += 1.0j * spectrum[zeros].real
    proportion = numpy.abs(spectrum.real) / numpy.abs(spectrum.imag)
    size = len(proportion) / 2
    huge = (proportion > 1.0e+8) | zeros
    tiny = (proportion < 1.0e-8)
    spectrum[huge] -= 1.0j * spectrum[huge].imag
    spectrum[tiny] -= spectrum[tiny].real
    return spectrum

def repeatSignal(signal, times, number):
    # Synchronous Addition
    single = numpy.copy(signal)
    for time in xrange(times + 1):
#    for time in xrange(times - 1):
        single = numpy.r_[single, signal]

    # Multiple TSP
    multiple = numpy.copy(single)
    for count in xrange(number - 1):
        single *= 0.5
        multiple = numpy.r_[single, multiple]
    
    return multiple
    
def computeInverse(signal):
    # Inverse
    inverse = numpy.zeros_like(signal)
    inverse[0] = signal[0]
    inverse[1:] = signal[-1:0:-1]
    
    return inverse

if __name__ == u'__main__':
    parameters = {}
    with open(u'configure.json', 'r') as file:
        parameters = json.load(file)

    if not os.path.isdir(u'data'):
        os.mkdir(u'data')

    byte = parameters[u'bit'] / 8
    number = parameters[u'number']
    times = parameters[u'times']
    dtypes = [None, numpy.int8, numpy.int16, numpy.int32, numpy.int32]
    typecodes = [None, 'b', 'h', 'i', 'i']
    waveform = {u'mls':mls,
                u'tspu':tspu,
                u'tspd':tspd,
                u'ptspu':ptspu,
                u'ptspd':ptspd,
                u'custom':custom}
    
    mode = parameters[u'mode']
    size = int(round(float(parameters[u'sampleRate']) * float(parameters[u'seconds'])))
    margin = parameters[u'margin']
    signal, inverse = waveform[mode](size, times, number, margin)
    
    max = float(1 << (parameters[u'bit'] - 2))
    samples = dtypes[byte](signal * max)
    file = wave.open(path.join(u'data', parameters[u'signal']) ,u'w')
    file.setnchannels(1)
    file.setsampwidth(byte)
    file.setframerate(parameters[u'sampleRate'])
    file.setcomptype(u'NONE', u'')
    file.writeframes(array.array(typecodes[byte], samples).tostring())
    file.close()

    samples = dtypes[byte](inverse * max)
    file = wave.open(path.join(u'data', parameters[u'inverse']), u'w')
    file.setnchannels(1)
    file.setsampwidth(byte)
    file.setframerate(parameters[u'sampleRate'])
    file.setcomptype(u'NONE', u'')
    file.writeframes(array.array(typecodes[byte], samples).tostring())
    file.close()
