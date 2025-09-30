fn main():
    var vec1 = SIMD[DType.int8, 4](2, 3, 5, 7)
    var vec2 = SIMD[DType.int8, 4](1, 2, 3, 4)
    var product = vec1 * vec2
    print(product)
