#include <stdio.h>
#include <stdlib.h>
#include <time.h>
#include <simd/simd.h>
#include <math.h>

#define N 1000000

void normalize_simd(simd_float3 *vectors, simd_float3 *results) {
    for (int i = 0; i < N; i++) {
        results[i] = simd_normalize(vectors[i]);
    }
}

void normalize_scalar(simd_float3 *vectors, simd_float3 *results) {
    for (int i = 0; i < N; i++) {
        float x = vectors[i].x;
        float y = vectors[i].y;
        float z = vectors[i].z;
        float len = sqrtf(x*x + y*y + z*z);
        results[i] = (simd_float3){ x / len, y / len, z / len };
    }
}

double time_it(void (*func)(simd_float3*, simd_float3*), simd_float3 *in, simd_float3 *out) {
    clock_t start = clock();
    func(in, out);
    clock_t end = clock();
    return (double)(end - start) / CLOCKS_PER_SEC;
}

int main(void) {
    simd_float3 *in = malloc(sizeof(simd_float3) * N);
    simd_float3 *out = malloc(sizeof(simd_float3) * N);

    for (int i = 0; i < N; i++) {
        in[i] = (simd_float3){ 1.0f * i, 2.0f * i, 3.0f * i };
    }

    double t1 = time_it(normalize_scalar, in, out);
    printf("Scalar normalize: %f seconds\n", t1);

    double t2 = time_it(normalize_simd, in, out);
    printf("SIMD normalize:   %f seconds\n", t2);

    free(in);
    free(out);
    return 0;
}

