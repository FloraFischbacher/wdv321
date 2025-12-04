const main = require("../src/main.js");
const { assert } = require("chai");

describe("Main.max()", () => {
    it("should return the greater number from two positive number arguments", () => {
        assert.equal(main.max(4, 3), 4);
        assert.equal(main.max(4, 3), 4);
    });

    it("should return the greater number when arguments are decimals or negative numbers", () => {
        assert.equal(main.max(-1, 5), 5);
        assert.equal(main.max(+34, -30), 34);
        assert.equal(main.max(-5, -6), -5);
        assert.equal(main.max(-5, -6), -5);
        assert.equal(main.max(1.5, 2), 2);
        assert.equal(main.max(2, 1.5), 2);
    });

    it("should return an error when both arguments are equal", () => {
        assert.typeOf(main.max(3, 3), "Error");
    });

    it("should throw an error when at least one argument is the wrong type", () => {
        assert.throws(() => { main.max('a', 5) }, "Please enter a number in Value 1");
        assert.throws(() => { main.max(5, 'a') }, "Please enter a number in Value 2");
        assert.throws(() => { main.max("3/4", 1) }, "Please enter a number in Value 1");
        assert.throws(() => { main.max("5b", 3) }, "Please enter a number in Value 1");
        assert.throws(() => { main.max(3, "5b") }, "Please enter a number in Value 2");
    });

    it("should throw an error when at least one argument is null", () => {
        assert.throws(() => { main.max(null, 5) }, "Please enter a number in Value 1");
        assert.throws(() => { main.max(5, null) }, "Please enter a number in Value 2");
    });
});