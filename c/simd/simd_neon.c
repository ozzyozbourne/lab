#include <arm_neon.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

// Single-threaded version
void single_threaded(float *a, float *b, float *result, size_t size) {
  for (size_t i = 0; i < size; i++) {
    result[i] = a[i] + b[i];
  }
}

// ARM Neon SIMD version (processes 4 floats at once)
void simd_neon(float *a, float *b, float *result, size_t size) {
  size_t i = 0;

  // Process 4 floats at a time
  for (; i + 4 <= size; i += 4) {
    // Load 4 floats into SIMD registers
    float32x4_t va = vld1q_f32(&a[i]);
    float32x4_t vb = vld1q_f32(&b[i]);

    // Add all 4 values in one instruction
    float32x4_t vr = vaddq_f32(va, vb);

    // Store result
    vst1q_f32(&result[i], vr);
  }

  // Handle remaining elements
  for (; i < size; i++) {
    result[i] = a[i] + b[i];
  }
}

double get_time_ms(struct timespec *start, struct timespec *end) {
  return (end->tv_sec - start->tv_sec) * 1000.0 +
         (end->tv_nsec - start->tv_nsec) / 1000000.0;
}

int main() {
  const size_t SIZE = 10000000;

  // Allocate aligned memory for SIMD
  float *a = aligned_alloc(16, SIZE * sizeof(float));
  float *b = aligned_alloc(16, SIZE * sizeof(float));
  float *result1 = aligned_alloc(16, SIZE * sizeof(float));
  float *result2 = aligned_alloc(16, SIZE * sizeof(float));

  // Initialize arrays
  for (size_t i = 0; i < SIZE; i++) {
    a[i] = (float)i;
    b[i] = (float)(SIZE - i);
  }

  struct timespec start, end;

  // Benchmark single-threaded
  clock_gettime(CLOCK_MONOTONIC, &start);
  single_threaded(a, b, result1, SIZE);
  clock_gettime(CLOCK_MONOTONIC, &end);
  double time1 = get_time_ms(&start, &end);
  printf("Single-threaded: %.2f ms\n", time1);

  // Benchmark SIMD Neon
  clock_gettime(CLOCK_MONOTONIC, &start);
  simd_neon(a, b, result2, SIZE);
  clock_gettime(CLOCK_MONOTONIC, &end);
  double time2 = get_time_ms(&start, &end);
  printf("SIMD Neon:       %.2f ms (%.2fx faster)\n", time2, time1 / time2);

  // Verify results
  int match = 1;
  for (size_t i = 0; i < SIZE; i++) {
    if (result1[i] != result2[i]) {
      match = 0;
      break;
    }
  }
  printf("Results match: %s\n", match ? "yes" : "no");

  free(a);
  free(b);
  free(result1);
  free(result2);

  return 0;
}
