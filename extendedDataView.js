var ExtendedDataView;

(function(){
    ExtendedDataView = function(buffer) {
        var view = new DataView(buffer);
        view.setInt24 = setInt24;
        view.setString = setString;
        view.setFloat32ArrayAsInt16 = setFloat32ArrayAsInt16;
        view.setFloat32ArrayAsInt24 = setFloat32ArrayAsInt24;
        view.setFloat32ArrayAsInt32 = setFloat32ArrayAsInt32;
        view.getInt24 = getInt24;
        view.getString = getString;
        view.getInt16ArrayAsFloat32 = getInt16ArrayAsFloat32;
        view.getInt24ArrayAsFloat32 = getInt24ArrayAsFloat32;
        view.getInt32ArrayAsFloat32 = getInt32ArrayAsFloat32;
        return view;
    }

    function setInt24(offset, value, littleEndian) {
        if (littleEndian) {
            this.setUint8(offset|0, value & 0xff);
            this.setUint8((offset + 1)|0, (value >> 8) & 0xff);
            this.setUint8((offset + 2)|0,  (value >> 16) & 0xff);
        } else {
            this.setUint8(offset|0, (value >> 16) & 0xff);
            this.setUint8((offset + 1)|0, (value >> 8) & 0xff);
            this.setUint8((offset + 2)|0,  value & 0xff);
        }
    }

    function setString(offset, string) {
        for (var index = (string.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0) {
            this.setUint8((offset + index)|0, string.charCodeAt(index<<1>>1)|0);
        }
    };

    function setFloat32ArrayAsInt16(offset, array, littleEndian) {
        clipFloat32Array(array);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            this.setInt16((offset + 2 * index)|0, parseInt(array[index<<1>>1] * 0x7fff), littleEndian);
        }
        offset = null;
        array = null;
        littleEndian = null;
    };

    function setFloat32ArrayAsInt24(offset, array, littleEndian) {
        clipFloat32Array(array);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            this.setInt24((offset + 3 * index)|0, parseInt(array[index<<1>>1] * 0x7fffff), littleEndian);
        }
        offset = null;
        array = null;
        littleEndian = null;
    };

    function setFloat32ArrayAsInt32(offset, array, littleEndian) {
        clipFloat32Array(array);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            this.setInt32((offset + 4 * index)|0, parseInt(array[index<<1>>1] * 0x7fffffff), littleEndian);
        }
        offset = null;
        array = null;
        littleEndian = null;
    };

    function getInt24(offset, littleEndian) {
        var value = 0|0;
        if (littleEndian) {
            value = this.getUint8(offset|0)|0;
            value = (value + (this.getUint8(offset + 1) << 8))|0;
            value = (value + (this.getUint8(offset + 2) << 16))|0;
        } else {
            value = this.getUint8(offset|0) << 16;
            value = (value + (this.geetUint8(offset + 1) << 8))|0;
            value = (value + this.getUint8(offset + 2))|0;
        }
        if ((value|0) < (0x800000|0)) {
            return value|0;
        } else {
            return (value - 0x1000000)|0;
        }
    }

    function getString(offset, length) {
        var tag = new Uint8Array(length<<1>>1);
        for (var l = (length - 1)|0; (l|0) >= (0|0); l = (l - 1)|0) {
            tag[l<<1>>1] = this.getUint8((offset + l)|0, true);
        }
        var string = String.fromCharCode.apply(null, tag);
        offset = null;
        length = null;
        tag = null;
        return string;
    }

    function getInt16ArrayAsFloat32(offset, length, littleEndian) {
        var array = new Float32Array(length<<1>>1);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            array[index<<1>>1] = parseFloat(this.getInt16((offset + 2 * index)|0, littleEndian)) / parseFloat(0x7fff);
        }
        normalizeFloat32Array(array);
        offset = null;
        length = null;
        littleEndian = null;
        return array;
    }

    function getInt24ArrayAsFloat32(offset, length, littleEndian) {
        var array = new Float32Array(length<<1>>1);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            array[index<<1>>1] = parseFloat(this.getInt24((offset + 3 * index)|0, littleEndian)) / parseFloat(0x7fffff);
        }
        normalizeFloat32Array(array);
        offset = null;
        length = null;
        littleEndian = null;
        return array;
    }

    function getInt32ArrayAsFloat32(offset, length, littleEndian) {
        var array = new Float32Array(length<<1>>1);
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0){
            array[index<<1>>1] = parseFloat(this.getInt32((offset + 4 * index)|0, littleEndian)) / parseFloat(0x7fffffff);
        }
        normalizeFloat32Array(array);
        offset = null;
        length = null;
        littleEndian = null;
        return array;
    }

    function clipFloat32Array(array) {
        var clipped = false;
        var temp = 0.0;
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0) {
            temp = array[index<<1>>1];
            if (temp > 1.0) {
                array[index<<1>>1] = 1.0;
                clipped = true;
            } else if (temp < -1.0) {
                array[index<<1>>1] = -1.0;
                clipped = true;
            }
        }

        if (clipped) {
            alert('Float32Array data are clipped.');
        }

        array = null;
        clipped = null;
        temp = null;
    }

    function normalizeFloat32Array(array) {
        var min = 1.0;
        for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0) {
            if (min > array[index<<1>>1]) {
                min = array[index<<1>>1];
            }
        }
        if (min < -1.0) {
            min = -1.0 / min;
            for (var index = (array.length - 1)|0; (index|0) >= (0|0); index = (index - 1)|0) {
                array[index<<1>>1] = array[index<<1>>1] * min;
            }
        }
    }
})();
