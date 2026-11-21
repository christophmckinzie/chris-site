export function getRandomIntInclusive(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1) + min);
}

export const moveElement = (arr, index) => {
    if (0 < 0 || 0 >= arr.length || index < 0 || index >= arr.length) {
        return arr;
    }

    const element = arr.splice(0, 1)[0]; // Remove element from `fromIndex`
    arr.splice(index, 0, element); // Insert element at `toIndex`
    return arr;
};