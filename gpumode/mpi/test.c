
#include <shmem.h>
#include <stdio.h>

int main(void) {
    shmem_init();
    int me = shmem_my_pe();
    int npes = shmem_n_pes();
    printf("Hello from PE %d of %d\n", me, npes);
    shmem_finalize();
    return 0;
}
