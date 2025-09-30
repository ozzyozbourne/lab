#include <stdio.h>
#include <cuda_runtime.h>

#define CUDA_CHECK(err, msg) \
    if (err != cudaSuccess) { \
        fprintf(stderr, "%s (error code %s)!\n", msg, cudaGetErrorString(err)); \
        exit(EXIT_FAILURE); \
    }

__global__ void vectorAdd(float *const A, float *const B, float *const C, const int num_elements) {
    const int i = blockDim.x * blockIdx.x + threadIdx.x;
    if (i < num_elements) { C[i] = A[i] + B[i]; }
}

int main(void) {
    cudaError_t err = cudaSuccess;

    const int num_elements = 5000, threads_per_block = 256, block_per_grid = (num_elements + threads_per_block - 1) / threads_per_block;
    const size_t size = num_elements * sizeof(float), total_size = 3 * size;

    float *const h_data = (float*) malloc(total_size);
    if (h_data == NULL) {
        fprintf(stderr, "Failed to allocate host vectors!\n");
        exit(EXIT_FAILURE);
    }

    float *const h_A = h_data, *const h_B = h_data + num_elements, *const h_C = h_data + num_elements * 2;

    //Initing the data
    for(int i = 0; i < num_elements; i++) {
        h_A[i] = rand() / (float) RAND_MAX;
        h_B[i] = rand() / (float) RAND_MAX;
    }

    // Device allcation 
    float *d_data = NULL;
    err = cudaMalloc((void **)&d_data, total_size);
    CUDA_CHECK(err, "Failed to allocate device vector");

    float *const d_A = d_data, *const d_B = d_data + num_elements, *const d_C = d_data + num_elements * 2;

    err = cudaMemcpy(d_A, h_A, 2 * size, cudaMemcpyHostToDevice);
    CUDA_CHECK(err, "Failed to copy vector form host to device");

    vectorAdd<<<block_per_grid, threads_per_block>>>(d_A, d_B, d_C, num_elements);
    CUDA_CHECK(cudaGetLastError(),"Failed to lauch vectorAdd kernel");

    err = cudaMemcpy(h_C, d_C, size, cudaMemcpyDeviceToHost);
    CUDA_CHECK(err, "Failed to copy vector c from device to host");

    for(int i = 0; i < num_elements; i++) {
        if (fabs(h_A[i] + h_B[i] - h_C[i]) > 1e-5) {
            fprintf(stderr, "Result verification failed at element %d\n", i);
            exit(EXIT_FAILURE);
        }
    }

    printf("Test PASSED\n");
    cudaFree(d_data);
    free(h_data);

    return 0;
}
