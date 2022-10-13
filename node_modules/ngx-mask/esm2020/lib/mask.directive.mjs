import { NG_VALIDATORS, NG_VALUE_ACCESSOR, } from '@angular/forms';
import { Directive, EventEmitter, forwardRef, HostListener, Inject, Input, Output, } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { config, timeMasks, withoutValidation } from './config';
import { MaskService } from './mask.service';
import * as i0 from "@angular/core";
import * as i1 from "./mask.service";
export class MaskDirective {
    constructor(document, _maskService, _config) {
        this.document = document;
        this._maskService = _maskService;
        this._config = _config;
        // eslint-disable-next-line @angular-eslint/no-input-rename
        this.maskExpression = '';
        this.specialCharacters = [];
        this.patterns = {};
        this.prefix = '';
        this.suffix = '';
        this.thousandSeparator = ' ';
        this.decimalMarker = '.';
        this.dropSpecialCharacters = null;
        this.hiddenInput = null;
        this.showMaskTyped = null;
        this.placeHolderCharacter = null;
        this.shownMaskExpression = null;
        this.showTemplate = null;
        this.clearIfNotMatch = null;
        this.validation = null;
        this.separatorLimit = null;
        this.allowNegativeNumbers = null;
        this.leadZeroDateTime = null;
        this.triggerOnMaskChange = null;
        this.maskFilled = new EventEmitter();
        this._maskValue = '';
        this._position = null;
        this._maskExpressionArray = [];
        this._justPasted = false;
        this.onChange = (_) => { };
        this.onTouch = () => { };
    }
    ngOnChanges(changes) {
        const { maskExpression, specialCharacters, patterns, prefix, suffix, thousandSeparator, decimalMarker, dropSpecialCharacters, hiddenInput, showMaskTyped, placeHolderCharacter, shownMaskExpression, showTemplate, clearIfNotMatch, validation, separatorLimit, allowNegativeNumbers, leadZeroDateTime, triggerOnMaskChange, } = changes;
        if (maskExpression) {
            if (maskExpression.currentValue !== maskExpression.previousValue &&
                !maskExpression.firstChange) {
                this._maskService.maskChanged = true;
            }
            if (maskExpression.currentValue && maskExpression.currentValue.split('||').length > 1) {
                this._maskExpressionArray = maskExpression.currentValue
                    .split('||')
                    .sort((a, b) => {
                    return a.length - b.length;
                });
                this._setMask();
            }
            else {
                this._maskExpressionArray = [];
                this._maskValue = maskExpression.currentValue || '';
                this._maskService.maskExpression = this._maskValue;
            }
        }
        if (specialCharacters) {
            if (!specialCharacters.currentValue || !Array.isArray(specialCharacters.currentValue)) {
                return;
            }
            else {
                this._maskService.maskSpecialCharacters = specialCharacters.currentValue || [];
            }
        }
        // Only overwrite the mask available patterns if a pattern has actually been passed in
        if (patterns && patterns.currentValue) {
            this._maskService.maskAvailablePatterns = patterns.currentValue;
        }
        if (prefix) {
            this._maskService.prefix = prefix.currentValue;
        }
        if (suffix) {
            this._maskService.suffix = suffix.currentValue;
        }
        if (thousandSeparator) {
            this._maskService.thousandSeparator = thousandSeparator.currentValue;
        }
        if (decimalMarker) {
            this._maskService.decimalMarker = decimalMarker.currentValue;
        }
        if (dropSpecialCharacters) {
            this._maskService.dropSpecialCharacters = dropSpecialCharacters.currentValue;
        }
        if (hiddenInput) {
            this._maskService.hiddenInput = hiddenInput.currentValue;
        }
        if (showMaskTyped) {
            this._maskService.showMaskTyped = showMaskTyped.currentValue;
        }
        if (placeHolderCharacter) {
            this._maskService.placeHolderCharacter = placeHolderCharacter.currentValue;
        }
        if (shownMaskExpression) {
            this._maskService.shownMaskExpression = shownMaskExpression.currentValue;
        }
        if (showTemplate) {
            this._maskService.showTemplate = showTemplate.currentValue;
        }
        if (clearIfNotMatch) {
            this._maskService.clearIfNotMatch = clearIfNotMatch.currentValue;
        }
        if (validation) {
            this._maskService.validation = validation.currentValue;
        }
        if (separatorLimit) {
            this._maskService.separatorLimit = separatorLimit.currentValue;
        }
        if (allowNegativeNumbers) {
            this._maskService.allowNegativeNumbers = allowNegativeNumbers.currentValue;
            if (this._maskService.allowNegativeNumbers) {
                this._maskService.maskSpecialCharacters = this._maskService.maskSpecialCharacters.filter((c) => c !== '-');
            }
        }
        if (leadZeroDateTime) {
            this._maskService.leadZeroDateTime = leadZeroDateTime.currentValue;
        }
        if (triggerOnMaskChange) {
            this._maskService.triggerOnMaskChange = triggerOnMaskChange.currentValue;
        }
        this._applyMask();
    }
    // eslint-disable-next-line complexity
    validate({ value }) {
        if (!this._maskService.validation || !this._maskValue) {
            return null;
        }
        if (this._maskService.ipError) {
            return this._createValidationError(value);
        }
        if (this._maskService.cpfCnpjError) {
            return this._createValidationError(value);
        }
        if (this._maskValue.startsWith('separator')) {
            return null;
        }
        if (withoutValidation.includes(this._maskValue)) {
            return null;
        }
        if (this._maskService.clearIfNotMatch) {
            return null;
        }
        if (timeMasks.includes(this._maskValue)) {
            return this._validateTime(value);
        }
        if (value && value.toString().length >= 1) {
            let counterOfOpt = 0;
            for (const key in this._maskService.maskAvailablePatterns) {
                if (this._maskService.maskAvailablePatterns[key].optional) {
                    if (this._maskValue.indexOf(key) !== this._maskValue.lastIndexOf(key)) {
                        const opt = this._maskValue
                            .split('')
                            .filter((i) => i === key)
                            .join('');
                        counterOfOpt += opt.length;
                    }
                    else if (this._maskValue.indexOf(key) !== -1) {
                        counterOfOpt++;
                    }
                    if (this._maskValue.indexOf(key) !== -1 &&
                        value.toString().length >= this._maskValue.indexOf(key)) {
                        return null;
                    }
                    if (counterOfOpt === this._maskValue.length) {
                        return null;
                    }
                }
            }
            if (this._maskValue.indexOf('{') === 1 &&
                value.toString().length ===
                    this._maskValue.length + Number(this._maskValue.split('{')[1].split('}')[0]) - 4) {
                return null;
            }
            if (this._maskValue.indexOf('*') === 1 || this._maskValue.indexOf('?') === 1) {
                return null;
            }
            else if ((this._maskValue.indexOf('*') > 1 &&
                value.toString().length < this._maskValue.indexOf('*')) ||
                (this._maskValue.indexOf('?') > 1 &&
                    value.toString().length < this._maskValue.indexOf('?')) ||
                this._maskValue.indexOf('{') === 1) {
                return this._createValidationError(value);
            }
            if (this._maskValue.indexOf('*') === -1 || this._maskValue.indexOf('?') === -1) {
                const length = this._maskService.dropSpecialCharacters
                    ? this._maskValue.length -
                        this._maskService.checkSpecialCharAmount(this._maskValue) -
                        counterOfOpt
                    : this._maskValue.length - counterOfOpt;
                if (value.toString().length < length) {
                    return this._createValidationError(value);
                }
            }
        }
        if (value) {
            this.maskFilled.emit();
            return null;
        }
        return null;
    }
    onPaste() {
        this._justPasted = true;
    }
    onModelChange(value) {
        // on form reset we need to update the actualValue
        if ((value === '' || value === null || value === undefined) && this._maskService.actualValue) {
            this._maskService.actualValue = this._maskService.getActualValue('');
        }
    }
    onInput(e) {
        const el = e.target;
        this._inputValue = el.value;
        this._setMask();
        if (!this._maskValue) {
            this.onChange(el.value);
            return;
        }
        const position = el.selectionStart === 1
            ? el.selectionStart + this._maskService.prefix.length
            : el.selectionStart;
        let caretShift = 0;
        let backspaceShift = false;
        this._maskService.applyValueChanges(position, this._justPasted, this._code === 'Backspace' || this._code === 'Delete', (shift, _backspaceShift) => {
            this._justPasted = false;
            caretShift = shift;
            backspaceShift = _backspaceShift;
        });
        // only set the selection if the element is active
        if (this._getActiveElement() !== el) {
            return;
        }
        this._position = this._position === 1 && this._inputValue.length === 1 ? null : this._position;
        let positionToApply = this._position
            ? this._inputValue.length + position + caretShift
            : position + (this._code === 'Backspace' && !backspaceShift ? 0 : caretShift);
        if (positionToApply > this._getActualInputLength()) {
            positionToApply = this._getActualInputLength();
        }
        if (positionToApply < 0) {
            positionToApply = 0;
        }
        el.setSelectionRange(positionToApply, positionToApply);
        this._position = null;
    }
    onBlur() {
        if (this._maskValue) {
            this._maskService.clearIfNotMatchFn();
        }
        this.onTouch();
    }
    onClick(e) {
        if (!this._maskValue) {
            return;
        }
        const el = e.target;
        const posStart = 0;
        const posEnd = 0;
        if (el !== null &&
            el.selectionStart !== null &&
            el.selectionStart === el.selectionEnd &&
            el.selectionStart > this._maskService.prefix.length &&
            // eslint-disable-next-line
            e.keyCode !== 38) {
            if (this._maskService.showMaskTyped) {
                // We are showing the mask in the input
                this._maskService.maskIsShown = this._maskService.showMaskInInput();
                if (el.setSelectionRange &&
                    this._maskService.prefix + this._maskService.maskIsShown === el.value) {
                    // the input ONLY contains the mask, so position the cursor at the start
                    el.focus();
                    el.setSelectionRange(posStart, posEnd);
                }
                else {
                    // the input contains some characters already
                    if (el.selectionStart > this._maskService.actualValue.length) {
                        // if the user clicked beyond our value's length, position the cursor at the end of our value
                        el.setSelectionRange(this._maskService.actualValue.length, this._maskService.actualValue.length);
                    }
                }
            }
        }
        const nextValue = !el.value || el.value === this._maskService.prefix
            ? this._maskService.prefix + this._maskService.maskIsShown
            : el.value;
        /** Fix of cursor position jumping to end in most browsers no matter where cursor is inserted onFocus */
        if (el.value !== nextValue) {
            el.value = nextValue;
        }
        /** fix of cursor position with prefix when mouse click occur */
        if ((el.selectionStart || el.selectionEnd) <=
            this._maskService.prefix.length) {
            el.selectionStart = this._maskService.prefix.length;
            return;
        }
        /** select only inserted text */
        if (el.selectionEnd > this._getActualInputLength()) {
            el.selectionEnd = this._getActualInputLength();
        }
    }
    // eslint-disable-next-line complexity
    onKeyDown(e) {
        if (!this._maskValue) {
            return;
        }
        this._code = e.code ? e.code : e.key;
        const el = e.target;
        this._inputValue = el.value;
        this._setMask();
        if (e.keyCode === 38) {
            e.preventDefault();
        }
        if (e.keyCode === 37 || e.keyCode === 8 || e.keyCode === 46) {
            if (e.keyCode === 8 && el.value.length === 0) {
                el.selectionStart = el.selectionEnd;
            }
            if (e.keyCode === 8 && el.selectionStart !== 0) {
                // If specialChars is false, (shouldn't ever happen) then set to the defaults
                this.specialCharacters = this.specialCharacters?.length
                    ? this.specialCharacters
                    : this._config.specialCharacters;
                if (this.prefix.length > 1 && el.selectionStart <= this.prefix.length) {
                    el.setSelectionRange(this.prefix.length, el.selectionEnd);
                }
                else {
                    if (this._inputValue.length !== el.selectionStart &&
                        el.selectionStart !== 1) {
                        while (this.specialCharacters.includes(this._inputValue[el.selectionStart - 1].toString()) &&
                            ((this.prefix.length >= 1 && el.selectionStart > this.prefix.length) ||
                                this.prefix.length === 0)) {
                            el.setSelectionRange(el.selectionStart - 1, el.selectionEnd);
                        }
                    }
                }
            }
            this.checkSelectionOnDeletion(el);
            if (this._maskService.prefix.length &&
                el.selectionStart <= this._maskService.prefix.length &&
                el.selectionEnd <= this._maskService.prefix.length) {
                e.preventDefault();
            }
            const cursorStart = el.selectionStart;
            if (e.keyCode === 8 &&
                !el.readOnly &&
                cursorStart === 0 &&
                el.selectionEnd === el.value.length &&
                el.value.length !== 0) {
                this._position = this._maskService.prefix ? this._maskService.prefix.length : 0;
                this._maskService.applyMask(this._maskService.prefix, this._maskService.maskExpression, this._position);
            }
        }
        if (!!this.suffix &&
            this.suffix.length > 1 &&
            this._inputValue.length - this.suffix.length < el.selectionStart) {
            el.setSelectionRange(this._inputValue.length - this.suffix.length, this._inputValue.length);
        }
        else if ((e.keyCode === 65 && e.ctrlKey) ||
            (e.keyCode === 65 && e.metaKey) // Cmd + A (Mac)
        ) {
            el.setSelectionRange(0, this._getActualInputLength());
            e.preventDefault();
        }
        this._maskService.selStart = el.selectionStart;
        this._maskService.selEnd = el.selectionEnd;
    }
    /** It writes the value in the input */
    async writeValue(inputValue) {
        if (typeof inputValue === 'object' && inputValue !== null && 'value' in inputValue) {
            if ('disable' in inputValue) {
                this.setDisabledState(Boolean(inputValue.disable));
            }
            // eslint-disable-next-line no-param-reassign
            inputValue = inputValue.value;
        }
        if (typeof inputValue === 'number' || this._maskValue.startsWith('separator')) {
            // eslint-disable-next-line no-param-reassign
            inputValue = this._maskService.numberToString(inputValue);
            if (!Array.isArray(this.decimalMarker)) {
                // eslint-disable-next-line no-param-reassign
                inputValue =
                    this.decimalMarker !== '.' ? inputValue.replace('.', this.decimalMarker) : inputValue;
            }
            this._maskService.isNumberValue = true;
        }
        if (typeof inputValue !== 'string') {
            // eslint-disable-next-line no-param-reassign
            inputValue = '';
        }
        this._inputValue = inputValue;
        this._setMask();
        if ((inputValue && this._maskService.maskExpression) ||
            (this._maskService.maskExpression &&
                (this._maskService.prefix || this._maskService.showMaskTyped))) {
            // Let the service we know we are writing value so that triggering onChange function wont happen during applyMask
            this._maskService.writingValue = true;
            this._maskService.formElementProperty = [
                'value',
                this._maskService.applyMask(inputValue, this._maskService.maskExpression),
            ];
            // Let the service know we've finished writing value
            this._maskService.writingValue = false;
        }
        else {
            this._maskService.formElementProperty = ['value', inputValue];
        }
        this._inputValue = inputValue;
    }
    registerOnChange(fn) {
        this._maskService.onChange = this.onChange = fn;
    }
    registerOnTouched(fn) {
        this.onTouch = fn;
    }
    _getActiveElement(document = this.document) {
        const shadowRootEl = document?.activeElement?.shadowRoot;
        if (!shadowRootEl?.activeElement) {
            return document.activeElement;
        }
        else {
            return this._getActiveElement(shadowRootEl);
        }
    }
    checkSelectionOnDeletion(el) {
        el.selectionStart = Math.min(Math.max(this.prefix.length, el.selectionStart), this._inputValue.length - this.suffix.length);
        el.selectionEnd = Math.min(Math.max(this.prefix.length, el.selectionEnd), this._inputValue.length - this.suffix.length);
    }
    /** It disables the input element */
    setDisabledState(isDisabled) {
        this._maskService.formElementProperty = ['disabled', isDisabled];
    }
    _repeatPatternSymbols(maskExp) {
        return ((maskExp.match(/{[0-9]+}/) &&
            maskExp.split('').reduce((accum, currval, index) => {
                this._start = currval === '{' ? index : this._start;
                if (currval !== '}') {
                    return this._maskService._findSpecialChar(currval) ? accum + currval : accum;
                }
                this._end = index;
                const repeatNumber = Number(maskExp.slice(this._start + 1, this._end));
                const replaceWith = new Array(repeatNumber + 1).join(maskExp[this._start - 1]);
                return accum + replaceWith;
            }, '')) ||
            maskExp);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _applyMask() {
        this._maskService.maskExpression = this._repeatPatternSymbols(this._maskValue || '');
        this._maskService.formElementProperty = [
            'value',
            this._maskService.applyMask(this._inputValue, this._maskService.maskExpression),
        ];
    }
    _validateTime(value) {
        const rowMaskLen = this._maskValue.split('').filter((s) => s !== ':').length;
        if (!value) {
            return null; // Don't validate empty values to allow for optional form control
        }
        if ((+value[value.length - 1] === 0 && value.length < rowMaskLen) ||
            value.length <= rowMaskLen - 2) {
            return this._createValidationError(value);
        }
        return null;
    }
    _getActualInputLength() {
        return (this._maskService.actualValue.length ||
            this._maskService.actualValue.length + this._maskService.prefix.length);
    }
    _createValidationError(actualValue) {
        return {
            mask: {
                requiredMask: this._maskValue,
                actualValue,
            },
        };
    }
    _setMask() {
        if (this._maskExpressionArray.length > 0) {
            this._maskExpressionArray.some((mask) => {
                const test = this._maskService.removeMask(this._inputValue)?.length <=
                    this._maskService.removeMask(mask)?.length;
                if (this._inputValue && test) {
                    this._maskValue = mask;
                    this.maskExpression = mask;
                    this._maskService.maskExpression = mask;
                    return test;
                }
                else {
                    this._maskValue = this._maskExpressionArray[this._maskExpressionArray.length - 1];
                    this.maskExpression = this._maskExpressionArray[this._maskExpressionArray.length - 1];
                    this._maskService.maskExpression =
                        this._maskExpressionArray[this._maskExpressionArray.length - 1];
                }
            });
        }
    }
}
MaskDirective.ɵfac = i0.ɵɵngDeclareFactory({ minVersion: "12.0.0", version: "14.2.1", ngImport: i0, type: MaskDirective, deps: [{ token: DOCUMENT }, { token: i1.MaskService }, { token: config }], target: i0.ɵɵFactoryTarget.Directive });
MaskDirective.ɵdir = i0.ɵɵngDeclareDirective({ minVersion: "14.0.0", version: "14.2.1", type: MaskDirective, selector: "input[mask], textarea[mask]", inputs: { maskExpression: ["mask", "maskExpression"], specialCharacters: "specialCharacters", patterns: "patterns", prefix: "prefix", suffix: "suffix", thousandSeparator: "thousandSeparator", decimalMarker: "decimalMarker", dropSpecialCharacters: "dropSpecialCharacters", hiddenInput: "hiddenInput", showMaskTyped: "showMaskTyped", placeHolderCharacter: "placeHolderCharacter", shownMaskExpression: "shownMaskExpression", showTemplate: "showTemplate", clearIfNotMatch: "clearIfNotMatch", validation: "validation", separatorLimit: "separatorLimit", allowNegativeNumbers: "allowNegativeNumbers", leadZeroDateTime: "leadZeroDateTime", triggerOnMaskChange: "triggerOnMaskChange" }, outputs: { maskFilled: "maskFilled" }, host: { listeners: { "paste": "onPaste()", "ngModelChange": "onModelChange($event)", "input": "onInput($event)", "blur": "onBlur()", "click": "onClick($event)", "keydown": "onKeyDown($event)" } }, providers: [
        {
            provide: NG_VALUE_ACCESSOR,
            useExisting: forwardRef(() => MaskDirective),
            multi: true,
        },
        {
            provide: NG_VALIDATORS,
            useExisting: forwardRef(() => MaskDirective),
            multi: true,
        },
        MaskService,
    ], exportAs: ["mask", "ngxMask"], usesOnChanges: true, ngImport: i0 });
i0.ɵɵngDeclareClassMetadata({ minVersion: "12.0.0", version: "14.2.1", ngImport: i0, type: MaskDirective, decorators: [{
            type: Directive,
            args: [{
                    selector: 'input[mask], textarea[mask]',
                    providers: [
                        {
                            provide: NG_VALUE_ACCESSOR,
                            useExisting: forwardRef(() => MaskDirective),
                            multi: true,
                        },
                        {
                            provide: NG_VALIDATORS,
                            useExisting: forwardRef(() => MaskDirective),
                            multi: true,
                        },
                        MaskService,
                    ],
                    exportAs: 'mask,ngxMask',
                }]
        }], ctorParameters: function () { return [{ type: undefined, decorators: [{
                    type: Inject,
                    args: [DOCUMENT]
                }] }, { type: i1.MaskService }, { type: undefined, decorators: [{
                    type: Inject,
                    args: [config]
                }] }]; }, propDecorators: { maskExpression: [{
                type: Input,
                args: ['mask']
            }], specialCharacters: [{
                type: Input
            }], patterns: [{
                type: Input
            }], prefix: [{
                type: Input
            }], suffix: [{
                type: Input
            }], thousandSeparator: [{
                type: Input
            }], decimalMarker: [{
                type: Input
            }], dropSpecialCharacters: [{
                type: Input
            }], hiddenInput: [{
                type: Input
            }], showMaskTyped: [{
                type: Input
            }], placeHolderCharacter: [{
                type: Input
            }], shownMaskExpression: [{
                type: Input
            }], showTemplate: [{
                type: Input
            }], clearIfNotMatch: [{
                type: Input
            }], validation: [{
                type: Input
            }], separatorLimit: [{
                type: Input
            }], allowNegativeNumbers: [{
                type: Input
            }], leadZeroDateTime: [{
                type: Input
            }], triggerOnMaskChange: [{
                type: Input
            }], maskFilled: [{
                type: Output
            }], onPaste: [{
                type: HostListener,
                args: ['paste']
            }], onModelChange: [{
                type: HostListener,
                args: ['ngModelChange', ['$event']]
            }], onInput: [{
                type: HostListener,
                args: ['input', ['$event']]
            }], onBlur: [{
                type: HostListener,
                args: ['blur']
            }], onClick: [{
                type: HostListener,
                args: ['click', ['$event']]
            }], onKeyDown: [{
                type: HostListener,
                args: ['keydown', ['$event']]
            }] } });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFzay5kaXJlY3RpdmUuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi8uLi9wcm9qZWN0cy9uZ3gtbWFzay1saWIvc3JjL2xpYi9tYXNrLmRpcmVjdGl2ZS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxPQUFPLEVBRU4sYUFBYSxFQUNiLGlCQUFpQixHQUlqQixNQUFNLGdCQUFnQixDQUFDO0FBQ3hCLE9BQU8sRUFDTixTQUFTLEVBQ1QsWUFBWSxFQUNaLFVBQVUsRUFDVixZQUFZLEVBQ1osTUFBTSxFQUNOLEtBQUssRUFFTCxNQUFNLEdBRU4sTUFBTSxlQUFlLENBQUM7QUFDdkIsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlCQUFpQixDQUFDO0FBRzNDLE9BQU8sRUFBRSxNQUFNLEVBQVcsU0FBUyxFQUFFLGlCQUFpQixFQUFFLE1BQU0sVUFBVSxDQUFDO0FBQ3pFLE9BQU8sRUFBRSxXQUFXLEVBQUUsTUFBTSxnQkFBZ0IsQ0FBQzs7O0FBbUI3QyxNQUFNLE9BQU8sYUFBYTtJQTBEekIsWUFDMkIsUUFBYSxFQUNoQyxZQUF5QixFQUNOLE9BQWdCO1FBRmhCLGFBQVEsR0FBUixRQUFRLENBQUs7UUFDaEMsaUJBQVksR0FBWixZQUFZLENBQWE7UUFDTixZQUFPLEdBQVAsT0FBTyxDQUFTO1FBNUQzQywyREFBMkQ7UUFDckMsbUJBQWMsR0FBVyxFQUFFLENBQUM7UUFFbEMsc0JBQWlCLEdBQWlDLEVBQUUsQ0FBQztRQUVyRCxhQUFRLEdBQXdCLEVBQUUsQ0FBQztRQUVuQyxXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUUvQixXQUFNLEdBQXNCLEVBQUUsQ0FBQztRQUUvQixzQkFBaUIsR0FBaUMsR0FBRyxDQUFDO1FBRXRELGtCQUFhLEdBQTZCLEdBQUcsQ0FBQztRQUU5QywwQkFBcUIsR0FBNEMsSUFBSSxDQUFDO1FBRXRFLGdCQUFXLEdBQWtDLElBQUksQ0FBQztRQUVsRCxrQkFBYSxHQUFvQyxJQUFJLENBQUM7UUFFdEQs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LE1BQU07c0JBRFosWUFBWTt1QkFBQyxNQUFNO2dCQVNiLE9BQU87c0JBRGIsWUFBWTt1QkFBQyxPQUFPLEVBQUUsQ0FBQyxRQUFRLENBQUM7Z0JBK0QxQixTQUFTO3NCQURmLFlBQVk7dUJBQUMsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcblx0Q29udHJvbFZhbHVlQWNjZXNzb3IsXG5cdE5HX1ZBTElEQVRPUlMsXG5cdE5HX1ZBTFVFX0FDQ0VTU09SLFxuXHRWYWxpZGF0aW9uRXJyb3JzLFxuXHRWYWxpZGF0b3IsXG5cdEZvcm1Db250cm9sLFxufSBmcm9tICdAYW5ndWxhci9mb3Jtcyc7XG5pbXBvcnQge1xuXHREaXJlY3RpdmUsXG5cdEV2ZW50RW1pdHRlcixcblx0Zm9yd2FyZFJlZixcblx0SG9zdExpc3RlbmVyLFxuXHRJbmplY3QsXG5cdElucHV0LFxuXHRPbkNoYW5nZXMsXG5cdE91dHB1dCxcblx0U2ltcGxlQ2hhbmdlcyxcbn0gZnJvbSAnQGFuZ3VsYXIvY29yZSc7XG5pbXBvcnQgeyBET0NVTUVOVCB9IGZyb20gJ0Bhbmd1bGFyL2NvbW1vbic7XG5cbmltcG9ydCB7IEN1c3RvbUtleWJvYXJkRXZlbnQgfSBmcm9tICcuL2N1c3RvbS1rZXlib2FyZC1ldmVudCc7XG5pbXBvcnQgeyBjb25maWcsIElDb25maWcsIHRpbWVNYXNrcywgd2l0aG91dFZhbGlkYXRpb24gfSBmcm9tICcuL2NvbmZpZyc7XG5pbXBvcnQgeyBNYXNrU2VydmljZSB9IGZyb20gJy4vbWFzay5zZXJ2aWNlJztcblxuQERpcmVjdGl2ZSh7XG5cdHNlbGVjdG9yOiAnaW5wdXRbbWFza10sIHRleHRhcmVhW21hc2tdJyxcblx0cHJvdmlkZXJzOiBbXG5cdFx0e1xuXHRcdFx0cHJvdmlkZTogTkdfVkFMVUVfQUNDRVNTT1IsXG5cdFx0XHR1c2VFeGlzdGluZzogZm9yd2FyZFJlZigoKSA9PiBNYXNrRGlyZWN0aXZlKSxcblx0XHRcdG11bHRpOiB0cnVlLFxuXHRcdH0sXG5cdFx0e1xuXHRcdFx0cHJvdmlkZTogTkdfVkFMSURBVE9SUyxcblx0XHRcdHVzZUV4aXN0aW5nOiBmb3J3YXJkUmVmKCgpID0+IE1hc2tEaXJlY3RpdmUpLFxuXHRcdFx0bXVsdGk6IHRydWUsXG5cdFx0fSxcblx0XHRNYXNrU2VydmljZSxcblx0XSxcblx0ZXhwb3J0QXM6ICdtYXNrLG5neE1hc2snLFxufSlcbmV4cG9ydCBjbGFzcyBNYXNrRGlyZWN0aXZlIGltcGxlbWVudHMgQ29udHJvbFZhbHVlQWNjZXNzb3IsIE9uQ2hhbmdlcywgVmFsaWRhdG9yIHtcblx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEBhbmd1bGFyLWVzbGludC9uby1pbnB1dC1yZW5hbWVcblx0QElucHV0KCdtYXNrJykgcHVibGljIG1hc2tFeHByZXNzaW9uOiBzdHJpbmcgPSAnJztcblxuXHRASW5wdXQoKSBwdWJsaWMgc3BlY2lhbENoYXJhY3RlcnM6IElDb25maWdbJ3NwZWNpYWxDaGFyYWN0ZXJzJ10gPSBbXTtcblxuXHRASW5wdXQoKSBwdWJsaWMgcGF0dGVybnM6IElDb25maWdbJ3BhdHRlcm5zJ10gPSB7fTtcblxuXHRASW5wdXQoKSBwdWJsaWMgcHJlZml4OiBJQ29uZmlnWydwcmVmaXgnXSA9ICcnO1xuXG5cdEBJbnB1dCgpIHB1YmxpYyBzdWZmaXg6IElDb25maWdbJ3N1ZmZpeCddID0gJyc7XG5cblx0QElucHV0KCkgcHVibGljIHRob3VzYW5kU2VwYXJhdG9yOiBJQ29uZmlnWyd0aG91c2FuZFNlcGFyYXRvciddID0gJyAnO1xuXG5cdEBJbnB1dCgpIHB1YmxpYyBkZWNpbWFsTWFya2VyOiBJQ29uZmlnWydkZWNpbWFsTWFya2VyJ10gPSAnLic7XG5cblx0QElucHV0KCkgcHVibGljIGRyb3BTcGVjaWFsQ2hhcmFjdGVyczogSUNvbmZpZ1snZHJvcFNwZWNpYWxDaGFyYWN0ZXJzJ10gfCBudWxsID0gbnVsbDtcblxuXHRASW5wdXQoKSBwdWJsaWMgaGlkZGVuSW5wdXQ6IElDb25maWdbJ2hpZGRlbklucHV0J10gfCBudWxsID0gbnVsbDtcblxuXHRASW5wdXQoKSBwdWJsaWMgc2hvd01hc2tUeXBlZDogSUNvbmZpZ1snc2hvd01hc2tUeXBlZCddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIHBsYWNlSG9sZGVyQ2hhcmFjdGVyOiBJQ29uZmlnWydwbGFjZUhvbGRlckNoYXJhY3RlciddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIHNob3duTWFza0V4cHJlc3Npb246IElDb25maWdbJ3Nob3duTWFza0V4cHJlc3Npb24nXSB8IG51bGwgPSBudWxsO1xuXG5cdEBJbnB1dCgpIHB1YmxpYyBzaG93VGVtcGxhdGU6IElDb25maWdbJ3Nob3dUZW1wbGF0ZSddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIGNsZWFySWZOb3RNYXRjaDogSUNvbmZpZ1snY2xlYXJJZk5vdE1hdGNoJ10gfCBudWxsID0gbnVsbDtcblxuXHRASW5wdXQoKSBwdWJsaWMgdmFsaWRhdGlvbjogSUNvbmZpZ1sndmFsaWRhdGlvbiddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIHNlcGFyYXRvckxpbWl0OiBJQ29uZmlnWydzZXBhcmF0b3JMaW1pdCddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIGFsbG93TmVnYXRpdmVOdW1iZXJzOiBJQ29uZmlnWydhbGxvd05lZ2F0aXZlTnVtYmVycyddIHwgbnVsbCA9IG51bGw7XG5cblx0QElucHV0KCkgcHVibGljIGxlYWRaZXJvRGF0ZVRpbWU6IElDb25maWdbJ2xlYWRaZXJvRGF0ZVRpbWUnXSB8IG51bGwgPSBudWxsO1xuXG5cdEBJbnB1dCgpIHB1YmxpYyB0cmlnZ2VyT25NYXNrQ2hhbmdlOiBJQ29uZmlnWyd0cmlnZ2VyT25NYXNrQ2hhbmdlJ10gfCBudWxsID0gbnVsbDtcblxuXHRAT3V0cHV0KCkgcHVibGljIG1hc2tGaWxsZWQ6IElDb25maWdbJ21hc2tGaWxsZWQnXSA9IG5ldyBFdmVudEVtaXR0ZXI8dm9pZD4oKTtcblxuXHRwcml2YXRlIF9tYXNrVmFsdWU6IHN0cmluZyA9ICcnO1xuXG5cdHByaXZhdGUgX2lucHV0VmFsdWUhOiBzdHJpbmc7XG5cblx0cHJpdmF0ZSBfcG9zaXRpb246IG51bWJlciB8IG51bGwgPSBudWxsO1xuXG5cdHByaXZhdGUgX3N0YXJ0ITogbnVtYmVyO1xuXG5cdHByaXZhdGUgX2VuZCE6IG51bWJlcjtcblxuXHRwcml2YXRlIF9jb2RlITogc3RyaW5nO1xuXG5cdHByaXZhdGUgX21hc2tFeHByZXNzaW9uQXJyYXk6IHN0cmluZ1tdID0gW107XG5cblx0cHJpdmF0ZSBfanVzdFBhc3RlZDogYm9vbGVhbiA9IGZhbHNlO1xuXG5cdHB1YmxpYyBjb25zdHJ1Y3Rvcihcblx0XHRASW5qZWN0KERPQ1VNRU5UKSBwcml2YXRlIGRvY3VtZW50OiBhbnksXG5cdFx0cHVibGljIF9tYXNrU2VydmljZTogTWFza1NlcnZpY2UsXG5cdFx0QEluamVjdChjb25maWcpIHByb3RlY3RlZCBfY29uZmlnOiBJQ29uZmlnLFxuXHQpIHt9XG5cblx0cHVibGljIG9uQ2hhbmdlID0gKF86IGFueSkgPT4ge307XG5cblx0cHVibGljIG9uVG91Y2ggPSAoKSA9PiB7fTtcblxuXHRwdWJsaWMgbmdPbkNoYW5nZXMoY2hhbmdlczogU2ltcGxlQ2hhbmdlcyk6IHZvaWQge1xuXHRcdGNvbnN0IHtcblx0XHRcdG1hc2tFeHByZXNzaW9uLFxuXHRcdFx0c3BlY2lhbENoYXJhY3RlcnMsXG5cdFx0XHRwYXR0ZXJucyxcblx0XHRcdHByZWZpeCxcblx0XHRcdHN1ZmZpeCxcblx0XHRcdHRob3VzYW5kU2VwYXJhdG9yLFxuXHRcdFx0ZGVjaW1hbE1hcmtlcixcblx0XHRcdGRyb3BTcGVjaWFsQ2hhcmFjdGVycyxcblx0XHRcdGhpZGRlbklucHV0LFxuXHRcdFx0c2hvd01hc2tUeXBlZCxcblx0XHRcdHBsYWNlSG9sZGVyQ2hhcmFjdGVyLFxuXHRcdFx0c2hvd25NYXNrRXhwcmVzc2lvbixcblx0XHRcdHNob3dUZW1wbGF0ZSxcblx0XHRcdGNsZWFySWZOb3RNYXRjaCxcblx0XHRcdHZhbGlkYXRpb24sXG5cdFx0XHRzZXBhcmF0b3JMaW1pdCxcblx0XHRcdGFsbG93TmVnYXRpdmVOdW1iZXJzLFxuXHRcdFx0bGVhZFplcm9EYXRlVGltZSxcblx0XHRcdHRyaWdnZXJPbk1hc2tDaGFuZ2UsXG5cdFx0fSA9IGNoYW5nZXM7XG5cdFx0aWYgKG1hc2tFeHByZXNzaW9uKSB7XG5cdFx0XHRpZiAoXG5cdFx0XHRcdG1hc2tFeHByZXNzaW9uLmN1cnJlbnRWYWx1ZSAhPT0gbWFza0V4cHJlc3Npb24ucHJldmlvdXNWYWx1ZSAmJlxuXHRcdFx0XHQhbWFza0V4cHJlc3Npb24uZmlyc3RDaGFuZ2Vcblx0XHRcdCkge1xuXHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5tYXNrQ2hhbmdlZCA9IHRydWU7XG5cdFx0XHR9XG5cdFx0XHRpZiAobWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlICYmIG1hc2tFeHByZXNzaW9uLmN1cnJlbnRWYWx1ZS5zcGxpdCgnfHwnKS5sZW5ndGggPiAxKSB7XG5cdFx0XHRcdHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkgPSBtYXNrRXhwcmVzc2lvbi5jdXJyZW50VmFsdWVcblx0XHRcdFx0XHQuc3BsaXQoJ3x8Jylcblx0XHRcdFx0XHQuc29ydCgoYTogc3RyaW5nLCBiOiBzdHJpbmcpID0+IHtcblx0XHRcdFx0XHRcdHJldHVybiBhLmxlbmd0aCAtIGIubGVuZ3RoO1xuXHRcdFx0XHRcdH0pO1xuXHRcdFx0XHR0aGlzLl9zZXRNYXNrKCk7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5ID0gW107XG5cdFx0XHRcdHRoaXMuX21hc2tWYWx1ZSA9IG1hc2tFeHByZXNzaW9uLmN1cnJlbnRWYWx1ZSB8fCAnJztcblx0XHRcdFx0dGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24gPSB0aGlzLl9tYXNrVmFsdWU7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChzcGVjaWFsQ2hhcmFjdGVycykge1xuXHRcdFx0aWYgKCFzcGVjaWFsQ2hhcmFjdGVycy5jdXJyZW50VmFsdWUgfHwgIUFycmF5LmlzQXJyYXkoc3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlKSkge1xuXHRcdFx0XHRyZXR1cm47XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5tYXNrU3BlY2lhbENoYXJhY3RlcnMgPSBzcGVjaWFsQ2hhcmFjdGVycy5jdXJyZW50VmFsdWUgfHwgW107XG5cdFx0XHR9XG5cdFx0fVxuXHRcdC8vIE9ubHkgb3ZlcndyaXRlIHRoZSBtYXNrIGF2YWlsYWJsZSBwYXR0ZXJucyBpZiBhIHBhdHRlcm4gaGFzIGFjdHVhbGx5IGJlZW4gcGFzc2VkIGluXG5cdFx0aWYgKHBhdHRlcm5zICYmIHBhdHRlcm5zLmN1cnJlbnRWYWx1ZSkge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UubWFza0F2YWlsYWJsZVBhdHRlcm5zID0gcGF0dGVybnMuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAocHJlZml4KSB7XG5cdFx0XHR0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggPSBwcmVmaXguY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoc3VmZml4KSB7XG5cdFx0XHR0aGlzLl9tYXNrU2VydmljZS5zdWZmaXggPSBzdWZmaXguY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAodGhvdXNhbmRTZXBhcmF0b3IpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLnRob3VzYW5kU2VwYXJhdG9yID0gdGhvdXNhbmRTZXBhcmF0b3IuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoZGVjaW1hbE1hcmtlcikge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UuZGVjaW1hbE1hcmtlciA9IGRlY2ltYWxNYXJrZXIuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoZHJvcFNwZWNpYWxDaGFyYWN0ZXJzKSB7XG5cdFx0XHR0aGlzLl9tYXNrU2VydmljZS5kcm9wU3BlY2lhbENoYXJhY3RlcnMgPSBkcm9wU3BlY2lhbENoYXJhY3RlcnMuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoaGlkZGVuSW5wdXQpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmhpZGRlbklucHV0ID0gaGlkZGVuSW5wdXQuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoc2hvd01hc2tUeXBlZCkge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tUeXBlZCA9IHNob3dNYXNrVHlwZWQuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAocGxhY2VIb2xkZXJDaGFyYWN0ZXIpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLnBsYWNlSG9sZGVyQ2hhcmFjdGVyID0gcGxhY2VIb2xkZXJDaGFyYWN0ZXIuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoc2hvd25NYXNrRXhwcmVzc2lvbikge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2Uuc2hvd25NYXNrRXhwcmVzc2lvbiA9IHNob3duTWFza0V4cHJlc3Npb24uY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoc2hvd1RlbXBsYXRlKSB7XG5cdFx0XHR0aGlzLl9tYXNrU2VydmljZS5zaG93VGVtcGxhdGUgPSBzaG93VGVtcGxhdGUuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoY2xlYXJJZk5vdE1hdGNoKSB7XG5cdFx0XHR0aGlzLl9tYXNrU2VydmljZS5jbGVhcklmTm90TWF0Y2ggPSBjbGVhcklmTm90TWF0Y2guY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAodmFsaWRhdGlvbikge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UudmFsaWRhdGlvbiA9IHZhbGlkYXRpb24uY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoc2VwYXJhdG9yTGltaXQpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLnNlcGFyYXRvckxpbWl0ID0gc2VwYXJhdG9yTGltaXQuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAoYWxsb3dOZWdhdGl2ZU51bWJlcnMpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFsbG93TmVnYXRpdmVOdW1iZXJzID0gYWxsb3dOZWdhdGl2ZU51bWJlcnMuY3VycmVudFZhbHVlO1xuXHRcdFx0aWYgKHRoaXMuX21hc2tTZXJ2aWNlLmFsbG93TmVnYXRpdmVOdW1iZXJzKSB7XG5cdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tTcGVjaWFsQ2hhcmFjdGVycyA9IHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tTcGVjaWFsQ2hhcmFjdGVycy5maWx0ZXIoXG5cdFx0XHRcdFx0KGM6IHN0cmluZykgPT4gYyAhPT0gJy0nLFxuXHRcdFx0XHQpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRpZiAobGVhZFplcm9EYXRlVGltZSkge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UubGVhZFplcm9EYXRlVGltZSA9IGxlYWRaZXJvRGF0ZVRpbWUuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHRpZiAodHJpZ2dlck9uTWFza0NoYW5nZSkge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UudHJpZ2dlck9uTWFza0NoYW5nZSA9IHRyaWdnZXJPbk1hc2tDaGFuZ2UuY3VycmVudFZhbHVlO1xuXHRcdH1cblx0XHR0aGlzLl9hcHBseU1hc2soKTtcblx0fVxuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBjb21wbGV4aXR5XG5cdHB1YmxpYyB2YWxpZGF0ZSh7IHZhbHVlIH06IEZvcm1Db250cm9sKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xuXHRcdGlmICghdGhpcy5fbWFza1NlcnZpY2UudmFsaWRhdGlvbiB8fCAhdGhpcy5fbWFza1ZhbHVlKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYgKHRoaXMuX21hc2tTZXJ2aWNlLmlwRXJyb3IpIHtcblx0XHRcdHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuXHRcdH1cblx0XHRpZiAodGhpcy5fbWFza1NlcnZpY2UuY3BmQ25wakVycm9yKSB7XG5cdFx0XHRyZXR1cm4gdGhpcy5fY3JlYXRlVmFsaWRhdGlvbkVycm9yKHZhbHVlKTtcblx0XHR9XG5cdFx0aWYgKHRoaXMuX21hc2tWYWx1ZS5zdGFydHNXaXRoKCdzZXBhcmF0b3InKSkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGlmICh3aXRob3V0VmFsaWRhdGlvbi5pbmNsdWRlcyh0aGlzLl9tYXNrVmFsdWUpKSB7XG5cdFx0XHRyZXR1cm4gbnVsbDtcblx0XHR9XG5cdFx0aWYgKHRoaXMuX21hc2tTZXJ2aWNlLmNsZWFySWZOb3RNYXRjaCkge1xuXHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0fVxuXHRcdGlmICh0aW1lTWFza3MuaW5jbHVkZXModGhpcy5fbWFza1ZhbHVlKSkge1xuXHRcdFx0cmV0dXJuIHRoaXMuX3ZhbGlkYXRlVGltZSh2YWx1ZSk7XG5cdFx0fVxuXHRcdGlmICh2YWx1ZSAmJiB2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA+PSAxKSB7XG5cdFx0XHRsZXQgY291bnRlck9mT3B0ID0gMDtcblx0XHRcdGZvciAoY29uc3Qga2V5IGluIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tBdmFpbGFibGVQYXR0ZXJucykge1xuXHRcdFx0XHRpZiAodGhpcy5fbWFza1NlcnZpY2UubWFza0F2YWlsYWJsZVBhdHRlcm5zW2tleV0hLm9wdGlvbmFsKSB7XG5cdFx0XHRcdFx0aWYgKHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKGtleSkgIT09IHRoaXMuX21hc2tWYWx1ZS5sYXN0SW5kZXhPZihrZXkpKSB7XG5cdFx0XHRcdFx0XHRjb25zdCBvcHQ6IHN0cmluZyA9IHRoaXMuX21hc2tWYWx1ZVxuXHRcdFx0XHRcdFx0XHQuc3BsaXQoJycpXG5cdFx0XHRcdFx0XHRcdC5maWx0ZXIoKGk6IHN0cmluZykgPT4gaSA9PT0ga2V5KVxuXHRcdFx0XHRcdFx0XHQuam9pbignJyk7XG5cdFx0XHRcdFx0XHRjb3VudGVyT2ZPcHQgKz0gb3B0Lmxlbmd0aDtcblx0XHRcdFx0XHR9IGVsc2UgaWYgKHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKGtleSkgIT09IC0xKSB7XG5cdFx0XHRcdFx0XHRjb3VudGVyT2ZPcHQrKztcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0aWYgKFxuXHRcdFx0XHRcdFx0dGhpcy5fbWFza1ZhbHVlLmluZGV4T2Yoa2V5KSAhPT0gLTEgJiZcblx0XHRcdFx0XHRcdHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoID49IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKGtleSlcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdHJldHVybiBudWxsO1xuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRpZiAoY291bnRlck9mT3B0ID09PSB0aGlzLl9tYXNrVmFsdWUubGVuZ3RoKSB7XG5cdFx0XHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHRcdGlmIChcblx0XHRcdFx0dGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJ3snKSA9PT0gMSAmJlxuXHRcdFx0XHR2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA9PT1cblx0XHRcdFx0XHR0aGlzLl9tYXNrVmFsdWUubGVuZ3RoICsgTnVtYmVyKHRoaXMuX21hc2tWYWx1ZS5zcGxpdCgneycpWzFdIS5zcGxpdCgnfScpWzBdKSAtIDRcblx0XHRcdCkge1xuXHRcdFx0XHRyZXR1cm4gbnVsbDtcblx0XHRcdH1cblx0XHRcdGlmICh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZignKicpID09PSAxIHx8IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCc/JykgPT09IDEpIHtcblx0XHRcdFx0cmV0dXJuIG51bGw7XG5cdFx0XHR9IGVsc2UgaWYgKFxuXHRcdFx0XHQodGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJyonKSA+IDEgJiZcblx0XHRcdFx0XHR2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCcqJykpIHx8XG5cdFx0XHRcdCh0aGlzLl9tYXNrVmFsdWUuaW5kZXhPZignPycpID4gMSAmJlxuXHRcdFx0XHRcdHZhbHVlLnRvU3RyaW5nKCkubGVuZ3RoIDwgdGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJz8nKSkgfHxcblx0XHRcdFx0dGhpcy5fbWFza1ZhbHVlLmluZGV4T2YoJ3snKSA9PT0gMVxuXHRcdFx0KSB7XG5cdFx0XHRcdHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuXHRcdFx0fVxuXHRcdFx0aWYgKHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCcqJykgPT09IC0xIHx8IHRoaXMuX21hc2tWYWx1ZS5pbmRleE9mKCc/JykgPT09IC0xKSB7XG5cdFx0XHRcdGNvbnN0IGxlbmd0aDogbnVtYmVyID0gdGhpcy5fbWFza1NlcnZpY2UuZHJvcFNwZWNpYWxDaGFyYWN0ZXJzXG5cdFx0XHRcdFx0PyB0aGlzLl9tYXNrVmFsdWUubGVuZ3RoIC1cblx0XHRcdFx0XHQgIHRoaXMuX21hc2tTZXJ2aWNlLmNoZWNrU3BlY2lhbENoYXJBbW91bnQodGhpcy5fbWFza1ZhbHVlKSAtXG5cdFx0XHRcdFx0ICBjb3VudGVyT2ZPcHRcblx0XHRcdFx0XHQ6IHRoaXMuX21hc2tWYWx1ZS5sZW5ndGggLSBjb3VudGVyT2ZPcHQ7XG5cdFx0XHRcdGlmICh2YWx1ZS50b1N0cmluZygpLmxlbmd0aCA8IGxlbmd0aCkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmICh2YWx1ZSkge1xuXHRcdFx0dGhpcy5tYXNrRmlsbGVkLmVtaXQoKTtcblx0XHRcdHJldHVybiBudWxsO1xuXHRcdH1cblx0XHRyZXR1cm4gbnVsbDtcblx0fVxuXG5cdEBIb3N0TGlzdGVuZXIoJ3Bhc3RlJylcblx0cHVibGljIG9uUGFzdGUoKSB7XG5cdFx0dGhpcy5fanVzdFBhc3RlZCA9IHRydWU7XG5cdH1cblxuXHRASG9zdExpc3RlbmVyKCduZ01vZGVsQ2hhbmdlJywgWyckZXZlbnQnXSlcblx0cHVibGljIG9uTW9kZWxDaGFuZ2UodmFsdWU6IGFueSk6IHZvaWQge1xuXHRcdC8vIG9uIGZvcm0gcmVzZXQgd2UgbmVlZCB0byB1cGRhdGUgdGhlIGFjdHVhbFZhbHVlXG5cdFx0aWYgKCh2YWx1ZSA9PT0gJycgfHwgdmFsdWUgPT09IG51bGwgfHwgdmFsdWUgPT09IHVuZGVmaW5lZCkgJiYgdGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUpIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlID0gdGhpcy5fbWFza1NlcnZpY2UuZ2V0QWN0dWFsVmFsdWUoJycpO1xuXHRcdH1cblx0fVxuXG5cdEBIb3N0TGlzdGVuZXIoJ2lucHV0JywgWyckZXZlbnQnXSlcblx0cHVibGljIG9uSW5wdXQoZTogQ3VzdG9tS2V5Ym9hcmRFdmVudCk6IHZvaWQge1xuXHRcdGNvbnN0IGVsOiBIVE1MSW5wdXRFbGVtZW50ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHR0aGlzLl9pbnB1dFZhbHVlID0gZWwudmFsdWU7XG5cblx0XHR0aGlzLl9zZXRNYXNrKCk7XG5cblx0XHRpZiAoIXRoaXMuX21hc2tWYWx1ZSkge1xuXHRcdFx0dGhpcy5vbkNoYW5nZShlbC52YWx1ZSk7XG5cdFx0XHRyZXR1cm47XG5cdFx0fVxuXHRcdGNvbnN0IHBvc2l0aW9uOiBudW1iZXIgPVxuXHRcdFx0ZWwuc2VsZWN0aW9uU3RhcnQgPT09IDFcblx0XHRcdFx0PyAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSArIHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcblx0XHRcdFx0OiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKTtcblx0XHRsZXQgY2FyZXRTaGlmdCA9IDA7XG5cdFx0bGV0IGJhY2tzcGFjZVNoaWZ0ID0gZmFsc2U7XG5cdFx0dGhpcy5fbWFza1NlcnZpY2UuYXBwbHlWYWx1ZUNoYW5nZXMoXG5cdFx0XHRwb3NpdGlvbixcblx0XHRcdHRoaXMuX2p1c3RQYXN0ZWQsXG5cdFx0XHR0aGlzLl9jb2RlID09PSAnQmFja3NwYWNlJyB8fCB0aGlzLl9jb2RlID09PSAnRGVsZXRlJyxcblx0XHRcdChzaGlmdDogbnVtYmVyLCBfYmFja3NwYWNlU2hpZnQ6IGJvb2xlYW4pID0+IHtcblx0XHRcdFx0dGhpcy5fanVzdFBhc3RlZCA9IGZhbHNlO1xuXHRcdFx0XHRjYXJldFNoaWZ0ID0gc2hpZnQ7XG5cdFx0XHRcdGJhY2tzcGFjZVNoaWZ0ID0gX2JhY2tzcGFjZVNoaWZ0O1xuXHRcdFx0fSxcblx0XHQpO1xuXHRcdC8vIG9ubHkgc2V0IHRoZSBzZWxlY3Rpb24gaWYgdGhlIGVsZW1lbnQgaXMgYWN0aXZlXG5cdFx0aWYgKHRoaXMuX2dldEFjdGl2ZUVsZW1lbnQoKSAhPT0gZWwpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5fcG9zaXRpb24gPSB0aGlzLl9wb3NpdGlvbiA9PT0gMSAmJiB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCA9PT0gMSA/IG51bGwgOiB0aGlzLl9wb3NpdGlvbjtcblx0XHRsZXQgcG9zaXRpb25Ub0FwcGx5OiBudW1iZXIgPSB0aGlzLl9wb3NpdGlvblxuXHRcdFx0PyB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCArIHBvc2l0aW9uICsgY2FyZXRTaGlmdFxuXHRcdFx0OiBwb3NpdGlvbiArICh0aGlzLl9jb2RlID09PSAnQmFja3NwYWNlJyAmJiAhYmFja3NwYWNlU2hpZnQgPyAwIDogY2FyZXRTaGlmdCk7XG5cdFx0aWYgKHBvc2l0aW9uVG9BcHBseSA+IHRoaXMuX2dldEFjdHVhbElucHV0TGVuZ3RoKCkpIHtcblx0XHRcdHBvc2l0aW9uVG9BcHBseSA9IHRoaXMuX2dldEFjdHVhbElucHV0TGVuZ3RoKCk7XG5cdFx0fVxuXHRcdGlmIChwb3NpdGlvblRvQXBwbHkgPCAwKSB7XG5cdFx0XHRwb3NpdGlvblRvQXBwbHkgPSAwO1xuXHRcdH1cblx0XHRlbC5zZXRTZWxlY3Rpb25SYW5nZShwb3NpdGlvblRvQXBwbHksIHBvc2l0aW9uVG9BcHBseSk7XG5cdFx0dGhpcy5fcG9zaXRpb24gPSBudWxsO1xuXHR9XG5cblx0QEhvc3RMaXN0ZW5lcignYmx1cicpXG5cdHB1YmxpYyBvbkJsdXIoKTogdm9pZCB7XG5cdFx0aWYgKHRoaXMuX21hc2tWYWx1ZSkge1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UuY2xlYXJJZk5vdE1hdGNoRm4oKTtcblx0XHR9XG5cdFx0dGhpcy5vblRvdWNoKCk7XG5cdH1cblxuXHRASG9zdExpc3RlbmVyKCdjbGljaycsIFsnJGV2ZW50J10pXG5cdHB1YmxpYyBvbkNsaWNrKGU6IE1vdXNlRXZlbnQgfCBDdXN0b21LZXlib2FyZEV2ZW50KTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLl9tYXNrVmFsdWUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0Y29uc3QgZWw6IEhUTUxJbnB1dEVsZW1lbnQgPSBlLnRhcmdldCBhcyBIVE1MSW5wdXRFbGVtZW50O1xuXHRcdGNvbnN0IHBvc1N0YXJ0ID0gMDtcblx0XHRjb25zdCBwb3NFbmQgPSAwO1xuXHRcdGlmIChcblx0XHRcdGVsICE9PSBudWxsICYmXG5cdFx0XHRlbC5zZWxlY3Rpb25TdGFydCAhPT0gbnVsbCAmJlxuXHRcdFx0ZWwuc2VsZWN0aW9uU3RhcnQgPT09IGVsLnNlbGVjdGlvbkVuZCAmJlxuXHRcdFx0ZWwuc2VsZWN0aW9uU3RhcnQgPiB0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoICYmXG5cdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmVcblx0XHRcdChlIGFzIGFueSkua2V5Q29kZSAhPT0gMzhcblx0XHQpIHtcblx0XHRcdGlmICh0aGlzLl9tYXNrU2VydmljZS5zaG93TWFza1R5cGVkKSB7XG5cdFx0XHRcdC8vIFdlIGFyZSBzaG93aW5nIHRoZSBtYXNrIGluIHRoZSBpbnB1dFxuXHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93biA9IHRoaXMuX21hc2tTZXJ2aWNlLnNob3dNYXNrSW5JbnB1dCgpO1xuXHRcdFx0XHRpZiAoXG5cdFx0XHRcdFx0ZWwuc2V0U2VsZWN0aW9uUmFuZ2UgJiZcblx0XHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggKyB0aGlzLl9tYXNrU2VydmljZS5tYXNrSXNTaG93biA9PT0gZWwudmFsdWVcblx0XHRcdFx0KSB7XG5cdFx0XHRcdFx0Ly8gdGhlIGlucHV0IE9OTFkgY29udGFpbnMgdGhlIG1hc2ssIHNvIHBvc2l0aW9uIHRoZSBjdXJzb3IgYXQgdGhlIHN0YXJ0XG5cdFx0XHRcdFx0ZWwuZm9jdXMoKTtcblx0XHRcdFx0XHRlbC5zZXRTZWxlY3Rpb25SYW5nZShwb3NTdGFydCwgcG9zRW5kKTtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHQvLyB0aGUgaW5wdXQgY29udGFpbnMgc29tZSBjaGFyYWN0ZXJzIGFscmVhZHlcblx0XHRcdFx0XHRpZiAoZWwuc2VsZWN0aW9uU3RhcnQgPiB0aGlzLl9tYXNrU2VydmljZS5hY3R1YWxWYWx1ZS5sZW5ndGgpIHtcblx0XHRcdFx0XHRcdC8vIGlmIHRoZSB1c2VyIGNsaWNrZWQgYmV5b25kIG91ciB2YWx1ZSdzIGxlbmd0aCwgcG9zaXRpb24gdGhlIGN1cnNvciBhdCB0aGUgZW5kIG9mIG91ciB2YWx1ZVxuXHRcdFx0XHRcdFx0ZWwuc2V0U2VsZWN0aW9uUmFuZ2UoXG5cdFx0XHRcdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCxcblx0XHRcdFx0XHRcdFx0dGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUubGVuZ3RoLFxuXHRcdFx0XHRcdFx0KTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9XG5cdFx0Y29uc3QgbmV4dFZhbHVlOiBzdHJpbmcgfCBudWxsID1cblx0XHRcdCFlbC52YWx1ZSB8fCBlbC52YWx1ZSA9PT0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4XG5cdFx0XHRcdD8gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ICsgdGhpcy5fbWFza1NlcnZpY2UubWFza0lzU2hvd25cblx0XHRcdFx0OiBlbC52YWx1ZTtcblx0XHQvKiogRml4IG9mIGN1cnNvciBwb3NpdGlvbiBqdW1waW5nIHRvIGVuZCBpbiBtb3N0IGJyb3dzZXJzIG5vIG1hdHRlciB3aGVyZSBjdXJzb3IgaXMgaW5zZXJ0ZWQgb25Gb2N1cyAqL1xuXHRcdGlmIChlbC52YWx1ZSAhPT0gbmV4dFZhbHVlKSB7XG5cdFx0XHRlbC52YWx1ZSA9IG5leHRWYWx1ZTtcblx0XHR9XG5cblx0XHQvKiogZml4IG9mIGN1cnNvciBwb3NpdGlvbiB3aXRoIHByZWZpeCB3aGVuIG1vdXNlIGNsaWNrIG9jY3VyICovXG5cdFx0aWYgKFxuXHRcdFx0KChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIHx8IChlbC5zZWxlY3Rpb25FbmQgYXMgbnVtYmVyKSkgPD1cblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcblx0XHQpIHtcblx0XHRcdGVsLnNlbGVjdGlvblN0YXJ0ID0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aDtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0LyoqIHNlbGVjdCBvbmx5IGluc2VydGVkIHRleHQgKi9cblx0XHRpZiAoKGVsLnNlbGVjdGlvbkVuZCBhcyBudW1iZXIpID4gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKSkge1xuXHRcdFx0ZWwuc2VsZWN0aW9uRW5kID0gdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKTtcblx0XHR9XG5cdH1cblxuXHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgY29tcGxleGl0eVxuXHRASG9zdExpc3RlbmVyKCdrZXlkb3duJywgWyckZXZlbnQnXSlcblx0cHVibGljIG9uS2V5RG93bihlOiBDdXN0b21LZXlib2FyZEV2ZW50KTogdm9pZCB7XG5cdFx0aWYgKCF0aGlzLl9tYXNrVmFsdWUpIHtcblx0XHRcdHJldHVybjtcblx0XHR9XG5cdFx0dGhpcy5fY29kZSA9IGUuY29kZSA/IGUuY29kZSA6IGUua2V5O1xuXHRcdGNvbnN0IGVsOiBIVE1MSW5wdXRFbGVtZW50ID0gZS50YXJnZXQgYXMgSFRNTElucHV0RWxlbWVudDtcblx0XHR0aGlzLl9pbnB1dFZhbHVlID0gZWwudmFsdWU7XG5cblx0XHR0aGlzLl9zZXRNYXNrKCk7XG5cblx0XHRpZiAoZS5rZXlDb2RlID09PSAzOCkge1xuXHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdH1cblx0XHRpZiAoZS5rZXlDb2RlID09PSAzNyB8fCBlLmtleUNvZGUgPT09IDggfHwgZS5rZXlDb2RlID09PSA0Nikge1xuXHRcdFx0aWYgKGUua2V5Q29kZSA9PT0gOCAmJiBlbC52YWx1ZS5sZW5ndGggPT09IDApIHtcblx0XHRcdFx0ZWwuc2VsZWN0aW9uU3RhcnQgPSBlbC5zZWxlY3Rpb25FbmQ7XG5cdFx0XHR9XG5cdFx0XHRpZiAoZS5rZXlDb2RlID09PSA4ICYmIChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpICE9PSAwKSB7XG5cdFx0XHRcdC8vIElmIHNwZWNpYWxDaGFycyBpcyBmYWxzZSwgKHNob3VsZG4ndCBldmVyIGhhcHBlbikgdGhlbiBzZXQgdG8gdGhlIGRlZmF1bHRzXG5cdFx0XHRcdHRoaXMuc3BlY2lhbENoYXJhY3RlcnMgPSB0aGlzLnNwZWNpYWxDaGFyYWN0ZXJzPy5sZW5ndGhcblx0XHRcdFx0XHQ/IHRoaXMuc3BlY2lhbENoYXJhY3RlcnNcblx0XHRcdFx0XHQ6IHRoaXMuX2NvbmZpZy5zcGVjaWFsQ2hhcmFjdGVycztcblx0XHRcdFx0aWYgKHRoaXMucHJlZml4Lmxlbmd0aCA+IDEgJiYgKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgPD0gdGhpcy5wcmVmaXgubGVuZ3RoKSB7XG5cdFx0XHRcdFx0ZWwuc2V0U2VsZWN0aW9uUmFuZ2UodGhpcy5wcmVmaXgubGVuZ3RoLCBlbC5zZWxlY3Rpb25FbmQpO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdGlmIChcblx0XHRcdFx0XHRcdHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoICE9PSAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSAmJlxuXHRcdFx0XHRcdFx0KGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgIT09IDFcblx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdHdoaWxlIChcblx0XHRcdFx0XHRcdFx0dGhpcy5zcGVjaWFsQ2hhcmFjdGVycy5pbmNsdWRlcyhcblx0XHRcdFx0XHRcdFx0XHR0aGlzLl9pbnB1dFZhbHVlWyhlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIC0gMV0hLnRvU3RyaW5nKCksXG5cdFx0XHRcdFx0XHRcdCkgJiZcblx0XHRcdFx0XHRcdFx0KCh0aGlzLnByZWZpeC5sZW5ndGggPj0gMSAmJiAoZWwuc2VsZWN0aW9uU3RhcnQgYXMgbnVtYmVyKSA+IHRoaXMucHJlZml4Lmxlbmd0aCkgfHxcblx0XHRcdFx0XHRcdFx0XHR0aGlzLnByZWZpeC5sZW5ndGggPT09IDApXG5cdFx0XHRcdFx0XHQpIHtcblx0XHRcdFx0XHRcdFx0ZWwuc2V0U2VsZWN0aW9uUmFuZ2UoKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcikgLSAxLCBlbC5zZWxlY3Rpb25FbmQpO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH1cblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdFx0dGhpcy5jaGVja1NlbGVjdGlvbk9uRGVsZXRpb24oZWwpO1xuXHRcdFx0aWYgKFxuXHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgubGVuZ3RoICYmXG5cdFx0XHRcdChlbC5zZWxlY3Rpb25TdGFydCBhcyBudW1iZXIpIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGggJiZcblx0XHRcdFx0KGVsLnNlbGVjdGlvbkVuZCBhcyBudW1iZXIpIDw9IHRoaXMuX21hc2tTZXJ2aWNlLnByZWZpeC5sZW5ndGhcblx0XHRcdCkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHR9XG5cdFx0XHRjb25zdCBjdXJzb3JTdGFydDogbnVtYmVyIHwgbnVsbCA9IGVsLnNlbGVjdGlvblN0YXJ0O1xuXHRcdFx0aWYgKFxuXHRcdFx0XHRlLmtleUNvZGUgPT09IDggJiZcblx0XHRcdFx0IWVsLnJlYWRPbmx5ICYmXG5cdFx0XHRcdGN1cnNvclN0YXJ0ID09PSAwICYmXG5cdFx0XHRcdGVsLnNlbGVjdGlvbkVuZCA9PT0gZWwudmFsdWUubGVuZ3RoICYmXG5cdFx0XHRcdGVsLnZhbHVlLmxlbmd0aCAhPT0gMFxuXHRcdFx0KSB7XG5cdFx0XHRcdHRoaXMuX3Bvc2l0aW9uID0gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4ID8gdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aCA6IDA7XG5cdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhcblx0XHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5wcmVmaXgsXG5cdFx0XHRcdFx0dGhpcy5fbWFza1NlcnZpY2UubWFza0V4cHJlc3Npb24sXG5cdFx0XHRcdFx0dGhpcy5fcG9zaXRpb24sXG5cdFx0XHRcdCk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdGlmIChcblx0XHRcdCEhdGhpcy5zdWZmaXggJiZcblx0XHRcdHRoaXMuc3VmZml4Lmxlbmd0aCA+IDEgJiZcblx0XHRcdHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoIC0gdGhpcy5zdWZmaXgubGVuZ3RoIDwgKGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlcilcblx0XHQpIHtcblx0XHRcdGVsLnNldFNlbGVjdGlvblJhbmdlKHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoIC0gdGhpcy5zdWZmaXgubGVuZ3RoLCB0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCk7XG5cdFx0fSBlbHNlIGlmIChcblx0XHRcdChlLmtleUNvZGUgPT09IDY1ICYmIGUuY3RybEtleSkgfHxcblx0XHRcdChlLmtleUNvZGUgPT09IDY1ICYmIGUubWV0YUtleSkgLy8gQ21kICsgQSAoTWFjKVxuXHRcdCkge1xuXHRcdFx0ZWwuc2V0U2VsZWN0aW9uUmFuZ2UoMCwgdGhpcy5fZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKSk7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0fVxuXHRcdHRoaXMuX21hc2tTZXJ2aWNlLnNlbFN0YXJ0ID0gZWwuc2VsZWN0aW9uU3RhcnQ7XG5cdFx0dGhpcy5fbWFza1NlcnZpY2Uuc2VsRW5kID0gZWwuc2VsZWN0aW9uRW5kO1xuXHR9XG5cblx0LyoqIEl0IHdyaXRlcyB0aGUgdmFsdWUgaW4gdGhlIGlucHV0ICovXG5cdHB1YmxpYyBhc3luYyB3cml0ZVZhbHVlKFxuXHRcdGlucHV0VmFsdWU6IHN0cmluZyB8IG51bWJlciB8IHsgdmFsdWU6IHN0cmluZyB8IG51bWJlcjsgZGlzYWJsZT86IGJvb2xlYW4gfSxcblx0KTogUHJvbWlzZTx2b2lkPiB7XG5cdFx0aWYgKHR5cGVvZiBpbnB1dFZhbHVlID09PSAnb2JqZWN0JyAmJiBpbnB1dFZhbHVlICE9PSBudWxsICYmICd2YWx1ZScgaW4gaW5wdXRWYWx1ZSkge1xuXHRcdFx0aWYgKCdkaXNhYmxlJyBpbiBpbnB1dFZhbHVlKSB7XG5cdFx0XHRcdHRoaXMuc2V0RGlzYWJsZWRTdGF0ZShCb29sZWFuKGlucHV0VmFsdWUuZGlzYWJsZSkpO1xuXHRcdFx0fVxuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRpbnB1dFZhbHVlID0gaW5wdXRWYWx1ZS52YWx1ZTtcblx0XHR9XG5cblx0XHRpZiAodHlwZW9mIGlucHV0VmFsdWUgPT09ICdudW1iZXInIHx8IHRoaXMuX21hc2tWYWx1ZS5zdGFydHNXaXRoKCdzZXBhcmF0b3InKSkge1xuXHRcdFx0Ly8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLXBhcmFtLXJlYXNzaWduXG5cdFx0XHRpbnB1dFZhbHVlID0gdGhpcy5fbWFza1NlcnZpY2UubnVtYmVyVG9TdHJpbmcoaW5wdXRWYWx1ZSk7XG5cdFx0XHRpZiAoIUFycmF5LmlzQXJyYXkodGhpcy5kZWNpbWFsTWFya2VyKSkge1xuXHRcdFx0XHQvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbm8tcGFyYW0tcmVhc3NpZ25cblx0XHRcdFx0aW5wdXRWYWx1ZSA9XG5cdFx0XHRcdFx0dGhpcy5kZWNpbWFsTWFya2VyICE9PSAnLicgPyBpbnB1dFZhbHVlLnJlcGxhY2UoJy4nLCB0aGlzLmRlY2ltYWxNYXJrZXIpIDogaW5wdXRWYWx1ZTtcblx0XHRcdH1cblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmlzTnVtYmVyVmFsdWUgPSB0cnVlO1xuXHRcdH1cblxuXHRcdGlmICh0eXBlb2YgaW5wdXRWYWx1ZSAhPT0gJ3N0cmluZycpIHtcblx0XHRcdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBuby1wYXJhbS1yZWFzc2lnblxuXHRcdFx0aW5wdXRWYWx1ZSA9ICcnO1xuXHRcdH1cblxuXHRcdHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xuXHRcdHRoaXMuX3NldE1hc2soKTtcblxuXHRcdGlmIChcblx0XHRcdChpbnB1dFZhbHVlICYmIHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uKSB8fFxuXHRcdFx0KHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uICYmXG5cdFx0XHRcdCh0aGlzLl9tYXNrU2VydmljZS5wcmVmaXggfHwgdGhpcy5fbWFza1NlcnZpY2Uuc2hvd01hc2tUeXBlZCkpXG5cdFx0KSB7XG5cdFx0XHQvLyBMZXQgdGhlIHNlcnZpY2Ugd2Uga25vdyB3ZSBhcmUgd3JpdGluZyB2YWx1ZSBzbyB0aGF0IHRyaWdnZXJpbmcgb25DaGFuZ2UgZnVuY3Rpb24gd29udCBoYXBwZW4gZHVyaW5nIGFwcGx5TWFza1xuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2Uud3JpdGluZ1ZhbHVlID0gdHJ1ZTtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbXG5cdFx0XHRcdCd2YWx1ZScsXG5cdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayhpbnB1dFZhbHVlLCB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiksXG5cdFx0XHRdO1xuXHRcdFx0Ly8gTGV0IHRoZSBzZXJ2aWNlIGtub3cgd2UndmUgZmluaXNoZWQgd3JpdGluZyB2YWx1ZVxuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2Uud3JpdGluZ1ZhbHVlID0gZmFsc2U7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbJ3ZhbHVlJywgaW5wdXRWYWx1ZV07XG5cdFx0fVxuXHRcdHRoaXMuX2lucHV0VmFsdWUgPSBpbnB1dFZhbHVlO1xuXHR9XG5cblx0cHVibGljIHJlZ2lzdGVyT25DaGFuZ2UoZm46IGFueSk6IHZvaWQge1xuXHRcdHRoaXMuX21hc2tTZXJ2aWNlLm9uQ2hhbmdlID0gdGhpcy5vbkNoYW5nZSA9IGZuO1xuXHR9XG5cblx0cHVibGljIHJlZ2lzdGVyT25Ub3VjaGVkKGZuOiBhbnkpOiB2b2lkIHtcblx0XHR0aGlzLm9uVG91Y2ggPSBmbjtcblx0fVxuXG5cdHByaXZhdGUgX2dldEFjdGl2ZUVsZW1lbnQoZG9jdW1lbnQ6IERvY3VtZW50T3JTaGFkb3dSb290ID0gdGhpcy5kb2N1bWVudCk6IEVsZW1lbnQgfCBudWxsIHtcblx0XHRjb25zdCBzaGFkb3dSb290RWwgPSBkb2N1bWVudD8uYWN0aXZlRWxlbWVudD8uc2hhZG93Um9vdDtcblx0XHRpZiAoIXNoYWRvd1Jvb3RFbD8uYWN0aXZlRWxlbWVudCkge1xuXHRcdFx0cmV0dXJuIGRvY3VtZW50LmFjdGl2ZUVsZW1lbnQ7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJldHVybiB0aGlzLl9nZXRBY3RpdmVFbGVtZW50KHNoYWRvd1Jvb3RFbCk7XG5cdFx0fVxuXHR9XG5cblx0cHVibGljIGNoZWNrU2VsZWN0aW9uT25EZWxldGlvbihlbDogSFRNTElucHV0RWxlbWVudCk6IHZvaWQge1xuXHRcdGVsLnNlbGVjdGlvblN0YXJ0ID0gTWF0aC5taW4oXG5cdFx0XHRNYXRoLm1heCh0aGlzLnByZWZpeC5sZW5ndGgsIGVsLnNlbGVjdGlvblN0YXJ0IGFzIG51bWJlciksXG5cdFx0XHR0aGlzLl9pbnB1dFZhbHVlLmxlbmd0aCAtIHRoaXMuc3VmZml4Lmxlbmd0aCxcblx0XHQpO1xuXHRcdGVsLnNlbGVjdGlvbkVuZCA9IE1hdGgubWluKFxuXHRcdFx0TWF0aC5tYXgodGhpcy5wcmVmaXgubGVuZ3RoLCBlbC5zZWxlY3Rpb25FbmQgYXMgbnVtYmVyKSxcblx0XHRcdHRoaXMuX2lucHV0VmFsdWUubGVuZ3RoIC0gdGhpcy5zdWZmaXgubGVuZ3RoLFxuXHRcdCk7XG5cdH1cblxuXHQvKiogSXQgZGlzYWJsZXMgdGhlIGlucHV0IGVsZW1lbnQgKi9cblx0cHVibGljIHNldERpc2FibGVkU3RhdGUoaXNEaXNhYmxlZDogYm9vbGVhbik6IHZvaWQge1xuXHRcdHRoaXMuX21hc2tTZXJ2aWNlLmZvcm1FbGVtZW50UHJvcGVydHkgPSBbJ2Rpc2FibGVkJywgaXNEaXNhYmxlZF07XG5cdH1cblxuXHRwcml2YXRlIF9yZXBlYXRQYXR0ZXJuU3ltYm9scyhtYXNrRXhwOiBzdHJpbmcpOiBzdHJpbmcge1xuXHRcdHJldHVybiAoXG5cdFx0XHQobWFza0V4cC5tYXRjaCgve1swLTldK30vKSAmJlxuXHRcdFx0XHRtYXNrRXhwLnNwbGl0KCcnKS5yZWR1Y2UoKGFjY3VtOiBzdHJpbmcsIGN1cnJ2YWw6IHN0cmluZywgaW5kZXg6IG51bWJlcik6IHN0cmluZyA9PiB7XG5cdFx0XHRcdFx0dGhpcy5fc3RhcnQgPSBjdXJydmFsID09PSAneycgPyBpbmRleCA6IHRoaXMuX3N0YXJ0O1xuXG5cdFx0XHRcdFx0aWYgKGN1cnJ2YWwgIT09ICd9Jykge1xuXHRcdFx0XHRcdFx0cmV0dXJuIHRoaXMuX21hc2tTZXJ2aWNlLl9maW5kU3BlY2lhbENoYXIoY3VycnZhbCkgPyBhY2N1bSArIGN1cnJ2YWwgOiBhY2N1bTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0dGhpcy5fZW5kID0gaW5kZXg7XG5cdFx0XHRcdFx0Y29uc3QgcmVwZWF0TnVtYmVyOiBudW1iZXIgPSBOdW1iZXIobWFza0V4cC5zbGljZSh0aGlzLl9zdGFydCArIDEsIHRoaXMuX2VuZCkpO1xuXHRcdFx0XHRcdGNvbnN0IHJlcGxhY2VXaXRoOiBzdHJpbmcgPSBuZXcgQXJyYXkocmVwZWF0TnVtYmVyICsgMSkuam9pbihtYXNrRXhwW3RoaXMuX3N0YXJ0IC0gMV0pO1xuXHRcdFx0XHRcdHJldHVybiBhY2N1bSArIHJlcGxhY2VXaXRoO1xuXHRcdFx0XHR9LCAnJykpIHx8XG5cdFx0XHRtYXNrRXhwXG5cdFx0KTtcblx0fVxuXG5cdC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG5cdHByaXZhdGUgX2FwcGx5TWFzaygpOiBhbnkge1xuXHRcdHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID0gdGhpcy5fcmVwZWF0UGF0dGVyblN5bWJvbHModGhpcy5fbWFza1ZhbHVlIHx8ICcnKTtcblx0XHR0aGlzLl9tYXNrU2VydmljZS5mb3JtRWxlbWVudFByb3BlcnR5ID0gW1xuXHRcdFx0J3ZhbHVlJyxcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFwcGx5TWFzayh0aGlzLl9pbnB1dFZhbHVlLCB0aGlzLl9tYXNrU2VydmljZS5tYXNrRXhwcmVzc2lvbiksXG5cdFx0XTtcblx0fVxuXG5cdHByaXZhdGUgX3ZhbGlkYXRlVGltZSh2YWx1ZTogc3RyaW5nKTogVmFsaWRhdGlvbkVycm9ycyB8IG51bGwge1xuXHRcdGNvbnN0IHJvd01hc2tMZW46IG51bWJlciA9IHRoaXMuX21hc2tWYWx1ZS5zcGxpdCgnJykuZmlsdGVyKChzOiBzdHJpbmcpID0+IHMgIT09ICc6JykubGVuZ3RoO1xuXHRcdGlmICghdmFsdWUpIHtcblx0XHRcdHJldHVybiBudWxsOyAvLyBEb24ndCB2YWxpZGF0ZSBlbXB0eSB2YWx1ZXMgdG8gYWxsb3cgZm9yIG9wdGlvbmFsIGZvcm0gY29udHJvbFxuXHRcdH1cblxuXHRcdGlmIChcblx0XHRcdCgrdmFsdWVbdmFsdWUubGVuZ3RoIC0gMV0hID09PSAwICYmIHZhbHVlLmxlbmd0aCA8IHJvd01hc2tMZW4pIHx8XG5cdFx0XHR2YWx1ZS5sZW5ndGggPD0gcm93TWFza0xlbiAtIDJcblx0XHQpIHtcblx0XHRcdHJldHVybiB0aGlzLl9jcmVhdGVWYWxpZGF0aW9uRXJyb3IodmFsdWUpO1xuXHRcdH1cblxuXHRcdHJldHVybiBudWxsO1xuXHR9XG5cblx0cHJpdmF0ZSBfZ2V0QWN0dWFsSW5wdXRMZW5ndGgoKSB7XG5cdFx0cmV0dXJuIChcblx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLmFjdHVhbFZhbHVlLmxlbmd0aCB8fFxuXHRcdFx0dGhpcy5fbWFza1NlcnZpY2UuYWN0dWFsVmFsdWUubGVuZ3RoICsgdGhpcy5fbWFza1NlcnZpY2UucHJlZml4Lmxlbmd0aFxuXHRcdCk7XG5cdH1cblxuXHRwcml2YXRlIF9jcmVhdGVWYWxpZGF0aW9uRXJyb3IoYWN0dWFsVmFsdWU6IHN0cmluZyk6IFZhbGlkYXRpb25FcnJvcnMge1xuXHRcdHJldHVybiB7XG5cdFx0XHRtYXNrOiB7XG5cdFx0XHRcdHJlcXVpcmVkTWFzazogdGhpcy5fbWFza1ZhbHVlLFxuXHRcdFx0XHRhY3R1YWxWYWx1ZSxcblx0XHRcdH0sXG5cdFx0fTtcblx0fVxuXG5cdHByaXZhdGUgX3NldE1hc2soKSB7XG5cdFx0aWYgKHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoID4gMCkge1xuXHRcdFx0dGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5zb21lKChtYXNrKTogYm9vbGVhbiB8IHZvaWQgPT4ge1xuXHRcdFx0XHRjb25zdCB0ZXN0ID1cblx0XHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5yZW1vdmVNYXNrKHRoaXMuX2lucHV0VmFsdWUpPy5sZW5ndGggPD1cblx0XHRcdFx0XHR0aGlzLl9tYXNrU2VydmljZS5yZW1vdmVNYXNrKG1hc2spPy5sZW5ndGg7XG5cdFx0XHRcdGlmICh0aGlzLl9pbnB1dFZhbHVlICYmIHRlc3QpIHtcblx0XHRcdFx0XHR0aGlzLl9tYXNrVmFsdWUgPSBtYXNrO1xuXHRcdFx0XHRcdHRoaXMubWFza0V4cHJlc3Npb24gPSBtYXNrO1xuXHRcdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID0gbWFzaztcblx0XHRcdFx0XHRyZXR1cm4gdGVzdDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHR0aGlzLl9tYXNrVmFsdWUgPSB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5W3RoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoIC0gMV0hO1xuXHRcdFx0XHRcdHRoaXMubWFza0V4cHJlc3Npb24gPSB0aGlzLl9tYXNrRXhwcmVzc2lvbkFycmF5W3RoaXMuX21hc2tFeHByZXNzaW9uQXJyYXkubGVuZ3RoIC0gMV0hO1xuXHRcdFx0XHRcdHRoaXMuX21hc2tTZXJ2aWNlLm1hc2tFeHByZXNzaW9uID1cblx0XHRcdFx0XHRcdHRoaXMuX21hc2tFeHByZXNzaW9uQXJyYXlbdGhpcy5fbWFza0V4cHJlc3Npb25BcnJheS5sZW5ndGggLSAxXSE7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdH1cblx0fVxufVxuIl19