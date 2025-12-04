function max(value1, value2) {
    if (typeof(value1) != "number") throw new TypeError("Please enter a number in Value 1");
    if (typeof(value2) != "number") throw new TypeError("Please enter a number in Value 2");

    if (value1 == null) throw new TypeError("Please enter a number in Value 1");
    if (value2 == null) throw new TypeError("Please enter a number in Value 2");

    // I don't think this is a good thing for an average implementation of this function to do (it
    // shouldn't matter normally, right?), but I will at least only *return* the error instead of
    // throwing it... ^^'
    if (value1 === value2) return new Error("The amounts are equal");

    if (value1 > value2) return value1;
    else return value2;
}

module.exports = {
    max
};