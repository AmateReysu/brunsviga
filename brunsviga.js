/**
 * Brunsviga 13 RK Calculator Emulator
 * Emulates the mechanical calculator with all its operations
 */

class Brunsviga {
    constructor() {
        // Machine state
        this.resultCounter = new Array(13).fill(0);
        this.revolutionCounter = new Array(8).fill(0); // Position-aware counter array
        this.revolutionCounterSign = 1; // 1 for positive, -1 for negative
        this.inputRegister = new Array(13).fill(0);
        this.carriagePosition = 0;
        this.resultDecimalPosition = null;
        
        // Algorithm execution state
        this.algorithmSteps = [];
        this.currentStepIndex = -1;
        this.isPlaying = false;
        this.playbackSpeed = 1000;
        this.playbackInterval = null;
        
        this.initializeUI();
        this.attachEventListeners();
        this.updateDisplay();
    }

    initializeUI() {
        // Get UI elements
        this.elements = {
            resultCounter: document.getElementById('result-counter'),
            revolutionCounter: document.getElementById('revolution-counter'),
            inputRegister: document.getElementById('input-register'),
            carriagePosition: document.getElementById('carriage-position'),
            crankAnimation: document.getElementById('crank-animation'),
            statusDisplay: document.getElementById('status-display'),
            stepList: document.getElementById('step-list'),
            speedLabel: document.getElementById('speed-label')
        };
    }

