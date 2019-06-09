function slidingIterator(array, batchSize = 1) {
    let index = 0;
    function next() {
        const lastIndex = Math.min(array.length, index + batchSize);
        const value = array.slice(index, lastIndex);
        index += batchSize;
        if (lastIndex === array.length) {
            return {
                value,
                done: true,
            };
        }
        return {
            value,
            done: false,
        };
    }
    return {
        next,
    };
}
function slidingGenerator(array, batchSize = 1) {
    const iterator = slidingIterator(array, batchSize);
    let result = iterator.next();
    return {
        *[Symbol.iterator]() {
            while (result.value.length !== 0) {
                yield result.value;
                result = iterator.next();
            }
        },
    };
}

module.exports = {
    slidingGenerator,
    slidingIterator
}