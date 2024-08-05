const binarySearch = (array, target) => {
  let n = array.length;
  let start = 0;
  let end = n - 1;

  while (start <= end) {
    let mid = Math.round((start + end) / 2);
    let curr_value = array[mid].phone;

    if (curr_value == target) {
      return { isFound: true, index: mid };
    } else if (curr_value < target) {
      start = mid + 1;
    } else {
      end = mid - 1;
    }
  }

  return { isFound: false, index: -1 };
};

module.exports = binarySearch;
