// Small replacement for the abandoned recompose package. Telegram React only
// uses its compose helper, so shipping the complete legacy dependency is
// unnecessary and pulled vulnerable transitive packages into the browser app.
export const compose = (...functions) => {
    if (functions.length === 0) return value => value;
    if (functions.length === 1) return functions[0];

    return functions.reduce((left, right) => (...args) => left(right(...args)));
};
