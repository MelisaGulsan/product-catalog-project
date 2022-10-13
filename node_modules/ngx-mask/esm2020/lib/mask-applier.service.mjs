import { Inject, Injectable } from '@angular/core';
import { config } from './config';
import * as i0 from "@angular/core";
export class MaskApplierService {
    constructor(_config) {
        this._config = _config;
        this.maskExpression = '';
        this.actualValue = '';
        this.shownMaskExpression = '';
        this._formatWithSeparators = (str, thousandSeparatorChar, decimalChars, precision) => {
            let x = [];
            let decimalChar = '';
            if (Array.isArray(decimalChars)) {
                const regExp = new RegExp(decimalChars.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|'));
                x = str.split(regExp);
                decimalChar = str.match(regExp)?.[0] ?? '';
            }
            else {
                x = str.split(decimalChars);
                decimalChar = decimalChars;
            }
            const decimals = x.length > 1 ? `${decimalChar}${x[1]}` : '';
            let res = x[0];
            const separatorLimit = this.separatorLimit.replace(/\s/g, '');
            if (separatorLimit && +separatorLimit) {
                if (res[0] === '-') {
                    res = `-${res.slice(1, res.length).slice(0, separatorLimit.length)}`;
                }
                else {
                    res = res.slice(0, separatorLimit.length);
                }
            }
            const rgx = /(\d+)(\d{3})/;
            while (thousandSeparatorChar && rgx.test(res)) {
                res = res.replace(rgx, '$1' + thousandSeparatorChar + '$2');
            }
            if (precision === undefined) {
                return res + decimals;
            }
            else if (precision === 0) {
                return res;
            }
            return res + decimals.substr(0, precision + 1);
        };
        this.percentage = (str) => {
            return Number(str) >= 0 && Number(str) <= 100;
        };
        this.getPrecision = (maskExpression) => {
            const x = maskExpression.split('.');
            if (x.length > 1) {
                return Number(x[x.length - 1]);
            }
            return Infinity;
        };
        this.checkAndRemoveSuffix = (inputValue) => {
            for (let i = this.suffix?.length - 1; i >= 0; i--) {
                const substr = this.suffix.substr(i, this.suffix?.length);
                if (inputValue.includes(substr) &&
                    (i - 1 < 0 || !inputValue.includes(this.suffix.substr(i - 1, this.suffix?.length)))) {
                    return inputValue.replace(substr, '');
                }
            }
            return inputValue;
        };
        this.checkInputPrecision = (inputValue, precision, decimalMarker) => {
            if (precision < Infinity) {
                // TODO need think about decimalMarker
                if (Array.isArray(decimalMarker)) {
                    const marker = decimalMarker.find((dm) => dm !== this.thousandSeparator);
                    // eslint-disable-next-line no-param-reassign
                    decimalMarker = marker ? marker : decimalMarker[0];
                }
                const precisionRegEx = new RegExp(this._charToRegExpExpression(decimalMarker) + `\\d{${precision}}.*$`);
                const precisionMatch = inputValue.match(precisionRegEx);
                if (precisionMatch && precisionMatch[0].length - 1 > precision) {
                    const diff = precisionMatch[0].length - 1 - precision;
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.substring(0, inputValue.length - diff);
                }
                if (precision === 0 &&
                    this._compareOrIncludes(inputValue[inputValue.length - 1], decimalMarker, this.thousandSeparator)) {
                    // eslint-disable-next-line no-param-reassign
                    inputValue = inputValue.substring(0, inputValue.length - 1);
                }
            }
            return inputValue;
        };
        this._shift = new Set();
        this.clearIfNotMatch = this._config.clearIfNotMatch;
        this.dropSpecialCharacters = this._config.dropSpecialCharacters;
        this.maskSpecialCharacters = this._config.specialCharacters;
        this.maskAvailablePatterns = this._config.patterns;
        this.prefix = this._config.prefix;
        this.suffix = this._config.suffix;
        this.thousandSeparator = this._config.thousandSeparator;
        this.decimalMarker = this._config.decimalMarker;
        this.hiddenInput = this._config.hiddenInput;
        this.showMaskTyped = this._config.showMaskTyped;
        this.placeHolderCharacter = this._config.placeHolderCharacter;
        this.validation = this._config.validation;
        this.separatorLimit = this._config.separatorLimit;
        this.allowNegativeNumbers = this._config.allowNegativeNumbers;
        this.leadZeroDateTime = this._config.leadZeroDateTime;
    }
    applyMaskWithPattern(inputValue, maskAndPattern) {
        const [mask, customPattern] = maskAndPattern;
        this.customPattern = customPattern;
        return this.applyMask(inputValue, mask);
    }
    applyMask(inputValue, maskExpression, position = 0, justPasted = false, backspaced = false, cb = () => { }) {
        if (!maskExpression || typeof inputValue !== 'string') {
            return '';
        }
        let cursor = 0;
        let result = '';
        let multi = false;
        let backspaceShift = false;
        let shift = 1;
        let stepBack = false;
        if (inputValue.slice(0, this.prefix.length) === this.prefix) {
            // eslint-disable-next-line no-param-reassign
            inputValue = inputValue.slice(this.prefix.length, inputValue.length);
        }
        if (!!this.suffix && inputValue?.length > 0) {
            // eslint-disable-next-line no-param-reassign
            inputValue = this.checkAndRemoveSuffix(inputValue);
        }
        const inputArray = inputValue.toString().split('');
        if (maskExpression === 'IP') {
            const valuesIP = inputValue.split('.');
            this.ipError = this._validIP(valuesIP);
            // eslint-disable-next-line no-param-reassign
            maskExpression = '099.099.099.099';
        }
        const arr = [];
        for (let i = 0; i < inputValue.length; i++) {
            if (inputValue[i]?.match('\\d')) {
                arr.push(inputValue[i]);
            }
        }
        if (maskExpression === 'CPF_CNPJ') {
            this.cpfCnpjError = arr.length !== 11 && arr.length !== 14;
            if (arr.length > 11) {
                // eslint-disable-next-line no-param-reassign
                maskExpression = '00.000.000/0000-00';
            }
            else {
                // eslint-disable-next-line no-param-reassign
                maskExpression = '000.000.000-00';
            }
        }
        if (maskExpression.startsWith('percent')) {
            if (inputValue.match('[a-z]|[A-Z]') ||
                inputValue.match(/[-!$%^&*()_+|~=`{}\[\]:";'<>?,\/.]/)) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._stripToDecimal(inputValue);
                const precision = this.getPrecision(maskExpression);
                // eslint-disable-next-line no-param-reassign
                inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            }
            if (inputValue.indexOf('.') > 0 &&
                !this.percentage(inputValue.substring(0, inputValue.indexOf('.')))) {
                const base = inputValue.substring(0, inputValue.indexOf('.') - 1);
                // eslint-disable-next-line no-param-reassign
                inputValue = `${base}${inputValue.substring(inputValue.indexOf('.'), inputValue.length)}`;
            }
            if (this.percentage(inputValue)) {
                result = inputValue;
            }
            else {
                result = inputValue.substring(0, inputValue.length - 1);
            }
        }
        else if (maskExpression.startsWith('separator')) {
            if (inputValue.match('[wа-яА-Я]') ||
                inputValue.match('[ЁёА-я]') ||
                inputValue.match('[a-z]|[A-Z]') ||
                inputValue.match(/[-@#!$%\\^&*()_£¬'+|~=`{}\[\]:";<>.?\/]/) ||
                inputValue.match('[^A-Za-z0-9,]')) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._stripToDecimal(inputValue);
            }
            // eslint-disable-next-line no-param-reassign
            inputValue =
                inputValue.length > 1 &&
                    inputValue[0] === '0' &&
                    inputValue[1] !== this.thousandSeparator &&
                    !this._compareOrIncludes(inputValue[1], this.decimalMarker, this.thousandSeparator) &&
                    !backspaced
                    ? inputValue.slice(0, inputValue.length - 1)
                    : inputValue;
            if (backspaced) {
                // eslint-disable-next-line no-param-reassign
                inputValue = this._compareOrIncludes(inputValue[inputValue.length - 1], this.decimalMarker, this.thousandSeparator)
                    ? inputValue.slice(0, inputValue.length - 1)
                    : inputValue;
            }
            // TODO: we had different rexexps here for the different cases... but tests dont seam to bother - check this
            //  separator: no COMMA, dot-sep: no SPACE, COMMA OK, comma-sep: no SPACE, COMMA OK
            const thousandSeparatorCharEscaped = this._charToRegExpExpression(this.thousandSeparator);
            let invalidChars = '@#!$%^&*()_+|~=`{}\\[\\]:\\s,\\.";<>?\\/'.replace(thousandSeparatorCharEscaped, '');
            //.replace(decimalMarkerEscaped, '');
            if (Array.isArray(this.decimalMarker)) {
                for (const marker of this.decimalMarker) {
                    invalidChars = invalidChars.replace(this._charToRegExpExpression(marker), '');
                }
            }
            else {
                invalidChars = invalidChars.replace(this._charToRegExpExpression(this.decimalMarker), '');
            }
            const invalidCharRegexp = new RegExp('[' + invalidChars + ']');
            if (inputValue.match(invalidCharRegexp) ||
                (inputValue.length === 1 &&
                    this._compareOrIncludes(inputValue, this.decimalMarker, this.thousandSeparator))) {
                // eslint-disable-next-line no-param-reassign
                inputValue = inputValue.substring(0, inputValue.length - 1);
            }
            const precision = this.getPrecision(maskExpression);
            // eslint-disable-next-line no-param-reassign
            inputValue = this.checkInputPrecision(inputValue, precision, this.decimalMarker);
            const strForSep = inputValue.replace(new RegExp(thousandSeparatorCharEscaped, 'g'), '');
            result = this._formatWithSeparators(strForSep, this.thousandSeparator, this.decimalMarker, precision);
            const commaShift = result.indexOf(',') - inputValue.indexOf(',');
            const shiftStep = result.length - inputValue.length;
            if (shiftStep > 0 && result[position] !== ',') {
                backspaceShift = true;
                let _shift = 0;
                do {
                    this._shift.add(position + _shift);
                    _shift++;
                } while (_shift < shiftStep);
            }
            else if ((commaShift !== 0 && position > 0 && !(result.indexOf(',') >= position && position > 3)) ||
                (!(result.indexOf('.') >= position && position > 3) && shiftStep <= 0)) {
                this._shift.clear();
                backspaceShift = true;
                shift = shiftStep;
                // eslint-disable-next-line no-param-reassign
                position += shiftStep;
                this._shift.add(position);
            }
            else {
                this._shift.clear();
            }
        }
        else {
            for (
            // eslint-disable-next-line
            let i = 0, inputSymbol = inputArray[0]; i < inputArray.length; i++, inputSymbol = inputArray[i]) {
                if (cursor === maskExpression.length) {
                    break;
                }
                if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) &&
                    maskExpression[cursor + 1] === '?') {
                    result += inputSymbol;
                    cursor += 2;
                }
                else if (maskExpression[cursor + 1] === '*' &&
                    multi &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                    multi = false;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor]) &&
                    maskExpression[cursor + 1] === '*') {
                    result += inputSymbol;
                    multi = true;
                }
                else if (maskExpression[cursor + 1] === '?' &&
                    this._checkSymbolMask(inputSymbol, maskExpression[cursor + 2])) {
                    result += inputSymbol;
                    cursor += 3;
                }
                else if (this._checkSymbolMask(inputSymbol, maskExpression[cursor])) {
                    if (maskExpression[cursor] === 'H') {
                        if (Number(inputSymbol) > 2) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'h') {
                        if (result === '2' && Number(inputSymbol) > 3) {
                            cursor += 1;
                            i--;
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'm') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 's') {
                        if (Number(inputSymbol) > 5) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    const daysCount = 31;
                    if (maskExpression[cursor] === 'd') {
                        if ((Number(inputSymbol) > 3 && this.leadZeroDateTime) ||
                            Number(inputValue.slice(cursor, cursor + 2)) > daysCount ||
                            inputValue[cursor + 1] === '/') {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    if (maskExpression[cursor] === 'M') {
                        const monthsCount = 12;
                        // mask without day
                        const withoutDays = cursor === 0 &&
                            (Number(inputSymbol) > 2 ||
                                Number(inputValue.slice(cursor, cursor + 2)) > monthsCount ||
                                inputValue[cursor + 1] === '/');
                        // day<10 && month<12 for input
                        const day1monthInput = inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            ((inputValue[cursor - 2] === '/' &&
                                Number(inputValue.slice(cursor - 1, cursor + 1)) > monthsCount &&
                                inputValue[cursor] !== '/') ||
                                inputValue[cursor] === '/' ||
                                (inputValue[cursor - 3] === '/' &&
                                    Number(inputValue.slice(cursor - 2, cursor)) > monthsCount &&
                                    inputValue[cursor - 1] !== '/') ||
                                inputValue[cursor - 1] === '/');
                        // 10<day<31 && month<12 for input
                        const day2monthInput = Number(inputValue.slice(cursor - 3, cursor - 1)) <= daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            inputValue[cursor - 1] === '/' &&
                            (Number(inputValue.slice(cursor, cursor + 2)) > monthsCount ||
                                inputValue[cursor + 1] === '/');
                        // day<10 && month<12 for paste whole data
                        const day1monthPaste = Number(inputValue.slice(cursor - 3, cursor - 1)) > daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            !inputValue.slice(cursor - 2, cursor).includes('/') &&
                            Number(inputValue.slice(cursor - 2, cursor)) > monthsCount;
                        // 10<day<31 && month<12 for paste whole data
                        const day2monthPaste = Number(inputValue.slice(cursor - 3, cursor - 1)) <= daysCount &&
                            !inputValue.slice(cursor - 3, cursor - 1).includes('/') &&
                            inputValue[cursor - 1] !== '/' &&
                            Number(inputValue.slice(cursor - 1, cursor + 1)) > monthsCount;
                        if ((Number(inputSymbol) > 1 && this.leadZeroDateTime) ||
                            withoutDays ||
                            day1monthInput ||
                            day2monthInput ||
                            day1monthPaste ||
                            day2monthPaste) {
                            cursor += 1;
                            this._shiftStep(maskExpression, cursor, inputArray.length);
                            i--;
                            if (this.leadZeroDateTime) {
                                result += '0';
                            }
                            continue;
                        }
                    }
                    result += inputSymbol;
                    cursor++;
                }
                else if (inputSymbol === ' ' && maskExpression[cursor] === ' ') {
                    result += inputSymbol;
                    cursor++;
                }
                else if (this.maskSpecialCharacters.indexOf(maskExpression[cursor]) !== -1) {
                    result += maskExpression[cursor];
                    cursor++;
                    this._shiftStep(maskExpression, cursor, inputArray.length);
                    i--;
                }
                else if (this.maskSpecialCharacters.indexOf(inputSymbol) > -1 &&
                    this.maskAvailablePatterns[maskExpression[cursor]] &&
                    this.maskAvailablePatterns[maskExpression[cursor]]?.optional) {
                    if (!!inputArray[cursor] &&
                        maskExpression !== '099.099.099.099' &&
                        maskExpression !== '000.000.000-00' &&
                        maskExpression !== '00.000.000/0000-00' &&
                        !maskExpression.match(/^9+\.0+$/)) {
                        result += inputArray[cursor];
                    }
                    cursor++;
                    i--;
                }
                else if (this.maskExpression[cursor + 1] === '*' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.maskExpression[cursor + 1] === '?' &&
                    this._findSpecialChar(this.maskExpression[cursor + 2]) &&
                    this._findSpecialChar(inputSymbol) === this.maskExpression[cursor + 2] &&
                    multi) {
                    cursor += 3;
                    result += inputSymbol;
                }
                else if (this.showMaskTyped &&
                    this.maskSpecialCharacters.indexOf(inputSymbol) < 0 &&
                    inputSymbol !== this.placeHolderCharacter) {
                    stepBack = true;
                }
            }
        }
        if (result.length + 1 === maskExpression.length &&
            this.maskSpecialCharacters.indexOf(maskExpression[maskExpression.length - 1]) !== -1) {
            result += maskExpression[maskExpression.length - 1];
        }
        let newPosition = position + 1;
        while (this._shift.has(newPosition)) {
            shift++;
            newPosition++;
        }
        let actualShift = justPasted && !maskExpression.startsWith('separator')
            ? cursor
            : this._shift.has(position)
                ? shift
                : 0;
        if (stepBack) {
            actualShift--;
        }
        cb(actualShift, backspaceShift);
        if (shift < 0) {
            this._shift.clear();
        }
        let onlySpecial = false;
        if (backspaced) {
            onlySpecial = inputArray.every((char) => this.maskSpecialCharacters.includes(char));
        }
        let res = `${this.prefix}${onlySpecial ? '' : result}${this.suffix}`;
        if (result.length === 0) {
            res = `${this.prefix}${result}`;
        }
        return res;
    }
    _findSpecialChar(inputSymbol) {
        return this.maskSpecialCharacters.find((val) => val === inputSymbol);
    }
    _checkSymbolMask(inputSymbol, maskSymbol) {
        this.maskAvailablePatterns = this.customPattern
            ? this.customPattern
            : this.maskAvailablePatterns;
        return (this.maskAvailablePatterns[maskSymbol] &&
            this.maskAvailablePatterns[maskSymbol].pattern &&
            this.maskAvailablePatterns[maskSymbol].pattern.test(inputSymbol));
    }
    _stripToDecimal(str) {
        return str
            .split('')
            .filter((i, idx) => {
            const isDecimalMarker = typeof this.decimalMarker === 'string'
                ? i === this.decimalMarker
                : // TODO (inepipenko) use utility type
                    this.decimalMarker.includes(i);
            return (i.match('^-?\\d') ||
                i === this.thousandSeparator ||
                isDecimalMarker ||
                (i === '-' && idx === 0 && this.allowNegativeNumbers));
        })
            .join('');
    }
    _charToRegExpExpression(char) {
        // if (Array.isArray(char)) {
        // 	return char.map((v) => ('[\\^$.|?*+()'.indexOf(v) >= 0 ? `\\${v}` : v)).join('|');
        // }
        if (char) {
            const charsToEscape = '[\\^$.|?*+()';
            return char === ' ' ? '\\s' : charsToEscape.indexOf(char) >= 0 ? `\\${char}` : char;
        }
        return char;
    }
    _shiftStep(maskExpression, cursor, inputLength) {
        const shiftStep = /[*?]/g.test(maskExpression.slice(0, cursor)) ? inputLength : cursor;
        this._shift.add(shiftStep + this.prefix.length || 0);
    }
    _compareOrIncludes(value, comparedValue, excludedValue) {
        return Array.isArray(comparedValue)
            ? comparedValue.filter((v) => v !== excludedValue).includes(value)
            : value === comparedValue;
    }
    _validIP(valuesIP) {
        return !(valuesIP.length === 4 &&
            !valuesIP.some((value, index) => {
                if (valuesIP.length !== index + 1) {
                    return value === '' || Number(value) > 255;
                }
                return value === '' || Number(value.substring(0, 3)) > 255;
            }));
    }
}
MaskApplierService.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.1", ngImport: i0, type: MaskApplierService, deps: [{ token: config }], target: i0.ɵɵFactoryTarget.Injectable });
MaskApplierService.ɵprov = i0.ɵɵngDeclareInjectable({ minVersion: "12.0.0", version: "14.2.1", ngImport: i0, type: MaskApplierService });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.1", ngImport: i0, type: MaskApplierService, decorators: [{
            type: Injectable
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [config]
                }] }]; } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay1hcHBsaWVyLnNlcnZpY2UuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtbWFzay1saWIvc3JjL2xpYi9tYXNrLWFwcGxpZXIuc2VydmljZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxNQUFNLGVBQWUsQ0FBQztBQUNuRCxPQUFPLEVBQUUsTUFBTSxFQUFXLE1BQU0sVUFBVSxDQUFDOztBQUczQyxNQUFNLE9BQU8sa0JBQWtCO0lBK0M5QixZQUE2QyxPQUFnQjtRQUFoQixZQUFPLEdBQVAsT0FBTyxDQUFTO1FBdEN0RCxtQkFBYyxHQUFXLEVBQUUsQ0FBQztRQUU1QixnQkFBVyxHQUFXLEVBQUUsQ0FBQztRQUV6Qix3QkFBbUIsR0FBVyxFQUFFLENBQUM7UUFzZWhDLDBCQUFxQixHQUFHLENBQy9CLEdBQVcsRUFDWCxxQkFBNkIsRUFDN0IsWUFBK0IsRUFDL0IsU0FBaUIsRUFDaEIsRUFBRTtZQUNILElBQUksQ0FBQyxHQUFhLEVBQUUsQ0FBQztZQUNyQixJQUFJLFdBQVcsR0FBVyxFQUFFLENBQUM7WUFDN0IsSUFBSSxLQUFLLENBQUMsT0FBTyxDQUFDLFlBQVksQ0FBQyxFQUFFO2dCQUNoQyxNQUFNLE1BQU0sR0FBRyxJQUFJLE1BQU0sQ0FDeEIsWUFBWSxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQyxjQUFjLENBQUMsT0FBTyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEVBQUUsQ0FBQyxDQUFDLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQ2xGLENBQUM7Z0JBQ0YsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7Z0JBQ3RCLFdBQVcsR0FBRyxHQUFHLENBQUMsS0FBSyxD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QUFHOzRCQUM5QixDQUFDLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sRUFBRSxNQUFNLEdBQUcsQ0FBQyxDQUFDLENBQUMsR0FBRyxXQUFXO2dDQUMxRCxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDO3dCQUNsQywwQ0FBMEM7d0JBQzFDLE1BQU0sY0FBYyxHQUNuQixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxHQUFHLFNBQVM7NEJBQzVELENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUN2RCxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxNQUFNLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUNuRCxNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxDQUFDLEdBQUcsV0FBVyxDQUFDO3dCQUM1RCw2Q0FBNkM7d0JBQzdDLE1BQU0sY0FBYyxHQUNuQixNQUFNLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxJQUFJLFNBQVM7NEJBQzdELENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxDQUFDLENBQUMsQ0FBQyxRQUFRLENBQUMsR0FBRyxDQUFDOzRCQUN2RCxVQUFVLENBQUMsTUFBTSxHQUFHLENBQUMsQ0FBQyxLQUFLLEdBQUc7NEJBQzlCLE1BQU0sQ0FBQyxVQUFVLENBQUMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsV0FBVyxD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bnRlbnQiOlsiaW1wb3J0IHsgSW5qZWN0LCBJbmplY3RhYmxlIH0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBjb25maWcsIElDb25maWcgfSBmcm9tICcuL2NvbmZpZyc7XG5cbkBJbmplY3RhYmxlKClcbmV4cG9ydCBjbGFzcyBNYXNrQXBwbGllclNlcnZpY2Uge1xuXHRwdWJsaWMgZHJvcFNwZWNpYWxDaGFyYWN0ZXJzOiBJQ29uZmlnWydkcm9wU3BlY2lhbENoYXJhY3RlcnMnXTtcblxuXHRwdWJsaWMgaGlkZGVuSW5wdXQ6IElDb25maWdbJ2hpZGRlbklucHV0J107XG5cblx0cHVibGljIHNob3dUZW1wbGF0ZSE6IElDb25maWdbJ3Nob3dUZW1wbGF0ZSddO1xuXG5cdHB1YmxpYyBjbGVhcklmTm90TWF0Y2ghOiBJQ29uZmlnWydjbGVhcklmTm90TWF0Y2gnXTtcblxuXHRwdWJsaWMgbWFza0V4cHJlc3Npb246IHN0cmluZyA9ICcnO1xuXG5cdHB1YmxpYyBhY3R1YWxWYWx1ZTogc3RyaW5nID0gJyc7XG5cblx0cHVibGljIHNob3duTWFza0V4cHJlc3Npb246IHN0cmluZyA9ICcnO1xuXG5cdHB1YmxpYyBtYXNrU3BlY2lhbENoYXJhY3RlcnMhOiBJQ29uZmlnWydzcGVjaWFsQ2hhcmFjdGVycyddO1xuXG5cdHB1YmxpYyBtYXNrQXZhaWxhYmxlUGF0dGVybnMhOiBJQ29uZmlnWydwYXR0ZXJucyddO1xuXG5cdHB1YmxpYyBwcmVmaXghOiBJQ29uZmlnWydwcmVmaXgnXTtcblxuXHRwdWJsaWMgc3VmZml4ITogSUNvbmZpZ1snc3VmZml4J107XG5cblx0cHVibGljIHRob3VzYW5kU2VwYXJhdG9yITogSUNvbmZpZ1sndGhvdXNhbmRTZXBhcmF0b3InXTtcblxuXHRwdWJsaWMgZGVjaW1hbE1hcmtlciE6IElDb25maWdbJ2RlY2ltYWxNYXJrZXInXTtcblxuXHRwdWJsaWMgY3VzdG9tUGF0dGVybiE6IElDb25maWdbJ3BhdHRlcm5zJ107XG5cblx0cHVibGljIGlwRXJyb3I/OiBib29sZWFuO1xuXG5cdHB1YmxpYyBjcGZDbnBqRXJyb3I/OiBib29sZWFuO1xuXG5cdHB1YmxpYyBzaG93TWFza1R5cGVkITogSUNvbmZpZ1snc2hvd01hc2tUeXBlZCddO1xuXG5cdHB1YmxpYyBwbGFjZUhvbGRlckNoYXJhY3RlciE6IElDb25maWdbJ3BsYWNlSG9sZGVyQ2hhcmFjdGVyJ107XG5cblx0cHVibGljIHZhbGlkYXRpb246IElDb25maWdbJ3ZhbGlkYXRpb24nXTtcblxuXHRwdWJsaWMgc2VwYXJhdG9yTGltaXQ6IElDb25maWdbJ3NlcGFyYXRvckxpbWl0J107XG5cblx0cHVibGljIGFsbG93TmVnYXRpdmVOdW1iZXJzOiBJQ29uZmlnWydhbGxvd05lZ2F0aXZlTnVtYmVycyddO1xuXG5cdHB1YmxpYyBsZWFkWmVyb0RhdGVUaW1lOiBJQ29uZmlnWydsZWFkWmVyb0RhdGVUaW1lJ107XG5cblx0cHJpdmF0ZSBfc2hpZnQhOiBTZXQ8bnVtYmVyPjtcblxuXHRwdWJsaWMgY29uc3RydWN0b3IoQEluamVjdChjb25maWcpIHByb3RlY3RlZCBfY29uZmlnOiBJQ29uZmlnKSB7XG5cdFx0dGhpcy5fc2hpZnQgPSBuZXcgU2V0KCk7XG5cdFx0dGhpcy5jbGVhcklmTm90TWF0Y2ggPSB0aGlzLl9jb25maWcuY2xlYXJJZk5vdE1hdGNoO1xuXHRcdHRoaXMuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzID0gdGhpcy5fY29uZmlnLmRyb3BTcGVjaWFsQ2hhcmFjdGVycztcblx0XHR0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX2NvbmZpZy5zcGVjaWFsQ2hhcmFjdGVycztcblx0XHR0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucyA9IHRoaXMuX2NvbmZpZy5wYXR0ZXJucztcblx0XHR0aGlzLnByZWZpeCA9IHRoaXMuX2NvbmZpZy5wcmVmaXg7XG5cdFx0dGhpcy5zdWZmaXggPSB0aGlzLl9jb25maWcuc3VmZml4O1xuXHRcdHRoaXMudGhvdXNhbmRTZXBhcmF0b3IgPSB0aGlzLl9jb25maWcudGhvdXNhbmRTZXBhcmF0b3I7XG5cdFx0dGhpcy5kZWNpbWFsTWFya2VyID0gdGhpcy5fY29uZmlnLmRlY2ltYWxNYXJrZXI7XG5cdFx0dGhpcy5oaWRkZW5JbnB1dCA9IHRoaXMuX2NvbmZpZy5oaWRkZW5JbnB1dDtcblx0XHR0aGlzLnNob3dNYXNrVHlwZWQgPSB0aGlzLl9jb25maWcuc2hvd01hc2tUeXBlZDtcblx0XHR0aGlzLnBsYWNlSG9sZGVyQ2hhcmFjdGVyID0gdGhpcy5fY29uZmlnLnBsYWNlSG9sZGVyQ2hhcmFjdGVyO1xuXHRcdHRoaXMudmFsaWRhdGlvbiA9IHRoaXMuX2NvbmZpZy52YWxpZGF0aW9uO1xuXHRcdHRoaXMuc2VwYXJhdG9yTGltaXQgPSB0aGlzLl9jb25maWcuc2VwYXJhdG9yTGltaXQ7XG5cdFx0dGhpcy5hbGxvd05lZ2F0aXZlTnVtYmVycyA9IHRoaXMuX2NvbmZpZy5hbGxvd05lZ2F0aXZlTnVtYmVycztcblx0XHR0aGlzLmxlYWRaZXJvRGF0ZVRpbWUgPSB0aGlzLl9jb25maWcubGVhZFplcm9EYXRlVGltZTtcblx0fVxuXG5cdHB1YmxpYyBhcHBseU1hc2tXaXRoUGF0dGVybihcblx0XHRpbnB1dFZhbHVlOiBzdHJpbmcsXG5cdFx0bWFza0FuZFBhdHRlcm46IFtzdHJpbmcsIElDb25maWdbJ3BhdHRlcm5zJ11dLFxuXHQpOiBzdHJpbmcge1xuXHRcdGNvbnN0IFttYXNrLCBjdXN0b21QYXR0ZXJuXSA9IG1hc2tBbmRQYXR0ZXJuO1xuXHRcdHRoaXMuY3VzdG9tUGF0dGVybiA9IGN1c3RvbVBhdHRlcm47XG5cdFx0cmV0dXJuIHRoaXMuYXBwbHlNYXNrKGlucHV0VmFsdWUsIG1hc2spO1xuXHR9XG5cblx0cHVibGljIGFwcGx5TWFzayhcblx0XHRpbnB1dFZhbHVlOiBzdHJpbmcgfCBvYmplY3QgfCBib29sZWFuIHwgbnVsbCB8IHVuZGVmaW5lZCxcblx0XHRtYXNrRXhwcmVzc2lvbjogc3RyaW5nLFxuXHRcdHBvc2l0aW9uOiBudW1iZXIgPSAwLFxuXHRcdGp1c3RQYXN0ZWQ6IGJvb2xlYW4gPSBmYWxzZSxcblx0XHRiYWNrc3BhY2VkOiBib29sZWFuID0gZmFsc2UsXG5cdFx0Y2I6IEZ1bmN0aW9uID0gKCkgPT4ge30sXG5cdCk6IHN0cmluZyB7XG5cdFx0aWYgKCFtYXNrRXhwcmVzc2lvbiB8fCB0eXBlb2YgaW5wdXRWYWx1ZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdHJldHVybiAnJztcblx0XHR9XG5cdFx0bGV0IGN1cnNvciA9IDA7XG5cdFx0bGV0IHJlc3VsdCA9ICcnO1xuXHRcdGxldCBtdWx0aSA9IGZhbHNlO1xuXHRcdGxldCBiYWNrc3BhY2VTaGlmdCA9IGZhbHNlO1xuXHRcdGxldCBzaGlmdCA9IDE7XG5cdFx0bGV0IHN0ZXBCYWNrID0gZmFsc2U7XG5cdFx0aWYgKGlucHV0VmFsdWUuc2xpY2UoMCwgdGhpcy5wcmVmaXgubGVuZ3RoKSA9PT0gdGhpcy5wcmVmaXgpIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0aW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc2xpY2UodGhpcy5wcmVmaXgubGVuZ3RoLCBpbnB1dFZhbHVlLmxlbmd0aCk7XG5cdFx0fVxuXHRcdGlmICghIXRoaXMuc3VmZml4ICYmIGlucHV0VmFsdWU/Lmxlbmd0aCA+IDApIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0aW5wdXRWYWx1ZSA9IHRoaXMuY2hlY2tBbmRSZW1vdmVTdWZmaXgoaW5wdXRWYWx1ZSk7XG5cdFx0fVxuXHRcdGNvbnN0IGlucHV0QXJyYXk6IHN0cmluZ1tdID0gaW5wdXRWYWx1ZS50b1N0cmluZygpLnNwbGl0KCcnKTtcblx0XHRpZiAobWFza0V4cHJlc3Npb24gPT09ICdJUCcpIHtcblx0XHRcdGNvbnN0IHZhbHVlc0lQID0gaW5wdXRWYWx1ZS5zcGxpdCgnLicpO1xuXHRcdFx0dGhpcy5pcEVycm9yID0gdGhpcy5fdmFsaWRJUCh2YWx1ZXNJUCk7XG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdG1hc2tFeHByZXNzaW9uID0gJzA5OS4wOTkuMDk5LjA5OSc7XG5cdFx0fVxuXHRcdGNvbnN0IGFycjogc3RyaW5nW10gPSBbXTtcblx0XHRmb3IgKGxldCBpID0gMDsgaSA8IGlucHV0VmFsdWUubGVuZ3RoOyBpKyspIHtcblx0XHRcdGlmIChpbnB1dFZhbHVlW2ldPy5tYXRjaCgnXFxcXGQnKSkge1xuXHRcdFx0XHRhcnIucHVzaChpbnB1dFZhbHVlW2ldISk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChtYXNrRXhwcmVzc2lvbiA9PT0gJ0NQRl9DTlBKJykge1xuXHRcdFx0dGhpcy5jcGZDbnBqRXJyb3IgPSBhcnIubGVuZ3RoICE9PSAxMSAmJiBhcnIubGVuZ3RoICE9PSAxNDtcblx0XHRcdGlmIChhcnIubGVuZ3RoID4gMTEpIHtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRcdG1hc2tFeHByZXNzaW9uID0gJzAwLjAwMC4wMDAvMDAwMC0wMCc7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0bWFza0V4cHJlc3Npb24gPSAnMDAwLjAwMC4wMDAtMDAnO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aCgncGVyY2VudCcpKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdGlucHV0VmFsdWUubWF0Y2goJ1thLXpdfFtBLVpdJykgfHxcblx0XHRcdFx0aW5wdXRWYWx1ZS5tYXRjaCgvWy0hJCVeJiooKV8rfH49YHt9XFxbXFxdOlwiOyc8Pj8sXFwvLl0vKVxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0XHRpbnB1dFZhbHVlID0gdGhpcy5fc3RyaXBUb0RlY2ltYWwoaW5wdXRWYWx1ZSk7XG5cdFx0XHRcdGNvbnN0IHByZWNpc2lvbjogbnVtYmVyID0gdGhpcy5nZXRQcmVjaXNpb24obWFza0V4cHJlc3Npb24pO1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0aW5wdXRWYWx1ZSA9IHRoaXMuY2hlY2tJbnB1dFByZWNpc2lvbihpbnB1dFZhbHVlLCBwcmVjaXNpb24sIHRoaXMuZGVjaW1hbE1hcmtlcik7XG5cdFx0XHR9XG5cdFx0XHRpZiAoXG5cdFx0XHRcdGlucHV0VmFsdWUuaW5kZXhPZignLicpID4gMCAmJlxuXHRcdFx0XHQhdGhpcy5wZXJjZW50YWdlKGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUuaW5kZXhPZignLicpKSlcblx0XHRcdCkge1xuXHRcdFx0XHRjb25zdCBiYXNlOiBzdHJpbmcgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSAtIDEpO1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0aW5wdXRWYWx1ZSA9IGAke2Jhc2V9JHtpbnB1dFZhbHVlLnN1YnN0cmluZyhpbnB1dFZhbHVlLmluZGV4T2YoJy4nKSwgaW5wdXRWYWx1ZS5sZW5ndGgpfWA7XG5cdFx0XHR9XG5cdFx0XHRpZiAodGhpcy5wZXJjZW50YWdlKGlucHV0VmFsdWUpKSB7XG5cdFx0XHRcdHJlc3VsdCA9IGlucHV0VmFsdWU7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXN1bHQgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSBpZiAobWFza0V4cHJlc3Npb24uc3RhcnRzV2l0aCgnc2VwYXJhdG9yJykpIHtcblx0XHRcdGlmIChcblx0XHRcdFx0aW5wdXRWYWx1ZS5tYXRjaCgnW3fQsC3Rj9CQLdCvXScpIHx8XG5cdFx0XHRcdGlucHV0VmFsdWUubWF0Y2goJ1vQgdGR0JAt0Y9dJykgfHxcblx0XHRcdFx0aW5wdXRWYWx1ZS5tYXRjaCgnW2Etel18W0EtWl0nKSB8fFxuXHRcdFx0XHRpbnB1dFZhbHVlLm1hdGNoKC9bLUAjISQlXFxcXF4mKigpX8KjwqwnK3x+PWB7fVxcW1xcXTpcIjs8Pi4/XFwvXS8pIHx8XG5cdFx0XHRcdGlucHV0VmFsdWUubWF0Y2goJ1teQS1aYS16MC05LF0nKVxuXHRcdFx0KSB7XG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0XHRpbnB1dFZhbHVlID0gdGhpcy5fc3RyaXBUb0RlY2ltYWwoaW5wdXRWYWx1ZSk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0aW5wdXRWYWx1ZSA9XG5cdFx0XHRcdGlucHV0VmFsdWUubGVuZ3RoID4gMSAmJlxuXHRcdFx0XHRpbnB1dFZhbHVlWzBdID09PSAnMCcgJiZcblx0XHRcdFx0aW5wdXRWYWx1ZVsxXSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvciAmJlxuXHRcdFx0XHQhdGhpcy5fY29tcGFyZU9ySW5jbHVkZXMoaW5wdXRWYWx1ZVsxXSwgdGhpcy5kZWNpbWFsTWFya2VyLCB0aGlzLnRob3VzYW5kU2VwYXJhdG9yKSAmJlxuXHRcdFx0XHQhYmFja3NwYWNlZFxuXHRcdFx0XHRcdD8gaW5wdXRWYWx1ZS5zbGljZSgwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0OiBpbnB1dFZhbHVlO1xuXG5cdFx0XHRpZiAoYmFja3NwYWNlZCkge1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0aW5wdXRWYWx1ZSA9IHRoaXMuX2NvbXBhcmVPckluY2x1ZGVzKFxuXHRcdFx0XHRcdGlucHV0VmFsdWVbaW5wdXRWYWx1ZS5sZW5ndGggLSAxXSxcblx0XHRcdFx0XHR0aGlzLmRlY2ltYWxNYXJrZXIsXG5cdFx0XHRcdFx0dGhpcy50aG91c2FuZFNlcGFyYXRvcixcblx0XHRcdFx0KVxuXHRcdFx0XHRcdD8gaW5wdXRWYWx1ZS5zbGljZSgwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpXG5cdFx0XHRcdFx0OiBpbnB1dFZhbHVlO1xuXHRcdFx0fVxuXHRcdFx0Ly8gVE9ETzogd2UgaGFkIGRpZmZlcmVudCByZXhleHBzIGhlcmUgZm9yIHRoZSBkaWZmZXJlbnQgY2FzZXMuLi4gYnV0IHRlc3RzIGRvbnQgc2VhbSB0byBib3RoZXIgLSBjaGVjayB0aGlzXG5cdFx0XHQvLyAgc2VwYXJhdG9yOiBubyBDT01NQSwgZG90LXNlcDogbm8gU1BBQ0UsIENPTU1BIE9LLCBjb21tYS1zZXA6IG5vIFNQQUNFLCBDT01NQSBPS1xuXG5cdFx0XHRjb25zdCB0aG91c2FuZFNlcGFyYXRvckNoYXJFc2NhcGVkOiBzdHJpbmcgPSB0aGlzLl9jaGFyVG9SZWdFeHBFeHByZXNzaW9uKFxuXHRcdFx0XHR0aGlzLnRob3VzYW5kU2VwYXJhdG9yLFxuXHRcdFx0KTtcblx0XHRcdGxldCBpbnZhbGlkQ2hhcnM6IHN0cmluZyA9ICdAIyEkJV4mKigpXyt8fj1ge31cXFxcW1xcXFxdOlxcXFxzLFxcXFwuXCI7PD4/XFxcXC8nLnJlcGxhY2UoXG5cdFx0XHRcdHRob3VzYW5kU2VwYXJhdG9yQ2hhckVzY2FwZWQsXG5cdFx0XHRcdCcnLFxuXHRcdFx0KTtcblx0XHRcdC8vLnJlcGxhY2UoZGVjaW1hbE1hcmtlckVzY2FwZWQsICcnKTtcblx0XHRcdGlmIChBcnJheS5pc0FycmF5KHRoaXMuZGVjaW1hbE1hcmtlcikpIHtcblx0XHRcdFx0Zm9yIChjb25zdCBtYXJrZXIgb2YgdGhpcy5kZWNpbWFsTWFya2VyKSB7XG5cdFx0XHRcdFx0aW52YWxpZENoYXJzID0gaW52YWxpZENoYXJzLnJlcGxhY2UodGhpcy5fY2hhclRvUmVnRXhwRXhwcmVzc2lvbihtYXJrZXIpLCAnJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGludmFsaWRDaGFycyA9IGludmFsaWRDaGFycy5yZXBsYWNlKHRoaXMuX2NoYXJUb1JlZ0V4cEV4cHJlc3Npb24odGhpcy5kZWNpbWFsTWFya2VyKSwgJycpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBpbnZhbGlkQ2hhclJlZ2V4cDogUmVnRXhwID0gbmV3IFJlZ0V4cCgnWycgKyBpbnZhbGlkQ2hhcnMgKyAnXScpO1xuXG5cdFx0XHRpZiAoXG5cdFx0XHRcdGlucHV0VmFsdWUubWF0Y2goaW52YWxpZENoYXJSZWdleHApIHx8XG5cdFx0XHRcdChpbnB1dFZhbHVlLmxlbmd0aCA9PT0gMSAmJlxuXHRcdFx0XHRcdHRoaXMuX2NvbXBhcmVPckluY2x1ZGVzKGlucHV0VmFsdWUsIHRoaXMuZGVjaW1hbE1hcmtlciwgdGhpcy50aG91c2FuZFNlcGFyYXRvcikpXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRcdGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXG5cdFx0XHRjb25zdCBwcmVjaXNpb246IG51bWJlciA9IHRoaXMuZ2V0UHJlY2lzaW9uKG1hc2tFeHByZXNzaW9uKTtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0aW5wdXRWYWx1ZSA9IHRoaXMuY2hlY2tJbnB1dFByZWNpc2lvbihpbnB1dFZhbHVlLCBwcmVjaXNpb24sIHRoaXMuZGVjaW1hbE1hcmtlcik7XG5cdFx0XHRjb25zdCBzdHJGb3JTZXA6IHN0cmluZyA9IGlucHV0VmFsdWUucmVwbGFjZShcblx0XHRcdFx0bmV3IFJlZ0V4cCh0aG91c2FuZFNlcGFyYXRvckNoYXJFc2NhcGVkLCAnZycpLFxuXHRcdFx0XHQnJyxcblx0XHRcdCk7XG5cdFx0XHRyZXN1bHQgPSB0aGlzLl9mb3JtYXRXaXRoU2VwYXJhdG9ycyhcblx0XHRcdFx0c3RyRm9yU2VwLFxuXHRcdFx0XHR0aGlzLnRob3VzYW5kU2VwYXJhdG9yLFxuXHRcdFx0XHR0aGlzLmRlY2ltYWxNYXJrZXIsXG5cdFx0XHRcdHByZWNpc2lvbixcblx0XHRcdCk7XG5cdFx0XHRjb25zdCBjb21tYVNoaWZ0OiBudW1iZXIgPSByZXN1bHQuaW5kZXhPZignLCcpIC0gaW5wdXRWYWx1ZS5pbmRleE9mKCcsJyk7XG5cdFx0XHRjb25zdCBzaGlmdFN0ZXA6IG51bWJlciA9IHJlc3VsdC5sZW5ndGggLSBpbnB1dFZhbHVlLmxlbmd0aDtcblxuXHRcdFx0aWYgKHNoaWZ0U3RlcCA+IDAgJiYgcmVzdWx0W3Bvc2l0aW9uXSAhPT0gJywnKSB7XG5cdFx0XHRcdGJhY2tzcGFjZVNoaWZ0ID0gdHJ1ZTtcblx0XHRcdFx0bGV0IF9zaGlmdCA9IDA7XG5cdFx0XHRcdGRvIHtcblx0XHRcdFx0XHR0aGlzLl9zaGlmdC5hZGQocG9zaXRpb24gKyBfc2hpZnQpO1xuXHRcdFx0XHRcdF9zaGlmdCsrO1xuXHRcdFx0XHR9IHdoaWxlIChfc2hpZnQgPCBzaGlmdFN0ZXApO1xuXHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0KGNvbW1hU2hpZnQgIT09IDAgJiYgcG9zaXRpb24gPiAwICYmICEocmVzdWx0LmluZGV4T2YoJywnKSA+PSBwb3NpdGlvbiAmJiBwb3NpdGlvbiA+IDMpKSB8fFxuXHRcdFx0XHQoIShyZXN1bHQuaW5kZXhPZignLicpID49IHBvc2l0aW9uICYmIHBvc2l0aW9uID4gMykgJiYgc2hpZnRTdGVwIDw9IDApXG5cdFx0XHQpIHtcblx0XHRcdFx0dGhpcy5fc2hpZnQuY2xlYXIoKTtcblx0XHRcdFx0YmFja3NwYWNlU2hpZnQgPSB0cnVlO1xuXHRcdFx0XHRzaGlmdCA9IHNoaWZ0U3RlcDtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRcdHBvc2l0aW9uICs9IHNoaWZ0U3RlcDtcblx0XHRcdFx0dGhpcy5fc2hpZnQuYWRkKHBvc2l0aW9uKTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHRoaXMuX3NoaWZ0LmNsZWFyKCk7XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZvciAoXG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZVxuXHRcdFx0XHRsZXQgaTogbnVtYmVyID0gMCwgaW5wdXRTeW1ib2w6IHN0cmluZyA9IGlucHV0QXJyYXlbMF0hO1xuXHRcdFx0XHRpIDwgaW5wdXRBcnJheS5sZW5ndGg7XG5cdFx0XHRcdGkrKywgaW5wdXRTeW1ib2wgPSBpbnB1dEFycmF5W2ldIVxuXHRcdFx0KSB7XG5cdFx0XHRcdGlmIChjdXJzb3IgPT09IG1hc2tFeHByZXNzaW9uLmxlbmd0aCkge1xuXHRcdFx0XHRcdGJyZWFrO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChcblx0XHRcdFx0XHR0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0hKSAmJlxuXHRcdFx0XHRcdG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnPydcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0cmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuXHRcdFx0XHRcdGN1cnNvciArPSAyO1xuXHRcdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRcdG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicgJiZcblx0XHRcdFx0XHRtdWx0aSAmJlxuXHRcdFx0XHRcdHRoaXMuX2NoZWNrU3ltYm9sTWFzayhpbnB1dFN5bWJvbCwgbWFza0V4cHJlc3Npb25bY3Vyc29yICsgMl0hKVxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRyZXN1bHQgKz0gaW5wdXRTeW1ib2w7XG5cdFx0XHRcdFx0Y3Vyc29yICs9IDM7XG5cdFx0XHRcdFx0bXVsdGkgPSBmYWxzZTtcblx0XHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0XHR0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0hKSAmJlxuXHRcdFx0XHRcdG1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKidcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0cmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuXHRcdFx0XHRcdG11bHRpID0gdHJ1ZTtcblx0XHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0XHRtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAxXSA9PT0gJz8nICYmXG5cdFx0XHRcdFx0dGhpcy5fY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sLCBtYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSEpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcblx0XHRcdFx0XHRjdXJzb3IgKz0gMztcblx0XHRcdFx0fSBlbHNlIGlmICh0aGlzLl9jaGVja1N5bWJvbE1hc2soaW5wdXRTeW1ib2wsIG1hc2tFeHByZXNzaW9uW2N1cnNvcl0hKSkge1xuXHRcdFx0XHRcdGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAnSCcpIHtcblx0XHRcdFx0XHRcdGlmIChOdW1iZXIoaW5wdXRTeW1ib2wpID4gMikge1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgKz0gMTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9ICcwJztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdoJykge1xuXHRcdFx0XHRcdFx0aWYgKHJlc3VsdCA9PT0gJzInICYmIE51bWJlcihpbnB1dFN5bWJvbCkgPiAzKSB7XG5cdFx0XHRcdFx0XHRcdGN1cnNvciArPSAxO1xuXHRcdFx0XHRcdFx0XHRpLS07XG5cdFx0XHRcdFx0XHRcdGNvbnRpbnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAobWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gJ20nKSB7XG5cdFx0XHRcdFx0XHRpZiAoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDUpIHtcblx0XHRcdFx0XHRcdFx0Y3Vyc29yICs9IDE7XG5cdFx0XHRcdFx0XHRcdHRoaXMuX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbiwgY3Vyc29yLCBpbnB1dEFycmF5Lmxlbmd0aCk7XG5cdFx0XHRcdFx0XHRcdGktLTtcblx0XHRcdFx0XHRcdFx0aWYgKHRoaXMubGVhZFplcm9EYXRlVGltZSkge1xuXHRcdFx0XHRcdFx0XHRcdHJlc3VsdCArPSAnMCc7XG5cdFx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdFx0Y29udGludWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGlmIChtYXNrRXhwcmVzc2lvbltjdXJzb3JdID09PSAncycpIHtcblx0XHRcdFx0XHRcdGlmIChOdW1iZXIoaW5wdXRTeW1ib2wpID4gNSkge1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgKz0gMTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9ICcwJztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0Y29uc3QgZGF5c0NvdW50ID0gMzE7XG5cdFx0XHRcdFx0aWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdkJykge1xuXHRcdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0XHQoTnVtYmVyKGlucHV0U3ltYm9sKSA+IDMgJiYgdGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB8fFxuXHRcdFx0XHRcdFx0XHROdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IsIGN1cnNvciArIDIpKSA+IGRheXNDb3VudCB8fFxuXHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlW2N1cnNvciArIDFdID09PSAnLydcblx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgKz0gMTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9ICcwJztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKG1hc2tFeHByZXNzaW9uW2N1cnNvcl0gPT09ICdNJykge1xuXHRcdFx0XHRcdFx0Y29uc3QgbW9udGhzQ291bnQgPSAxMjtcblx0XHRcdFx0XHRcdC8vIG1hc2sgd2l0aG91dCBkYXlcblx0XHRcdFx0XHRcdGNvbnN0IHdpdGhvdXREYXlzOiBib29sZWFuID1cblx0XHRcdFx0XHRcdFx0Y3Vyc29yID09PSAwICYmXG5cdFx0XHRcdFx0XHRcdChOdW1iZXIoaW5wdXRTeW1ib2wpID4gMiB8fFxuXHRcdFx0XHRcdFx0XHRcdE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciwgY3Vyc29yICsgMikpID4gbW9udGhzQ291bnQgfHxcblx0XHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlW2N1cnNvciArIDFdID09PSAnLycpO1xuXHRcdFx0XHRcdFx0Ly8gZGF5PDEwICYmIG1vbnRoPDEyIGZvciBpbnB1dFxuXHRcdFx0XHRcdFx0Y29uc3QgZGF5MW1vbnRoSW5wdXQ6IGJvb2xlYW4gPVxuXHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDMsIGN1cnNvciAtIDEpLmluY2x1ZGVzKCcvJykgJiZcblx0XHRcdFx0XHRcdFx0KChpbnB1dFZhbHVlW2N1cnNvciAtIDJdID09PSAnLycgJiZcblx0XHRcdFx0XHRcdFx0XHROdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAxLCBjdXJzb3IgKyAxKSkgPiBtb250aHNDb3VudCAmJlxuXHRcdFx0XHRcdFx0XHRcdGlucHV0VmFsdWVbY3Vyc29yXSAhPT0gJy8nKSB8fFxuXHRcdFx0XHRcdFx0XHRcdGlucHV0VmFsdWVbY3Vyc29yXSA9PT0gJy8nIHx8XG5cdFx0XHRcdFx0XHRcdFx0KGlucHV0VmFsdWVbY3Vyc29yIC0gM10gPT09ICcvJyAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0TnVtYmVyKGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMiwgY3Vyc29yKSkgPiBtb250aHNDb3VudCAmJlxuXHRcdFx0XHRcdFx0XHRcdFx0aW5wdXRWYWx1ZVtjdXJzb3IgLSAxXSAhPT0gJy8nKSB8fFxuXHRcdFx0XHRcdFx0XHRcdGlucHV0VmFsdWVbY3Vyc29yIC0gMV0gPT09ICcvJyk7XG5cdFx0XHRcdFx0XHQvLyAxMDxkYXk8MzEgJiYgbW9udGg8MTIgZm9yIGlucHV0XG5cdFx0XHRcdFx0XHRjb25zdCBkYXkybW9udGhJbnB1dDogYm9vbGVhbiA9XG5cdFx0XHRcdFx0XHRcdE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDMsIGN1cnNvciAtIDEpKSA8PSBkYXlzQ291bnQgJiZcblx0XHRcdFx0XHRcdFx0IWlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMywgY3Vyc29yIC0gMSkuaW5jbHVkZXMoJy8nKSAmJlxuXHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlW2N1cnNvciAtIDFdID09PSAnLycgJiZcblx0XHRcdFx0XHRcdFx0KE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciwgY3Vyc29yICsgMikpID4gbW9udGhzQ291bnQgfHxcblx0XHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlW2N1cnNvciArIDFdID09PSAnLycpO1xuXHRcdFx0XHRcdFx0Ly8gZGF5PDEwICYmIG1vbnRoPDEyIGZvciBwYXN0ZSB3aG9sZSBkYXRhXG5cdFx0XHRcdFx0XHRjb25zdCBkYXkxbW9udGhQYXN0ZTogYm9vbGVhbiA9XG5cdFx0XHRcdFx0XHRcdE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDMsIGN1cnNvciAtIDEpKSA+IGRheXNDb3VudCAmJlxuXHRcdFx0XHRcdFx0XHQhaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAzLCBjdXJzb3IgLSAxKS5pbmNsdWRlcygnLycpICYmXG5cdFx0XHRcdFx0XHRcdCFpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDIsIGN1cnNvcikuaW5jbHVkZXMoJy8nKSAmJlxuXHRcdFx0XHRcdFx0XHROdW1iZXIoaW5wdXRWYWx1ZS5zbGljZShjdXJzb3IgLSAyLCBjdXJzb3IpKSA+IG1vbnRoc0NvdW50O1xuXHRcdFx0XHRcdFx0Ly8gMTA8ZGF5PDMxICYmIG1vbnRoPDEyIGZvciBwYXN0ZSB3aG9sZSBkYXRhXG5cdFx0XHRcdFx0XHRjb25zdCBkYXkybW9udGhQYXN0ZTogYm9vbGVhbiA9XG5cdFx0XHRcdFx0XHRcdE51bWJlcihpbnB1dFZhbHVlLnNsaWNlKGN1cnNvciAtIDMsIGN1cnNvciAtIDEpKSA8PSBkYXlzQ291bnQgJiZcblx0XHRcdFx0XHRcdFx0IWlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMywgY3Vyc29yIC0gMSkuaW5jbHVkZXMoJy8nKSAmJlxuXHRcdFx0XHRcdFx0XHRpbnB1dFZhbHVlW2N1cnNvciAtIDFdICE9PSAnLycgJiZcblx0XHRcdFx0XHRcdFx0TnVtYmVyKGlucHV0VmFsdWUuc2xpY2UoY3Vyc29yIC0gMSwgY3Vyc29yICsgMSkpID4gbW9udGhzQ291bnQ7XG5cblx0XHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdFx0KE51bWJlcihpbnB1dFN5bWJvbCkgPiAxICYmIHRoaXMubGVhZFplcm9EYXRlVGltZSkgfHxcblx0XHRcdFx0XHRcdFx0d2l0aG91dERheXMgfHxcblx0XHRcdFx0XHRcdFx0ZGF5MW1vbnRoSW5wdXQgfHxcblx0XHRcdFx0XHRcdFx0ZGF5Mm1vbnRoSW5wdXQgfHxcblx0XHRcdFx0XHRcdFx0ZGF5MW1vbnRoUGFzdGUgfHxcblx0XHRcdFx0XHRcdFx0ZGF5Mm1vbnRoUGFzdGVcblx0XHRcdFx0XHRcdCkge1xuXHRcdFx0XHRcdFx0XHRjdXJzb3IgKz0gMTtcblx0XHRcdFx0XHRcdFx0dGhpcy5fc2hpZnRTdGVwKG1hc2tFeHByZXNzaW9uLCBjdXJzb3IsIGlucHV0QXJyYXkubGVuZ3RoKTtcblx0XHRcdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHRcdFx0XHRpZiAodGhpcy5sZWFkWmVyb0RhdGVUaW1lKSB7XG5cdFx0XHRcdFx0XHRcdFx0cmVzdWx0ICs9ICcwJztcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0XHRjb250aW51ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0cmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuXHRcdFx0XHRcdGN1cnNvcisrO1xuXHRcdFx0XHR9IGVsc2UgaWYgKGlucHV0U3ltYm9sID09PSAnICcgJiYgbWFza0V4cHJlc3Npb25bY3Vyc29yXSA9PT0gJyAnKSB7XG5cdFx0XHRcdFx0cmVzdWx0ICs9IGlucHV0U3ltYm9sO1xuXHRcdFx0XHRcdGN1cnNvcisrO1xuXHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YobWFza0V4cHJlc3Npb25bY3Vyc29yXSEpICE9PSAtMSkge1xuXHRcdFx0XHRcdHJlc3VsdCArPSBtYXNrRXhwcmVzc2lvbltjdXJzb3JdO1xuXHRcdFx0XHRcdGN1cnNvcisrO1xuXHRcdFx0XHRcdHRoaXMuX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbiwgY3Vyc29yLCBpbnB1dEFycmF5Lmxlbmd0aCk7XG5cdFx0XHRcdFx0aS0tO1xuXHRcdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHRcdHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmluZGV4T2YoaW5wdXRTeW1ib2wpID4gLTEgJiZcblx0XHRcdFx0XHR0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdIV0gJiZcblx0XHRcdFx0XHR0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrRXhwcmVzc2lvbltjdXJzb3JdIV0/Lm9wdGlvbmFsXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdCEhaW5wdXRBcnJheVtjdXJzb3JdICYmXG5cdFx0XHRcdFx0XHRtYXNrRXhwcmVzc2lvbiAhPT0gJzA5OS4wOTkuMDk5LjA5OScgJiZcblx0XHRcdFx0XHRcdG1hc2tFeHByZXNzaW9uICE9PSAnMDAwLjAwMC4wMDAtMDAnICYmXG5cdFx0XHRcdFx0XHRtYXNrRXhwcmVzc2lvbiAhPT0gJzAwLjAwMC4wMDAvMDAwMC0wMCcgJiZcblx0XHRcdFx0XHRcdCFtYXNrRXhwcmVzc2lvbi5tYXRjaCgvXjkrXFwuMCskLylcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdHJlc3VsdCArPSBpbnB1dEFycmF5W2N1cnNvcl07XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGN1cnNvcisrO1xuXHRcdFx0XHRcdGktLTtcblx0XHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0XHR0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnKicgJiZcblx0XHRcdFx0XHR0aGlzLl9maW5kU3BlY2lhbENoYXIodGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSEpICYmXG5cdFx0XHRcdFx0dGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxuXHRcdFx0XHRcdG11bHRpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGN1cnNvciArPSAzO1xuXHRcdFx0XHRcdHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcblx0XHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0XHR0aGlzLm1hc2tFeHByZXNzaW9uW2N1cnNvciArIDFdID09PSAnPycgJiZcblx0XHRcdFx0XHR0aGlzLl9maW5kU3BlY2lhbENoYXIodGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSEpICYmXG5cdFx0XHRcdFx0dGhpcy5fZmluZFNwZWNpYWxDaGFyKGlucHV0U3ltYm9sKSA9PT0gdGhpcy5tYXNrRXhwcmVzc2lvbltjdXJzb3IgKyAyXSAmJlxuXHRcdFx0XHRcdG11bHRpXG5cdFx0XHRcdCkge1xuXHRcdFx0XHRcdGN1cnNvciArPSAzO1xuXHRcdFx0XHRcdHJlc3VsdCArPSBpbnB1dFN5bWJvbDtcblx0XHRcdFx0fSBlbHNlIGlmIChcblx0XHRcdFx0XHR0aGlzLnNob3dNYXNrVHlwZWQgJiZcblx0XHRcdFx0XHR0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmRleE9mKGlucHV0U3ltYm9sKSA8IDAgJiZcblx0XHRcdFx0XHRpbnB1dFN5bWJvbCAhPT0gdGhpcy5wbGFjZUhvbGRlckNoYXJhY3RlclxuXHRcdFx0XHQpIHtcblx0XHRcdFx0XHRzdGVwQmFjayA9IHRydWU7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0aWYgKFxuXHRcdFx0cmVzdWx0Lmxlbmd0aCArIDEgPT09IG1hc2tFeHByZXNzaW9uLmxlbmd0aCAmJlxuXHRcdFx0dGhpcy5tYXNrU3BlY2lhbENoYXJhY3RlcnMuaW5kZXhPZihtYXNrRXhwcmVzc2lvblttYXNrRXhwcmVzc2lvbi5sZW5ndGggLSAxXSEpICE9PSAtMVxuXHRcdCkge1xuXHRcdFx0cmVzdWx0ICs9IG1hc2tFeHByZXNzaW9uW21hc2tFeHByZXNzaW9uLmxlbmd0aCAtIDFdO1xuXHRcdH1cblxuXHRcdGxldCBuZXdQb3NpdGlvbjogbnVtYmVyID0gcG9zaXRpb24gKyAxO1xuXG5cdFx0d2hpbGUgKHRoaXMuX3NoaWZ0LmhhcyhuZXdQb3NpdGlvbikpIHtcblx0XHRcdHNoaWZ0Kys7XG5cdFx0XHRuZXdQb3NpdGlvbisrO1xuXHRcdH1cblxuXHRcdGxldCBhY3R1YWxTaGlmdDogbnVtYmVyID1cblx0XHRcdGp1c3RQYXN0ZWQgJiYgIW1hc2tFeHByZXNzaW9uLnN0YXJ0c1dpdGgoJ3NlcGFyYXRvcicpXG5cdFx0XHRcdD8gY3Vyc29yXG5cdFx0XHRcdDogdGhpcy5fc2hpZnQuaGFzKHBvc2l0aW9uKVxuXHRcdFx0XHQ/IHNoaWZ0XG5cdFx0XHRcdDogMDtcblx0XHRpZiAoc3RlcEJhY2spIHtcblx0XHRcdGFjdHVhbFNoaWZ0LS07XG5cdFx0fVxuXG5cdFx0Y2IoYWN0dWFsU2hpZnQsIGJhY2tzcGFjZVNoaWZ0KTtcblx0XHRpZiAoc2hpZnQgPCAwKSB7XG5cdFx0XHR0aGlzLl9zaGlmdC5jbGVhcigpO1xuXHRcdH1cblx0XHRsZXQgb25seVNwZWNpYWwgPSBmYWxzZTtcblx0XHRpZiAoYmFja3NwYWNlZCkge1xuXHRcdFx0b25seVNwZWNpYWwgPSBpbnB1dEFycmF5LmV2ZXJ5KChjaGFyKSA9PiB0aGlzLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhjaGFyKSk7XG5cdFx0fVxuXHRcdGxldCByZXMgPSBgJHt0aGlzLnByZWZpeH0ke29ubHlTcGVjaWFsID8gJycgOiByZXN1bHR9JHt0aGlzLnN1ZmZpeH1gO1xuXHRcdGlmIChyZXN1bHQubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXMgPSBgJHt0aGlzLnByZWZpeH0ke3Jlc3VsdH1gO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzO1xuXHR9XG5cblx0cHVibGljIF9maW5kU3BlY2lhbENoYXIoaW5wdXRTeW1ib2w6IHN0cmluZyk6IHVuZGVmaW5lZCB8IHN0cmluZyB7XG5cdFx0cmV0dXJuIHRoaXMubWFza1NwZWNpYWxDaGFyYWN0ZXJzLmZpbmQoKHZhbDogc3RyaW5nKSA9PiB2YWwgPT09IGlucHV0U3ltYm9sKTtcblx0fVxuXG5cdHByb3RlY3RlZCBfY2hlY2tTeW1ib2xNYXNrKGlucHV0U3ltYm9sOiBzdHJpbmcsIG1hc2tTeW1ib2w6IHN0cmluZyk6IGJvb2xlYW4ge1xuXHRcdHRoaXMubWFza0F2YWlsYWJsZVBhdHRlcm5zID0gdGhpcy5jdXN0b21QYXR0ZXJuXG5cdFx0XHQ/IHRoaXMuY3VzdG9tUGF0dGVyblxuXHRcdFx0OiB0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJucztcblx0XHRyZXR1cm4gKFxuXHRcdFx0dGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza1N5bWJvbF0hICYmXG5cdFx0XHR0aGlzLm1hc2tBdmFpbGFibGVQYXR0ZXJuc1ttYXNrU3ltYm9sXSEucGF0dGVybiAmJlxuXHRcdFx0dGhpcy5tYXNrQXZhaWxhYmxlUGF0dGVybnNbbWFza1N5bWJvbF0hLnBhdHRlcm4udGVzdChpbnB1dFN5bWJvbClcblx0XHQpO1xuXHR9XG5cblx0cHJpdmF0ZSBfZm9ybWF0V2l0aFNlcGFyYXRvcnMgPSAoXG5cdFx0c3RyOiBzdHJpbmcsXG5cdFx0dGhvdXNhbmRTZXBhcmF0b3JDaGFyOiBzdHJpbmcsXG5cdFx0ZGVjaW1hbENoYXJzOiBzdHJpbmcgfCBzdHJpbmdbXSxcblx0XHRwcmVjaXNpb246IG51bWJlcixcblx0KSA9PiB7XG5cdFx0bGV0IHg6IHN0cmluZ1tdID0gW107XG5cdFx0bGV0IGRlY2ltYWxDaGFyOiBzdHJpbmcgPSAnJztcblx0XHRpZiAoQXJyYXkuaXNBcnJheShkZWNpbWFsQ2hhcnMpKSB7XG5cdFx0XHRjb25zdCByZWdFeHAgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHRkZWNpbWFsQ2hhcnMubWFwKCh2KSA9PiAoJ1tcXFxcXiQufD8qKygpJy5pbmRleE9mKHYpID49IDAgPyBgXFxcXCR7dn1gIDogdikpLmpvaW4oJ3wnKSxcblx0XHRcdCk7XG5cdFx0XHR4ID0gc3RyLnNwbGl0KHJlZ0V4cCk7XG5cdFx0XHRkZWNpbWFsQ2hhciA9IHN0ci5tYXRjaChyZWdFeHApPy5bMF0gPz8gJyc7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHggPSBzdHIuc3BsaXQoZGVjaW1hbENoYXJzKTtcblx0XHRcdGRlY2ltYWxDaGFyID0gZGVjaW1hbENoYXJzO1xuXHRcdH1cblx0XHRjb25zdCBkZWNpbWFsczogc3RyaW5nID0geC5sZW5ndGggPiAxID8gYCR7ZGVjaW1hbENoYXJ9JHt4WzFdfWAgOiAnJztcblx0XHRsZXQgcmVzOiBzdHJpbmcgPSB4WzBdITtcblx0XHRjb25zdCBzZXBhcmF0b3JMaW1pdDogc3RyaW5nID0gdGhpcy5zZXBhcmF0b3JMaW1pdC5yZXBsYWNlKC9cXHMvZywgJycpO1xuXHRcdGlmIChzZXBhcmF0b3JMaW1pdCAmJiArc2VwYXJhdG9yTGltaXQpIHtcblx0XHRcdGlmIChyZXNbMF0gPT09ICctJykge1xuXHRcdFx0XHRyZXMgPSBgLSR7cmVzLnNsaWNlKDEsIHJlcy5sZW5ndGgpLnNsaWNlKDAsIHNlcGFyYXRvckxpbWl0Lmxlbmd0aCl9YDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJlcyA9IHJlcy5zbGljZSgwLCBzZXBhcmF0b3JMaW1pdC5sZW5ndGgpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRjb25zdCByZ3g6IFJlZ0V4cCA9IC8oXFxkKykoXFxkezN9KS87XG5cblx0XHR3aGlsZSAodGhvdXNhbmRTZXBhcmF0b3JDaGFyICYmIHJneC50ZXN0KHJlcykpIHtcblx0XHRcdHJlcyA9IHJlcy5yZXBsYWNlKHJneCwgJyQxJyArIHRob3VzYW5kU2VwYXJhdG9yQ2hhciArICckMicpO1xuXHRcdH1cblxuXHRcdGlmIChwcmVjaXNpb24gPT09IHVuZGVmaW5lZCkge1xuXHRcdFx0cmV0dXJuIHJlcyArIGRlY2ltYWxzO1xuXHRcdH0gZWxzZSBpZiAocHJlY2lzaW9uID09PSAwKSB7XG5cdFx0XHRyZXR1cm4gcmVzO1xuXHRcdH1cblx0XHRyZXR1cm4gcmVzICsgZGVjaW1hbHMuc3Vic3RyKDAsIHByZWNpc2lvbiArIDEpO1xuXHR9O1xuXG5cdHByaXZhdGUgcGVyY2VudGFnZSA9IChzdHI6IHN0cmluZyk6IGJvb2xlYW4gPT4ge1xuXHRcdHJldHVybiBOdW1iZXIoc3RyKSA+PSAwICYmIE51bWJlcihzdHIpIDw9IDEwMDtcblx0fTtcblxuXHRwcml2YXRlIGdldFByZWNpc2lvbiA9IChtYXNrRXhwcmVzc2lvbjogc3RyaW5nKTogbnVtYmVyID0+IHtcblx0XHRjb25zdCB4OiBzdHJpbmdbXSA9IG1hc2tFeHByZXNzaW9uLnNwbGl0KCcuJyk7XG5cdFx0aWYgKHgubGVuZ3RoID4gMSkge1xuXHRcdFx0cmV0dXJuIE51bWJlcih4W3gubGVuZ3RoIC0gMV0pO1xuXHRcdH1cblxuXHRcdHJldHVybiBJbmZpbml0eTtcblx0fTtcblxuXHRwcml2YXRlIGNoZWNrQW5kUmVtb3ZlU3VmZml4ID0gKGlucHV0VmFsdWU6IHN0cmluZyk6IHN0cmluZyA9PiB7XG5cdFx0Zm9yIChsZXQgaSA9IHRoaXMuc3VmZml4Py5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuXHRcdFx0Y29uc3Qgc3Vic3RyID0gdGhpcy5zdWZmaXguc3Vic3RyKGksIHRoaXMuc3VmZml4Py5sZW5ndGgpO1xuXHRcdFx0aWYgKFxuXHRcdFx0XHRpbnB1dFZhbHVlLmluY2x1ZGVzKHN1YnN0cikgJiZcblx0XHRcdFx0KGkgLSAxIDwgMCB8fCAhaW5wdXRWYWx1ZS5pbmNsdWRlcyh0aGlzLnN1ZmZpeC5zdWJzdHIoaSAtIDEsIHRoaXMuc3VmZml4Py5sZW5ndGgpKSlcblx0XHRcdCkge1xuXHRcdFx0XHRyZXR1cm4gaW5wdXRWYWx1ZS5yZXBsYWNlKHN1YnN0ciwgJycpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaW5wdXRWYWx1ZTtcblx0fTtcblxuXHRwcml2YXRlIGNoZWNrSW5wdXRQcmVjaXNpb24gPSAoXG5cdFx0aW5wdXRWYWx1ZTogc3RyaW5nLFxuXHRcdHByZWNpc2lvbjogbnVtYmVyLFxuXHRcdGRlY2ltYWxNYXJrZXI6IElDb25maWdbJ2RlY2ltYWxNYXJrZXInXSxcblx0KTogc3RyaW5nID0+IHtcblx0XHRpZiAocHJlY2lzaW9uIDwgSW5maW5pdHkpIHtcblx0XHRcdC8vIFRPRE8gbmVlZCB0aGluayBhYm91dCBkZWNpbWFsTWFya2VyXG5cdFx0XHRpZiAoQXJyYXkuaXNBcnJheShkZWNpbWFsTWFya2VyKSkge1xuXHRcdFx0XHRjb25zdCBtYXJrZXIgPSBkZWNpbWFsTWFya2VyLmZpbmQoKGRtKSA9PiBkbSAhPT0gdGhpcy50aG91c2FuZFNlcGFyYXRvcik7XG5cdFx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0XHRkZWNpbWFsTWFya2VyID0gbWFya2VyID8gbWFya2VyIDogZGVjaW1hbE1hcmtlclswXTtcblx0XHRcdH1cblx0XHRcdGNvbnN0IHByZWNpc2lvblJlZ0V4OiBSZWdFeHAgPSBuZXcgUmVnRXhwKFxuXHRcdFx0XHR0aGlzLl9jaGFyVG9SZWdFeHBFeHByZXNzaW9uKGRlY2ltYWxNYXJrZXIpICsgYFxcXFxkeyR7cHJlY2lzaW9ufX0uKiRgLFxuXHRcdFx0KTtcblxuXHRcdFx0Y29uc3QgcHJlY2lzaW9uTWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsID0gaW5wdXRWYWx1ZS5tYXRjaChwcmVjaXNpb25SZWdFeCk7XG5cdFx0XHRpZiAocHJlY2lzaW9uTWF0Y2ggJiYgcHJlY2lzaW9uTWF0Y2hbMF0hLmxlbmd0aCAtIDEgPiBwcmVjaXNpb24pIHtcblx0XHRcdFx0Y29uc3QgZGlmZiA9IHByZWNpc2lvbk1hdGNoWzBdIS5sZW5ndGggLSAxIC0gcHJlY2lzaW9uO1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0aW5wdXRWYWx1ZSA9IGlucHV0VmFsdWUuc3Vic3RyaW5nKDAsIGlucHV0VmFsdWUubGVuZ3RoIC0gZGlmZik7XG5cdFx0XHR9XG5cdFx0XHRpZiAoXG5cdFx0XHRcdHByZWNpc2lvbiA9PT0gMCAmJlxuXHRcdFx0XHR0aGlzLl9jb21wYXJlT3JJbmNsdWRlcyhcblx0XHRcdFx0XHRpbnB1dFZhbHVlW2lucHV0VmFsdWUubGVuZ3RoIC0gMV0sXG5cdFx0XHRcdFx0ZGVjaW1hbE1hcmtlcixcblx0XHRcdFx0XHR0aGlzLnRob3VzYW5kU2VwYXJhdG9yLFxuXHRcdFx0XHQpXG5cdFx0XHQpIHtcblx0XHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRcdGlucHV0VmFsdWUgPSBpbnB1dFZhbHVlLnN1YnN0cmluZygwLCBpbnB1dFZhbHVlLmxlbmd0aCAtIDEpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gaW5wdXRWYWx1ZTtcblx0fTtcblxuXHRwcml2YXRlIF9zdHJpcFRvRGVjaW1hbChzdHI6IHN0cmluZyk6IHN0cmluZyB7XG5cdFx0cmV0dXJuIHN0clxuXHRcdFx0LnNwbGl0KCcnKVxuXHRcdFx0LmZpbHRlcigoaTogc3RyaW5nLCBpZHg6IG51bWJlcikgPT4ge1xuXHRcdFx0XHRjb25zdCBpc0RlY2ltYWxNYXJrZXIgPVxuXHRcdFx0XHRcdHR5cGVvZiB0aGlzLmRlY2ltYWxNYXJrZXIgPT09ICdzdHJpbmcnXG5cdFx0XHRcdFx0XHQ/IGkgPT09IHRoaXMuZGVjaW1hbE1hcmtlclxuXHRcdFx0XHRcdFx0OiAvLyBUT0RPIChpbmVwaXBlbmtvKSB1c2UgdXRpbGl0eSB0eXBlXG5cdFx0XHRcdFx0XHQgIHRoaXMuZGVjaW1hbE1hcmtlci5pbmNsdWRlcyhpIGFzICcsJyB8ICcuJyk7XG5cdFx0XHRcdHJldHVybiAoXG5cdFx0XHRcdFx0aS5tYXRjaCgnXi0/XFxcXGQnKSB8fFxuXHRcdFx0XHRcdGkgPT09IHRoaXMudGhvdXNhbmRTZXBhcmF0b3IgfHxcblx0XHRcdFx0XHRpc0RlY2ltYWxNYXJrZXIgfHxcblx0XHRcdFx0XHQoaSA9PT0gJy0nICYmIGlkeCA9PT0gMCAmJiB0aGlzLmFsbG93TmVnYXRpdmVOdW1iZXJzKVxuXHRcdFx0XHQpO1xuXHRcdFx0fSlcblx0XHRcdC5qb2luKCcnKTtcblx0fVxuXG5cdHByaXZhdGUgX2NoYXJUb1JlZ0V4cEV4cHJlc3Npb24oY2hhcjogc3RyaW5nKTogc3RyaW5nIHtcblx0XHQvLyBpZiAoQXJyYXkuaXNBcnJheShjaGFyKSkge1xuXHRcdC8vIFx0cmV0dXJuIGNoYXIubWFwKCh2KSA9PiAoJ1tcXFxcXiQufD8qKygpJy5pbmRleE9mKHYpID49IDAgPyBgXFxcXCR7dn1gIDogdikpLmpvaW4oJ3wnKTtcblx0XHQvLyB9XG5cdFx0aWYgKGNoYXIpIHtcblx0XHRcdGNvbnN0IGNoYXJzVG9Fc2NhcGUgPSAnW1xcXFxeJC58PyorKCknO1xuXHRcdFx0cmV0dXJuIGNoYXIgPT09ICcgJyA/ICdcXFxccycgOiBjaGFyc1RvRXNjYXBlLmluZGV4T2YoY2hhcikgPj0gMCA/IGBcXFxcJHtjaGFyfWAgOiBjaGFyO1xuXHRcdH1cblx0XHRyZXR1cm4gY2hhcjtcblx0fVxuXG5cdHByaXZhdGUgX3NoaWZ0U3RlcChtYXNrRXhwcmVzc2lvbjogc3RyaW5nLCBjdXJzb3I6IG51bWJlciwgaW5wdXRMZW5ndGg6IG51bWJlcikge1xuXHRcdGNvbnN0IHNoaWZ0U3RlcDogbnVtYmVyID0gL1sqP10vZy50ZXN0KG1hc2tFeHByZXNzaW9uLnNsaWNlKDAsIGN1cnNvcikpID8gaW5wdXRMZW5ndGggOiBjdXJzb3I7XG5cdFx0dGhpcy5fc2hpZnQuYWRkKHNoaWZ0U3RlcCArIHRoaXMucHJlZml4Lmxlbmd0aCB8fCAwKTtcblx0fVxuXG5cdHByb3RlY3RlZCBfY29tcGFyZU9ySW5jbHVkZXM8VD4odmFsdWU6IFQsIGNvbXBhcmVkVmFsdWU6IFQgfCBUW10sIGV4Y2x1ZGVkVmFsdWU6IFQpOiBib29sZWFuIHtcblx0XHRyZXR1cm4gQXJyYXkuaXNBcnJheShjb21wYXJlZFZhbHVlKVxuXHRcdFx0PyBjb21wYXJlZFZhbHVlLmZpbHRlcigodikgPT4gdiAhPT0gZXhjbHVkZWRWYWx1ZSkuaW5jbHVkZXModmFsdWUpXG5cdFx0XHQ6IHZhbHVlID09PSBjb21wYXJlZFZhbHVlO1xuXHR9XG5cblx0cHJpdmF0ZSBfdmFsaWRJUCh2YWx1ZXNJUDogc3RyaW5nW10pOiBib29sZWFuIHtcblx0XHRyZXR1cm4gIShcblx0XHRcdHZhbHVlc0lQLmxlbmd0aCA9PT0gNCAmJlxuXHRcdFx0IXZhbHVlc0lQLnNvbWUoKHZhbHVlOiBzdHJpbmcsIGluZGV4OiBudW1iZXIpID0+IHtcblx0XHRcdFx0aWYgKHZhbHVlc0lQLmxlbmd0aCAhPT0gaW5kZXggKyAxKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHZhbHVlID09PSAnJyB8fCBOdW1iZXIodmFsdWUpID4gMjU1O1xuXHRcdFx0XHR9XG5cdFx0XHRcdHJldHVybiB2YWx1ZSA9PT0gJycgfHwgTnVtYmVyKHZhbHVlLnN1YnN0cmluZygwLCAzKSkgPiAyNTU7XG5cdFx0XHR9KVxuXHRcdCk7XG5cdH1cbn1cbiJdfQ==