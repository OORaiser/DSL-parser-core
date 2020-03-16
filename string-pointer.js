class StringPointer {
    constructor(str) {
        this.str = null;
        if (str) {
            this.setString(str);
        }
    }

    setString(str) {
        this.str = str;
        this._length = this.str.length;
        this._index = -1;
    }

    reset() {
        this._index = -1;
    }

    forward() {
        if (!this.str) return false;

        if (this._index >= this._length - 1) {
            return false;
        }

        this._index += 1;
        return true;
    }

    backward() {
        if (!this.str) return false;

        if (this._index <= -1) {
            return false;
        }

        this._index -= 1;
        return true;
    }

    read() {
        return this.str && this.str[this._index];
    }
}

export default StringPointer;