    attachEventListeners() {
        // Clear buttons
        document.getElementById('clear-result').addEventListener('click', () => this.clearResult());
        document.getElementById('clear-revolution').addEventListener('click', () => this.clearRevolution());
        document.getElementById('clear-input').addEventListener('click', () => this.clearInput());
        
        // Carriage controls
        document.getElementById('carriage-left').addEventListener('click', () => this.moveCarriage(1));
        document.getElementById('carriage-right').addEventListener('click', () => this.moveCarriage(-1));
        
        // Crank controls
        document.getElementById('crank-forward').addEventListener('click', () => this.crankTurn(1));
        document.getElementById('crank-backward').addEventListener('click', () => this.crankTurn(-1));
        
        // Input register controls
        const incButtons = document.querySelectorAll('.input-digit .inc');
        const decButtons = document.querySelectorAll('.input-digit .dec');
        const inputs = document.querySelectorAll('.input-digit input');
        
        incButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pos = parseInt(e.target.dataset.position);
                this.incrementInput(pos);
            });
        });
        
        decButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pos = parseInt(e.target.dataset.position);
                this.decrementInput(pos);
            });
        });
        
        inputs.forEach(input => {
            input.addEventListener('change', (e) => {
                const pos = parseInt(e.target.dataset.position);
                let value = parseInt(e.target.value) || 0;
                value = Math.max(0, Math.min(9, value));
                this.inputRegister[pos] = value;
                e.target.value = value;
            });
        });
        
        // Algorithm buttons
        document.getElementById('algo-add').addEventListener('click', () => this.startAddition());
        document.getElementById('algo-subtract').addEventListener('click', () => this.startSubtraction());
        document.getElementById('algo-multiply').addEventListener('click', () => this.startMultiplication());
        document.getElementById('algo-divide').addEventListener('click', () => this.startDivision());
        document.getElementById('algo-decimal-divide').addEventListener('click', () => this.startDecimalDivision());
        document.getElementById('algo-sqrt').addEventListener('click', () => this.startSquareRoot());
        
        // Playback controls
        document.getElementById('play').addEventListener('click', () => this.play());
        document.getElementById('pause').addEventListener('click', () => this.pause());
        document.getElementById('step-back').addEventListener('click', () => this.stepBack());
        document.getElementById('step-forward').addEventListener('click', () => this.stepForward());
        document.getElementById('stop').addEventListener('click', () => this.stop());
        
        // Speed control
        document.getElementById('speed').addEventListener('input', (e) => {
            this.playbackSpeed = parseInt(e.target.value);
            document.getElementById('speed-label').textContent = `${this.playbackSpeed}ms`;
        });
    }

    // Basic operations
    clearResult() {
        this.resultCounter.fill(0);
        this.resultDecimalPosition = null;
        this.updateDisplay();
        this.setStatus('Resultatwerk gelöscht');
    }

    clearRevolution() {
        this.revolutionCounter.fill(0);
        this.revolutionCounterSign = 1;
        this.updateDisplay();
        this.setStatus('Umdrehungszähler gelöscht');
    }

    clearInput() {
        this.inputRegister.fill(0);
        this.updateDisplay();
        this.setStatus('Einstellwerk gelöscht');
    }

    incrementInput(position) {
        this.inputRegister[position] = (this.inputRegister[position] + 1) % 10;
        this.updateDisplay();
    }

    decrementInput(position) {
        this.inputRegister[position] = (this.inputRegister[position] + 9) % 10;
        this.updateDisplay();
    }

    moveCarriage(direction) {
        const newPos = this.carriagePosition + direction;
        if (newPos >= -6 && newPos <= 6) {
            this.carriagePosition = newPos;
            this.updateDisplay();
            this.setStatus(`Schlitten bewegt zu Position ${this.carriagePosition}`);
        }
    }

    crankTurn(direction) {
        // Animate crank
        const animClass = direction > 0 ? 'rotating-forward' : 'rotating-backward';
        this.elements.crankAnimation.classList.add(animClass);
        setTimeout(() => {
            this.elements.crankAnimation.classList.remove(animClass);
        }, 500);
        
        // Update counters
        this.updateRevolutionCounter(direction);
        this.performCalculation(direction);
        
        this.updateDisplay();
        this.setStatus(`Kurbel ${direction > 0 ? 'vorwärts' : 'rückwärts'} gedreht`);
    }

    updateRevolutionCounter(direction) {
        // Position-aware counter: updates the digit corresponding to carriage position
        // Maps carriage position to revolution counter index: carriagePosition + 3
        // Moving carriage left (increasing position) moves counter right (increasing index)
        // This allows positions from -3 to +4 to map to indices 0 to 7
        const revolutionIndex = this.carriagePosition + 3;

        if (revolutionIndex >= 0 && revolutionIndex < 8) {
            // Convert array to number, apply operation, convert back
            let counterValue = 0;
            for (let i = 0; i < 8; i++) {
                counterValue = counterValue * 10 + this.revolutionCounter[i];
            }

            // Apply sign
            counterValue *= this.revolutionCounterSign;

            // Update based on direction and current position
            const positionMultiplier = Math.pow(10, 7 - revolutionIndex);
            counterValue += direction * positionMultiplier;

            // Update sign
            if (counterValue < 0) {
                this.revolutionCounterSign = -1;
                counterValue = Math.abs(counterValue);
            } else if (counterValue > 0) {
                this.revolutionCounterSign = 1;
            } else {
                // counterValue is exactly 0
                this.revolutionCounterSign = 1;
            }

            // Convert back to array
            const counterStr = Math.floor(counterValue).toString().padStart(8, '0').slice(-8);
            for (let i = 0; i < 8; i++) {
                this.revolutionCounter[i] = parseInt(counterStr[i], 10);
            }

            // Animate the updated digit
            this.animateDigit('revolution', revolutionIndex);
        }
    }

    performCalculation(direction) {
        let carry = 0;
        const offset = this.carriagePosition; // Remove Math.max to allow negative positions

        for (let i = 12; i >= 0; i--) {
            const inputValue = this.inputRegister[i];
            const adjustedIndex = i + offset;

            if (adjustedIndex >= 0 && adjustedIndex < 13) {
                let newValue = this.resultCounter[adjustedIndex] + (inputValue * direction) + carry;
                carry = 0;

                if (newValue > 9) {
                    carry = Math.floor(newValue / 10);
                    newValue = newValue % 10;
                } else if (newValue < 0) {
                    carry = -1;
                    newValue = 10 + newValue;
                }

                this.resultCounter[adjustedIndex] = newValue;

                // Animate this digit
                this.animateDigit('result', adjustedIndex);
            }
        }
    }

    animateDigit(counterType, position) {
        const counter = counterType === 'result' ? this.elements.resultCounter : this.elements.revolutionCounter;
        const digit = counter.children[position];
        if (digit) {
            digit.classList.add('animating');
            setTimeout(() => digit.classList.remove('animating'), 300);
        }
    }

    updateDisplay() {
        // Update result counter
        const resultDigits = this.elements.resultCounter.children;
        for (let i = 0; i < this.resultCounter.length; i++) {
            const digitElement = resultDigits[i];
            if (!digitElement) {
                continue;
            }
            digitElement.textContent = this.resultCounter[i];
            digitElement.classList.remove('decimal-marker');
        }

        if (this.resultDecimalPosition !== null) {
            const markerIndex = Math.max(0, Math.min(resultDigits.length - 1, this.resultDecimalPosition - 1));
            const markerDigit = resultDigits[markerIndex];
            if (markerDigit) {
                markerDigit.classList.add('decimal-marker');
            }
        }

        // Update revolution counter
        const revolutionDigits = this.elements.revolutionCounter.children;
        const isNegative = this.revolutionCounterSign < 0;

        for (let i = 0; i < this.revolutionCounter.length; i++) {
            const digitElement = revolutionDigits[i];
            if (!digitElement) {
                continue;
            }
            digitElement.textContent = this.revolutionCounter[i];

            // Add or remove negative class for red color
            if (isNegative) {
                digitElement.classList.add('negative');
            } else {
                digitElement.classList.remove('negative');
            }
        }
        
        // Update input register
        const inputs = this.elements.inputRegister.querySelectorAll('input');
        this.inputRegister.forEach((digit, i) => {
            inputs[i].value = digit;
        });
        
        // Update carriage position
        this.elements.carriagePosition.textContent = this.carriagePosition;
    }

    setStatus(message) {
        this.elements.statusDisplay.textContent = message;
    }

    createCarriageMovementSteps(currentPosition, targetPosition) {
        const steps = [];
        let position = currentPosition;

        while (position !== targetPosition) {
            const direction = targetPosition > position ? 1 : -1;
            position += direction;
            steps.push({
                action: 'moveCarriage',
                direction,
                description: `Schlitten ${direction > 0 ? 'nach rechts' : 'nach links'} auf Position ${position} verschieben`
            });
        }

        return { steps, finalPosition: position };
    }

    // Algorithm execution
    startAddition() {
        const a = parseInt(document.getElementById('operand-a').value, 10);
        const b = parseInt(document.getElementById('operand-b').value, 10);

        if (!Number.isInteger(a) || a < 0 || !Number.isInteger(b) || b < 0) {
            this.setStatus('Bitte nur nichtnegative ganze Zahlen für die Addition verwenden.');
            return;
        }

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'setInput', value: a, description: `Ersten Summanden (${a}) im Einstellwerk einstellen` },
            { action: 'crank', direction: 1, description: 'Kurbel vorwärts drehen, um den ersten Summanden in das Resultatwerk zu übertragen' },
            { action: 'setInput', value: b, description: `Zweiten Summanden (${b}) im Einstellwerk einstellen` },
            { action: 'crank', direction: 1, description: 'Kurbel vorwärts drehen, um den zweiten Summanden hinzuzufügen' },
            { action: 'complete', description: `Ergebnis: ${a + b}` }
        ];

        this.prepareAlgorithm();
    }

    startSubtraction() {
        const a = parseInt(document.getElementById('operand-a').value, 10);
        const b = parseInt(document.getElementById('operand-b').value, 10);

        if (!Number.isInteger(a) || a < 0 || !Number.isInteger(b) || b < 0) {
            this.setStatus('Bitte nur nichtnegative ganze Zahlen für die Subtraktion verwenden.');
            return;
        }

        if (a < b) {
            this.setStatus('Für diese Maschine muss der Minuend größer oder gleich dem Subtrahenden sein.');
            return;
        }

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'setInput', value: a, description: `Minuend (${a}) im Einstellwerk einstellen` },
            { action: 'crank', direction: 1, description: 'Kurbel vorwärts drehen, um den Minuenden in das Resultatwerk zu übertragen' },
            { action: 'setInput', value: b, description: `Subtrahend (${b}) im Einstellwerk einstellen` },
            { action: 'crank', direction: -1, description: 'Kurbel rückwärts drehen, um den Subtrahenden abzuziehen' },
            { action: 'complete', description: `Ergebnis: ${a - b}` }
        ];

        this.prepareAlgorithm();
    }

    startMultiplication() {
        const multiplicand = parseInt(document.getElementById('operand-a').value, 10);
        const multiplier = parseInt(document.getElementById('operand-b').value, 10);

        if (!Number.isInteger(multiplicand) || multiplicand < 0 || !Number.isInteger(multiplier) || multiplier < 0) {
            this.setStatus('Bitte nur nichtnegative ganze Zahlen für die Multiplikation verwenden.');
            return;
        }

        const multiplierDigits = Math.abs(multiplier).toString().split('').map(Number).reverse();
        let currentCarriage = 0;

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'setInput', value: multiplicand, description: `Multiplikand (${multiplicand}) im Einstellwerk einstellen` }
        ];

        multiplierDigits.forEach((digit, index) => {
            const targetPosition = -index;
            const { steps, finalPosition } = this.createCarriageMovementSteps(currentCarriage, targetPosition);
            steps.forEach(step => this.algorithmSteps.push(step));
            currentCarriage = finalPosition;

            if (digit === 0) {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Teilprodukt ${index + 1}: Ziffer 0 - keine Kurbelumdrehung erforderlich`
                });
            } else {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Teilprodukt ${index + 1}: Ziffer ${digit} bei Schlittenposition ${currentCarriage}`
                });

                for (let turn = 0; turn < digit; turn++) {
                    this.algorithmSteps.push({
                        action: 'crank',
                        direction: 1,
                        description: `Kurbel vorwärts drehen (${turn + 1}/${digit}) für diese Ziffer`
                    });
                }
            }
        });

        if (currentCarriage !== 0) {
            const { steps } = this.createCarriageMovementSteps(currentCarriage, 0);
            steps.forEach(step => this.algorithmSteps.push(step));
        }

        this.algorithmSteps.push({ action: 'complete', description: `Ergebnis: ${multiplicand * multiplier}` });

        this.prepareAlgorithm();
    }

    startDivision() {
        const dividend = parseInt(document.getElementById('operand-a').value, 10);
        const divisor = parseInt(document.getElementById('operand-b').value, 10);

        if (!Number.isInteger(dividend) || dividend < 0 || !Number.isInteger(divisor) || divisor <= 0) {
            this.setStatus('Bitte einen nichtnegativen Dividend und einen positiven ganzzahligen Divisor eingeben.');
            return;
        }

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'setResultDirect', value: dividend, description: `Dividend (${dividend}) im Resultatwerk einstellen` },
            { action: 'setInput', value: divisor, description: `Divisor (${divisor}) im Einstellwerk einstellen` }
        ];

        const dividendDigits = dividend === 0 ? 1 : dividend.toString().length;
        const divisorDigits = divisor.toString().length;
        let positionShift = Math.max(0, dividendDigits - divisorDigits);
        let currentCarriage = 0;
        let remaining = dividend;
        const quotientDigits = [];

        if (positionShift > 0) {
            const { steps, finalPosition } = this.createCarriageMovementSteps(currentCarriage, -positionShift);
            steps.forEach(step => this.algorithmSteps.push(step));
            currentCarriage = finalPosition;
        }

        for (let position = positionShift; position >= 0; position--) {
            const divisorFactor = divisor * Math.pow(10, position);
            let digit = 0;

            if (divisorFactor !== 0) {
                digit = Math.min(9, Math.floor(remaining / divisorFactor));
            }

            quotientDigits.push(digit);

            if (digit === 0) {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Divisionsstelle ${positionShift - position + 1}: Divisor passt 0-mal`
                });
            } else {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Divisionsstelle ${positionShift - position + 1}: ${digit}×${divisor}·10^${position} subtrahieren`
                });

                for (let turn = 0; turn < digit; turn++) {
                    this.algorithmSteps.push({
                        action: 'crank',
                        direction: -1,
                        description: `Kurbel rückwärts drehen (${turn + 1}/${digit}) an dieser Stelle`
                    });
                }

                remaining -= digit * divisorFactor;
            }

            if (position > 0) {
                const { steps, finalPosition } = this.createCarriageMovementSteps(currentCarriage, currentCarriage + 1);
                steps.forEach(step => this.algorithmSteps.push(step));
                currentCarriage = finalPosition;
            }
        }

        if (currentCarriage !== 0) {
            const { steps } = this.createCarriageMovementSteps(currentCarriage, 0);
            steps.forEach(step => this.algorithmSteps.push(step));
        }

        const quotient = parseInt(quotientDigits.join(''), 10) || 0;

        this.algorithmSteps.push({
            action: 'complete',
            description: `Ergebnis: Quotient=${quotient}, Rest=${remaining}`
        });

        this.prepareAlgorithm();
    }

    prepareAlgorithm() {
        this.currentStepIndex = -1;
        this.isPlaying = false;
        this.displaySteps();
        this.updatePlaybackControls();
        this.setStatus('Algorithmus bereit. Verwenden Sie die Wiedergabesteuerung.');
    }

    displaySteps() {
        this.elements.stepList.innerHTML = '';
        this.algorithmSteps.forEach((step, index) => {
            const stepElement = document.createElement('div');
            stepElement.className = 'step-item';
            stepElement.textContent = `${index + 1}. ${step.description}`;
            stepElement.dataset.index = index;
            
            if (index < this.currentStepIndex) {
                stepElement.classList.add('completed');
            } else if (index === this.currentStepIndex) {
                stepElement.classList.add('active');
            }
            
            this.elements.stepList.appendChild(stepElement);
        });
    }

    updatePlaybackControls() {
        const hasSteps = this.algorithmSteps.length > 0;
        const canPlay = hasSteps && this.currentStepIndex < this.algorithmSteps.length - 1;
        const canStepForward = hasSteps && this.currentStepIndex < this.algorithmSteps.length - 1;
        const canStepBack = hasSteps && this.currentStepIndex >= 0;
        
        document.getElementById('play').disabled = !canPlay || this.isPlaying;
        document.getElementById('pause').disabled = !this.isPlaying;
        document.getElementById('step-forward').disabled = !canStepForward || this.isPlaying;
        document.getElementById('step-back').disabled = !canStepBack || this.isPlaying;
        document.getElementById('stop').disabled = !hasSteps;
    }

    play() {
        this.isPlaying = true;
        this.updatePlaybackControls();
        
        this.playbackInterval = setInterval(() => {
            if (this.currentStepIndex < this.algorithmSteps.length - 1) {
                this.stepForward();
            } else {
                this.pause();
            }
        }, this.playbackSpeed);
    }

    pause() {
        this.isPlaying = false;
        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
        this.updatePlaybackControls();
        this.setStatus('Pause');
    }

    stepForward() {
        if (this.currentStepIndex < this.algorithmSteps.length - 1) {
            this.currentStepIndex++;
            this.executeStep(this.algorithmSteps[this.currentStepIndex]);
            this.displaySteps();
            this.updatePlaybackControls();
        }
    }

    stepBack() {
        if (this.currentStepIndex >= 0) {
            // For simplicity, restart from beginning and replay to previous step
            const targetStep = this.currentStepIndex - 1;
            this.resetMachine();
            this.currentStepIndex = -1;
            
            for (let i = 0; i <= targetStep; i++) {
                this.currentStepIndex++;
                this.executeStep(this.algorithmSteps[this.currentStepIndex], true);
            }
            
            this.displaySteps();
            this.updatePlaybackControls();
        }
    }

    stop() {
        this.pause();
        this.resetMachine();
        this.currentStepIndex = -1;
        this.algorithmSteps = [];
        this.displaySteps();
        this.updatePlaybackControls();
        this.setStatus('Gestoppt');
    }

    resetMachine() {
        this.resultCounter.fill(0);
        this.revolutionCounter.fill(0);
        this.revolutionCounterSign = 1;
        this.inputRegister.fill(0);
        this.carriagePosition = 0;
        this.resultDecimalPosition = null;
        this.updateDisplay();
    }

    executeStep(step, silent = false) {
        if (!silent) {
            this.setStatus(step.description);
        }
        
        switch (step.action) {
            case 'clearAll':
                this.resetMachine();
                break;

            case 'clearInput':
                this.clearInput();
                break;

            case 'clearRevolution':
                this.clearRevolution();
                break;

            case 'setInput':
                this.setInputValue(step.value);
                break;

            case 'setResultDirect':
                this.setResultValue(step.value);
                break;

            case 'setResultDecimal':
                this.setResultValue(step.value, { decimalPlaces: step.decimalPlaces });
                break;

            case 'note':
                break;

            case 'crank':
                this.crankTurn(step.direction);
                break;
                
            case 'moveCarriage':
                this.moveCarriage(step.direction);
                break;
                
            case 'complete':
                if (!silent) {
                    setTimeout(() => this.setStatus(step.description), 500);
                }
                break;
        }
        
        this.updateDisplay();
    }

    parseDecimalInput(rawValue) {
        if (typeof rawValue !== 'string') {
            return null;
        }

        const normalized = rawValue.replace(',', '.').trim();

        if (normalized.length === 0) {
            return null;
        }

        const numericValue = Number(normalized);

        if (Number.isNaN(numericValue)) {
            return null;
        }

        const negative = numericValue < 0;
        const absoluteString = negative ? normalized.slice(1) : normalized;
        const parts = absoluteString.split('.');
        const integerPart = parts[0].replace(/[^0-9]/g, '');
        const fractionalPart = parts[1] ? parts[1].replace(/[^0-9]/g, '') : '';
        const sanitizedInteger = integerPart.replace(/^0+(?=\d)/, '') || '0';
        const digits = (sanitizedInteger + fractionalPart).replace(/^0+(?=\d)/, '') || '0';

        return {
            normalized,
            number: numericValue,
            negative,
            digits,
            decimals: fractionalPart.length
        };
    }

    setInputValue(value) {
        this.inputRegister.fill(0);
        const str = Math.abs(value).toString().padStart(13, '0');
        for (let i = 0; i < 13; i++) {
            this.inputRegister[i] = parseInt(str[i]);
        }
        this.updateDisplay();
    }

    setResultValue(value, options = {}) {
        this.resultCounter.fill(0);
        this.resultDecimalPosition = null;

        const { decimalPlaces = null } = options;

        let workingValue = value;

        if (typeof workingValue === 'string') {
            workingValue = workingValue.replace('-', '');
        } else if (typeof workingValue === 'number') {
            workingValue = Math.abs(workingValue);
        } else {
            workingValue = 0;
        }

        let stringValue;

        if (typeof workingValue === 'number') {
            if (decimalPlaces !== null && !Number.isNaN(decimalPlaces)) {
                stringValue = workingValue.toFixed(decimalPlaces);
            } else {
                stringValue = workingValue.toString();
            }
        } else {
            stringValue = workingValue.toString();
        }

        stringValue = stringValue.replace(',', '.');

        let decimalDigits = 0;
        if (stringValue.includes('.')) {
            const parts = stringValue.split('.');
            decimalDigits = parts[1].length;
            stringValue = parts.join('');
            this.resultDecimalPosition = Math.max(0, this.resultCounter.length - decimalDigits);
        }

        stringValue = stringValue.replace(/\D/g, '');
        if (stringValue.length === 0) {
            stringValue = '0';
        }

        if (stringValue.length > this.resultCounter.length) {
            stringValue = stringValue.slice(-this.resultCounter.length);
        } else {
            stringValue = stringValue.padStart(this.resultCounter.length, '0');
        }

        for (let i = 0; i < this.resultCounter.length; i++) {
            this.resultCounter[i] = parseInt(stringValue[i], 10);
        }

        this.updateDisplay();
    }

    startDecimalDivision() {
        const rawDividend = document.getElementById('operand-a').value;
        const rawDivisor = document.getElementById('operand-b').value;

        const dividendInfo = this.parseDecimalInput(rawDividend);
        const divisorInfo = this.parseDecimalInput(rawDivisor);

        if (!dividendInfo || !divisorInfo) {
            this.setStatus('Bitte gültige Zahlen eingeben.');
            return;
        }

        if (divisorInfo.number === 0) {
            this.setStatus('Division durch Null nicht möglich!');
            return;
        }

        const decimalPlaces = 5;
        const ten = 10n;
        const dividendDigits = BigInt(dividendInfo.digits);
        const divisorDigits = BigInt(divisorInfo.digits);

        if (divisorDigits === 0n) {
            this.setStatus('Division durch Null nicht möglich!');
            return;
        }

        const numerator = dividendDigits * (ten ** BigInt(divisorInfo.decimals + decimalPlaces));
        const denominator = divisorDigits * (ten ** BigInt(dividendInfo.decimals));

        if (denominator === 0n) {
            this.setStatus('Nicht durchführbar – zu viele Dezimalstellen.');
            return;
        }

        let quotientAbsBigInt = numerator / denominator;

        let quotientAbsStr = quotientAbsBigInt.toString();
        if (quotientAbsStr.length <= decimalPlaces) {
            quotientAbsStr = quotientAbsStr.padStart(decimalPlaces + 1, '0');
        }

        const integerDigitCount = quotientAbsStr.length - decimalPlaces;
        const integerPartStr = quotientAbsStr.slice(0, integerDigitCount) || '0';
        const fractionPartStr = quotientAbsStr.slice(integerDigitCount);
        const quotientAbs = Number(`${integerPartStr}.${fractionPartStr}`);

        const signNegative = (dividendInfo.number < 0) !== (divisorInfo.number < 0);
        const quotientValue = signNegative ? -quotientAbs : quotientAbs;

        let remainderValue = dividendInfo.number - divisorInfo.number * quotientValue;
        remainderValue = Number.parseFloat(remainderValue.toFixed(decimalPlaces));
        if (Object.is(remainderValue, -0)) {
            remainderValue = 0;
        }

        const quotientDisplay = `${signNegative ? '-' : ''}${(integerPartStr || '0')}${decimalPlaces > 0 ? `.${fractionPartStr}` : ''}`;
        const quotientDisplayGerman = quotientDisplay.replace('.', ',');
        const remainderDisplay = remainderValue.toFixed(decimalPlaces).replace('.', ',');

        const baseDifference = dividendInfo.decimals - divisorInfo.decimals;
        const minimumDecimalDigits = Math.max(0, baseDifference);
        const extraZeros = Math.max(0, decimalPlaces - minimumDecimalDigits);
        const alignmentZeros = Math.max(0, divisorInfo.decimals - dividendInfo.decimals);

        const stageDigits = quotientAbsStr.split('').map(d => parseInt(d, 10));
        const manualStartPosition = 6;  // Start position for carriage

        this.algorithmSteps = [];
        this.algorithmSteps.push({ action: 'clearAll', description: 'Alle Register löschen' });

        // Move carriage to starting position (right side)
        const { steps: moveRightSteps } = this.createCarriageMovementSteps(0, manualStartPosition);
        moveRightSteps.forEach(step => this.algorithmSteps.push(step));

        // Set dividend in input register and transfer to result
        const dividendValue = Math.abs(parseFloat(dividendInfo.normalized));
        this.algorithmSteps.push({
            action: 'setInput',
            value: Math.floor(dividendValue * Math.pow(10, dividendInfo.decimals)),
            description: `Dividend ${dividendInfo.normalized.replace('.', ',')} im Einstellwerk einstellen`
        });

        this.algorithmSteps.push({
            action: 'crank',
            direction: 1,
            description: 'Kurbel vorwärts drehen, um Dividend in das Resultatwerk zu übertragen'
        });

        this.algorithmSteps.push({ action: 'clearInput', description: 'Einstellwerk leeren (E-Werk löschen)' });
        this.algorithmSteps.push({ action: 'clearRevolution', description: 'Umdrehungszähler zurücksetzen' });

        // Set divisor in input register
        const divisorValue = Math.abs(parseFloat(divisorInfo.normalized));
        this.algorithmSteps.push({
            action: 'setInput',
            value: Math.floor(divisorValue * Math.pow(10, divisorInfo.decimals)),
            description: `Divisor ${divisorInfo.normalized.replace('.', ',')} im Einstellwerk einstellen`
        });

        let komaText;
        if (baseDifference >= 0) {
            komaText = `Dezimalstellen: Dividend ${dividendInfo.decimals}, Divisor ${divisorInfo.decimals} ⇒ Differenz ${baseDifference}. Für ${decimalPlaces} Dezimalstellen im Ergebnis werden zusätzlich ${extraZeros} Nullen an den Dividend angehängt.`;
        } else {
            komaText = `Divisor besitzt ${divisorInfo.decimals} Dezimalstellen mehr als der Dividend. Deshalb zuerst ${alignmentZeros} Nullen beim Dividend ergänzen und anschließend auf ${decimalPlaces} Dezimalstellen im Ergebnis erweitern.`;
        }

        this.algorithmSteps.push({ action: 'note', description: `Komma-Regel beachten: ${komaText}` });

        // Perform division steps
        let currentCarriage = manualStartPosition;
        stageDigits.forEach((digit, index) => {
            const isDecimal = index >= integerDigitCount;
            const decimalIndex = index - integerDigitCount + 1;
            const targetPosition = manualStartPosition - index;

            // Move carriage to position for this digit
            if (index > 0) {
                const { steps: moveSteps } = this.createCarriageMovementSteps(currentCarriage, targetPosition);
                moveSteps.forEach(step => this.algorithmSteps.push(step));
                currentCarriage = targetPosition;
            }

            if (digit === 0) {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Schlitten Stellung ${targetPosition}: Divisor passt nicht – Ergebnisziffer 0${isDecimal ? ' (Dezimalstelle)' : ''}`
                });
            } else {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Schlitten Stellung ${targetPosition}: Divisor passt ${digit}-mal${isDecimal ? ` (Dezimalstelle ${decimalIndex})` : ''}`
                });

                // Perform backward cranks
                for (let turn = 0; turn < digit; turn++) {
                    this.algorithmSteps.push({
                        action: 'crank',
                        direction: -1,
                        description: `Kurbel rückwärts drehen (${turn + 1}/${digit})`
                    });
                }

                // One forward crank after bell signal
                this.algorithmSteps.push({
                    action: 'crank',
                    direction: 1,
                    description: 'Klingelzeichen erreicht - eine Vorwärtsdrehung'
                });
            }
        });

        // Move carriage back to center
        if (currentCarriage !== 0) {
            const { steps: moveBackSteps } = this.createCarriageMovementSteps(currentCarriage, 0);
            moveBackSteps.forEach(step => this.algorithmSteps.push(step));
        }

        if (signNegative) {
            this.algorithmSteps.push({ action: 'note', description: 'Negatives Ergebnis – Vorzeichen gesondert notieren.' });
        }

        this.algorithmSteps.push({
            action: 'note',
            description: `Quotient im Umdrehungszähler: ${quotientDisplayGerman}`
        });

        this.algorithmSteps.push({
            action: 'note',
            description: `Rest im Resultatwerk: ${remainderDisplay}`
        });

        this.algorithmSteps.push({
            action: 'complete',
            description: `Division abgeschlossen: Quotient=${quotientDisplayGerman}, Rest=${remainderDisplay}`
        });

        this.prepareAlgorithm();
    }

    startSquareRoot() {
        const rawValue = document.getElementById('operand-a').value;
        const parsed = this.parseDecimalInput(rawValue);

        if (!parsed) {
            this.setStatus('Bitte eine gültige Zahl für Operand A eingeben.');
            return;
        }

        if (parsed.number < 0) {
            this.setStatus('Wurzel aus negativen Zahlen ist nicht definiert.');
            return;
        }

        const decimalPlaces = 5;
        const normalized = parsed.normalized;
        const absString = normalized.startsWith('-') ? normalized.slice(1) : normalized;
        const parts = absString.split('.');
        const integerDigits = parts[0].replace(/[^0-9]/g, '') || '0';
        const fractionalDigits = parts[1] ? parts[1].replace(/[^0-9]/g, '') : '';

        // Zweiergruppen bilden vom Komma aus
        const intGroups = [];
        for (let i = integerDigits.length; i > 0; i -= 2) {
            const start = Math.max(0, i - 2);
            intGroups.unshift(integerDigits.slice(start, i));
        }
        if (intGroups.length === 0) {
            intGroups.push('0');
        }

        const fracGroups = [];
        for (let i = 0; i < fractionalDigits.length; i += 2) {
            let group = fractionalDigits.slice(i, i + 2);
            if (group.length < 2) {
                group = `${group}0`;
            }
            fracGroups.push(group);
        }
        while (fracGroups.length < decimalPlaces) {
            fracGroups.push('00');
        }

        const totalGroups = intGroups.concat(fracGroups.slice(0, decimalPlaces));
        const integerGroupCount = intGroups.length;

        // Berechne die Wurzel und sammle Details für jeden Schritt
        let remainder = 0n;
        let partialRoot = 0n;
        const stageDetails = [];
        const rootDigits = [];

        totalGroups.forEach((groupStr, index) => {
            const groupValue = BigInt(groupStr);
            remainder = remainder * 100n + groupValue;
            const base = partialRoot * 20n;
            let odd = base + 1n;
            const oddNumbers = [];
            let digit = 0;

            // Subtrahiere aufeinanderfolgende ungerade Zahlen
            while (odd <= remainder && digit < 9) {
                remainder -= odd;
                oddNumbers.push(odd);
                odd += 2n;
                digit++;
            }

            const attemptedOdd = odd;
            partialRoot = partialRoot * 10n + BigInt(digit);
            rootDigits.push(digit);

            stageDetails.push({
                index,
                group: groupStr,
                oddNumbers,
                attemptedOdd,
                digit,
                partialRoot,
                remainder,
                remainderBeforeGroup: remainder + oddNumbers.reduce((sum, n) => sum + n, 0n)
            });
        });

        const rootDigitsStr = rootDigits.map(String).join('');
        const integerPart = rootDigitsStr.slice(0, integerGroupCount) || '0';
        let fractionalPart = rootDigitsStr.slice(integerGroupCount);
        if (fractionalPart.length < decimalPlaces) {
            fractionalPart = fractionalPart.padEnd(decimalPlaces, '0');
        }

        const rootValue = Number(`${integerPart}.${fractionalPart}`);
        const radicandValue = parsed.number;
        let remainderValue = radicandValue - rootValue * rootValue;
        remainderValue = Number.parseFloat(remainderValue.toFixed(decimalPlaces));
        if (Object.is(remainderValue, -0)) {
            remainderValue = 0;
        }

        const groupDisplay = `${intGroups.join(' | ')}${decimalPlaces > 0 ? ' · ' + fracGroups.slice(0, decimalPlaces).join(' | ') : ''}`;

        // Erstelle die Algorithmus-Schritte
        this.algorithmSteps = [];

        // 1. Initialisierung
        this.algorithmSteps.push({
            action: 'clearAll',
            description: 'Alle Register löschen'
        });

        this.algorithmSteps.push({
            action: 'note',
            description: `Radikand ${normalized.replace('.', ',')} in Zweiergruppen: ${groupDisplay}`
        });

        // 2. Radikand im Resultatwerk einstellen
        const radicandForDisplay = integerDigits + fractionalDigits.slice(0, decimalPlaces).padEnd(decimalPlaces, '0');
        const radicandIntValue = parseInt(radicandForDisplay, 10);

        this.algorithmSteps.push({
            action: 'setResultDirect',
            value: radicandIntValue,
            description: `Radikand ${radicandForDisplay} im Resultatwerk einstellen`
        });

        this.algorithmSteps.push({
            action: 'clearRevolution',
            description: 'Umdrehungszähler auf 0 setzen'
        });

        // 3. Für jede Gruppe die Wurzelziffer berechnen
        stageDetails.forEach((detail, stageIndex) => {
            const isDecimal = stageIndex >= integerGroupCount;
            const decimalIndex = stageIndex - integerGroupCount + 1;
            const digitsProcessed = stageIndex + 1;
            const decimalDigitsSoFar = Math.max(0, digitsProcessed - integerGroupCount);
            const integerDigitsSoFar = digitsProcessed - decimalDigitsSoFar;

            // Formatierte Teilwurzel
            const paddedPartial = detail.partialRoot.toString().padStart(digitsProcessed, '0');
            const partialIntPart = paddedPartial.slice(0, integerDigitsSoFar) || '0';
            const partialFracPart = decimalDigitsSoFar > 0 ? paddedPartial.slice(integerDigitsSoFar).padEnd(decimalDigitsSoFar, '0') : '';
            const partialRootFormatted = decimalDigitsSoFar > 0 ? `${partialIntPart},${partialFracPart}` : partialIntPart;

            // Gruppenverarbeitung
            this.algorithmSteps.push({
                action: 'note',
                description: `─────────────────────────────────`
            });

            this.algorithmSteps.push({
                action: 'note',
                description: `Gruppe ${stageIndex + 1}: ${detail.group}${isDecimal ? ` (Dezimalstelle ${decimalIndex})` : ''}`
            });

            if (detail.digit === 0) {
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Keine Subtraktion möglich → Wurzelziffer = 0`
                });

                this.algorithmSteps.push({
                    action: 'note',
                    description: `Rest: ${detail.remainder.toString()}`
                });
            } else {
                // Zeige die Sequenz der ungeraden Zahlen
                const oddSequence = detail.oddNumbers.map(n => n.toString()).join(', ');
                this.algorithmSteps.push({
                    action: 'note',
                    description: `Ungerade Zahlenfolge: ${oddSequence}`
                });

                // Für jede ungerade Zahl: im Einstellwerk einstellen und subtrahieren
                detail.oddNumbers.forEach((oddNum, oddIndex) => {
                    const oddValue = parseInt(oddNum.toString(), 10);

                    this.algorithmSteps.push({
                        action: 'setInput',
                        value: oddValue,
                        description: `${oddNum.toString()} im Einstellwerk`
                    });

                    this.algorithmSteps.push({
                        action: 'crank',
                        direction: -1,
                        description: `Kurbel rückwärts → ${oddNum.toString()} subtrahieren (${oddIndex + 1}/${detail.digit})`
                    });
                });

                this.algorithmSteps.push({
                    action: 'note',
                    description: `Klingelzeichen bei ${detail.attemptedOdd.toString()} (passt nicht mehr)`
                });

                this.algorithmSteps.push({
                    action: 'note',
                    description: `Wurzelziffer = ${detail.digit} (Anzahl Subtraktionen)`
                });

                this.algorithmSteps.push({
                    action: 'note',
                    description: `Teilwurzel: ${partialRootFormatted}, Rest: ${detail.remainder.toString()}`
                });
            }

            // Zeige die doppelte Wurzel für die nächste Gruppe
            if (stageIndex < stageDetails.length - 1) {
                const doubleRoot = detail.partialRoot * 2n;
                const nextBase = doubleRoot * 10n + 1n;

                let doubleFormatted;
                if (decimalDigitsSoFar === 0) {
                    doubleFormatted = doubleRoot.toString();
                } else {
                    const doubleRaw = doubleRoot.toString();
                    const paddedDouble = doubleRaw.padStart(integerDigitsSoFar + decimalDigitsSoFar, '0');
                    const doubleIntPart = paddedDouble.slice(0, integerDigitsSoFar) || '0';
                    const doubleFracPart = paddedDouble.slice(integerDigitsSoFar).padEnd(decimalDigitsSoFar, '0');
                    doubleFormatted = `${doubleIntPart},${doubleFracPart}`;
                }

                this.algorithmSteps.push({
                    action: 'note',
                    description: `Nächste Basis: 2×${partialRootFormatted} = ${doubleFormatted}, erste ungerade Zahl: ${nextBase.toString()}`
                });
            }
        });

        // 4. Zusammenfassung
        this.algorithmSteps.push({
            action: 'note',
            description: `─────────────────────────────────`
        });

        this.algorithmSteps.push({
            action: 'note',
            description: `Ergebnis im Umdrehungszähler: ${rootValue.toFixed(decimalPlaces).replace('.', ',')}`
        });

        this.algorithmSteps.push({
            action: 'note',
            description: `Restlicher Wert im Resultatwerk: ${remainderValue.toFixed(decimalPlaces).replace('.', ',')}`
        });

        this.algorithmSteps.push({
            action: 'complete',
            description: `√${normalized.replace('.', ',')} = ${rootValue.toFixed(decimalPlaces).replace('.', ',')} (Rest: ${remainderValue.toFixed(decimalPlaces).replace('.', ',')})`
        });

        this.prepareAlgorithm();
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const brunsviga = new Brunsviga();
    window.brunsviga = brunsviga; // Make it globally accessible for debugging
});
