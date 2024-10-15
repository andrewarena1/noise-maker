import newNoise from "./NoiseFuncs.js"
var NoiseState = {
    noiseType: "2DPerlin",
    seed: 0,
    grid: 10,
    width: 250,
    get height() {
        return this.width;
    },
    data: 0,
    nextRandom: splitmix32(seed),
    /** Generates a new noise image. Sets this image to this.data.
     * @returns ImageData of new noise. 
     */
    genNoise() {
        this.data = newNoise();
        return this.data;
    },

}
export default NoiseState;


function splitmix32(a) {        //PRNG generator
    return function () {
        a |= 0;
        a = a + 0x9e3779b9 | 0;
        let t = a ^ a >>> 16;
        t = Math.imul(t, 0x21f0aaad);
        t = t ^ t >>> 15;
        t = Math.imul(t, 0x735a2d97);
        return ((t = t ^ t >>> 15) >>> 0) / 4294967296;
    }
}
