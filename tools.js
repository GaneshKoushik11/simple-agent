function calculator(a, b, operation){
    switch(operation){
        case 'addition':
            return a + b;
        case 'subtract':
            return a - b;
        case 'multiply':
            return a * b;
        case 'divide':
            return a / b;
        default:
            return "Unknown Operation"
    }
}

function getCurrentTime(){
    return new Date().toLocaleDateString();
}

module.exports = {
    calculator,
    getCurrentTime
}