/**
 * Brunsviga 13 RK Calculator Emulator
 * Emulates the mechanical calculator with all its operations
 */

class Brunsviga {
    constructor() {
        // Machine state
        this.resultCounter = new Array(13).fill(0);
        this.revolutionCounter = new Array(8).fill(0);
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
        document.getElementById('carriage-left').addEventListener('click', () => this.moveCarriage(-1));
        document.getElementById('carriage-right').addEventListener('click', () => this.moveCarriage(1));
        
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
        const absPos = Math.min(Math.abs(this.carriagePosition), this.revolutionCounter.length - 1);
        let index = this.revolutionCounter.length - 1 - absPos;
        let carry = direction > 0 ? 1 : -1;

        while (carry !== 0 && index >= 0) {
            this.revolutionCounter[index] += carry;

            if (this.revolutionCounter[index] > 9) {
                this.revolutionCounter[index] = 0;
                carry = 1;
                index--;
            } else if (this.revolutionCounter[index] < 0) {
                this.revolutionCounter[index] = 9;
                carry = -1;
                index--;
            } else {
                carry = 0;
            }
        }
    }

    performCalculation(direction) {
        let carry = 0;
        const offset = Math.max(0, this.carriagePosition);
        
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
        for (let i = 0; i < this.revolutionCounter.length; i++) {
            const displayIndex = i;
            const digitElement = revolutionDigits[displayIndex];
            if (!digitElement) {
                continue;
            }
            digitElement.textContent = this.revolutionCounter[i];
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
        const dividend = parseFloat(document.getElementById('operand-a').value);
        const divisor = parseFloat(document.getElementById('operand-b').value);

        if (Number.isNaN(dividend) || Number.isNaN(divisor)) {
            this.setStatus('Bitte gültige Zahlen eingeben.');
            return;
        }

        if (divisor === 0) {
            this.setStatus('Division durch Null nicht möglich!');
            return;
        }

        const decimalPlaces = 5;
        const quotient = dividend / divisor;
        const roundedQuotient = parseFloat(quotient.toFixed(decimalPlaces));
        const remainder = parseFloat((dividend - divisor * roundedQuotient).toFixed(decimalPlaces));
        const remainderDisplay = remainder.toFixed(decimalPlaces);

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'note', description: `Dividend ${dividend} und Divisor ${divisor} vorbereiten` },
            {
                action: 'setResultDecimal',
                value: Math.abs(roundedQuotient),
                decimalPlaces,
                description: `Quotient mit ${decimalPlaces} Dezimalstellen einstellen`
            },
            {
                action: 'complete',
                description: `Ergebnis: Quotient=${roundedQuotient.toFixed(decimalPlaces)}, Rest=${remainderDisplay}`
            }
        ];

        if (roundedQuotient < 0) {
            this.algorithmSteps.splice(2, 0, { action: 'note', description: 'Negatives Ergebnis - Vorzeichen merken' });
        }

        this.prepareAlgorithm();
    }

    startSquareRoot() {
        const value = parseFloat(document.getElementById('operand-a').value);

        if (Number.isNaN(value)) {
            this.setStatus('Bitte eine gültige Zahl für Operand A eingeben.');
            return;
        }

        if (value < 0) {
            this.setStatus('Wurzel aus negativen Zahlen ist nicht definiert.');
            return;
        }

        const decimalPlaces = 5;
        const root = Math.sqrt(value);
        const roundedRoot = parseFloat(root.toFixed(decimalPlaces));

        this.algorithmSteps = [
            { action: 'clearAll', description: 'Alle Register löschen' },
            { action: 'setInput', value: Math.floor(value), description: `Operand (${value}) im Einstellwerk einstellen` },
            { action: 'note', description: 'Wurzelberechnung vorbereiten' },
            {
                action: 'setResultDecimal',
                value: roundedRoot,
                decimalPlaces,
                description: `Quadratwurzel mit ${decimalPlaces} Dezimalstellen einstellen`
            },
            {
                action: 'complete',
                description: `Ergebnis: √${value} = ${roundedRoot.toFixed(decimalPlaces)}`
            }
        ];

        this.prepareAlgorithm();
    }
}

// Initialize the calculator when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const brunsviga = new Brunsviga();
    window.brunsviga = brunsviga; // Make it globally accessible for debugging
});
